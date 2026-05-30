import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import db from '../src/db/index';
import { executeRun } from '../src/engine/workflow';
import { scorePairRuns, validatePairScoring } from '../src/engine/scorer';
import { getPreferredScoringModelId } from '../src/settings';

db.pragma('busy_timeout = 30000');

const MODEL_ID = Number(process.env.CE_ADD_MODEL_ID ?? 3);
const REVIEWER_MODEL_ID = Number(process.env.CE_ADD_REVIEWER_MODEL_ID ?? getPreferredScoringModelId() ?? MODEL_ID);
const TESTSET = process.env.CE_ADD_TESTSET ?? 'ce_main_structured_questions';
const RUN_SET_ID = process.env.CE_ADD_RUN_SET_ID ?? `ce_additive_completion_10pm_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
const QUESTIONS_PER_CRITERIA = Number(process.env.CE_ADD_QUESTIONS_PER_CRITERIA ?? 10);
const RUN_NR = Number(process.env.CE_ADD_RUN_NR ?? 1);
const WORKFLOW_SETUP_ID = 'setup_ce_additive_completion';
const DIRECT_SETUP_ID = 'setup_ce_direct';

type Question = {
  id: number;
  criteria_id: string;
};

type ExistingRun = {
  id: number;
};

type PairResult = {
  questionId: number;
  criteriaId: string;
  directRunId: number;
  workflowRunId: number;
  directScore: number | null;
  workflowScore: number | null;
};

function completedRun(setupId: string, questionId: number, comparisonGroupId: string): ExistingRun | undefined {
  return db.prepare(`
    SELECT id
    FROM runs
    WHERE setup_id = ?
      AND llm_config_id = ?
      AND question_id = ?
      AND testset = ?
      AND run_set_id = ?
      AND comparison_group_id = ?
      AND run_nr = ?
      AND status = 'completed'
    ORDER BY id DESC
    LIMIT 1
  `).get(setupId, MODEL_ID, questionId, TESTSET, RUN_SET_ID, comparisonGroupId, RUN_NR) as ExistingRun | undefined;
}

function scoreForRun(runId: number): number | null {
  const row = db.prepare('SELECT score_percent FROM scores WHERE run_id = ?').get(runId) as { score_percent: number | null } | undefined;
  return row?.score_percent ?? null;
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function pct(value: number | null | undefined, signed = false): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  const sign = signed && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function mdTable(headers: string[], rows: Array<Array<string | number>>): string {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.join(' | ')} |`),
  ].join('\n');
}

async function runQuestion(question: Question): Promise<PairResult> {
  const comparisonGroupId = `q${question.id}`;
  let direct = completedRun(DIRECT_SETUP_ID, question.id, comparisonGroupId);
  if (!direct) {
    const result = await executeRun({
      setupId: DIRECT_SETUP_ID,
      llmConfigId: MODEL_ID,
      questionId: question.id,
      testset: TESTSET,
      runSetId: RUN_SET_ID,
      runNr: RUN_NR,
      comparisonGroupId,
    });
    if (result.error) throw new Error(`Direct failed for q${question.id}: ${result.error}`);
    direct = { id: result.runId };
  }

  let workflow = completedRun(WORKFLOW_SETUP_ID, question.id, comparisonGroupId);
  if (!workflow) {
    const result = await executeRun({
      setupId: WORKFLOW_SETUP_ID,
      llmConfigId: MODEL_ID,
      questionId: question.id,
      testset: TESTSET,
      runSetId: RUN_SET_ID,
      runNr: RUN_NR,
      comparisonGroupId,
    });
    if (result.error) throw new Error(`Workflow failed for q${question.id}: ${result.error}`);
    workflow = { id: result.runId };
  }

  await scorePairRuns(direct.id, workflow.id, MODEL_ID);
  await validatePairScoring(direct.id, workflow.id, REVIEWER_MODEL_ID);

  return {
    questionId: question.id,
    criteriaId: question.criteria_id,
    directRunId: direct.id,
    workflowRunId: workflow.id,
    directScore: scoreForRun(direct.id),
    workflowScore: scoreForRun(workflow.id),
  };
}

function summarize(results: PairResult[]) {
  const groups = new Map<string, PairResult[]>();
  for (const result of results) {
    groups.set(result.criteriaId, [...(groups.get(result.criteriaId) ?? []), result]);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([criteriaId, rows]) => {
    const direct = rows.map(row => row.directScore).filter((value): value is number => value !== null);
    const workflow = rows.map(row => row.workflowScore).filter((value): value is number => value !== null);
    const diffs = rows
      .filter(row => row.directScore !== null && row.workflowScore !== null)
      .map(row => Number(row.workflowScore) - Number(row.directScore));
    return {
      criteriaId,
      n: rows.length,
      direct: average(direct),
      workflow: average(workflow),
      diff: average(diffs),
      better: diffs.filter(value => value > 0.000001).length,
      worse: diffs.filter(value => value < -0.000001).length,
      equal: diffs.filter(value => Math.abs(value) <= 0.000001).length,
    };
  });
}

async function main(): Promise<void> {
  const model = db.prepare('SELECT id, label, model_id, api_key_env FROM llm_configs WHERE id = ?').get(MODEL_ID) as
    | { id: number; label: string; model_id: string; api_key_env: string }
    | undefined;
  if (!model) throw new Error(`Model config not found: ${MODEL_ID}`);
  if (!process.env[model.api_key_env]) throw new Error(`API key not set for model ${MODEL_ID}: ${model.api_key_env}`);

  db.prepare('INSERT OR IGNORE INTO run_sets (id, name) VALUES (?, ?)').run(RUN_SET_ID, RUN_SET_ID);

  const questions = db.prepare(`
    WITH ranked AS (
      SELECT id,
             criteria_id,
             ROW_NUMBER() OVER (PARTITION BY criteria_id ORDER BY id) AS rn
      FROM questions
      WHERE testset = ?
        AND computer_evaluable = 1
    )
    SELECT id, criteria_id
    FROM ranked
    WHERE rn <= ?
    ORDER BY criteria_id, id
  `).all(TESTSET, QUESTIONS_PER_CRITERIA) as Question[];

  if (questions.length === 0) throw new Error(`No CE questions found for testset ${TESTSET}`);

  console.log(JSON.stringify({
    event: 'start',
    workflowSetupId: WORKFLOW_SETUP_ID,
    model,
    reviewerModelId: REVIEWER_MODEL_ID,
    testset: TESTSET,
    runSetId: RUN_SET_ID,
    questions: questions.length,
    questionsPerCriteria: QUESTIONS_PER_CRITERIA,
    runNr: RUN_NR,
  }));

  const results: PairResult[] = [];
  for (const [index, question] of questions.entries()) {
    const result = await runQuestion(question);
    results.push(result);
    console.log(JSON.stringify({
      event: 'progress',
      done: index + 1,
      total: questions.length,
      questionId: result.questionId,
      criteriaId: result.criteriaId,
      directScore: result.directScore,
      workflowScore: result.workflowScore,
      diff: result.directScore !== null && result.workflowScore !== null
        ? result.workflowScore - result.directScore
        : null,
    }));
  }

  const summary = summarize(results);
  const overallDiffs = results
    .filter(row => row.directScore !== null && row.workflowScore !== null)
    .map(row => Number(row.workflowScore) - Number(row.directScore));
  const overallDirect = average(results.map(row => row.directScore).filter((value): value is number => value !== null));
  const overallWorkflow = average(results.map(row => row.workflowScore).filter((value): value is number => value !== null));
  const overallDiff = average(overallDiffs);

  const exportDir = path.resolve(process.cwd(), '..', 'exports');
  fs.mkdirSync(exportDir, { recursive: true });
  const outBase = path.join(exportDir, `${RUN_SET_ID}_summary`);
  fs.writeFileSync(`${outBase}.json`, `${JSON.stringify({ runSetId: RUN_SET_ID, testset: TESTSET, workflowSetupId: WORKFLOW_SETUP_ID, results, summary }, null, 2)}\n`, 'utf8');
  fs.writeFileSync(`${outBase}.md`, [
    '# CE Additive Completion: 10 Tests Per Metric',
    '',
    `- Run set: \`${RUN_SET_ID}\``,
    `- Testset: \`${TESTSET}\``,
    `- Workflow: \`${WORKFLOW_SETUP_ID}\``,
    `- Model: ${model.label} (\`${model.model_id}\`)`,
    `- Questions: ${results.length}`,
    '',
    '## Overall',
    '',
    mdTable(
      ['N', 'Direct avg', 'Workflow avg', 'Diff', 'Better', 'Worse', 'Equal'],
      [[
        results.length,
        pct(overallDirect),
        pct(overallWorkflow),
        pct(overallDiff, true),
        overallDiffs.filter(value => value > 0.000001).length,
        overallDiffs.filter(value => value < -0.000001).length,
        overallDiffs.filter(value => Math.abs(value) <= 0.000001).length,
      ]],
    ),
    '',
    '## By Metric',
    '',
    mdTable(
      ['Metric', 'N', 'Direct avg', 'Workflow avg', 'Diff', 'Better', 'Worse', 'Equal'],
      summary.map(row => [
        row.criteriaId,
        row.n,
        pct(row.direct),
        pct(row.workflow),
        pct(row.diff, true),
        row.better,
        row.worse,
        row.equal,
      ]),
    ),
    '',
  ].join('\n'), 'utf8');

  console.log(JSON.stringify({
    event: 'done',
    runSetId: RUN_SET_ID,
    results: results.length,
    summary,
    report: `${outBase}.md`,
  }));
}

main().catch(err => {
  console.error(JSON.stringify({
    event: 'error',
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  }));
  process.exitCode = 1;
});

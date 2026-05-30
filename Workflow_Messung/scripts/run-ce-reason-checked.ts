import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import db from '../src/db/index';
import { executeRun } from '../src/engine/workflow';

db.pragma('busy_timeout = 30000');

const MODEL_ID = Number(process.env.CE_REASON_MODEL_ID ?? 1);
const RUN_SET_ID =
  process.env.CE_REASON_RUN_SET_ID ??
  `ce_reason_checked_10_per_metric_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}`;
const TESTSETS = (process.env.CE_REASON_TESTSETS ?? 'app2_d1,app2_d2,app2_d3')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);
const CONCURRENCY = Math.max(1, Number(process.env.CE_REASON_CONCURRENCY ?? 7));
const MAX_QUESTIONS = Math.max(0, Number(process.env.CE_REASON_MAX_QUESTIONS ?? 0));
const WORKFLOW_SETUPS = (process.env.CE_REASON_WORKFLOW_SETUPS ?? 'setup_ce_reason_flowmap,setup_ce_reason_pick_flowmap')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);
const DIRECT_SETUP_ID = 'setup_ce_direct';

type Question = {
  id: number;
  testset: string;
  criteria_id: string;
};

type ExistingRun = {
  id: number;
};

type Job = {
  question: Question;
  setupId: string;
};

type RunSummary = {
  runId: number;
  setupId: string;
  questionId: number;
  testset: string;
  criteriaId: string;
  score: number | null;
  reviewRequired: number | null;
  audit: string;
  auditProblems: string;
  realSteps: number;
  stepsWithReasoning: number;
  pickerHasCandidateLabels: boolean | null;
  pickerChecklistLength: number | null;
  pickedCandidate: string | null;
};

function expectsIsoCandidateLabels(setupId: string): boolean {
  return setupId === 'setup_ce_reason_pick_iso_flowmap' || setupId === 'setup_ce_ss_reason_pick_iso';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isLockedError(err: unknown): boolean {
  return err instanceof Error && /database is locked|SQLITE_BUSY/i.test(err.message);
}

async function retryLocked<T>(label: string, fn: () => Promise<T> | T): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 7; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isLockedError(err)) throw err;
      const delayMs = 600 * attempt;
      console.error(JSON.stringify({ event: 'retry_locked', label, attempt, delayMs }));
      await sleep(delayMs);
    }
  }
  throw lastErr;
}

function completedRun(
  setupId: string,
  question: Question,
  comparisonGroupId: string,
): ExistingRun | undefined {
  return db.prepare(`
    SELECT id
    FROM runs
    WHERE setup_id = ?
      AND llm_config_id = ?
      AND question_id = ?
      AND testset = ?
      AND run_set_id = ?
      AND comparison_group_id = ?
      AND run_nr = 1
      AND status = 'completed'
    ORDER BY id DESC
    LIMIT 1
  `).get(setupId, MODEL_ID, question.id, question.testset, RUN_SET_ID, comparisonGroupId) as ExistingRun | undefined;
}

function parseObject(value: string | null | undefined): Record<string, unknown> | null {
  const raw = String(value ?? '').trim();
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      const parsed = JSON.parse(raw.slice(start, end + 1)) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
    } catch {
      return null;
    }
  }
}

function hasReasoning(answer: string | null | undefined): boolean {
  const parsed = parseObject(answer);
  return typeof parsed?.ai_reasoning === 'string' && parsed.ai_reasoning.trim().length >= 10;
}

async function runPool<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>): Promise<void> {
  let nextIndex = 0;
  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const item = items[nextIndex++];
      await worker(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker()));
}

async function ensureDirect(question: Question): Promise<number> {
  const comparisonGroupId = `q${question.id}`;
  const existing = completedRun(DIRECT_SETUP_ID, question, comparisonGroupId);
  if (existing) return existing.id;
  const result = await retryLocked(`direct q${question.id}`, () => executeRun({
    setupId: DIRECT_SETUP_ID,
    llmConfigId: MODEL_ID,
    questionId: question.id,
    testset: question.testset,
    runSetId: RUN_SET_ID,
    runNr: 1,
    comparisonGroupId,
  }));
  if (result.error) throw new Error(`Direct failed q${question.id}: ${result.error}`);
  return result.runId;
}

async function runWorkflowJob(job: Job): Promise<void> {
  const comparisonGroupId = `q${job.question.id}`;
  await ensureDirect(job.question);
  const existing = completedRun(job.setupId, job.question, comparisonGroupId);
  if (existing) return;
  const result = await retryLocked(`${job.setupId} q${job.question.id}`, () => executeRun({
    setupId: job.setupId,
    llmConfigId: MODEL_ID,
    questionId: job.question.id,
    testset: job.question.testset,
    runSetId: RUN_SET_ID,
    runNr: 1,
    comparisonGroupId,
  }));
  if (result.error) throw new Error(`${job.setupId} failed q${job.question.id}: ${result.error}`);
}

function collectRunSummary(): RunSummary[] {
  const runs = db.prepare(`
    SELECT r.id, r.setup_id, r.question_id, r.testset, q.criteria_id,
           s.score_percent, s.review_required
    FROM runs r
    JOIN questions q ON q.id = r.question_id
    LEFT JOIN scores s ON s.run_id = r.id
    WHERE r.run_set_id = ?
      AND r.setup_id IN (${WORKFLOW_SETUPS.map(() => '?').join(',')})
    ORDER BY r.testset, q.criteria_id, r.question_id, r.setup_id
  `).all(RUN_SET_ID, ...WORKFLOW_SETUPS) as Array<{
    id: number;
    setup_id: string;
    question_id: number;
    testset: string;
    criteria_id: string;
    score_percent: number | null;
    review_required: number | null;
  }>;

  return runs.map(run => {
    const steps = db.prepare(`
      SELECT step, formal_step, final_answer, messages_json
      FROM run_steps
      WHERE run_id = ?
      ORDER BY step
    `).all(run.id) as Array<{ step: number; formal_step: number | null; final_answer: string | null; messages_json: string | null }>;
    const realSteps = steps.filter(step => Number(step.formal_step ?? step.step) < 900);
    const audit = steps.find(step => Number(step.formal_step ?? step.step) === 900);
    const auditObject = parseObject(audit?.final_answer);
    const pickerFormalStep = run.setup_id.includes('_ss_reason_') ? 3 : 4;
    const picker = realSteps.find(step => Number(step.formal_step ?? step.step) === pickerFormalStep);
    const pickerObject = parseObject(picker?.final_answer);
    return {
      runId: run.id,
      setupId: run.setup_id,
      questionId: run.question_id,
      testset: run.testset,
      criteriaId: run.criteria_id,
      score: run.score_percent,
      reviewRequired: run.review_required,
      audit: String(auditObject?.protocol_audit ?? 'missing'),
      auditProblems: Array.isArray(auditObject?.problems) ? auditObject.problems.join(' | ') : '',
      realSteps: realSteps.length,
      stepsWithReasoning: realSteps.filter(step => hasReasoning(step.final_answer)).length,
      pickerHasCandidateLabels: picker
        ? expectsIsoCandidateLabels(run.setup_id)
          ? String(picker.messages_json ?? '').includes('Candidate X') && String(picker.messages_json ?? '').includes('Candidate Y')
          : String(picker.messages_json ?? '').includes('Candidate A') && String(picker.messages_json ?? '').includes('Candidate B')
        : null,
      pickerChecklistLength: Array.isArray(pickerObject?.pick_checklist) ? pickerObject.pick_checklist.length : null,
      pickedCandidate: typeof pickerObject?.picked_candidate === 'string' ? pickerObject.picked_candidate : null,
    };
  });
}

function writeReport(summaries: RunSummary[]): void {
  const outDir = path.resolve(process.cwd(), '../analysis_app2');
  fs.mkdirSync(outDir, { recursive: true });
  const bySetup = new Map<string, RunSummary[]>();
  for (const row of summaries) {
    const key = row.setupId;
    bySetup.set(key, [...(bySetup.get(key) ?? []), row]);
  }
  const lines = [
    '# CE_REASON checked runset',
    '',
    `Runset: \`${RUN_SET_ID}\``,
    `Model: \`${MODEL_ID}\``,
    `Testsets: \`${TESTSETS.join('`, `')}\``,
    '',
    '## Protocol summary',
    '',
    '| Setup | Runs | Audit ok | Review marked | Steps with reasoning | PICK checklist ok |',
    '|---|---:|---:|---:|---:|---:|',
  ];
  for (const [setupId, rows] of bySetup) {
  const realStepTotal = rows.reduce((sum, row) => sum + row.realSteps, 0);
    const copiedStepTotal = rows.filter(row => row.setupId.includes('_ss_reason_')).length;
    const reasoningExpectedTotal = realStepTotal - copiedStepTotal;
    const reasoningTotal = rows.reduce((sum, row) => sum + row.stepsWithReasoning, 0);
    const pickRows = rows.filter(row => row.setupId.includes('pick'));
    const pickOk = pickRows.filter(row => row.pickerHasCandidateLabels && (row.pickerChecklistLength ?? 0) >= 3 && ['A', 'B'].includes(row.pickedCandidate ?? '')).length;
    lines.push(`| ${setupId} | ${rows.length} | ${rows.filter(row => row.audit === 'ok').length} | ${rows.filter(row => Number(row.reviewRequired ?? 0) === 1).length} | ${reasoningTotal}/${reasoningExpectedTotal} | ${pickRows.length ? `${pickOk}/${pickRows.length}` : '-'} |`);
  }
  lines.push('', '## Runs by testset and criterion', '');
  lines.push('| Testset | Criterion | Setup | Runs | Mean score | Audit problems |');
  lines.push('|---|---|---|---:|---:|---|');
  const grouped = new Map<string, RunSummary[]>();
  for (const row of summaries) {
    const key = `${row.testset}\t${row.criteriaId}\t${row.setupId}`;
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }
  for (const [key, rows] of [...grouped.entries()].sort()) {
    const [testset, criterion, setupId] = key.split('\t');
    const mean = rows.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / rows.length;
    const problems = rows.map(row => row.auditProblems).filter(Boolean);
    lines.push(`| ${testset} | ${criterion} | ${setupId} | ${rows.length} | ${mean.toFixed(1)}% | ${problems.length ? problems.join('; ') : '-'} |`);
  }
  fs.writeFileSync(path.join(outDir, `${RUN_SET_ID}.md`), `${lines.join('\n')}\n`, 'utf8');
  fs.writeFileSync(path.join(outDir, `${RUN_SET_ID}.json`), JSON.stringify(summaries, null, 2), 'utf8');
}

async function main(): Promise<void> {
  const model = db.prepare('SELECT id, label, model_id, api_key_env FROM llm_configs WHERE id = ?').get(MODEL_ID) as
    | { id: number; label: string; model_id: string; api_key_env: string }
    | undefined;
  if (!model) throw new Error(`Model config not found: ${MODEL_ID}`);
  if (!process.env[model.api_key_env]) throw new Error(`API key not set for model ${MODEL_ID}: ${model.api_key_env}`);

  db.prepare('INSERT OR IGNORE INTO run_sets (id, name) VALUES (?, ?)').run(RUN_SET_ID, RUN_SET_ID);
  const placeholders = TESTSETS.map(() => '?').join(',');
  const questions = db.prepare(`
    SELECT id, testset, criteria_id
    FROM questions
    WHERE computer_evaluable = 1
      AND testset IN (${placeholders})
    ORDER BY testset, criteria_id, id
  `).all(...TESTSETS) as Question[];
  if (questions.length === 0) throw new Error(`No CE questions found for ${TESTSETS.join(', ')}`);

  const byMetric = questions.reduce<Record<string, number>>((acc, question) => {
    const key = `${question.testset}:${question.criteria_id}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const metricCountsOk = Object.values(byMetric).every(count => count === 10);
  if (!metricCountsOk) {
    throw new Error(`Expected exactly 10 questions per metric/testset, got ${JSON.stringify(byMetric)}`);
  }

  const jobs = questions.flatMap(question => WORKFLOW_SETUPS.map(setupId => ({ question, setupId })));
  const selectedQuestions = MAX_QUESTIONS > 0 ? questions.slice(0, MAX_QUESTIONS) : questions;
  const selectedJobs = selectedQuestions.flatMap(question => WORKFLOW_SETUPS.map(setupId => ({ question, setupId })));
  console.log(JSON.stringify({
    event: 'start',
    runSetId: RUN_SET_ID,
    model,
    testsets: TESTSETS,
    questions: selectedQuestions.length,
    availableQuestions: questions.length,
    workflowRuns: selectedJobs.length,
    directRuns: selectedQuestions.length,
    concurrency: CONCURRENCY,
    byMetric,
  }, null, 2));

  console.log(JSON.stringify({ event: 'direct_stage_start', total: selectedQuestions.length }));
  let directDone = 0;
  for (const question of selectedQuestions) {
    await ensureDirect(question);
    directDone++;
    if (directDone % 10 === 0 || directDone === selectedQuestions.length) {
      console.log(JSON.stringify({ event: 'direct_stage_progress', done: directDone, total: selectedQuestions.length }));
    }
  }

  let done = 0;
  await runPool(selectedJobs, CONCURRENCY, async job => {
    await runWorkflowJob(job);
    done++;
    if (done % 10 === 0 || done === selectedJobs.length) {
      console.log(JSON.stringify({ event: 'progress', done, total: selectedJobs.length, setupId: job.setupId, questionId: job.question.id }));
    }
  });

  const summaries = collectRunSummary();
  writeReport(summaries);

  const bad = summaries.filter(row =>
    row.audit !== 'ok' ||
    row.stepsWithReasoning !== (row.setupId.includes('_ss_reason_') ? row.realSteps - 1 : row.realSteps) ||
    (row.setupId.includes('pick') && (!row.pickerHasCandidateLabels || (row.pickerChecklistLength ?? 0) < 3 || !['A', 'B'].includes(row.pickedCandidate ?? '')))
  );
  console.log(JSON.stringify({
    event: 'done',
    runSetId: RUN_SET_ID,
    workflowRuns: summaries.length,
    protocolProblems: bad.length,
    report: `analysis_app2/${RUN_SET_ID}.md`,
  }, null, 2));
  if (bad.length > 0) {
    console.error(JSON.stringify({ event: 'protocol_problems', bad }, null, 2));
    process.exitCode = 2;
  }
}

main().catch(err => {
  console.error(JSON.stringify({ event: 'error', message: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined }, null, 2));
  process.exitCode = 1;
});

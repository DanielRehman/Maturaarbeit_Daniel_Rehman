import db from '../src/db/index';
import { scoreComputerEvaluableAnswerForQuestion } from '../src/engine/scorer';
import type { QuestionRow } from '../src/db/index';

const runSet = 'ce_reason_iso_picker_10_per_metric_20260524';

type Row = QuestionRow & {
  direct_run: number;
  workflow_run: number;
  direct_score: number;
  workflow_score: number;
};

const rows = db.prepare(`
  SELECT q.*, rd.id direct_run, rw.id workflow_run,
         sd.score_percent direct_score, sw.score_percent workflow_score
  FROM runs rd
  JOIN runs rw ON rw.question_id = rd.question_id
    AND rw.llm_config_id = rd.llm_config_id
    AND rw.testset = rd.testset
    AND rw.run_set_id = rd.run_set_id
    AND rw.comparison_group_id = rd.comparison_group_id
    AND rw.run_nr = rd.run_nr
  JOIN questions q ON q.id = rd.question_id
  JOIN scores sd ON sd.run_id = rd.id
  JOIN scores sw ON sw.run_id = rw.id
  WHERE rd.run_set_id = ?
    AND rd.setup_id = 'setup_ce_direct'
    AND rw.setup_id = 'setup_ce_reason_pick_iso_flowmap'
`).all(runSet) as Row[];

function step(runId: number, formalStep: number): string {
  const row = db.prepare(`
    SELECT final_answer
    FROM run_steps
    WHERE run_id = ? AND COALESCE(formal_step, step) = ?
  `).get(runId, formalStep) as { final_answer: string | null } | undefined;
  return row?.final_answer ?? '';
}

function score(question: QuestionRow, answer: string): number {
  const result = scoreComputerEvaluableAnswerForQuestion(question, answer);
  return result.total ? (100 * result.passed) / result.total : 0;
}

function pickedCandidate(answer: string): string {
  try {
    const parsed = JSON.parse(answer) as { picked_candidate?: unknown };
    return typeof parsed.picked_candidate === 'string' ? parsed.picked_candidate : '';
  } catch {
    return '';
  }
}

const summary = {
  total: 0,
  worse: 0,
  worseStep1Already: 0,
  step3WorseThanStep1: 0,
  pickerFinalWorseThanStep3: 0,
  worsePickedA: 0,
  worsePickedB: 0,
  trueFollowupWorseWhenStep1AtLeastDirect: 0,
};

const examples: Array<Record<string, unknown>> = [];

for (const row of rows) {
  const direct = row.direct_score;
  const step1 = score(row, step(row.workflow_run, 1));
  const step3 = score(row, step(row.workflow_run, 3));
  const final = score(row, step(row.workflow_run, 4));
  const pick = pickedCandidate(step(row.workflow_run, 4));
  summary.total++;
  if (final < direct) {
    summary.worse++;
    if (step1 < direct) summary.worseStep1Already++;
    if (step3 < step1) summary.step3WorseThanStep1++;
    if (final < step3) summary.pickerFinalWorseThanStep3++;
    if (pick === 'A') summary.worsePickedA++;
    if (pick === 'B') summary.worsePickedB++;
    if (step1 >= direct) summary.trueFollowupWorseWhenStep1AtLeastDirect++;
    examples.push({
      q: row.id,
      testset: row.testset,
      metric: row.criteria_id,
      direct,
      step1,
      step3,
      final,
      pick,
    });
  }
}

console.log(JSON.stringify(summary, null, 2));
console.table(examples);

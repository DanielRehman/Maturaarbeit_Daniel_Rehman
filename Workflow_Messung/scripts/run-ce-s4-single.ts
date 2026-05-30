import 'dotenv/config';
import db from '../src/db/index';
import { executeRun } from '../src/engine/workflow';
import { scorePairRuns } from '../src/engine/scorer';

const MODEL_ID = Number(process.env.CE_SINGLE_MODEL_ID ?? 3);
const RUN_SET_ID = process.env.CE_SINGLE_RUN_SET_ID ?? 'ce_s4_single_inspect';
const QUESTION_IDS = (process.env.CE_SINGLE_QUESTION_IDS ?? '751,785,811')
  .split(',')
  .map(id => Number(id.trim()))
  .filter(Number.isFinite);
const RUN_NR_BASE = Number(process.env.CE_SINGLE_RUN_NR_BASE ?? 1);

type Row = {
  question_id: number;
  criteria_id: string;
  expected_answer_json: string | null;
  direct_run_id: number;
  workflow_run_id: number;
  direct_score: number;
  workflow_score: number;
  direct_answer: string | null;
  copied_answer: string | null;
  workflow_answer: string | null;
  workflow_final_answer: string | null;
};

async function main(): Promise<void> {
  const model = db.prepare('SELECT id, label, model_id, api_key_env FROM llm_configs WHERE id = ?').get(MODEL_ID) as
    | { id: number; label: string; model_id: string; api_key_env: string }
    | undefined;
  if (!model) throw new Error(`Model config not found: ${MODEL_ID}`);
  if (!process.env[model.api_key_env]) throw new Error(`API key not set for model ${MODEL_ID}: ${model.api_key_env}`);

  db.prepare('INSERT OR IGNORE INTO run_sets (id, name) VALUES (?, ?)').run(RUN_SET_ID, RUN_SET_ID);
  console.log(JSON.stringify({ event: 'start', model, runSetId: RUN_SET_ID, questionIds: QUESTION_IDS }));

  for (let i = 0; i < QUESTION_IDS.length; i++) {
    const questionId = QUESTION_IDS[i];
    const question = db.prepare('SELECT id FROM questions WHERE id = ? AND computer_evaluable = 1').get(questionId);
    if (!question) throw new Error(`CE question not found: ${questionId}`);
    const runNr = RUN_NR_BASE + i;
    const comparisonGroupId = `q${questionId}`;

    const direct = await executeRun({
      setupId: 'setup_ce_direct',
      llmConfigId: MODEL_ID,
      questionId,
      testset: 'ce_main_structured_questions',
      runSetId: RUN_SET_ID,
      runNr,
      comparisonGroupId,
    });
    if (direct.error) throw new Error(`Direct failed for ${questionId}: ${direct.error}`);

    const workflow = await executeRun({
      setupId: 'setup_ce_flowreview_s4',
      llmConfigId: MODEL_ID,
      questionId,
      testset: 'ce_main_structured_questions',
      runSetId: RUN_SET_ID,
      runNr,
      comparisonGroupId,
    });
    if (workflow.error) throw new Error(`Workflow failed for ${questionId}: ${workflow.error}`);

    await scorePairRuns(direct.runId, workflow.runId, MODEL_ID);

    const row = db.prepare(`
      SELECT q.id question_id, q.criteria_id, q.expected_answer_json,
             rd.id direct_run_id, rw.id workflow_run_id,
             sd.score_percent direct_score, sw.score_percent workflow_score,
             d.final_answer direct_answer,
             w1.final_answer copied_answer,
             w2.final_answer workflow_answer,
             wf.final_answer workflow_final_answer
      FROM runs rd
      JOIN runs rw ON rw.id = ?
      JOIN questions q ON q.id = rd.question_id
      JOIN scores sd ON sd.run_id = rd.id
      JOIN scores sw ON sw.run_id = rw.id
      JOIN run_steps d ON d.run_id = rd.id AND d.formal_step = 1
      JOIN run_steps w1 ON w1.run_id = rw.id AND w1.formal_step = 1
      JOIN run_steps w2 ON w2.run_id = rw.id AND w2.formal_step = 2
      JOIN run_steps wf ON wf.run_id = rw.id
        AND wf.step = (SELECT MAX(step) FROM run_steps WHERE run_id = rw.id)
      WHERE rd.id = ?
    `).get(workflow.runId, direct.runId) as Row;
    console.log(JSON.stringify({ event: 'result', ...row }, null, 2));
  }

  console.log(JSON.stringify({ event: 'done' }));
}

main().catch(err => {
  console.error(JSON.stringify({ event: 'error', message: err instanceof Error ? err.message : String(err) }, null, 2));
  process.exitCode = 1;
});

import 'dotenv/config';
import db from '../src/db/index';
import { executeRun } from '../src/engine/workflow';

const MODEL_ID = Number(process.env.CE_REASON_PROBE_MODEL_ID ?? 1);
const RUN_SET_ID =
  process.env.CE_REASON_PROBE_RUN_SET_ID ??
  `ce_reason_protocol_probe_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}`;
const QUESTIONS = (process.env.CE_REASON_PROBE_QUESTIONS ?? '971,1021,1081')
  .split(',')
  .map(value => Number(value.trim()))
  .filter(Number.isFinite);
const SETUPS = ['setup_ce_reason_flowmap', 'setup_ce_reason_pick_flowmap'];

type ModelRow = {
  id: number;
  label: string;
  model_id: string;
  api_key_env: string;
};

async function main(): Promise<void> {
  const model = db.prepare('SELECT id,label,model_id,api_key_env FROM llm_configs WHERE id=?').get(MODEL_ID) as
    | ModelRow
    | undefined;
  if (!model) throw new Error(`model config not found: ${MODEL_ID}`);
  if (!process.env[model.api_key_env]) throw new Error(`missing API key env ${model.api_key_env} for model ${model.label}`);

  db.prepare('INSERT OR IGNORE INTO run_sets (id, name) VALUES (?, ?)').run(RUN_SET_ID, RUN_SET_ID);
  console.log(JSON.stringify({ event: 'start', runSetId: RUN_SET_ID, model, questions: QUESTIONS, setups: SETUPS }, null, 2));

  for (const questionId of QUESTIONS) {
    const question = db
      .prepare('SELECT id,testset,criteria_id FROM questions WHERE id=? AND computer_evaluable=1')
      .get(questionId) as { id: number; testset: string; criteria_id: string } | undefined;
    if (!question) throw new Error(`question ${questionId} not found or not CE`);

    for (const setupId of SETUPS) {
      const result = await executeRun({
        setupId,
        llmConfigId: MODEL_ID,
        questionId,
        testset: question.testset,
        runSetId: RUN_SET_ID,
        runNr: questionId,
        comparisonGroupId: `probe:${questionId}:${setupId}`,
      });
      console.log(JSON.stringify({
        event: 'run',
        setupId,
        questionId,
        runId: result.runId,
        error: result.error ?? null,
        score: result.score?.scorePercent ?? null,
      }, null, 2));
      if (result.error) throw new Error(result.error);
    }
  }

  console.log(JSON.stringify({ event: 'done', runSetId: RUN_SET_ID }, null, 2));
}

main().catch(err => {
  console.error(JSON.stringify({ event: 'error', message: err instanceof Error ? err.message : String(err) }, null, 2));
  process.exitCode = 1;
});

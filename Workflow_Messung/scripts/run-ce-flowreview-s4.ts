import 'dotenv/config';
import db from '../src/db/index';
import { executeRun } from '../src/engine/workflow';
import { scorePairRuns, validatePairScoring } from '../src/engine/scorer';
import { getPreferredScoringModelId } from '../src/settings';

db.pragma('busy_timeout = 30000');

const MODEL_ID = Number(process.env.CE_S4_MODEL_ID ?? 3);
const REVIEWER_MODEL_ID = Number(process.env.CE_S4_REVIEWER_MODEL_ID ?? getPreferredScoringModelId() ?? MODEL_ID);
const RUNS_PER_QUESTION = Number(process.env.CE_S4_RUNS_PER_QUESTION ?? 10);
const TESTSET = process.env.CE_S4_TESTSET ?? 'ce_main_structured_questions';
const RUN_SET_ID = process.env.CE_S4_RUN_SET_ID ?? 'ce_flowreview_s4_10x_model3';
const CONCURRENCY = Math.max(1, Number(process.env.CE_S4_CONCURRENCY ?? 1));
const MAX_QUESTIONS = Number(process.env.CE_S4_MAX_QUESTIONS ?? 0);
const QUESTION_IDS = (process.env.CE_S4_QUESTION_IDS ?? '')
  .split(',')
  .map(value => Number(value.trim()))
  .filter(value => Number.isFinite(value) && value > 0);
const CRITERIA_IDS = (process.env.CE_S4_CRITERIA_IDS ?? '')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);
const WORKFLOW_SETUP_ID = process.env.CE_S4_WORKFLOW_SETUP_ID ?? 'setup_ce_flowreview_s4';
const DIRECT_SETUP_ID = 'setup_ce_direct';

type Question = {
  id: number;
  criteria_id: string;
  question_text: string;
};

type ExistingRun = {
  id: number;
};

type PairJob = {
  question: Question;
  runNr: number;
};

type PairJobResult = {
  questionId: number;
  criteriaId: string;
  runNr: number;
  createdDirect: number;
  createdWorkflow: number;
  reusedDirect: number;
  reusedWorkflow: number;
  pairValidation: Awaited<ReturnType<typeof validatePairScoring>>;
};

function isLockedError(err: unknown): boolean {
  return err instanceof Error && /database is locked|SQLITE_BUSY/i.test(err.message);
}

async function retryLocked<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isLockedError(err)) throw err;
      const delayMs = 750 * attempt;
      console.error(JSON.stringify({ event: 'retry_locked', label, attempt, delayMs }));
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw lastErr;
}

function completedRun(
  setupId: string,
  questionId: number,
  runNr: number,
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
      AND run_nr = ?
      AND status = 'completed'
    ORDER BY id DESC
    LIMIT 1
  `).get(setupId, MODEL_ID, questionId, TESTSET, RUN_SET_ID, comparisonGroupId, runNr) as ExistingRun | undefined;
}

async function runPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
  onComplete: (result: R) => void,
): Promise<void> {
  let nextIndex = 0;
  const workerCount = Math.min(concurrency, items.length);

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const item = items[nextIndex++];
      const result = await worker(item);
      onComplete(result);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
}

async function processPairJob({ question, runNr }: PairJob): Promise<PairJobResult> {
  const comparisonGroupId = `q${question.id}`;
  let createdDirect = 0;
  let createdWorkflow = 0;
  let reusedDirect = 0;
  let reusedWorkflow = 0;

  let direct = completedRun(DIRECT_SETUP_ID, question.id, runNr, comparisonGroupId);
  if (!direct) {
    const result = await retryLocked(`direct q${question.id} #${runNr}`, () => executeRun({
      setupId: DIRECT_SETUP_ID,
      llmConfigId: MODEL_ID,
      questionId: question.id,
      testset: TESTSET,
      runSetId: RUN_SET_ID,
      runNr,
      comparisonGroupId,
    }));
    if (result.error) throw new Error(`Direct failed q${question.id} #${runNr}: ${result.error}`);
    direct = { id: result.runId };
    createdDirect++;
  } else {
    reusedDirect++;
  }

  let workflow = completedRun(WORKFLOW_SETUP_ID, question.id, runNr, comparisonGroupId);
  if (!workflow) {
    const result = await retryLocked(`workflow q${question.id} #${runNr}`, () => executeRun({
      setupId: WORKFLOW_SETUP_ID,
      llmConfigId: MODEL_ID,
      questionId: question.id,
      testset: TESTSET,
      runSetId: RUN_SET_ID,
      runNr,
      comparisonGroupId,
    }));
    if (result.error) throw new Error(`Workflow failed q${question.id} #${runNr}: ${result.error}`);
    workflow = { id: result.runId };
    createdWorkflow++;
  } else {
    reusedWorkflow++;
  }

  await retryLocked(`score pair q${question.id} #${runNr}`, () => scorePairRuns(direct.id, workflow.id, MODEL_ID));
  const pairValidation = await retryLocked(`validate pair q${question.id} #${runNr}`, () => validatePairScoring(direct.id, workflow.id, REVIEWER_MODEL_ID));

  return {
    questionId: question.id,
    criteriaId: question.criteria_id,
    runNr,
    createdDirect,
    createdWorkflow,
    reusedDirect,
    reusedWorkflow,
    pairValidation,
  };
}

async function main(): Promise<void> {
  const model = db.prepare('SELECT id, label, model_id, api_key_env FROM llm_configs WHERE id = ?').get(MODEL_ID) as
    | { id: number; label: string; model_id: string; api_key_env: string }
    | undefined;
  if (!model) throw new Error(`Model config not found: ${MODEL_ID}`);
  if (!process.env[model.api_key_env]) throw new Error(`API key not set for model ${MODEL_ID}: ${model.api_key_env}`);

  db.prepare('INSERT OR IGNORE INTO run_sets (id, name) VALUES (?, ?)').run(RUN_SET_ID, RUN_SET_ID);

  const allQuestions = db.prepare(`
    SELECT id, criteria_id, question_text
    FROM questions
    WHERE testset = ?
      AND computer_evaluable = 1
    ORDER BY criteria_id, id
  `).all(TESTSET) as Question[];

  let questions = allQuestions;
  if (QUESTION_IDS.length > 0) {
    const allowedIds = new Set(QUESTION_IDS);
    questions = questions.filter(question => allowedIds.has(question.id));
  }
  if (CRITERIA_IDS.length > 0) {
    const allowedCriteria = new Set(CRITERIA_IDS);
    questions = questions.filter(question => allowedCriteria.has(question.criteria_id));
  }
  if (MAX_QUESTIONS > 0) {
    questions = questions.slice(0, MAX_QUESTIONS);
  }
  if (questions.length === 0) throw new Error(`No computer-evaluable questions found in ${TESTSET}`);

  const byCriteria = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.criteria_id] = (acc[q.criteria_id] ?? 0) + 1;
    return acc;
  }, {});

  console.log(JSON.stringify({
    event: 'start',
    model: { id: model.id, label: model.label, model_id: model.model_id },
    reviewerModelId: REVIEWER_MODEL_ID,
    testset: TESTSET,
    runSetId: RUN_SET_ID,
    workflowSetupId: WORKFLOW_SETUP_ID,
    questions: questions.length,
    availableQuestions: allQuestions.length,
    runsPerQuestion: RUNS_PER_QUESTION,
    concurrency: CONCURRENCY,
    filters: {
      maxQuestions: MAX_QUESTIONS,
      questionIds: QUESTION_IDS,
      criteriaIds: CRITERIA_IDS,
    },
    byCriteria,
  }));

  let donePairs = 0;
  let createdDirect = 0;
  let createdWorkflow = 0;
  let reusedDirect = 0;
  let reusedWorkflow = 0;
  const jobs = questions.flatMap(question =>
    Array.from({ length: RUNS_PER_QUESTION }, (_, index) => ({ question, runNr: index + 1 })),
  );
  const totalPairs = jobs.length;

  await runPool(jobs, CONCURRENCY, processPairJob, result => {
    donePairs++;
    createdDirect += result.createdDirect;
    createdWorkflow += result.createdWorkflow;
    reusedDirect += result.reusedDirect;
    reusedWorkflow += result.reusedWorkflow;

    if (donePairs % 10 === 0 || donePairs === totalPairs) {
      console.log(JSON.stringify({
        event: 'progress',
        donePairs,
        totalPairs,
        questionId: result.questionId,
        criteriaId: result.criteriaId,
        runNr: result.runNr,
        createdDirect,
        createdWorkflow,
        reusedDirect,
        reusedWorkflow,
        lastPairValidation: result.pairValidation,
      }));
    }
  });

  console.log(JSON.stringify({
    event: 'done',
    donePairs,
    totalPairs,
    createdDirect,
    createdWorkflow,
    reusedDirect,
    reusedWorkflow,
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

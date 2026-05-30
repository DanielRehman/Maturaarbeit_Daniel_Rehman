import db from '../db/index';
import { callLLM, parseWorkflowResponse, LLMConfig, Message } from './llm';
import { tavilySearch, formatSearchResults } from './search';
import { markRunScoreForReview, scoreRun } from './scorer';
import { getPreferredScoringModelId } from '../settings';
import { clarificationIsExpected, looksLikeClarificationRequest } from './clarification';
import { enginePrompt } from '../config/enginePrompts';
import type { ScoreResult } from './scorer';
import type {
  SetupRow,
  SetupStepRow,
  SystemPromptRow,
  QuestionRow,
  LlmConfigRow,
  CheckpointRow,
} from '../db/index';

export interface RunParams {
  setupId: string;
  llmConfigId: number;
  questionId: number;
  testset: string;
  runSetId?: string;
  comparisonGroupId?: string;
  runNr?: number;
}

export interface StepResult {
  step: number;
  formalStep: number;
  finalAnswer: string;
  searchQueries: string[];
  systemPromptUsed: string;
  responseText: string;
}

export interface RunResult {
  runId: number;
  steps: StepResult[];
  finalAnswer: string;
  score?: ScoreResult;
  error?: string;
}

export function buildTechnicalPrompt(
  internetAllowed: boolean,
  isIntermediateStep: boolean
): string {
  let prompt = `\n\n---\n${enginePrompt('workflow_base_response_format')}`;

  if (internetAllowed) {
    prompt += `\n\n${enginePrompt('workflow_internet_search')}`;
  }

  if (isIntermediateStep) {
    prompt += `\n\n${enginePrompt('workflow_next_step')}`;
  }

  return prompt;
}

function isComputerEvaluableQuestion(question: QuestionRow): boolean {
  return Number(question.computer_evaluable ?? 0) === 1 && question.evaluation_type === 'json_exact';
}

function buildComputerEvaluableTechnicalPrompt(internetAllowed: boolean): string {
  if (!internetAllowed) return '';
  return `\n\n---\n${enginePrompt('computer_evaluable_internet_search')}`;
}

function parseComputerEvaluableSearchRequest(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{')) return [];
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return [];
    const obj = parsed as Record<string, unknown>;
    if (obj.isfinished === true) return [];
    if (!Array.isArray(obj.internet_search_requests)) return [];
    return obj.internet_search_requests.map(item => String(item).trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function describeCeAnswerSchema(question: QuestionRow): string {
  if (question.answer_schema_json?.trim()) return question.answer_schema_json.trim();
  return 'No separate schema stored. Use exactly the JSON shape requested in the original task.';
}

function isCeReasonSetup(setupId: string): boolean {
  return setupId === 'setup_ce_reason_flowmap' ||
    setupId === 'setup_ce_reason_pick_flowmap' ||
    setupId === 'setup_ce_reason_pick_iso_flowmap' ||
    setupId === 'setup_ce_ss_reason_flowreview' ||
    setupId === 'setup_ce_ss_reason_pick_iso';
}

function isCeReasonPickSetup(setupId: string): boolean {
  return setupId === 'setup_ce_reason_pick_flowmap' ||
    setupId === 'setup_ce_reason_pick_iso_flowmap' ||
    setupId === 'setup_ce_ss_reason_pick_iso';
}

function isCeReasonIsoPickSetup(setupId: string): boolean {
  return setupId === 'setup_ce_reason_pick_iso_flowmap' || setupId === 'setup_ce_ss_reason_pick_iso';
}

function isCeSameStartReasonSetup(setupId: string): boolean {
  return setupId === 'setup_ce_ss_reason_flowreview' || setupId === 'setup_ce_ss_reason_pick_iso';
}

function isCeAdditiveCompletionSetup(setupId: string): boolean {
  return setupId === 'setup_ce_additive_completion';
}

function parseJsonObjectAnswer(answer: string): Record<string, unknown> | null {
  const trimmed = answer.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      const parsed = JSON.parse(candidate.slice(start, end + 1)) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function ceAnswerKeys(question: QuestionRow): string[] {
  if (question.answer_schema_json?.trim()) {
    try {
      const parsed = JSON.parse(question.answer_schema_json) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const fields = (parsed as { fields?: unknown }).fields;
        if (fields && typeof fields === 'object' && !Array.isArray(fields)) {
          return Object.keys(fields as Record<string, unknown>);
        }
      }
    } catch {
      // Fall back to expected_answer_json below.
    }
  }
  if (question.expected_answer_json?.trim()) {
    try {
      const parsed = JSON.parse(question.expected_answer_json) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return Object.keys(parsed as Record<string, unknown>);
      }
    } catch {
      return [];
    }
  }
  return [];
}

function isAdditiveBlank(value: unknown): boolean {
  return value === null || value === undefined;
}

function buildCeAdditiveCompletionMessage(question: QuestionRow, stepNum: number, previousAnswer: string): string {
  const keys = ceAnswerKeys(question);
  const keyList = keys.length ? JSON.stringify(keys) : 'the exact keys required by the task/schema';
  if (stepNum === 1) {
    return [
      'Solve this computer-evaluable JSON task cautiously.',
      '',
      'Original task:',
      question.question_text,
      '',
      'Allowed answer schema. This is NOT the solution, only the required shape and allowed value types/options:',
      describeCeAnswerSchema(question),
      '',
      'Required output rules:',
      '- Return exactly one JSON object and nothing else.',
      `- Use exactly these answer keys: ${keyList}.`,
      '- For every field you are sure is correct, fill the value using the required type.',
      '- For every field you are not sure about, set the value to null.',
      '- Do not guess to look complete.',
      '- Scoring incentive: correct filled value = +1; null/unsure = 0; wrong filled value = -3.',
      '- Null is better than a guessed or weakly supported answer.',
    ].join('\n');
  }

  return [
    'You are the additive completion pass for a cautious JSON draft.',
    '',
    'Original task:',
    question.question_text,
    '',
    'Step 1 cautious draft:',
    previousAnswer || '(missing or invalid)',
    '',
    'Allowed answer schema. This is NOT the solution, only the required shape and allowed value types/options:',
    describeCeAnswerSchema(question),
    '',
    'Your job:',
    '- Return exactly one JSON object and nothing else.',
    `- Use exactly these answer keys: ${keyList}.`,
    '- You may fill fields that are null or missing in the Step 1 draft when you are sure.',
    '- You are not allowed to change any non-null Step 1 value.',
    '- If a non-null Step 1 value looks wrong, leave it unchanged; the engine will lock it. You may only improve by adding missing/null values.',
    '- Use null for any field you still cannot determine confidently.',
    '- Scoring incentive: correct filled value = +1; null/unsure = 0; wrong filled value = -3.',
  ].join('\n');
}

function mergeCeAdditiveCompletion(question: QuestionRow, stepOneAnswer: string, stepTwoAnswer: string): { finalAnswer: string; report: Record<string, unknown> } {
  const keys = ceAnswerKeys(question);
  const stepOne = parseJsonObjectAnswer(stepOneAnswer);
  const stepTwo = parseJsonObjectAnswer(stepTwoAnswer);
  const keySet = new Set([
    ...keys,
    ...Object.keys(stepOne ?? {}),
    ...Object.keys(stepTwo ?? {}),
  ].filter(key => !key.startsWith('_')));
  const finalObject: Record<string, unknown> = {};
  const locked: string[] = [];
  const filled: string[] = [];
  const blank: string[] = [];

  for (const key of keySet) {
    const firstValue = stepOne?.[key];
    if (!isAdditiveBlank(firstValue)) {
      finalObject[key] = firstValue;
      locked.push(key);
      continue;
    }
    const secondValue = stepTwo?.[key];
    if (!isAdditiveBlank(secondValue)) {
      finalObject[key] = secondValue;
      filled.push(key);
      continue;
    }
    finalObject[key] = null;
    blank.push(key);
  }

  return {
    finalAnswer: JSON.stringify(finalObject, null, 2),
    report: {
      protocol: 'ce_additive_completion',
      step_one_parseable: !!stepOne,
      step_two_parseable: !!stepTwo,
      locked_non_null_step_one_fields: locked,
      filled_from_step_two_fields: filled,
      still_null_fields: blank,
      enforcement_rule: 'Step 2 can only fill fields that were null or missing in Step 1.',
    },
  };
}

function answerHasUsefulReasoning(answer: string): boolean {
  const parsed = parseJsonObjectAnswer(answer);
  const value = parsed?.ai_reasoning;
  return typeof value === 'string' && value.trim().length >= 10;
}

function ceReasonStepProtocolProblems(setupId: string, stepNum: number, answer: string): string[] {
  const problems: string[] = [];
  const parsed = parseJsonObjectAnswer(answer);
  if (!parsed) return ['output is not a parseable JSON object'];
  const reasoning = parsed.ai_reasoning;
  if (typeof reasoning !== 'string' || reasoning.trim().length < 10) {
    problems.push('missing useful ai_reasoning');
  }
  const isPickerStep = isCeReasonPickSetup(setupId) &&
    (isCeSameStartReasonSetup(setupId) ? stepNum === 3 : stepNum === 4);
  if (isPickerStep) {
    const picked = parsed.picked_candidate;
    if (picked !== 'A' && picked !== 'B') problems.push('missing picked_candidate "A" or "B"');
    if (!Array.isArray(parsed.pick_checklist) || parsed.pick_checklist.length < 3) {
      problems.push('missing usable pick_checklist');
    }
  }
  return problems;
}

function stripWorkflowMetadata(answer: string): string {
  const parsed = parseJsonObjectAnswer(answer);
  if (!parsed) return answer;
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (
      key === 'ai_reasoning' ||
      key === 'pick_reasoning' ||
      key === 'pick_checklist' ||
      key === 'picked_candidate' ||
      key === 'protocol_audit' ||
      key.endsWith('_reason') ||
      key.endsWith('_reasoning') ||
      key.endsWith('_comment')
    ) {
      continue;
    }
    cleaned[key] = value;
  }
  return JSON.stringify(cleaned, null, 2);
}

function ceReasonEnvelope(question: QuestionRow): string {
  return [
    'IMPORTANT WORKFLOW FORMAT OVERRIDE:',
    'The original task may say "no extra keys" or list an exact key set.',
    'For this CE_REASON workflow, add exactly one unscored workflow metadata field named ai_reasoning in every step.',
    'Keep all required answer fields from the original task/schema. Do not add other answer keys unless this step explicitly asks for picker metadata.',
    'ai_reasoning must explain briefly which task facts, rules, calculations, constraints, and uncertainty produced the JSON values.',
    '',
    'Original task:',
    question.question_text,
    '',
    'Allowed answer schema. This is not the solution, only the required shape/types/options:',
    describeCeAnswerSchema(question),
  ].join('\n');
}

function buildCeReasonStepMessages(
  setupId: string,
  stepNum: number,
  question: QuestionRow,
  previousAnswers: Map<number, string>,
): Message[] {
  const base = ceReasonEnvelope(question);
  if (stepNum === 1) {
    return [{
      role: 'user',
      content: [
        base,
        '',
        'Step 1 task:',
        'Create the first candidate JSON. Return one JSON object only: all required answer fields plus ai_reasoning.',
        'Do not include markdown or text outside JSON.',
      ].join('\n'),
    }];
  }

  if (stepNum === 2) {
    if (isCeSameStartReasonSetup(setupId)) {
      return [{
        role: 'user',
        content: [
          base,
          '',
          'Candidate from Step 1. This is the copied Direct answer and must be treated as the original baseline:',
          previousAnswers.get(1) || '(missing)',
          '',
          'Step 2 task:',
          'Conservatively review the copied Direct answer against the original task.',
          'Do not solve from scratch and do not rewrite for style.',
          'Keep the copied Direct answer unless you find an important, concrete, evidence-backed error.',
          'Only fix severe concrete errors: wrong value, wrong type, missing required value, wrong option, wrong calculation, or lost constraint.',
          'When checking rules, respect strict comparisons exactly: "more than" means >, "less than" means <; equality does not satisfy either condition.',
          'If you change any answer field, ai_reasoning must include: field name, old value, new value, the exact rule/condition, and the arithmetic/state that proves the change.',
          'If you cannot give that concrete proof for every changed field, keep the copied Direct value.',
          'Return one JSON object only: all required answer fields plus ai_reasoning explaining what you checked and what changed.',
        ].join('\n'),
      }];
    }
    return [{
      role: 'user',
      content: [
        base,
        '',
        'Candidate from Step 1:',
        previousAnswers.get(1) || '(missing)',
        '',
        'Step 2 task:',
        'Check the candidate against the original task. Do not solve from scratch and do not rewrite for style.',
        'Only fix severe concrete errors: wrong value, wrong type, missing required value, wrong option, wrong calculation, or lost constraint.',
        'Return one JSON object only: all required answer fields plus ai_reasoning explaining what you checked and what changed.',
      ].join('\n'),
    }];
  }

  if (stepNum === 3) {
    if (isCeSameStartReasonSetup(setupId) && isCeReasonPickSetup(setupId)) {
      const candidateA = stripWorkflowMetadata(previousAnswers.get(1) || '(missing)');
      const candidateB = stripWorkflowMetadata(previousAnswers.get(2) || '(missing)');
      return [{
        role: 'user',
        content: [
          base,
          '',
          'Candidate X: copied Direct baseline answer. Workflow metadata and reasoning have been removed:',
          candidateA,
          '',
          'Candidate Y: conservative review answer. Workflow metadata and reasoning have been removed:',
          candidateB,
          '',
          'Step 3 ISO PICK task:',
          'You are isolated from previous workflow history. Compare only the original task, schema, Candidate X, and Candidate Y.',
          'Pick exactly one candidate as final. Do not merge, except if one candidate is clearly only a formatting/type repair of the same answer.',
          '',
          'Decision priorities, in order:',
          '1. Correctness first. Never pick nicer wording if it is less correct.',
          '2. Candidate X is the copied Direct baseline and the default. Keep X when uncertain or when Y is only different/nicer but not materially better.',
          '3. Pick Candidate Y only if it clearly fixes an important, concrete, evidence-backed problem in X.',
          '4. Penalize new claims or changed values not supported by prompt/context.',
          '5. Penalize removed constraints, removed required fields, or lost details.',
          'Before picking Y, identify every field where X and Y differ. For each changed field, verify the exact rule/condition and arithmetic/state from the original task. Strict comparisons matter: equality is not "more than" and not "less than".',
          'If even one changed field in Y lacks a concrete proof, or Y changes a correct-looking X field without proof, pick X.',
          '6. Then compare completeness.',
          '7. Then compare clarity/style.',
          '8. Prefer the shorter answer if quality is equal.',
          '9. If both have different issues, choose the one with fewer correctness risks.',
          '',
          'Return one JSON object only. It must contain the selected candidate answer fields plus:',
          '- ai_reasoning: short explanation of the final selected values.',
          '- picked_candidate: "A" for Candidate X or "B" for Candidate Y.',
          '- pick_checklist: an array of short objects, one per priority, describing whether X or Y fulfills that priority better. Include changed-field proof checks before the completeness/style priorities.',
          'picked_candidate and pick_checklist are workflow metadata and are not scored.',
        ].join('\n'),
      }];
    }
    return [{
      role: 'user',
      content: [
        base,
        '',
        'Checked candidate from Step 2:',
        previousAnswers.get(2) || previousAnswers.get(1) || '(missing)',
        '',
        'Step 3 task:',
        'Prepare the final checked candidate. Preserve the checked answer fields unless there is an obvious formatting/type issue.',
        'Do not solve from scratch. Return one JSON object only: all required answer fields plus ai_reasoning.',
      ].join('\n'),
    }];
  }

  if (isCeReasonPickSetup(setupId) && stepNum === 4) {
    const candidateA = isCeReasonIsoPickSetup(setupId)
      ? stripWorkflowMetadata(previousAnswers.get(1) || '(missing)')
      : previousAnswers.get(1) || '(missing)';
    const candidateBSource = previousAnswers.get(3) || previousAnswers.get(2) || '(missing)';
    const candidateB = isCeReasonIsoPickSetup(setupId)
      ? stripWorkflowMetadata(candidateBSource)
      : candidateBSource;
    return [{
      role: 'user',
      content: [
        base,
        '',
        isCeReasonIsoPickSetup(setupId)
          ? 'Candidate X: first candidate JSON answer. Workflow metadata and reasoning have been removed:'
          : 'Candidate A: Step 1 original candidate, including its ai_reasoning:',
        candidateA,
        '',
        isCeReasonIsoPickSetup(setupId)
          ? 'Candidate Y: second candidate JSON answer. Workflow metadata and reasoning have been removed:'
          : 'Candidate B: Step 3 checked candidate, including its ai_reasoning:',
        candidateB,
        '',
        'Step 4 PICK task:',
        'You do not know the true solution and must not pretend to. Compare only the original task and the two candidate JSON objects.',
        isCeReasonIsoPickSetup(setupId)
          ? 'You are isolated from the previous workflow history. You do not know which candidate came first or which was reviewed.'
          : 'You can use the candidate reasonings as hints, but not as proof.',
        'Pick exactly one candidate as final. Do not merge, except if one candidate is clearly only a formatting/type repair of the same answer.',
        '',
        'Decision priorities, in order:',
        '1. Correctness first. Never pick nicer wording if it is less correct.',
        isCeReasonIsoPickSetup(setupId)
          ? '2. Candidate X is the default. Keep X when uncertain or when Y is only different/nicer but not materially better.'
          : '2. Candidate A is the default. Keep Candidate A when uncertain or when Candidate B is only different/nicer but not materially better.',
        isCeReasonIsoPickSetup(setupId)
          ? '3. Pick Candidate Y only if it clearly fixes an important, concrete, evidence-backed problem in X.'
          : '3. Pick Candidate B only if it clearly fixes an important, concrete, evidence-backed problem.',
        '4. Penalize new claims or changed values not supported by prompt/context.',
        '5. Penalize removed constraints, removed required fields, or lost details.',
        '6. Then compare completeness.',
        '7. Then compare clarity/style.',
        '8. Prefer the shorter answer if quality is equal.',
        '9. If both have different issues, choose the one with fewer correctness risks.',
        '',
        'Return one JSON object only. It must contain the selected candidate answer fields plus:',
        '- ai_reasoning: short explanation of the final selected values.',
        isCeReasonIsoPickSetup(setupId)
          ? '- picked_candidate: "A" for Candidate X or "B" for Candidate Y.'
          : '- picked_candidate: "A" or "B".',
        '- pick_checklist: an array of short objects, one per priority, describing whether A or B fulfills that priority better.',
        'picked_candidate and pick_checklist are workflow metadata and are not scored.',
      ].join('\n'),
    }];
  }

  return [{ role: 'user', content: base }];
}

function appendCeReasonProtocolAuditStep(runId: number, setupId: string, question: QuestionRow, storedStepNum: number): string[] {
  if (!isCeReasonSetup(setupId)) return [];

  const rows = db.prepare(`
    SELECT step, formal_step, final_answer, messages_json
    FROM run_steps
    WHERE run_id = ? AND COALESCE(formal_step, step) < 900
    ORDER BY step ASC
  `).all(runId) as Array<{ step: number; formal_step: number | null; final_answer: string | null; messages_json: string | null }>;

  const problems: string[] = [];
  const expectedSteps = isCeSameStartReasonSetup(setupId)
    ? (isCeReasonPickSetup(setupId) ? 3 : 2)
    : (isCeReasonPickSetup(setupId) ? 4 : 3);
  if (rows.length < expectedSteps) problems.push(`expected ${expectedSteps} real workflow steps, found ${rows.length}.`);

  for (const row of rows) {
    const formalStep = Number(row.formal_step ?? row.step);
    const answer = row.final_answer ?? '';
    if (!parseJsonObjectAnswer(answer)) {
      problems.push(`step ${formalStep} did not return a parseable JSON object.`);
      continue;
    }
    if (isCeSameStartReasonSetup(setupId) && formalStep === 1) {
      continue;
    }
    if (!answerHasUsefulReasoning(answer)) {
      problems.push(`step ${formalStep} is missing useful ai_reasoning.`);
    }
  }

  if (isCeReasonPickSetup(setupId)) {
    const pickerFormalStep = isCeSameStartReasonSetup(setupId) ? 3 : 4;
    const picker = rows.find(row => Number(row.formal_step ?? row.step) === pickerFormalStep);
    const pickerAnswer = picker?.final_answer ?? '';
    const pickerJson = parseJsonObjectAnswer(pickerAnswer);
    const picked = pickerJson?.picked_candidate;
    if (picked !== 'A' && picked !== 'B') problems.push('PICK step is missing picked_candidate "A" or "B".');
    if (!Array.isArray(pickerJson?.pick_checklist) || pickerJson.pick_checklist.length < 3) {
      problems.push('PICK step is missing a usable pick_checklist.');
    }
    const pickerMessages = picker?.messages_json ?? '';
    const hasNamedCandidates = isCeReasonIsoPickSetup(setupId)
      ? pickerMessages.includes('Candidate X') && pickerMessages.includes('Candidate Y')
      : pickerMessages.includes('Candidate A') && pickerMessages.includes('Candidate B');
    if (!hasNamedCandidates) {
      problems.push('PICK step prompt did not explicitly contain two named candidates.');
    }
  }

  const report = {
    protocol_audit: problems.length === 0 ? 'ok' : 'review_required',
    setup_id: setupId,
    question_id: question.id,
    checks: {
      expected_real_steps: expectedSteps,
      actual_real_steps: rows.length,
      every_step_has_ai_reasoning: rows.every(row => {
        const formalStep = Number(row.formal_step ?? row.step);
        return isCeSameStartReasonSetup(setupId) && formalStep === 1
          ? true
          : answerHasUsefulReasoning(row.final_answer ?? '');
      }),
      picker_has_two_named_candidates: !isCeReasonPickSetup(setupId) || (() => {
        const pickerFormalStep = isCeSameStartReasonSetup(setupId) ? 3 : 4;
        const pickerMessages = rows.find(row => Number(row.formal_step ?? row.step) === pickerFormalStep)?.messages_json ?? '';
        return isCeReasonIsoPickSetup(setupId)
          ? pickerMessages.includes('Candidate X') && pickerMessages.includes('Candidate Y')
          : pickerMessages.includes('Candidate A') && pickerMessages.includes('Candidate B');
      })(),
    },
    problems,
  };

  db.prepare(`
    INSERT INTO run_steps (run_id, step, formal_step, internet_allowed, system_prompt_used, messages_json, response_text, search_queries_json, search_results_json, final_answer)
    VALUES (?, ?, 900, 0, ?, ?, ?, ?, ?, ?)
  `).run(
    runId,
    storedStepNum + 1,
    'CE_REASON protocol audit. Deterministic reviewer: verifies workflow shape, required reasoning metadata, and PICK candidate visibility. It does not score correctness.',
    JSON.stringify([]),
    JSON.stringify(report, null, 2),
    JSON.stringify([]),
    JSON.stringify([]),
    JSON.stringify(report, null, 2),
  );

  return problems;
}

function buildCeFlowreviewS4ReviewMessage(question: QuestionRow, draftAnswer: string): string {
  return [
    'Review this computer-evaluable JSON draft.',
    '',
    'Original task:',
    question.question_text,
    '',
    'Draft JSON answer to review:',
    draftAnswer,
    '',
    'Allowed answer schema. This is NOT the solution, only the required shape and allowed value types/options:',
    describeCeAnswerSchema(question),
    '',
    'Rules:',
    '- Return exactly one JSON object and nothing else.',
    '- Use exactly the same keys required by the schema/task.',
    '- Do not add keys, comments, markdown, explanations, or friendly follow-up text.',
    '- Preserve arrays as arrays, booleans as booleans, and numbers as numbers when the schema asks for them.',
    '- Recompute arithmetic fields from the original task, even when the draft looks plausible.',
    '- For option/list tasks, compare each selected option against the original task text.',
    '- For source/currentness tasks, decide whether the information is time-sensitive and whether an official source is truly needed.',
    '- For uncertainty/follow-up tasks, count only missing information that is explicitly required by the task schema.',
    '- If the draft already has the right schema and you do not find a concrete factual/calculation error, return the draft JSON unchanged.',
    '- Only change a value when the original task proves the draft value is wrong.',
  ].join('\n');
}

function llmConfigFromRow(row: LlmConfigRow): LLMConfig {
  return {
    id: row.id,
    label: row.label,
    provider: row.provider,
    model_id: row.model_id,
    base_url: row.base_url,
    api_key_env: row.api_key_env,
    supports_native_search: row.supports_native_search,
  };
}

function getIsoPickerConfig(fallback: LLMConfig): { config: LLMConfig; temperature: number } {
  const pickerModelId = Number(process.env.CE_ISO_PICKER_MODEL_ID ?? 4);
  const pickerTemperature = Number(process.env.CE_ISO_PICKER_TEMPERATURE ?? 0.1);
  if (!Number.isFinite(pickerModelId) || pickerModelId <= 0 || pickerModelId === fallback.id) {
    return { config: fallback, temperature: pickerTemperature };
  }
  const row = db.prepare('SELECT * FROM llm_configs WHERE id = ?').get(pickerModelId) as LlmConfigRow | undefined;
  if (!row) return { config: fallback, temperature: pickerTemperature };
  return { config: llmConfigFromRow(row), temperature: pickerTemperature };
}

export async function executeRun(params: RunParams): Promise<RunResult> {
  const { setupId, llmConfigId, questionId, testset, runSetId, comparisonGroupId, runNr } = params;

  // Load data from DB
  const setup = db.prepare('SELECT * FROM setups WHERE id = ?').get(setupId) as SetupRow | undefined;
  if (!setup) throw new Error(`Setup not found: ${setupId}`);

  const steps = db
    .prepare('SELECT * FROM setup_steps WHERE setup_id = ? ORDER BY step ASC')
    .all(setupId) as SetupStepRow[];

  const systemPrompts = db
    .prepare('SELECT * FROM system_prompts WHERE setup_id = ? ORDER BY step ASC')
    .all(setupId) as SystemPromptRow[];

  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId) as QuestionRow | undefined;
  if (!question) throw new Error(`Question not found: ${questionId}`);

  const checkpoints = db
    .prepare('SELECT * FROM checkpoints WHERE question_id = ? ORDER BY sort_order ASC')
    .all(question.id) as CheckpointRow[];

  const llmConfigRaw = db.prepare('SELECT * FROM llm_configs WHERE id = ?').get(llmConfigId) as LlmConfigRow | undefined;
  if (!llmConfigRaw) throw new Error(`LLM config not found: ${llmConfigId}`);

  const llmConfig: LLMConfig = llmConfigFromRow(llmConfigRaw);

  // Create run record
  const runInsert = db.prepare(`
    INSERT INTO runs (setup_id, llm_config_id, question_id, testset, run_set_id, run_nr, comparison_group_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'running')
  `);
  const runResult = runInsert.run(setupId, llmConfigId, questionId, testset, runSetId ?? 'legacy_existing_import', runNr ?? null, comparisonGroupId ?? null);
  const runId = runResult.lastInsertRowid as number;

  const stepResults: StepResult[] = [];
  let finalAnswer = '';
  let messages: Message[] = [{ role: 'user', content: question.question_text }];
  let storedStepNum = 0;
  const autoanswerAttempts = new Map<number, number>();
  const ceReasonStepAnswers = new Map<number, string>();

  const copyMatchingDirectAnswerAsStep = (): boolean => {
    const sourceDirectSetupId = setupId.startsWith('setup_ce_') ? 'setup_ce_direct' : 'setup_direct';
    const directStep = db.prepare(`
      SELECT r.id as source_run_id,
             rs.step as source_step,
             rs.final_answer,
             rs.response_text,
             rs.messages_json,
             rs.system_prompt_used
      FROM runs r
      JOIN run_steps rs ON rs.run_id = r.id
      WHERE r.setup_id = ?
        AND r.status = 'completed'
        AND r.llm_config_id = ?
        AND r.question_id = ?
        AND COALESCE(r.testset, '') = COALESCE(?, '')
        AND COALESCE(r.run_set_id, '') = COALESCE(?, '')
        AND COALESCE(r.comparison_group_id, '') = COALESCE(?, '')
        AND COALESCE(r.run_nr, -1) = COALESCE(?, -1)
      ORDER BY rs.step DESC
      LIMIT 1
    `).get(
      sourceDirectSetupId,
      llmConfigId,
      questionId,
      testset,
      runSetId ?? 'legacy_existing_import',
      comparisonGroupId ?? null,
      runNr ?? null,
    ) as {
      source_run_id: number;
      source_step: number;
      final_answer: string | null;
      response_text: string | null;
      messages_json: string | null;
      system_prompt_used: string | null;
    } | undefined;

    if (!directStep?.final_answer?.trim()) {
      throw new Error(`${setupId} requires a completed matching Direct run with a saved answer to copy.`);
    }

    storedStepNum++;
    finalAnswer = directStep.final_answer;
    const copiedSystemPrompt = [
      `Copied from ${sourceDirectSetupId} run #${directStep.source_run_id}, step #${directStep.source_step}.`,
      'No model call was made for this workflow step.',
      directStep.system_prompt_used ? `Original Direct system prompt:\n${directStep.system_prompt_used}` : '',
    ].filter(Boolean).join('\n\n');
    const copiedResponseText = [
      `[Copied from ${sourceDirectSetupId} run #${directStep.source_run_id}, step #${directStep.source_step}]`,
      directStep.response_text || directStep.final_answer,
    ].join('\n\n');

    db.prepare(`
      INSERT INTO run_steps (run_id, step, formal_step, internet_allowed, system_prompt_used, messages_json, response_text, search_queries_json, search_results_json, final_answer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      runId,
      storedStepNum,
      1,
      0,
      copiedSystemPrompt,
      directStep.messages_json || JSON.stringify([{ role: 'user', content: question.question_text }]),
      copiedResponseText,
      JSON.stringify([]),
      JSON.stringify([]),
      finalAnswer,
    );

    stepResults.push({
      step: storedStepNum,
      formalStep: 1,
      finalAnswer,
      searchQueries: [],
      systemPromptUsed: copiedSystemPrompt,
      responseText: copiedResponseText,
    });

    messages = [
      { role: 'user', content: question.question_text },
      { role: 'assistant', content: finalAnswer },
    ];
    return true;
  };

  const createSyntheticUserAnswer = async (clarificationQuestion: string): Promise<string> => {
    const scoringId = getPreferredScoringModelId();
    const checkerRaw = scoringId
      ? db.prepare('SELECT * FROM llm_configs WHERE id = ?').get(scoringId) as LlmConfigRow | undefined
      : undefined;
    const checker = checkerRaw ?? llmConfigRaw;
    const checkerConfig: LLMConfig = {
      id: checker.id,
      label: checker.label,
      provider: checker.provider,
      model_id: checker.model_id,
      base_url: checker.base_url,
      api_key_env: checker.api_key_env,
      supports_native_search: checker.supports_native_search,
    };
    const systemPrompt = enginePrompt('unexpected_clarification_autoanswer');
    const userMessage = `Original question:
${question.question_text}

AI clarification question:
${clarificationQuestion}

Short neutral user answer:`;
    const answer = await callLLM(checkerConfig, systemPrompt, [{ role: 'user', content: userMessage }]);
    return answer.replace(/```[\s\S]*?```/g, '').trim() || 'Bitte waehle eine sinnvolle, neutrale Standardannahme und fahre fort.';
  };

  try {
    let stepIdx = 0;
    if (setupId === 'setup_flowreview_same' || setupId === 'setup_ce_flowreview_s4' || isCeSameStartReasonSetup(setupId)) {
      copyMatchingDirectAnswerAsStep();
      if (isCeSameStartReasonSetup(setupId)) {
        ceReasonStepAnswers.set(1, finalAnswer);
      }
      stepIdx = 1;
    }
    while (stepIdx < setup.max_steps) {
      const stepNum = stepIdx + 1;
      const stepConfig = steps.find(s => s.step === stepNum);
      const promptConfig = systemPrompts.find(p => p.step === stepNum);

      const internetAllowed = stepConfig?.internet_allowed === 1;
      const isLastStep = stepIdx === setup.max_steps - 1;
      // isIntermediateStep: only true for step 2+ when MORE steps still follow (future 3-step setups)
      // step 1 never gets Add-on B — AI must not know a second step is coming
      const isIntermediateStep = stepIdx > 0 && !isLastStep;
      const baseSystemPrompt = promptConfig?.prompt ?? 'Answer the question.';
      const useComputerEvaluableJson = isComputerEvaluableQuestion(question);
      const technicalPrompt = useComputerEvaluableJson
        ? buildComputerEvaluableTechnicalPrompt(internetAllowed)
        : buildTechnicalPrompt(internetAllowed, isIntermediateStep);
      const ceReasonTechnicalPrompt = useComputerEvaluableJson && isCeReasonSetup(setupId)
        ? `\n\n---\nCE_REASON protocol requirement:\nEvery workflow step must return a single JSON object with all required answer fields plus ai_reasoning.\nai_reasoning is unscored workflow metadata. It is allowed even if the original task says \"no extra keys\".\nDo not add other metadata keys unless this is the PICK step, where picked_candidate and pick_checklist are also required and unscored.`
        : '';
      const fullSystemPrompt = baseSystemPrompt + technicalPrompt + ceReasonTechnicalPrompt;

      let stepMessages = [...messages];
      if (useComputerEvaluableJson && isCeReasonSetup(setupId)) {
        stepMessages = buildCeReasonStepMessages(setupId, stepNum, question, ceReasonStepAnswers);
      } else if (useComputerEvaluableJson && isCeAdditiveCompletionSetup(setupId)) {
        stepMessages = [
          {
            role: 'user',
            content: buildCeAdditiveCompletionMessage(question, stepNum, finalAnswer),
          },
        ];
      } else if (setupId === 'setup_ce_flowreview_s4' && stepNum === 2) {
        stepMessages = [
          {
            role: 'user',
            content: buildCeFlowreviewS4ReviewMessage(question, finalAnswer),
          },
        ];
      }
      let responseText = '';
      let searchQueries: string[] = [];
      let allSearchResults: string[] = [];
      let parsedResponse = { answer: '', isfinished: true, raw: '', internet_search_requests: [] as string[], optional_nextprompt: '' };

      // Inner search loop (max 3 iterations)
      let searchIterations = 0;
      const maxSearchIterations = 3;

      while (searchIterations < maxSearchIterations) {
        searchIterations++;
        const isIsoPickerStep = isCeReasonIsoPickSetup(setupId) &&
          (isCeSameStartReasonSetup(setupId) ? stepNum === 3 : stepNum === 4);
        const stepLlm = isIsoPickerStep
          ? getIsoPickerConfig(llmConfig)
          : { config: llmConfig, temperature: undefined };
        responseText = await callLLM(
          stepLlm.config,
          fullSystemPrompt,
          stepMessages,
          stepLlm.temperature === undefined ? {} : { temperature: stepLlm.temperature },
        );

        if (useComputerEvaluableJson) {
          const queries = parseComputerEvaluableSearchRequest(responseText);
          if (queries.length > 0 && internetAllowed) {
            searchQueries.push(...queries);
            const searchResults = await tavilySearch(queries);
            const formatted = formatSearchResults(searchResults);
            allSearchResults.push(formatted);
            stepMessages = [
              ...stepMessages,
              { role: 'assistant', content: responseText },
              { role: 'user', content: formatted },
            ];
            continue;
          }
          parsedResponse = {
            answer: responseText.trim(),
            isfinished: true,
            raw: responseText,
            internet_search_requests: [],
            optional_nextprompt: '',
          };
          if (isCeReasonSetup(setupId)) {
            const problems = ceReasonStepProtocolProblems(setupId, stepNum, parsedResponse.answer);
            if (problems.length > 0) {
              const repairMessages: Message[] = [
                ...stepMessages,
                { role: 'assistant', content: responseText },
                {
                  role: 'user',
                  content: [
                    'Your previous output violates the CE_REASON workflow protocol:',
                    ...problems.map(problem => `- ${problem}`),
                    '',
                    'Repair only the JSON format/protocol. Keep the answer values unless a required metadata field must be added.',
                    'Return one JSON object only.',
                    'Required metadata for every step: ai_reasoning.',
                    isCeReasonPickSetup(setupId) && stepNum === (isCeSameStartReasonSetup(setupId) ? 3 : 4)
                      ? 'Required metadata for PICK step: picked_candidate ("A" or "B") and pick_checklist.'
                      : '',
                  ].filter(Boolean).join('\n'),
                },
              ];
              responseText = await callLLM(
                stepLlm.config,
                fullSystemPrompt,
                repairMessages,
                stepLlm.temperature === undefined ? {} : { temperature: stepLlm.temperature },
              );
              parsedResponse = {
                answer: responseText.trim(),
                isfinished: true,
                raw: responseText,
                internet_search_requests: [],
                optional_nextprompt: '',
              };
            }
          }
          break;
        }

        const parsed = parseWorkflowResponse(responseText);
        parsedResponse = {
          answer: parsed.answer ?? '',
          isfinished: parsed.isfinished !== false,
          raw: responseText,
          internet_search_requests: parsed.internet_search_requests ?? [],
          optional_nextprompt: parsed.optional_nextprompt ?? '',
        };

        const queries = parsedResponse.internet_search_requests ?? [];

        if (queries.length > 0 && internetAllowed) {
          searchQueries.push(...queries);
          const searchResults = await tavilySearch(queries);
          const formatted = formatSearchResults(searchResults);
          allSearchResults.push(formatted);

          // Append to messages for next iteration
          stepMessages = [
            ...stepMessages,
            { role: 'assistant', content: responseText },
            { role: 'user', content: formatted },
          ];
        } else {
          // No more searches needed
          break;
        }
      }

      finalAnswer = parsedResponse.answer || responseText;
      let additiveMergeReport: Record<string, unknown> | null = null;
      if (useComputerEvaluableJson && isCeAdditiveCompletionSetup(setupId) && stepNum === 2) {
        const merged = mergeCeAdditiveCompletion(question, stepResults[0]?.finalAnswer ?? '', finalAnswer);
        finalAnswer = merged.finalAnswer;
        additiveMergeReport = merged.report;
      }
      if (useComputerEvaluableJson && isCeReasonSetup(setupId)) {
        ceReasonStepAnswers.set(stepNum, finalAnswer);
      }

      storedStepNum++;

      // Store step in run_steps
      db.prepare(`
        INSERT INTO run_steps (run_id, step, formal_step, internet_allowed, system_prompt_used, messages_json, response_text, search_queries_json, search_results_json, final_answer)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        runId,
        storedStepNum,
        stepNum,
        internetAllowed ? 1 : 0,
        fullSystemPrompt,
        JSON.stringify(stepMessages),
        responseText,
        JSON.stringify(searchQueries),
        JSON.stringify(allSearchResults),
        finalAnswer
      );

      stepResults.push({
        step: storedStepNum,
        formalStep: stepNum,
        finalAnswer,
        searchQueries,
        systemPromptUsed: baseSystemPrompt,
        responseText,
      });

      if (additiveMergeReport) {
        db.prepare(`
          INSERT INTO run_steps (run_id, step, formal_step, internet_allowed, system_prompt_used, messages_json, response_text, search_queries_json, search_results_json, final_answer)
          VALUES (?, ?, 900, 0, ?, ?, ?, ?, ?, ?)
        `).run(
          runId,
          storedStepNum + 1,
          'CE additive completion deterministic merge audit. This audit does not affect scoring.',
          JSON.stringify([]),
          JSON.stringify(additiveMergeReport, null, 2),
          JSON.stringify([]),
          JSON.stringify([]),
          JSON.stringify(additiveMergeReport, null, 2),
        );
      }

      const unexpectedClarification =
        looksLikeClarificationRequest(finalAnswer) &&
        !clarificationIsExpected(question, checkpoints);

      if (unexpectedClarification && Number(question.autoanswer ?? 1) === 1) {
        const attempts = autoanswerAttempts.get(stepNum) ?? 0;
        if (attempts < 1) {
          autoanswerAttempts.set(stepNum, attempts + 1);
          const syntheticAnswer = await createSyntheticUserAnswer(finalAnswer);
          messages = [
            ...messages,
            { role: 'assistant', content: finalAnswer },
            { role: 'user', content: `[Autoanswer by checker because the previous clarification was unexpected]\n${syntheticAnswer}` },
          ];
          continue;
        }
      }
      if (unexpectedClarification) {
        break;
      }

      // isfinished controls step progression — EXCEPT step 2 always runs regardless.
      // The AI never knows step 2 is coming (step 1 prompt identical to Setup A),
      // so it cannot signal intent to skip it. Engine always advances to step 2.
      // For last step: run ends here.
      if (isLastStep) {
        break;
      }

      // Carry conversation forward to next step
      messages = [...messages, { role: 'assistant', content: finalAnswer }];
      if (parsedResponse.optional_nextprompt) {
        messages.push({ role: 'user', content: parsedResponse.optional_nextprompt });
      }
      stepIdx++;
    }

    // Update run status
    db.prepare('UPDATE runs SET status = ? WHERE id = ?').run('completed', runId);

    // Auto-score with a stronger evaluator when configured/available.
    let score: ScoreResult | undefined;
    try {
      score = await scoreRun(runId, getPreferredScoringModelId() ?? llmConfigId);
      const protocolProblems = appendCeReasonProtocolAuditStep(runId, setupId, question, storedStepNum);
      if (protocolProblems.length > 0) {
        markRunScoreForReview(runId, `CE_REASON protocol audit: ${protocolProblems.slice(0, 4).join(' ')}`);
      }
    } catch (scoreErr) {
      // Scoring failure does not fail the run — score will be absent
      console.error('Auto-scoring failed:', scoreErr instanceof Error ? scoreErr.message : scoreErr);
    }

    return { runId, steps: stepResults, finalAnswer, score };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    db.prepare('UPDATE runs SET status = ? WHERE id = ?').run('error', runId);

    // Store error step if no steps recorded yet
    if (stepResults.length === 0) {
      db.prepare(`
        INSERT INTO run_steps (run_id, step, final_answer)
        VALUES (?, 1, ?)
      `).run(runId, `Error: ${errorMsg}`);
    }

    return {
      runId,
      steps: stepResults,
      finalAnswer: '',
      error: errorMsg,
    };
  }
}

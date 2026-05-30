import db from '../db/index';
import { callLLM } from './llm';
import type { LlmConfigRow, RunRow, RunStepRow, QuestionRow, CheckpointRow } from '../db/index';
import { clarificationIsExpected, looksLikeClarificationRequest, unexpectedClarificationReviewReasons } from './clarification';
import { enginePrompt } from '../config/enginePrompts';

export interface ScoreResult {
  scoreId: number;
  scorePercent: number;
  passed: number;
  total: number;
  report: string;
  reviewRequired: boolean;
  reviewReason: string;
  checkpointResults: {
    checkpointId: number;
    itemText: string;
    passed: boolean;
    explanation: string;
  }[];
}

interface ScoringResponse {
  checkpoint_results: Array<{
    checkpoint_id: number;
    passed: boolean;
    explanation: string;
  }>;
  overall_report: string;
  review_required?: boolean;
  review_reason?: string;
}

interface PairValidationResponse {
  review_required?: boolean;
  review_reason?: string;
  symmetry_problem?: boolean;
}

interface PairProtocolResponse {
  review_required?: boolean;
  protocol_problem?: boolean;
  review_reason?: string;
}

interface PairedScoringSideResponse {
  checkpoint_results: Array<{
    checkpoint_id: number;
    passed: boolean;
    explanation: string;
  }>;
  overall_report: string;
  review_required?: boolean;
  review_reason?: string;
}

interface PairedScoringResponse {
  direct: PairedScoringSideResponse;
  workflow: PairedScoringSideResponse;
}

function isOrdinaryCheckpointFailureReview(
  reason: string | undefined,
  scorePercent: number,
  clarificationExpected: boolean,
): boolean {
  const text = (reason ?? '').trim().toLowerCase();
  if (!text) return false;

  const hardReviewSignals = [
    'refus',
    'refusal',
    'empty',
    'leer',
    'placeholder',
    'platzhalter',
    'topic map',
    'meta-struktur',
    'metastruktur',
    'json',
    'not scorable',
    'nicht bewertbar',
    'uncertain scoring',
    'scoring uncertain',
    'falscher step',
    'wrong step',
    'final synthesis lost',
    'protocol',
    'unexpected',
  ];
  if (!clarificationExpected) {
    hardReviewSignals.push('clarification', 'rückfrage', 'rueckfrage');
  }
  if (hardReviewSignals.some(signal => text.includes(signal))) return false;

  const ordinaryFailureSignals = [
    'fehlt',
    'fehlend',
    'lacks',
    'missing',
    'does not address',
    'nicht erwähnt',
    'nicht ausreichend',
    'unvollständig',
    'incomplete',
    'could be improved',
    'hätte',
    'sollte',
    'not clearly',
    'not explicitly',
    'does not clearly',
    'lacks specificity',
    'does not fulfill',
    'fails to ask',
    'does not ask',
    'merely asks for more details',
    'asks for more details',
    'more details',
    'not fulfill the criteria',
    'does not provide any clarification questions',
    'beispiel',
    'quelle',
    'source',
    'datum',
    'date',
    'explanation',
    'erklärung',
  ];
  return ordinaryFailureSignals.some(signal => text.includes(signal));
}

function parseJsonArray(value: string | null | undefined): unknown[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function excerpt(value: string | null | undefined, maxLength = 1200): string {
  const text = (value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function normalizeAnswer(value: string | null | undefined): string {
  const text = (value ?? '').trim();
  if (!text) return '';
  try {
    const parsed = JSON.parse(text) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      typeof (parsed as { answer?: unknown }).answer === 'string'
    ) {
      return normalizeAnswer((parsed as { answer: string }).answer);
    }
  } catch {
    // Plain text answers are expected; JSON unwrapping is only a best-effort normalization.
  }
  return text.replace(/\s+/g, ' ').trim();
}

function hasTechnicalAnswerWrapper(value: string | null | undefined): boolean {
  const text = (value ?? '').trim();
  if (!text.startsWith('{')) return false;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
    const obj = parsed as Record<string, unknown>;
    const keys = Object.keys(obj);
    return typeof obj['answer'] === 'string' && keys.every(key => ['answer', 'isfinished', 'internet_search_requests', 'optional_nextprompt'].includes(key));
  } catch {
    return false;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function deepEqualJson(a: unknown, b: unknown): boolean {
  return stableJson(a) === stableJson(b);
}

function normalizeComparableString(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/[^\p{L}\p{N}.]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseBooleanLike(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (value === null) return false;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0 || value === -1) return false;
  }
  if (typeof value !== 'string') return null;
  const normalized = normalizeComparableString(value);
  if (['true', 'yes', 'ja', 'y', '1', '1.0', 'correct', 'richtig', 'wahr'].includes(normalized)) return true;
  if (['false', 'fale', 'no', 'nein', 'n', '0', '0.0', '-1', '-1.0', 'null', 'none', 'incorrect', 'falsch', 'unwahr'].includes(normalized)) return false;
  return null;
}

function parseNumberLike(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const normalized = value
    .trim()
    .replace(/\u00a0/g, ' ')
    .replace(/,/g, '.');
  const matches = normalized.match(/[+-]?\d+(?:\.\d+)?/g) ?? [];
  if (matches.length !== 1) return null;
  const parsed = Number(matches[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function tolerantEqualJson(actual: unknown, expected: unknown): { equal: boolean; mode: string } {
  if (deepEqualJson(actual, expected)) return { equal: true, mode: 'exact' };

  if (typeof expected === 'boolean') {
    const actualBool = parseBooleanLike(actual);
    return { equal: actualBool === expected, mode: 'boolean-normalized' };
  }

  if (typeof expected === 'number') {
    const actualNumber = parseNumberLike(actual);
    if (actualNumber === null) return { equal: false, mode: 'number-normalized' };
    const tolerance = Number.isInteger(expected) ? 1e-9 : 1e-6;
    return { equal: Math.abs(actualNumber - expected) <= tolerance, mode: 'number-normalized' };
  }

  if (typeof expected === 'string') {
    if (typeof actual !== 'string') return { equal: false, mode: 'string-normalized' };
    return {
      equal: normalizeComparableString(actual) === normalizeComparableString(expected),
      mode: 'string-normalized',
    };
  }

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) {
      return { equal: false, mode: 'array-normalized' };
    }
    const ordered = expected.every((item, idx) => tolerantEqualJson(actual[idx], item).equal);
    if (ordered) return { equal: true, mode: 'array-normalized' };
    const expectedNorm = expected.map(item => stableJson(normalizeForLooseArrayCompare(item))).sort();
    const actualNorm = actual.map(item => stableJson(normalizeForLooseArrayCompare(item))).sort();
    return { equal: stableJson(actualNorm) === stableJson(expectedNorm), mode: 'array-normalized-unordered' };
  }

  return { equal: false, mode: 'exact' };
}

type AnswerFieldSchema = {
  type?: string;
  item_type?: string;
  allowed_values?: unknown[];
  allowed_items?: unknown[];
  validate?: boolean;
};

type AnswerSchema = {
  type?: string;
  fields?: Record<string, AnswerFieldSchema>;
};

function parseAnswerSchema(question: QuestionRow): AnswerSchema | null {
  if (!question.answer_schema_json?.trim()) return null;
  try {
    const parsed = JSON.parse(question.answer_schema_json) as unknown;
    if (!isPlainObject(parsed)) return null;
    return parsed as AnswerSchema;
  } catch {
    return null;
  }
}

function shouldScoreJsonField(key: string, answerSchema: AnswerSchema | null): boolean {
  if (key === 'ai_reasoning') return false;
  if (key === 'pick_reasoning') return false;
  if (key === 'pick_checklist') return false;
  if (key === 'picked_candidate') return false;
  if (key === 'protocol_audit') return false;
  if (key.endsWith('_reason')) return false;
  if (key.endsWith('_reasoning')) return false;
  if (key.endsWith('_comment')) return false;
  if (answerSchema?.fields?.[key]?.validate === false) return false;
  return true;
}

function canonicalAllowedValue(value: unknown, allowed: unknown[] | undefined): unknown {
  if (!allowed?.length) return value;
  for (const candidate of allowed) {
    if (tolerantEqualJson(value, candidate).equal) return candidate;
  }
  return undefined;
}

function tolerantEqualWithSchema(
  actual: unknown,
  expected: unknown,
  fieldSchema: AnswerFieldSchema | undefined,
): { equal: boolean; mode: string } {
  if (fieldSchema?.allowed_values?.length) {
    const canonicalActual = canonicalAllowedValue(actual, fieldSchema.allowed_values);
    if (canonicalActual === undefined) {
      return { equal: false, mode: `not-in-allowed-values:${fieldSchema.allowed_values.map(String).join('|')}` };
    }
    return {
      equal: tolerantEqualJson(canonicalActual, expected).equal,
      mode: 'allowed-values-normalized',
    };
  }

  if (Array.isArray(expected) && fieldSchema?.allowed_items?.length) {
    if (!Array.isArray(actual) || actual.length !== expected.length) {
      return { equal: false, mode: 'allowed-items-array' };
    }
    const canonicalActual = actual.map(item => canonicalAllowedValue(item, fieldSchema.allowed_items));
    if (canonicalActual.some(item => item === undefined)) {
      return { equal: false, mode: `not-in-allowed-items:${fieldSchema.allowed_items.map(String).join('|')}` };
    }
    const ordered = expected.every((item, idx) => tolerantEqualJson(canonicalActual[idx], item).equal);
    if (ordered) return { equal: true, mode: 'allowed-items-normalized' };
    const expectedNorm = expected.map(item => stableJson(normalizeForLooseArrayCompare(item))).sort();
    const actualNorm = canonicalActual.map(item => stableJson(normalizeForLooseArrayCompare(item))).sort();
    return { equal: stableJson(actualNorm) === stableJson(expectedNorm), mode: 'allowed-items-normalized-unordered' };
  }

  return tolerantEqualJson(actual, expected);
}

export function scoreComputerEvaluableAnswerForQuestion(
  question: QuestionRow,
  finalAnswer: string,
): { passed: number; total: number; validJson: boolean; exactKeys: boolean } {
  if (!question.expected_answer_json) {
    return { passed: 0, total: 0, validJson: false, exactKeys: false };
  }
  const expected = JSON.parse(question.expected_answer_json) as unknown;
  if (!isPlainObject(expected)) {
    return { passed: 0, total: 0, validJson: false, exactKeys: false };
  }
  const parsed = parseJsonAnswer(finalAnswer);
  const answerSchema = parseAnswerSchema(question);
  const expectedKeys = Object.keys(expected);
  const scoredExpectedKeys = expectedKeys.filter(key => shouldScoreJsonField(key, answerSchema));
  const total = scoredExpectedKeys.length + 2;
  if (!parsed.ok || !isPlainObject(parsed.value)) {
    return { passed: 0, total, validJson: false, exactKeys: false };
  }
  const actual = parsed.value;
  const actualKeys = Object.keys(actual);
  const extraKeys = actualKeys.filter(key => !expectedKeys.includes(key) && shouldScoreJsonField(key, answerSchema));
  const missingScoredKeys = scoredExpectedKeys.filter(key => !Object.prototype.hasOwnProperty.call(actual, key));
  const exactKeys =
    extraKeys.length === 0 &&
    missingScoredKeys.length === 0;
  let passed = 1;
  for (const key of scoredExpectedKeys) {
    if (
      Object.prototype.hasOwnProperty.call(actual, key) &&
      tolerantEqualWithSchema(actual[key], expected[key], answerSchema?.fields?.[key]).equal
    ) {
      passed += 1;
    }
  }
  if (exactKeys) passed += 1;
  return { passed, total, validJson: true, exactKeys };
}

function normalizeForLooseArrayCompare(value: unknown): unknown {
  const bool = parseBooleanLike(value);
  if (bool !== null) return bool;
  const num = parseNumberLike(value);
  if (num !== null) return num;
  if (typeof value === 'string') return normalizeComparableString(value);
  if (Array.isArray(value)) return value.map(normalizeForLooseArrayCompare);
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeForLooseArrayCompare(item)]));
  }
  return value;
}

function parseJsonAnswer(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: 'Answer is empty.' };
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = codeBlockMatch ? codeBlockMatch[1].trim() : trimmed;
  try {
    return { ok: true, value: JSON.parse(jsonText) as unknown };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function jsonTypeName(value: unknown): string {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function checkpointKey(checkpoint: CheckpointRow): string {
  const match = checkpoint.item_text.match(/^json:([A-Za-z0-9_.-]+)/);
  return match ? match[1] : '';
}

function isComputerEvaluableQuestion(question: QuestionRow): boolean {
  return Number(question.computer_evaluable ?? 0) === 1 &&
    question.evaluation_type === 'json_exact' &&
    !!question.expected_answer_json?.trim();
}

function loadFinalAnswer(runId: number): string {
  const row = db
    .prepare('SELECT final_answer FROM run_steps WHERE run_id = ? AND COALESCE(formal_step, step) < 900 ORDER BY step DESC LIMIT 1')
    .get(runId) as { final_answer: string | null } | undefined;
  return row?.final_answer ?? '';
}

function loadRunSteps(runId: number): RunStepRow[] {
  return db
    .prepare('SELECT * FROM run_steps WHERE run_id = ? AND COALESCE(formal_step, step) < 900 ORDER BY step ASC')
    .all(runId) as RunStepRow[];
}

function loadRunStepContext(runId: number): string {
  const steps = loadRunSteps(runId);
  return steps.map(step => {
    const queries = parseJsonArray(step.search_queries_json).map(String);
    const results = parseJsonArray(step.search_results_json).map(String);
    return [
      `Step ${step.step}${step.formal_step && step.formal_step !== step.step ? ` (formal step ${step.formal_step})` : ''}:`,
      `- internet_allowed: ${step.internet_allowed === 1 ? 'yes' : 'no'}`,
      `- answer: ${excerpt(step.final_answer, 2500) || 'none'}`,
      `- search_queries: ${queries.length ? queries.join(' | ') : 'none'}`,
      `- search_results_excerpt: ${excerpt(results.join('\n\n'), 900) || 'none'}`,
    ].join('\n');
  }).join('\n\n');
}

function appendReviewReason(existing: string | null | undefined, reason: string): string {
  const current = (existing ?? '').trim();
  if (!current) return reason;
  if (current.includes(reason)) return current;
  return `${current} ${reason}`;
}

export function markRunScoreForReview(runId: number, reason: string): void {
  const score = db.prepare('SELECT id, review_reason FROM scores WHERE run_id = ?').get(runId) as {
    id: number;
    review_reason: string | null;
  } | undefined;
  if (!score) return;
  db.prepare(`
    UPDATE scores
    SET review_required = 1,
        review_reason = ?,
        scored_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(appendReviewReason(score.review_reason, reason), score.id);
}

export function scoreComputerEvaluableRun(
  runId: number,
  question: QuestionRow,
  checkpoints: CheckpointRow[],
  finalAnswer: string,
  archivedReason: string,
): ScoreResult {
  if (!question.expected_answer_json) throw new Error(`Question ${question.id} has no expected_answer_json.`);
  const expected = JSON.parse(question.expected_answer_json) as unknown;
  if (!isPlainObject(expected)) throw new Error(`Question ${question.id} expected_answer_json must be a JSON object.`);
  const answerSchema = parseAnswerSchema(question);

  const parsed = parseJsonAnswer(finalAnswer);
  const actual = parsed.ok ? parsed.value : null;
  const actualObject = isPlainObject(actual) ? actual : null;
  const expectedKeys = Object.keys(expected);
  const scoredExpectedKeys = expectedKeys.filter(key => shouldScoreJsonField(key, answerSchema));
  const actualKeys = actualObject ? Object.keys(actualObject) : [];
  const extraKeys = actualKeys.filter(key => !expectedKeys.includes(key) && shouldScoreJsonField(key, answerSchema));
  const missingKeys = scoredExpectedKeys.filter(key => !actualKeys.includes(key));

  const results = checkpoints.map(cp => {
    const key = checkpointKey(cp);
    if (!parsed.ok) {
      return {
        checkpoint_id: cp.id,
        passed: false,
        explanation: `Invalid JSON: ${parsed.error}`,
      };
    }
    if (!actualObject) {
      return {
        checkpoint_id: cp.id,
        passed: false,
        explanation: 'Parsed answer is not a JSON object.',
      };
    }
    if (key === '__valid_json') {
      return {
        checkpoint_id: cp.id,
        passed: true,
        explanation: 'Answer is valid JSON and parses as an object.',
      };
    }
    if (key === '__no_extra_keys') {
      return {
        checkpoint_id: cp.id,
        passed: extraKeys.length === 0 && missingKeys.length === 0,
        explanation: extraKeys.length || missingKeys.length
          ? `JSON keys differ for scored fields. Missing scored fields: ${missingKeys.join(', ') || 'none'}. Extra: ${extraKeys.join(', ') || 'none'}. Unvalidated *_comment fields are allowed.`
          : 'JSON contains all scored keys and no unknown extra keys. Unvalidated *_comment fields are allowed.',
      };
    }
    if (!shouldScoreJsonField(key, answerSchema)) {
      return {
        checkpoint_id: cp.id,
        passed: true,
        explanation: `Field ${key} is marked as unvalidated comment/context and is not scored.`,
      };
    }
    if (!key || !Object.prototype.hasOwnProperty.call(expected, key)) {
      return {
        checkpoint_id: cp.id,
        passed: false,
        explanation: `Checkpoint does not map to an expected JSON key: ${cp.item_text}`,
      };
    }
    const comparison = Object.prototype.hasOwnProperty.call(actualObject, key)
      ? tolerantEqualWithSchema(actualObject[key], expected[key], answerSchema?.fields?.[key])
      : { equal: false, mode: 'missing' };
    const passed = comparison.equal;
    return {
      checkpoint_id: cp.id,
      passed,
      explanation: passed
        ? `Field ${key} matches expected value ${JSON.stringify(expected[key])} (${comparison.mode}).`
        : `Field ${key} expected ${JSON.stringify(expected[key])}, got ${JSON.stringify(actualObject[key])}.`,
    };
  });

  const passedCount = results.filter(result => result.passed).length;
  const report = parsed.ok
    ? `Computer JSON tolerant evaluation: ${passedCount}/${checkpoints.length} checks passed.`
    : `Computer JSON tolerant evaluation failed because answer was not valid JSON: ${parsed.error}`;

  return storeScoreResult(runId, 'computer_json_tolerant', checkpoints, {
    checkpoint_results: results,
    overall_report: report,
    review_required: false,
    review_reason: '',
  }, archivedReason);
}

function storeScoreResult(
  runId: number,
  scoringModel: string,
  checkpoints: CheckpointRow[],
  scoringData: PairedScoringSideResponse,
  archivedReason: string,
): ScoreResult {
  const results = scoringData.checkpoint_results ?? [];
  const total = checkpoints.length;
  const passed = results.filter(r => r.passed === true).length;
  const scorePercent = total > 0 ? (passed / total) * 100 : 0;
  const reviewRequired = scoringData.review_required === true;
  const reviewReason = reviewRequired ? (scoringData.review_reason ?? '') : '';
  const checkpointResults: ScoreResult['checkpointResults'] = [];
  let scoreId = 0;

  const tx = db.transaction(() => {
    const existingScore = db.prepare('SELECT * FROM scores WHERE run_id = ?').get(runId) as {
      id: number;
      run_id: number;
      scoring_model: string | null;
      score_percent: number | null;
      total_checkpoints: number | null;
      passed_checkpoints: number | null;
      report: string | null;
      review_required: number | null;
      review_reason: string | null;
      scored_at: string | null;
      created_at: string | null;
    } | undefined;

    if (existingScore) {
      scoreId = existingScore.id;
      const historyResult = db.prepare(`
        INSERT INTO score_history (
          original_score_id,
          run_id,
          scoring_model,
          score_percent,
          total_checkpoints,
          passed_checkpoints,
          report,
          review_required,
          review_reason,
          scored_at,
          created_at,
          archived_reason
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        existingScore.id,
        existingScore.run_id,
        existingScore.scoring_model,
        existingScore.score_percent,
        existingScore.total_checkpoints,
        existingScore.passed_checkpoints,
        existingScore.report,
        existingScore.review_required,
        existingScore.review_reason,
        existingScore.scored_at,
        existingScore.created_at,
        archivedReason,
      );
      const scoreHistoryId = historyResult.lastInsertRowid as number;
      const oldCheckpointResults = db.prepare('SELECT * FROM checkpoint_results WHERE score_id = ?').all(scoreId) as Array<{
        id: number;
        checkpoint_id: number;
        passed: number | null;
        explanation: string | null;
      }>;
      const historyCpInsert = db.prepare(`
        INSERT INTO checkpoint_results_history (
          score_history_id,
          original_checkpoint_result_id,
          checkpoint_id,
          passed,
          explanation
        )
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const oldCp of oldCheckpointResults) {
        historyCpInsert.run(scoreHistoryId, oldCp.id, oldCp.checkpoint_id, oldCp.passed, oldCp.explanation);
      }

      db.prepare(`
        UPDATE scores
        SET scoring_model = ?,
            score_percent = ?,
            total_checkpoints = ?,
            passed_checkpoints = ?,
            report = ?,
            review_required = ?,
            review_reason = ?,
            scored_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        scoringModel,
        scorePercent,
        total,
        passed,
        scoringData.overall_report ?? '',
        reviewRequired ? 1 : 0,
        reviewReason,
        scoreId,
      );
      db.prepare('DELETE FROM checkpoint_results WHERE score_id = ?').run(scoreId);
    } else {
      const scoreResult = db.prepare(`
        INSERT INTO scores (
          run_id,
          scoring_model,
          score_percent,
          total_checkpoints,
          passed_checkpoints,
          report,
          review_required,
          review_reason,
          scored_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        runId,
        scoringModel,
        scorePercent,
        total,
        passed,
        scoringData.overall_report ?? '',
        reviewRequired ? 1 : 0,
        reviewReason,
      );
      scoreId = scoreResult.lastInsertRowid as number;
    }

    const cpInsert = db.prepare(`
      INSERT INTO checkpoint_results (score_id, checkpoint_id, passed, explanation)
      VALUES (?, ?, ?, ?)
    `);

    for (const cp of checkpoints) {
      const result = results.find(r => r.checkpoint_id === cp.id);
      const cpPassed = result?.passed === true;
      const explanation = result?.explanation ?? '';
      cpInsert.run(scoreId, cp.id, cpPassed ? 1 : 0, explanation);
      checkpointResults.push({
        checkpointId: cp.id,
        itemText: cp.item_text,
        passed: cpPassed,
        explanation,
      });
    }
  });
  tx();

  return {
    scoreId,
    scorePercent,
    passed,
    total,
    report: scoringData.overall_report ?? '',
    reviewRequired,
    reviewReason,
    checkpointResults,
  };
}

function sameCheckpointPattern(directRunId: number, workflowRunId: number): boolean {
  const rows = db.prepare(`
    SELECT cp.id as checkpoint_id,
           cr1.passed as direct_passed,
           cr2.passed as workflow_passed
    FROM scores sc1
    JOIN checkpoint_results cr1 ON cr1.score_id = sc1.id
    JOIN checkpoints cp ON cp.id = cr1.checkpoint_id
    JOIN scores sc2 ON sc2.run_id = ?
    LEFT JOIN checkpoint_results cr2 ON cr2.score_id = sc2.id AND cr2.checkpoint_id = cp.id
    WHERE sc1.run_id = ?
    ORDER BY cp.sort_order
  `).all(workflowRunId, directRunId) as Array<{
    checkpoint_id: number;
    direct_passed: number | null;
    workflow_passed: number | null;
  }>;
  return rows.length > 0 && rows.every(row => row.direct_passed === row.workflow_passed);
}

export function copyScoreIfFinalAnswersMatch(sourceRunId: number, targetRunId: number, reason: string): boolean {
  const sourceAnswer = normalizeAnswer(loadFinalAnswer(sourceRunId));
  const targetAnswer = normalizeAnswer(loadFinalAnswer(targetRunId));
  if (!sourceAnswer || sourceAnswer !== targetAnswer) return false;

  const sourceScore = db.prepare('SELECT * FROM scores WHERE run_id = ?').get(sourceRunId) as {
    id: number;
    scoring_model: string | null;
    score_percent: number | null;
    total_checkpoints: number | null;
    passed_checkpoints: number | null;
    report: string | null;
    review_required: number | null;
    review_reason: string | null;
  } | undefined;
  const targetScore = db.prepare('SELECT * FROM scores WHERE run_id = ?').get(targetRunId) as {
    id: number;
    run_id: number;
    scoring_model: string | null;
    score_percent: number | null;
    total_checkpoints: number | null;
    passed_checkpoints: number | null;
    report: string | null;
    review_required: number | null;
    review_reason: string | null;
    scored_at: string | null;
    created_at: string | null;
  } | undefined;
  if (!sourceScore || !targetScore) return false;

  const sourceCheckpointResults = db.prepare(`
    SELECT checkpoint_id, passed, explanation
    FROM checkpoint_results
    WHERE score_id = ?
    ORDER BY id
  `).all(sourceScore.id) as Array<{ checkpoint_id: number; passed: number | null; explanation: string | null }>;

  const needsSync =
    sourceScore.score_percent !== targetScore.score_percent ||
    sourceScore.passed_checkpoints !== targetScore.passed_checkpoints ||
    sourceScore.total_checkpoints !== targetScore.total_checkpoints ||
    sourceScore.review_required !== targetScore.review_required;
  if (!needsSync) return true;

  const tx = db.transaction(() => {
    const historyResult = db.prepare(`
      INSERT INTO score_history (
        original_score_id,
        run_id,
        scoring_model,
        score_percent,
        total_checkpoints,
        passed_checkpoints,
        report,
        review_required,
        review_reason,
        scored_at,
        created_at,
        archived_reason
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      targetScore.id,
      targetScore.run_id,
      targetScore.scoring_model,
      targetScore.score_percent,
      targetScore.total_checkpoints,
      targetScore.passed_checkpoints,
      targetScore.report,
      targetScore.review_required,
      targetScore.review_reason,
      targetScore.scored_at,
      targetScore.created_at,
      reason,
    );
    const scoreHistoryId = historyResult.lastInsertRowid as number;
    const oldCheckpointResults = db.prepare('SELECT * FROM checkpoint_results WHERE score_id = ? ORDER BY id').all(targetScore.id) as Array<{
      id: number;
      checkpoint_id: number;
      passed: number | null;
      explanation: string | null;
    }>;
    const historyCpInsert = db.prepare(`
      INSERT INTO checkpoint_results_history (
        score_history_id,
        original_checkpoint_result_id,
        checkpoint_id,
        passed,
        explanation
      )
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const oldCp of oldCheckpointResults) {
      historyCpInsert.run(scoreHistoryId, oldCp.id, oldCp.checkpoint_id, oldCp.passed, oldCp.explanation);
    }

    db.prepare(`
      UPDATE scores
      SET scoring_model = ?,
          score_percent = ?,
          total_checkpoints = ?,
          passed_checkpoints = ?,
          report = ?,
          review_required = ?,
          review_reason = ?,
          scored_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      sourceScore.scoring_model,
      sourceScore.score_percent,
      sourceScore.total_checkpoints,
      sourceScore.passed_checkpoints,
      `${sourceScore.report ?? ''}\n\n[Pair scoring sync] ${reason}`.trim(),
      sourceScore.review_required ?? 0,
      sourceScore.review_reason ?? '',
      targetScore.id,
    );

    db.prepare('DELETE FROM checkpoint_results WHERE score_id = ?').run(targetScore.id);
    const cpInsert = db.prepare(`
      INSERT INTO checkpoint_results (score_id, checkpoint_id, passed, explanation)
      VALUES (?, ?, ?, ?)
    `);
    for (const cp of sourceCheckpointResults) {
      cpInsert.run(targetScore.id, cp.checkpoint_id, cp.passed, cp.explanation);
    }
  });
  tx();
  return true;
}

function ceShapeProblems(label: string, finalAnswer: string, expected: Record<string, unknown>): string[] {
  const problems: string[] = [];
  const parsed = parseJsonAnswer(finalAnswer);
  if (!parsed.ok) return [`${label} final answer is not valid JSON: ${parsed.error}`];
  if (!isPlainObject(parsed.value)) return [`${label} final answer is JSON but not an object.`];

  const expectedKeys = Object.keys(expected);
  const actualKeys = Object.keys(parsed.value);
  const missing = expectedKeys.filter(key => !actualKeys.includes(key));
  const extra = actualKeys.filter(key => !expectedKeys.includes(key));
  if (missing.length) problems.push(`${label} final JSON is missing keys: ${missing.join(', ')}.`);
  if (extra.length) problems.push(`${label} final JSON has extra keys: ${extra.join(', ')}.`);

  for (const key of expectedKeys) {
    if (!actualKeys.includes(key)) continue;
    const expectedType = jsonTypeName(expected[key]);
    const actualType = jsonTypeName(parsed.value[key]);
    if (expectedType !== actualType) {
      problems.push(`${label} key "${key}" has type ${actualType}, expected ${expectedType}.`);
    }
  }
  return problems;
}

function jsonSchemaDescription(value: unknown): string {
  if (Array.isArray(value)) {
    const first = value[0];
    return first === undefined ? 'array' : `array<${jsonTypeName(first)}>`;
  }
  if (isPlainObject(value)) {
    return 'object';
  }
  return jsonTypeName(value);
}

function ceExpectedShapeDescription(expectedAnswerJson: string | null | undefined): string {
  if (!expectedAnswerJson?.trim()) return 'none';
  try {
    const expected = JSON.parse(expectedAnswerJson) as unknown;
    if (!isPlainObject(expected)) return `expected answer is ${jsonTypeName(expected)}, not object`;
    return Object.entries(expected)
      .map(([key, value]) => `- ${key}: ${jsonSchemaDescription(value)}`)
      .join('\n');
  } catch (err) {
    return `invalid expected_answer_json: ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function validatePairProtocol(
  directRun: RunRow & { question_text: string; criteria_id: string; criteria_name: string },
  workflowRun: RunRow,
  question: QuestionRow,
  directFinalAnswer: string,
  workflowFinalAnswer: string,
  scoringLlmConfigId: number,
): Promise<{ reviewRequired: boolean; reason: string }> {
  const protocolProblems: string[] = [];

  if (hasTechnicalAnswerWrapper(directFinalAnswer) || hasTechnicalAnswerWrapper(workflowFinalAnswer)) {
    protocolProblems.push('final answer contains a leftover technical JSON answer wrapper.');
  }

  const workflowSteps = loadRunSteps(workflowRun.id);
  const workflowSetup = db.prepare('SELECT max_steps FROM setups WHERE id = ?').get(workflowRun.setup_id) as { max_steps: number } | undefined;
  if (workflowSetup && workflowSteps.length < workflowSetup.max_steps) {
    protocolProblems.push(`workflow has ${workflowSteps.length} real steps, expected ${workflowSetup.max_steps}.`);
  }

  if (workflowRun.setup_id === 'setup_flowreview_same' || workflowRun.setup_id === 'setup_ce_flowreview_s4') {
    const copiedStep = workflowSteps.find(step => Number(step.formal_step ?? step.step) === 1);
    if (!copiedStep) {
      protocolProblems.push('copy-first workflow has no copied step 1.');
    } else if ((copiedStep.final_answer ?? '').trim() !== directFinalAnswer.trim()) {
      protocolProblems.push('copy-first workflow step 1 does not exactly match the paired direct final answer.');
    }
  }

  if (isComputerEvaluableQuestion(question) && question.expected_answer_json) {
    try {
      const expected = JSON.parse(question.expected_answer_json) as unknown;
      if (isPlainObject(expected)) {
        protocolProblems.push(...ceShapeProblems('Direct', directFinalAnswer, expected));
        protocolProblems.push(...ceShapeProblems('Workflow', workflowFinalAnswer, expected));
      } else {
        protocolProblems.push('expected_answer_json is not a JSON object.');
      }
    } catch (err) {
      protocolProblems.push(`expected_answer_json is invalid: ${err instanceof Error ? err.message : String(err)}.`);
    }
  }

  if (isComputerEvaluableQuestion(question)) {
    return protocolProblems.length
      ? { reviewRequired: true, reason: `Pair protocol check: ${protocolProblems.join(' ')}` }
      : { reviewRequired: false, reason: '' };
  }

  const llmConfigRaw = db.prepare('SELECT * FROM llm_configs WHERE id = ?').get(scoringLlmConfigId) as LlmConfigRow | undefined;
  if (!llmConfigRaw) {
    return protocolProblems.length
      ? { reviewRequired: true, reason: `Pair protocol check: ${protocolProblems.join(' ')}` }
      : { reviewRequired: false, reason: '' };
  }

  const llmConfig = {
    id: llmConfigRaw.id,
    label: llmConfigRaw.label,
    provider: llmConfigRaw.provider,
    model_id: llmConfigRaw.model_id,
    base_url: llmConfigRaw.base_url,
    api_key_env: llmConfigRaw.api_key_env,
    supports_native_search: llmConfigRaw.supports_native_search,
  };

  const systemPrompt = enginePrompt('protocol_validator');

  const userMessage = `Original question:
${directRun.question_text}

Criterion: ${directRun.criteria_name} (#${directRun.criteria_id})
Question is computer-evaluable: ${isComputerEvaluableQuestion(question) ? 'yes' : 'no'}
Expected JSON shape, if any. These are keys and types only; do not infer or check expected solution values:
${ceExpectedShapeDescription(question.expected_answer_json)}

Known deterministic protocol warnings:
${protocolProblems.length ? protocolProblems.map(p => `- ${p}`).join('\n') : 'none'}

Direct run #${directRun.id}, setup ${directRun.setup_id}
Final answer:
${directFinalAnswer}

Direct history:
${loadRunStepContext(directRun.id)}

Workflow run #${workflowRun.id}, setup ${workflowRun.setup_id}
Final answer:
${workflowFinalAnswer}

Workflow history:
${loadRunStepContext(workflowRun.id)}

Should this pair be marked for human review because the run protocol/output shape did not go as planned?`;

  try {
    const raw = await callLLM(llmConfig, systemPrompt, [{ role: 'user', content: userMessage }], { temperature: 0, maxTokens: 900 });
    const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : raw.trim();
    const parsed = JSON.parse(jsonStr) as PairProtocolResponse;
    const reason = (parsed.review_reason ?? '').trim();
    if (parsed.review_required === true || parsed.protocol_problem === true) {
      return {
        reviewRequired: true,
        reason: `Pair protocol check: ${reason || protocolProblems.join(' ') || 'workflow/output protocol problem.'}`,
      };
    }
  } catch (err) {
    if (protocolProblems.length) {
      return { reviewRequired: true, reason: `Pair protocol check: ${protocolProblems.join(' ')}` };
    }
    console.warn(`Pair protocol check failed without deterministic protocol problems: ${err instanceof Error ? err.message : String(err)}`);
    return { reviewRequired: false, reason: '' };
  }

  if (protocolProblems.length) {
    return { reviewRequired: true, reason: `Pair protocol check: ${protocolProblems.join(' ')}` };
  }
  return { reviewRequired: false, reason: '' };
}

export async function validatePairScoring(
  directRunId: number,
  workflowRunId: number,
  scoringLlmConfigId: number,
): Promise<{ reviewRequired: boolean; reason: string; identicalAnswerSynced: boolean }> {
  const identicalAnswerSynced = copyScoreIfFinalAnswersMatch(
    directRunId,
    workflowRunId,
    'Identical final answers in a paired comparison must use identical checkpoint results.',
  );

  const directRun = db.prepare(`
    SELECT r.*, q.question_text, q.criteria_id, c.name_de as criteria_name
    FROM runs r
    JOIN questions q ON q.id = r.question_id
    JOIN criteria c ON c.id = q.criteria_id
    WHERE r.id = ?
  `).get(directRunId) as (RunRow & { question_text: string; criteria_id: string; criteria_name: string }) | undefined;
  const workflowRun = db.prepare('SELECT * FROM runs WHERE id = ?').get(workflowRunId) as RunRow | undefined;
  if (!directRun || !workflowRun) return { reviewRequired: false, reason: '', identicalAnswerSynced: false };

  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(directRun.question_id) as QuestionRow | undefined;
  if (!question) return { reviewRequired: false, reason: '', identicalAnswerSynced };

  const directScore = db.prepare('SELECT * FROM scores WHERE run_id = ?').get(directRunId) as {
    score_percent: number | null;
    passed_checkpoints: number | null;
    total_checkpoints: number | null;
  } | undefined;
  const workflowScore = db.prepare('SELECT * FROM scores WHERE run_id = ?').get(workflowRunId) as {
    score_percent: number | null;
    passed_checkpoints: number | null;
    total_checkpoints: number | null;
  } | undefined;
  if (!directScore || !workflowScore) return { reviewRequired: false, reason: '', identicalAnswerSynced: false };

  const directFinalAnswer = loadFinalAnswer(directRunId);
  const workflowFinalAnswer = loadFinalAnswer(workflowRunId);
  const protocolValidation = await validatePairProtocol(
    directRun,
    workflowRun,
    question,
    directFinalAnswer,
    workflowFinalAnswer,
    scoringLlmConfigId,
  );
  if (protocolValidation.reviewRequired) {
    markRunScoreForReview(directRunId, protocolValidation.reason);
    markRunScoreForReview(workflowRunId, protocolValidation.reason);
    return { reviewRequired: true, reason: protocolValidation.reason, identicalAnswerSynced };
  }

  if (identicalAnswerSynced) {
    return { reviewRequired: false, reason: '', identicalAnswerSynced: true };
  }

  if (isComputerEvaluableQuestion(question)) {
    return { reviewRequired: false, reason: '', identicalAnswerSynced };
  }

  if (hasTechnicalAnswerWrapper(directFinalAnswer) || hasTechnicalAnswerWrapper(workflowFinalAnswer)) {
    const reason = 'Pair post-analysis: final answer contains a leftover technical JSON answer wrapper.';
    markRunScoreForReview(directRunId, reason);
    markRunScoreForReview(workflowRunId, reason);
    return { reviewRequired: true, reason, identicalAnswerSynced: false };
  }

  const sameScore =
    directScore.score_percent === workflowScore.score_percent &&
    directScore.passed_checkpoints === workflowScore.passed_checkpoints &&
    directScore.total_checkpoints === workflowScore.total_checkpoints &&
    sameCheckpointPattern(directRunId, workflowRunId);
  if (sameScore) {
    return { reviewRequired: false, reason: '', identicalAnswerSynced: false };
  }

  const checkpoints = db.prepare('SELECT * FROM checkpoints WHERE question_id = ? ORDER BY sort_order ASC').all(directRun.question_id) as CheckpointRow[];
  const checkpointList = checkpoints.map(cp => `- ${cp.id}: ${cp.item_text}`).join('\n');
  const directCp = db.prepare(`
    SELECT cp.item_text, cr.passed, cr.explanation
    FROM scores sc
    JOIN checkpoint_results cr ON cr.score_id = sc.id
    JOIN checkpoints cp ON cp.id = cr.checkpoint_id
    WHERE sc.run_id = ?
    ORDER BY cp.sort_order
  `).all(directRunId);
  const workflowCp = db.prepare(`
    SELECT cp.item_text, cr.passed, cr.explanation
    FROM scores sc
    JOIN checkpoint_results cr ON cr.score_id = sc.id
    JOIN checkpoints cp ON cp.id = cr.checkpoint_id
    WHERE sc.run_id = ?
    ORDER BY cp.sort_order
  `).all(workflowRunId);

  const llmConfigRaw = db.prepare('SELECT * FROM llm_configs WHERE id = ?').get(scoringLlmConfigId) as LlmConfigRow | undefined;
  if (!llmConfigRaw) return { reviewRequired: false, reason: '', identicalAnswerSynced: false };
  const llmConfig = {
    id: llmConfigRaw.id,
    label: llmConfigRaw.label,
    provider: llmConfigRaw.provider,
    model_id: llmConfigRaw.model_id,
    base_url: llmConfigRaw.base_url,
    api_key_env: llmConfigRaw.api_key_env,
    supports_native_search: llmConfigRaw.supports_native_search,
  };

  const systemPrompt = enginePrompt('pair_post_analysis_validator');

  const userMessage = `Original question:
${directRun.question_text}

Criterion: ${directRun.criteria_name} (#${directRun.criteria_id})

Checkpoints:
${checkpointList}

Direct run #${directRunId}
Score: ${directScore.score_percent}% (${directScore.passed_checkpoints}/${directScore.total_checkpoints})
Final answer:
${directFinalAnswer}

Direct scoring:
${JSON.stringify(directCp, null, 2)}

Direct history:
${loadRunStepContext(directRunId)}

Workflow run #${workflowRunId}
Score: ${workflowScore.score_percent}% (${workflowScore.passed_checkpoints}/${workflowScore.total_checkpoints})
Final answer:
${workflowFinalAnswer}

Workflow scoring:
${JSON.stringify(workflowCp, null, 2)}

Workflow history:
${loadRunStepContext(workflowRunId)}

Check if this pair should be marked for human review because something went wrong or was scored asymmetrically.`;

  try {
    const raw = await callLLM(llmConfig, systemPrompt, [{ role: 'user', content: userMessage }], { temperature: 0, maxTokens: 800 });
    const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : raw.trim();
    const parsed = JSON.parse(jsonStr) as PairValidationResponse;
    const reason = (parsed.review_reason ?? '').trim();
    if (parsed.review_required === true || parsed.symmetry_problem === true) {
      const reviewReason = `Pair post-analysis: ${reason || 'possible asymmetric scoring or workflow anomaly.'}`;
      markRunScoreForReview(directRunId, reviewReason);
      markRunScoreForReview(workflowRunId, reviewReason);
      return { reviewRequired: true, reason: reviewReason, identicalAnswerSynced: false };
    }
  } catch (err) {
    const reason = `Pair post-analysis failed: ${err instanceof Error ? err.message : String(err)}`;
    markRunScoreForReview(directRunId, reason);
    markRunScoreForReview(workflowRunId, reason);
    return { reviewRequired: true, reason, identicalAnswerSynced: false };
  }

  return { reviewRequired: false, reason: '', identicalAnswerSynced: false };
}

export async function scorePairRuns(
  directRunId: number,
  workflowRunId: number,
  scoringLlmConfigId: number,
): Promise<{ direct: ScoreResult; workflow: ScoreResult }> {
  const directRun = db.prepare('SELECT * FROM runs WHERE id = ?').get(directRunId) as RunRow | undefined;
  const workflowRun = db.prepare('SELECT * FROM runs WHERE id = ?').get(workflowRunId) as RunRow | undefined;
  if (!directRun) throw new Error(`Direct run not found: ${directRunId}`);
  if (!workflowRun) throw new Error(`Workflow run not found: ${workflowRunId}`);
  if (directRun.question_id !== workflowRun.question_id) {
    throw new Error('Paired scoring requires both runs to use the same question.');
  }
  if (!['setup_direct', 'setup_ce_direct'].includes(directRun.setup_id)) {
    throw new Error(`Direct pair side must be a direct setup, got ${directRun.setup_id}.`);
  }
  if (['setup_direct', 'setup_ce_direct'].includes(workflowRun.setup_id)) {
    throw new Error(`Workflow pair side must be a workflow setup, got ${workflowRun.setup_id}.`);
  }

  const existingPair = db.prepare('SELECT direct_run_id FROM run_pairs WHERE workflow_run_id = ?').get(workflowRunId) as
    | { direct_run_id: number }
    | undefined;
  if (existingPair && existingPair.direct_run_id !== directRunId) {
    throw new Error(`Workflow run ${workflowRunId} is already paired with direct run ${existingPair.direct_run_id}.`);
  }

  db.prepare(`
    INSERT INTO run_pairs (
      direct_run_id,
      workflow_run_id,
      run_set_id,
      comparison_group_id,
      run_nr,
      pair_source
    )
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(workflow_run_id) DO UPDATE SET
      run_set_id = excluded.run_set_id,
      comparison_group_id = excluded.comparison_group_id,
      run_nr = excluded.run_nr,
      pair_source = excluded.pair_source,
      updated_at = CURRENT_TIMESTAMP
  `).run(
    directRunId,
    workflowRunId,
    workflowRun.run_set_id ?? directRun.run_set_id ?? null,
    workflowRun.comparison_group_id ?? directRun.comparison_group_id ?? null,
    workflowRun.run_nr ?? directRun.run_nr ?? null,
    'scorePairRuns',
  );

  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(directRun.question_id) as QuestionRow | undefined;
  if (!question) throw new Error(`Question not found: ${directRun.question_id}`);

  const criteria = db
    .prepare('SELECT name_de FROM criteria WHERE id = ?')
    .get(question.criteria_id) as { name_de: string } | undefined;

  const checkpoints = db
    .prepare('SELECT * FROM checkpoints WHERE question_id = ? ORDER BY sort_order ASC')
    .all(question.id) as CheckpointRow[];
  if (checkpoints.length === 0) throw new Error('No checkpoints defined for this question');

  if (isComputerEvaluableQuestion(question)) {
    return {
      direct: scoreComputerEvaluableRun(
        directRunId,
        question,
        checkpoints,
        loadFinalAnswer(directRunId),
        'computer_json_exact_paired_scoring',
      ),
      workflow: scoreComputerEvaluableRun(
        workflowRunId,
        question,
        checkpoints,
        loadFinalAnswer(workflowRunId),
        'computer_json_exact_paired_scoring',
      ),
    };
  }

  const llmConfigRaw = db.prepare('SELECT * FROM llm_configs WHERE id = ?').get(scoringLlmConfigId) as LlmConfigRow | undefined;
  if (!llmConfigRaw) throw new Error(`LLM config not found: ${scoringLlmConfigId}`);

  const llmConfig = {
    id: llmConfigRaw.id,
    label: llmConfigRaw.label,
    provider: llmConfigRaw.provider,
    model_id: llmConfigRaw.model_id,
    base_url: llmConfigRaw.base_url,
    api_key_env: llmConfigRaw.api_key_env,
    supports_native_search: llmConfigRaw.supports_native_search,
  };

  const checkpointList = checkpoints
    .map(cp => `- checkpoint_id: ${cp.id} | "${cp.item_text}"`)
    .join('\n');

  const systemPrompt = enginePrompt('paired_checkpoint_scorer');

  const userMessage = `Criteria: ${criteria?.name_de ?? question.criteria_id} (#${question.criteria_id})
Question notes: ${question.notes || 'none'}

Original question:
${question.question_text}

Checkpoints to evaluate:
${checkpointList}

Direct baseline run #${directRunId}
Final answer:
${loadFinalAnswer(directRunId)}

Direct run history:
${loadRunStepContext(directRunId) || 'No step data available.'}

Workflow run #${workflowRunId}
Final answer:
${loadFinalAnswer(workflowRunId)}

Workflow run history:
${loadRunStepContext(workflowRunId) || 'No step data available.'}

Evaluate both sides now in one shared pass and return the JSON response.`;

  const raw = await callLLM(llmConfig, systemPrompt, [{ role: 'user', content: userMessage }], { temperature: 0, maxTokens: 3000 });

  let scoringData: PairedScoringResponse;
  try {
    const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : raw.trim();
    scoringData = JSON.parse(jsonStr) as PairedScoringResponse;
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`Failed to parse paired scoring response: ${raw.slice(0, 200)}`);
    try {
      scoringData = JSON.parse(jsonMatch[0]) as PairedScoringResponse;
    } catch {
      throw new Error(`Failed to parse paired scoring response: ${raw.slice(0, 200)}`);
    }
  }

  if (!scoringData.direct || !scoringData.workflow) {
    throw new Error('Paired scoring response must include direct and workflow results.');
  }

  return {
    direct: storeScoreResult(directRunId, llmConfigRaw.model_id, checkpoints, scoringData.direct, 'paired_checkpoint_scoring'),
    workflow: storeScoreResult(workflowRunId, llmConfigRaw.model_id, checkpoints, scoringData.workflow, 'paired_checkpoint_scoring'),
  };
}

export async function scoreRun(runId: number, scoringLlmConfigId: number): Promise<ScoreResult> {
  // Load run
  const run = db.prepare('SELECT * FROM runs WHERE id = ?').get(runId) as RunRow | undefined;
  if (!run) throw new Error(`Run not found: ${runId}`);

  // Load question
  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(run.question_id) as QuestionRow | undefined;
  if (!question) throw new Error(`Question not found: ${run.question_id}`);

  const criteria = db
    .prepare('SELECT name_de FROM criteria WHERE id = ?')
    .get(question.criteria_id) as { name_de: string } | undefined;

  // Load checkpoints
  const checkpoints = db
    .prepare('SELECT * FROM checkpoints WHERE question_id = ? ORDER BY sort_order ASC')
    .all(question.id) as CheckpointRow[];

  if (checkpoints.length === 0) {
    throw new Error('No checkpoints defined for this question');
  }

  // Load final answer from the last real workflow step. Audit/report steps use
  // formal_step >= 900 and remain visible in run details without affecting scoring.
  const lastStep = db
    .prepare('SELECT * FROM run_steps WHERE run_id = ? AND COALESCE(formal_step, step) < 900 ORDER BY step DESC LIMIT 1')
    .get(runId) as RunStepRow | undefined;

  const finalAnswer = lastStep?.final_answer ?? '';

  const runSteps = db
    .prepare('SELECT * FROM run_steps WHERE run_id = ? AND COALESCE(formal_step, step) < 900 ORDER BY step ASC')
    .all(runId) as RunStepRow[];

  const setup = db.prepare('SELECT max_steps FROM setups WHERE id = ?').get(run.setup_id) as { max_steps: number } | undefined;

  if (isComputerEvaluableQuestion(question)) {
    return scoreComputerEvaluableRun(runId, question, checkpoints, finalAnswer, 'computer_json_exact_scoring');
  }

  // Load scoring model config
  const llmConfigRaw = db.prepare('SELECT * FROM llm_configs WHERE id = ?').get(scoringLlmConfigId) as LlmConfigRow | undefined;
  if (!llmConfigRaw) throw new Error(`LLM config not found: ${scoringLlmConfigId}`);

  const llmConfig = {
    id: llmConfigRaw.id,
    label: llmConfigRaw.label,
    provider: llmConfigRaw.provider,
    model_id: llmConfigRaw.model_id,
    base_url: llmConfigRaw.base_url,
    api_key_env: llmConfigRaw.api_key_env,
    supports_native_search: llmConfigRaw.supports_native_search,
  };

  // Build scoring prompt
  const checkpointList = checkpoints
    .map(cp => `- checkpoint_id: ${cp.id} | "${cp.item_text}"`)
    .join('\n');

  const stepContext = runSteps.map(step => {
    const queries = parseJsonArray(step.search_queries_json).map(String);
    const results = parseJsonArray(step.search_results_json).map(String);
    const resultExcerpt = excerpt(results.join('\n\n'));
    return [
      `Step ${step.step}${step.formal_step && step.formal_step !== step.step ? ` (formal step ${step.formal_step})` : ''}:`,
      `- internet_allowed: ${step.internet_allowed === 1 ? 'yes' : 'no'}`,
      `- step_answer_evidence: ${excerpt(step.final_answer, 5000) || 'none'}`,
      `- search_query_count: ${queries.length}`,
      `- search_queries: ${queries.length ? queries.join(' | ') : 'none'}`,
      `- search_results_saved: ${results.length > 0 ? 'yes' : 'no'}`,
      `- search_results_excerpt: ${resultExcerpt || 'none'}`,
    ].join('\n');
  }).join('\n\n');

  const systemPrompt = enginePrompt('single_run_checkpoint_scorer');

  const userMessage = `Criteria: ${criteria?.name_de ?? question.criteria_id} (#${question.criteria_id})
Question notes: ${question.notes || 'none'}

Original question:
${question.question_text}

Last step answer:
${finalAnswer}

All workflow step answers and run evidence:
${stepContext || 'No step data available.'}

Checkpoints to evaluate:
${checkpointList}

Evaluate each checkpoint and return the JSON response.`;

  // Call scoring model
  const raw = await callLLM(llmConfig, systemPrompt, [{ role: 'user', content: userMessage }], { temperature: 0 });

  // Parse response
  let scoringData: ScoringResponse;
  try {
    const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : raw.trim();
    scoringData = JSON.parse(jsonStr) as ScoringResponse;
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        scoringData = JSON.parse(jsonMatch[0]) as ScoringResponse;
      } catch {
        throw new Error(`Failed to parse scoring response: ${raw.slice(0, 200)}`);
      }
    } else {
      throw new Error(`Failed to parse scoring response: ${raw.slice(0, 200)}`);
    }
  }

  // Compute score
  const results = scoringData.checkpoint_results ?? [];
  const total = checkpoints.length;
  const passed = results.filter(r => r.passed === true).length;
  const scorePercent = total > 0 ? (passed / total) * 100 : 0;
  const report = scoringData.overall_report ?? '';
  const protocolReviewReasons: string[] = [];
  if (run.setup_id === 'setup_wf_prompt_optimise') {
    const step1 = runSteps.find(step => step.step === 1);
    if (!step1?.final_answer?.trim()) {
      protocolReviewReasons.push('Prompt-Optimierung Step 1 produced no optimized prompt.');
    } else if (
      Number(question.autoanswer ?? 1) !== 1 &&
      !clarificationIsExpected(question, checkpoints) &&
      looksLikeClarificationRequest(step1.final_answer)
    ) {
      protocolReviewReasons.push('Prompt-Optimierung Step 1 asked for clarification instead of producing an optimized prompt.');
    }
  }
  if (Number(question.autoanswer ?? 1) !== 1) {
    protocolReviewReasons.push(...unexpectedClarificationReviewReasons(
      question,
      checkpoints,
      runSteps,
      run.setup_id,
      setup?.max_steps ?? runSteps.length,
    ));
  } else {
    const finalStep = runSteps[runSteps.length - 1];
    if (
      finalStep &&
      !clarificationIsExpected(question, checkpoints) &&
      looksLikeClarificationRequest(finalStep.final_answer)
    ) {
      protocolReviewReasons.push('Run ended with an unexpected clarification question even after autoanswer handling.');
    }
  }
  const llmReviewReason = scoringData.review_reason ?? '';
  const expectedClarification = clarificationIsExpected(question, checkpoints);
  const llmReviewRequired =
    scoringData.review_required === true &&
    !isOrdinaryCheckpointFailureReview(llmReviewReason, scorePercent, expectedClarification);
  const reviewRequired = llmReviewRequired || protocolReviewReasons.length > 0;
  const reviewReason = [
    llmReviewRequired ? llmReviewReason : '',
    ...protocolReviewReasons,
  ].filter(Boolean).join(' ');

  const checkpointResults: ScoreResult['checkpointResults'] = [];
  let scoreId = 0;

  const storeScore = db.transaction(() => {
    const existingScore = db.prepare('SELECT * FROM scores WHERE run_id = ?').get(runId) as {
      id: number;
      run_id: number;
      scoring_model: string | null;
      score_percent: number | null;
      total_checkpoints: number | null;
      passed_checkpoints: number | null;
      report: string | null;
      review_required: number | null;
      review_reason: string | null;
      scored_at: string | null;
      created_at: string | null;
    } | undefined;

    if (existingScore) {
      scoreId = existingScore.id;
      const historyResult = db.prepare(`
        INSERT INTO score_history (
          original_score_id,
          run_id,
          scoring_model,
          score_percent,
          total_checkpoints,
          passed_checkpoints,
          report,
          review_required,
          review_reason,
          scored_at,
          created_at,
          archived_reason
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        existingScore.id,
        existingScore.run_id,
        existingScore.scoring_model,
        existingScore.score_percent,
        existingScore.total_checkpoints,
        existingScore.passed_checkpoints,
        existingScore.report,
        existingScore.review_required,
        existingScore.review_reason,
        existingScore.scored_at,
        existingScore.created_at,
        'score_revalidation',
      );
      const scoreHistoryId = historyResult.lastInsertRowid as number;
      const oldCheckpointResults = db.prepare('SELECT * FROM checkpoint_results WHERE score_id = ?').all(scoreId) as Array<{
        id: number;
        checkpoint_id: number;
        passed: number | null;
        explanation: string | null;
      }>;
      const historyCpInsert = db.prepare(`
        INSERT INTO checkpoint_results_history (
          score_history_id,
          original_checkpoint_result_id,
          checkpoint_id,
          passed,
          explanation
        )
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const oldCp of oldCheckpointResults) {
        historyCpInsert.run(scoreHistoryId, oldCp.id, oldCp.checkpoint_id, oldCp.passed, oldCp.explanation);
      }

      db.prepare(`
        UPDATE scores
        SET scoring_model = ?,
            score_percent = ?,
            total_checkpoints = ?,
            passed_checkpoints = ?,
            report = ?,
            review_required = ?,
            review_reason = ?,
            scored_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        llmConfigRaw.model_id,
        scorePercent,
        total,
        passed,
        report,
        reviewRequired ? 1 : 0,
        reviewReason,
        scoreId,
      );
      db.prepare('DELETE FROM checkpoint_results WHERE score_id = ?').run(scoreId);
    } else {
      const scoreResult = db.prepare(`
        INSERT INTO scores (
          run_id,
          scoring_model,
          score_percent,
          total_checkpoints,
          passed_checkpoints,
          report,
          review_required,
          review_reason,
          scored_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        runId,
        llmConfigRaw.model_id,
        scorePercent,
        total,
        passed,
        report,
        reviewRequired ? 1 : 0,
        reviewReason,
      );
      scoreId = scoreResult.lastInsertRowid as number;
    }

    const cpInsert = db.prepare(`
      INSERT INTO checkpoint_results (score_id, checkpoint_id, passed, explanation)
      VALUES (?, ?, ?, ?)
    `);

    for (const cp of checkpoints) {
      const result = results.find(r => r.checkpoint_id === cp.id);
      const cpPassed = result?.passed === true;
      const explanation = result?.explanation ?? '';

      cpInsert.run(scoreId, cp.id, cpPassed ? 1 : 0, explanation);

      checkpointResults.push({
        checkpointId: cp.id,
        itemText: cp.item_text,
        passed: cpPassed,
        explanation,
      });
    }
  });

  storeScore();

  return {
    scoreId,
    scorePercent,
    passed,
    total,
    report,
    reviewRequired,
    reviewReason,
    checkpointResults,
  };
}

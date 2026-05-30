import type { CheckpointRow, QuestionRow, RunStepRow } from '../db/index';

export function looksLikeClarificationRequest(value: string | null | undefined): boolean {
  const text = (value ?? '').trim().toLowerCase();
  if (!text) return false;
  const compact = text.replace(/\s+/g, ' ').trim();
  const startsStructured = /^[{\[]/.test(compact);
  const isLongAnswer = compact.length > 700;
  const questionMarkCount = (compact.match(/\?/g) || []).length;
  const sentenceLikeCount = compact.split(/[.!?]\s+|\n+/).filter(part => part.trim().length > 20).length;
  const hasSubstantialAnswerStructure = [
    /\n\s*[-*]\s+/,
    /\n\s*\d+[.)]\s+/,
    /:\s*\n/,
    /\bfazit\b/,
    /\bbeispiel\b/,
    /\bempfehlung\b/,
    /\bvorteil/,
    /\bnachteil/,
    /\bschritt\b/,
    /\bzusammenfass/,
    /\bentscheidungshilfe\b/,
  ].some(pattern => pattern.test(text));
  const likelyAnswerContent = [
    /prueffrage/,
    /prüffrage/,
    /checkliste/,
    /kontrollfrage/,
    /leitfrage/,
    /frage\s*\d/,
    /"frage/,
    /antwort/,
    /fazit/,
    /begruendung/,
    /begründung/,
  ].some(pattern => pattern.test(compact));

  const explicitCannotProceed = [
    /ich kann (das|dir|ihnen)?\s*(nicht|erst|nur)/,
    /ich kann .+ nicht .+ ohne/,
    /ohne (weitere|mehr|genauere|zusätzliche|zusaetzliche) information/,
    /um .+ zu (koennen|können|machen|erstellen|beantworten).+(brauche|benötige|benoetige)/,
    /bevor ich .+(kann|mache|erstelle|beantworte)/,
    /bitte (gib|geben|nenne|nennen|klaer|klär|praezisier|präzisier|spezifiziere|specify)/,
    /please (provide|specify|clarify|give me)/,
    /i need more information/,
    /more information is needed/,
  ].some(pattern => pattern.test(text));

  const answerWithEmbeddedQuestions =
    (isLongAnswer || hasSubstantialAnswerStructure || sentenceLikeCount >= 4) &&
    !explicitCannotProceed;

  // Cross-check: questions inside a real answer are not clarification requests.
  // Examples: guiding questions, checklist questions, source-check questions, or
  // "Welche Abschlüsse werden benötigt?" inside an otherwise complete answer.
  if (answerWithEmbeddedQuestions) return false;
  if ((startsStructured || isLongAnswer) && likelyAnswerContent) return false;

  const directClarificationPatterns = [
    /\?$/,
    /bitte (gib|geben|nenne|nennen|klaer|klär|praezisier|präzisier|spezifiziere|specify)/,
    /kannst du .+\?/,
    /koennen sie .+\?/,
    /können sie .+\?/,
    /welche .+\?/,
    /welcher .+\?/,
    /welches .+\?/,
    /was .+\?/,
    /worum .+\?/,
    /wann .+\?/,
    /wo .+\?/,
    /wie .+\?/,
    /ich brauche (mehr|weitere) information/,
    /weitere information(en)? (sind|ist) noetig/,
    /weitere information(en)? (sind|ist) nötig/,
    /please provide/,
    /please specify/,
    /please clarify/,
    /could you provide/,
    /can you provide/,
    /i need more information/,
    /more information is needed/,
    /which .+\?/,
    /what .+\?/,
    /please give me/,
  ];

  const hasDirectClarificationSignal = directClarificationPatterns.some(pattern => pattern.test(text));
  if (!hasDirectClarificationSignal) return false;

  const mostlyQuestion =
    compact.endsWith('?') &&
    (compact.length < 450 || questionMarkCount >= Math.max(1, sentenceLikeCount - 1));

  const shortInfoRequest = compact.length < 650 && explicitCannotProceed;

  // Final cross-check: trigger only when the output is mainly a request for
  // missing user information, not a normal answer that happens to contain
  // question marks.
  if (!mostlyQuestion && !shortInfoRequest) return false;

  return true;
}

export function clarificationIsExpected(question: QuestionRow, checkpoints: CheckpointRow[] = []): boolean {
  if (question.criteria_id === 'rueckfragefaehigkeit') return true;
  const text = [
    question.question_text,
    question.notes ?? '',
    ...checkpoints.map(cp => cp.item_text),
  ].join('\n').toLowerCase();
  return [
    /rueckfrage/,
    /rückfrage/,
    /nachfrag/,
    /frage nach/,
    /fehlende information/,
    /fehlender kontext/,
    /unklar/,
    /stelle zuerst fragen/,
    /ask clarifying/,
    /clarification/,
  ].some(pattern => pattern.test(text));
}

export function stepRoleForSetup(setupId: string, formalStep: number, maxSteps: number): string {
  if (setupId === 'setup_wf_prompt_optimise' && formalStep === 1) return 'optimized prompt';
  if (setupId === 'setup_flowmap' && formalStep === 1) return 'topic map';
  if (setupId === 'setup_flowmap' && formalStep === 2) return 'research summary';
  if (setupId === 'setup_flowmap' && formalStep === 3) return 'final answer';
  if (setupId === 'setup_flowreview' && formalStep === 1) return 'draft answer';
  if (setupId === 'setup_flowreview' && formalStep === 2) return 'reviewed final answer';
  if (setupId === 'setup_flowreview2' && formalStep === 1) return 'draft answer';
  if (setupId === 'setup_flowreview2' && formalStep === 2) return 'reviewed final answer';
  if (setupId === 'setup_flowreview2' && formalStep === 3) return 'selected best final answer';
  if (setupId === 'setup_flowreview_same' && formalStep === 1) return 'copied Direct answer';
  if (setupId === 'setup_flowreview_same' && formalStep === 2) return 'reviewed final answer';
  if (setupId === 'setup_flowreview_same' && formalStep === 3) return 'selected best final answer';
  if (setupId === 'setup_ce_flowreview_s4' && formalStep === 1) return 'copied CE Direct JSON';
  if (setupId === 'setup_ce_flowreview_s4' && formalStep === 2) return 'verified/corrected CE JSON';
  if (formalStep === maxSteps) return 'final answer';
  return 'intermediate answer';
}

export function unexpectedClarificationReviewReasons(
  question: QuestionRow,
  checkpoints: CheckpointRow[],
  runSteps: RunStepRow[],
  setupId: string,
  maxSteps: number,
): string[] {
  if (clarificationIsExpected(question, checkpoints)) return [];

  return runSteps
    .filter(step => looksLikeClarificationRequest(step.final_answer))
    .map(step => {
      const formalStep = Number((step as unknown as { formal_step?: number }).formal_step ?? step.step);
      const role = stepRoleForSetup(setupId, formalStep, maxSteps);
      return `Step ${step.step} asked an unexpected clarification question instead of producing the expected ${role}.`;
    });
}

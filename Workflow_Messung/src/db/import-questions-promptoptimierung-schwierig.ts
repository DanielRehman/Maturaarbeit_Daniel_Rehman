import fs from 'fs';
import path from 'path';
import db from './index';

const TESTSET = 'prompt_optimisation_hard_questions';
const SETUP_ID = 'setup_wf_prompt_optimise';
const SOURCE_PATH = path.resolve(process.cwd(), '..', 'plan_ai2', 'questionmaking', 'testset_promptoptimierung_schwierig.md');

type QuestionSeed = {
  criteriaId: string;
  code: string;
  question: string;
  checkpoints: string[];
};

const criteriaByHeading: Record<string, string> = {
  Richtigkeit: 'richtigkeit',
  'Vollstaendigkeit gemaess Frage': 'vollstaendigkeit_frage',
  'Vollstaendigkeit gemaess Moeglichkeit': 'vollstaendigkeit_moeglichkeit',
  'Pruefung / Verifikation': 'pruefung_verifikation',
  'Unsicherheit offenlegen': 'unsicherheit',
  Rueckfragefaehigkeit: 'rueckfragefaehigkeit',
  'Internet- / Quellenqualitaet': 'internet_quellenqualitaet',
  Relevanz: 'relevanz',
  'Klarheit / Verstaendlichkeit': 'klarheit',
};

function headingToCriteriaId(line: string): string | null {
  const match = /^##\s+\d+\.\s+(.+)$/.exec(line.trim());
  if (!match) return null;
  return criteriaByHeading[match[1] ?? ''] ?? null;
}

function parseQuestions(markdown: string): QuestionSeed[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const seeds: QuestionSeed[] = [];
  let criteriaId = '';
  let current: QuestionSeed | null = null;
  let mode: 'none' | 'awaitQuestionFence' | 'questionFence' | 'checkpoints' = 'none';
  let questionLines: string[] = [];

  const flush = () => {
    if (!current) return;
    current.question = current.question.trim();
    if (!current.criteriaId || !current.question || current.checkpoints.length === 0) {
      throw new Error(`Invalid question block ${current.code || '(unknown)'}`);
    }
    seeds.push(current);
    current = null;
    mode = 'none';
    questionLines = [];
  };

  for (const line of lines) {
    const nextCriteriaId = headingToCriteriaId(line);
    if (nextCriteriaId) {
      flush();
      criteriaId = nextCriteriaId;
      continue;
    }

    const questionMatch = /^###\s+(.+)$/.exec(line.trim());
    if (questionMatch) {
      flush();
      if (!criteriaId) throw new Error(`Question ${questionMatch[1]} appears before a criteria heading`);
      current = { criteriaId, code: questionMatch[1] ?? '', question: '', checkpoints: [] };
      continue;
    }

    if (!current) continue;

    if (line.trim() === 'Frage:') {
      mode = 'awaitQuestionFence';
      continue;
    }

    if (mode === 'awaitQuestionFence' && line.trim().startsWith('```')) {
      mode = 'questionFence';
      questionLines = [];
      continue;
    }

    if (mode === 'questionFence') {
      if (line.trim().startsWith('```')) {
        current.question = questionLines.join('\n').trim();
        mode = 'none';
      } else {
        questionLines.push(line);
      }
      continue;
    }

    if (line.trim() === 'Checkpoints:') {
      mode = 'checkpoints';
      continue;
    }

    if (mode === 'checkpoints') {
      const checkpointMatch = /^-\s+(.+)$/.exec(line.trim());
      if (checkpointMatch) {
        current.checkpoints.push(checkpointMatch[1] ?? '');
      }
    }
  }

  flush();
  return seeds;
}

if (!fs.existsSync(SOURCE_PATH)) {
  throw new Error(`Source markdown not found: ${SOURCE_PATH}`);
}

const seeds = parseQuestions(fs.readFileSync(SOURCE_PATH, 'utf8'));
if (seeds.length !== 90) {
  throw new Error(`Expected 90 questions, parsed ${seeds.length}`);
}

const existing = db.prepare(`
  SELECT COUNT(*) as count
  FROM questions
  WHERE testset = ? AND setup_id = ?
`).get(TESTSET, SETUP_ID) as { count: number };

if (existing.count > 0) {
  console.error(`Aborted: ${existing.count} questions already exist for ${TESTSET} / ${SETUP_ID}.`);
  process.exit(1);
}

const insertQuestion = db.prepare(`
  INSERT INTO questions (criteria_id, setup_id, question_text, testset, notes)
  VALUES (?, ?, ?, ?, ?)
`);
const insertCheckpoint = db.prepare(`
  INSERT INTO checkpoints (question_id, item_text, sort_order)
  VALUES (?, ?, ?)
`);

const transaction = db.transaction(() => {
  db.prepare('INSERT OR IGNORE INTO testsets (id, name) VALUES (?, ?)').run(TESTSET, TESTSET);

  const criteriaCounts = new Map<string, number>();
  for (const seed of seeds) {
    const next = (criteriaCounts.get(seed.criteriaId) ?? 0) + 1;
    criteriaCounts.set(seed.criteriaId, next);

    const result = insertQuestion.run(
      seed.criteriaId,
      SETUP_ID,
      seed.question,
      TESTSET,
      `${seed.criteriaId} ${TESTSET}-${next} for C - Prompt-Optimierung; hard multi-part prompt`,
    );

    seed.checkpoints.forEach((checkpoint, index) => {
      insertCheckpoint.run(result.lastInsertRowid, checkpoint, index);
    });
  }
});

transaction();

console.log(`Inserted ${seeds.length} questions for ${TESTSET} / ${SETUP_ID}.`);
console.table(db.prepare(`
  SELECT criteria_id, COUNT(*) as questions
  FROM questions
  WHERE testset = ? AND setup_id = ?
  GROUP BY criteria_id
  ORDER BY criteria_id
`).all(TESTSET, SETUP_ID));

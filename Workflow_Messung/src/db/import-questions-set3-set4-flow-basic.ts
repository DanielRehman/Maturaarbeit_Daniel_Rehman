import db from './index';

type TargetSet = {
  testset: string;
  setupId: string;
  setupLabel: string;
};

const SOURCE_TESTSET = 'prompt_optimisation_questions';
const SOURCE_SETUP_ID = 'setup_wf_prompt_optimise';

const TARGETS: TargetSet[] = [
  { testset: 'flowmap_basic_questions', setupId: 'setup_flowmap', setupLabel: 'Flowmap' },
  { testset: 'flowreview_basic_questions', setupId: 'setup_flowreview', setupLabel: 'Flowreview' },
];

const sourceQuestions = db.prepare(`
  SELECT id, criteria_id, question_text, notes, autoanswer
  FROM questions
  WHERE testset = ? AND setup_id = ?
  ORDER BY criteria_id, id
`).all(SOURCE_TESTSET, SOURCE_SETUP_ID) as Array<{
  id: number;
  criteria_id: string;
  question_text: string;
  notes: string | null;
  autoanswer: number | null;
}>;

if (sourceQuestions.length !== 90) {
  throw new Error(`Expected 90 source questions in ${SOURCE_TESTSET}, got ${sourceQuestions.length}.`);
}

const counts = new Map<string, number>();
for (const question of sourceQuestions) {
  counts.set(question.criteria_id, (counts.get(question.criteria_id) ?? 0) + 1);
}
for (const [criteriaId, count] of counts) {
  if (count !== 10) {
    throw new Error(`Expected 10 source questions for ${criteriaId}, got ${count}.`);
  }
}

for (const target of TARGETS) {
  const existing = db.prepare(`
    SELECT COUNT(*) as count
    FROM questions
    WHERE testset = ? AND setup_id = ?
  `).get(target.testset, target.setupId) as { count: number };

  if (existing.count > 0) {
    console.error(`Aborted: ${existing.count} questions already exist for ${target.testset} / ${target.setupId}.`);
    process.exit(1);
  }
}

const checkpointRows = db.prepare(`
  SELECT item_text, sort_order
  FROM checkpoints
  WHERE question_id = ?
  ORDER BY sort_order ASC, id ASC
`);

const insertQuestion = db.prepare(`
  INSERT INTO questions (criteria_id, setup_id, question_text, testset, notes, autoanswer)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertCheckpoint = db.prepare(`
  INSERT INTO checkpoints (question_id, item_text, sort_order)
  VALUES (?, ?, ?)
`);

const transaction = db.transaction(() => {
  for (const target of TARGETS) {
    db.prepare('INSERT OR IGNORE INTO testsets (id, name) VALUES (?, ?)').run(target.testset, target.testset);
  }

  for (const target of TARGETS) {
    const perCriteria = new Map<string, number>();
    for (const source of sourceQuestions) {
      const next = (perCriteria.get(source.criteria_id) ?? 0) + 1;
      perCriteria.set(source.criteria_id, next);
      const result = insertQuestion.run(
        source.criteria_id,
        target.setupId,
        source.question_text,
        target.testset,
        `${source.criteria_id} ${target.testset}-${next}; baseline questions for ${target.setupLabel}`,
        source.autoanswer ?? 1,
      );

      const checkpoints = checkpointRows.all(source.id) as Array<{ item_text: string; sort_order: number }>;
      for (const checkpoint of checkpoints) {
        insertCheckpoint.run(result.lastInsertRowid, checkpoint.item_text, checkpoint.sort_order);
      }
    }
  }
});

transaction();

console.log(`Inserted ${sourceQuestions.length} questions for each target set.`);
console.table(db.prepare(`
  SELECT setup_id, testset, criteria_id, COUNT(*) as questions
  FROM questions
  WHERE testset IN ('flowmap_basic_questions', 'flowreview_basic_questions')
  GROUP BY setup_id, testset, criteria_id
  ORDER BY testset, criteria_id
`).all());

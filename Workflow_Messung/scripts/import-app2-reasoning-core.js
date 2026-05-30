const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.resolve(__dirname, '../data/matura.db'));
const { generateTaskBundle } = require(path.resolve(__dirname, '../aufgaben_generator/dist/generate_task.js'));

const TESTSET = 'ce_app2_reasoning_core_10';
const OUT_DIR = path.resolve(__dirname, '../outputs/app2_reasoning_core_10');

const METRICS = [
  {
    id: 'richtigkeit',
    label: 'Richtigkeit',
    level: 2,
    seedBase: 2100,
    selectExpected(bundle) {
      return Object.fromEntries(
        Object.entries(bundle.expected).filter(([key]) => !key.startsWith('rule_')),
      );
    },
    focus: 'finale berechnete Werte',
  },
  {
    id: 'pruefung_verifikation',
    label: 'Pruefung / Verifikation',
    level: 3,
    seedBase: 3100,
    selectExpected(bundle) {
      return Object.fromEntries(
        Object.entries(bundle.expected).filter(([key]) => key.startsWith('rule_')),
      );
    },
    focus: 'ob jede Regel korrekt geprueft und angewendet wurde',
  },
  {
    id: 'vollstaendigkeit_frage',
    label: 'Vollstaendigkeit gemaess Frage',
    level: 2,
    seedBase: 4200,
    selectExpected(bundle) {
      const entries = Object.entries(bundle.expected);
      const finalValues = entries.filter(([key]) => !key.startsWith('rule_')).slice(0, 3);
      const ruleValues = entries.filter(([key]) => key.startsWith('rule_')).slice(0, 3);
      return Object.fromEntries([...finalValues, ...ruleValues]);
    },
    focus: 'alle explizit verlangten Teilfelder',
  },
  {
    id: 'vollstaendigkeit_moeglichkeit',
    label: 'Vollstaendigkeit gemaess Moeglichkeit',
    level: 4,
    seedBase: 5400,
    selectExpected(bundle) {
      return bundle.expected;
    },
    focus: 'vollstaendige Loesung mit allen moeglichen finalen Werten und Regelchecks',
  },
];

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((candidate) => candidate.name === column)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
}

ensureColumn('questions', 'computer_evaluable', 'INTEGER DEFAULT 0');
ensureColumn('questions', 'expected_answer_json', 'TEXT');
ensureColumn('questions', 'answer_schema_json', 'TEXT');
ensureColumn('questions', 'evaluation_type', "TEXT DEFAULT 'llm_checkpoint'");

function extractPromptText(taskText) {
  const marker = 'Prompt-Text:';
  const markerIndex = taskText.indexOf(marker);
  if (markerIndex < 0) return taskText.trim();
  return taskText.slice(markerIndex + marker.length).trim();
}

function valueType(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function answerSchema(expected) {
  const fields = {};
  for (const [key, value] of Object.entries(expected)) {
    if (value === 'yes' || value === 'no') {
      fields[key] = { type: 'string', allowed_values: ['yes', 'no'] };
      continue;
    }
    fields[key] = { type: valueType(value) };
    if (Array.isArray(value)) {
      fields[key].item_type = value.length ? valueType(value[0]) : 'string';
    }
  }
  return { type: 'object', fields };
}

function schemaLine(schema) {
  return Object.entries(schema.fields)
    .map(([key, field]) => {
      if (field.allowed_values) return `${key}: one of ${field.allowed_values.join('|')}`;
      if (field.type === 'array') return `${key}: array of ${field.item_type || 'value'}`;
      return `${key}: ${field.type}`;
    })
    .join('; ');
}

function placeholderFor(field) {
  if (field.allowed_values) return `<${field.allowed_values.join('|')}>`;
  if (field.type === 'array') return [`<${field.item_type || 'value'}>`];
  return `<${field.type}>`;
}

function schemaExample(schema) {
  const example = {};
  for (const [key, field] of Object.entries(schema.fields)) {
    example[key] = placeholderFor(field);
  }
  return JSON.stringify(example, null, 2);
}

function questionText(metric, index, bundle, expected, schema) {
  return [
    `Computer-evaluable app2 reasoning task #${index} for ${metric.label}.`,
    `Metric focus: ${metric.focus}.`,
    `Level: ${bundle.task.level}. Seed: ${bundle.task.seed}.`,
    '',
    extractPromptText(bundle.taskText),
    '',
    'Return ONLY one valid JSON object. No markdown, no explanation, no extra keys.',
    `Required keys in this exact set: ${JSON.stringify(Object.keys(expected))}.`,
    `Required types and allowed values: ${schemaLine(schema)}.`,
    'Use numbers as numbers. Use yes/no only for rule-applied fields.',
    'Format example, not the solution:',
    schemaExample(schema),
  ].join('\n');
}

const oldQuestionIds = db.prepare('SELECT id FROM questions WHERE testset = ?').all(TESTSET).map((row) => row.id);

const insertQuestion = db.prepare(`
  INSERT INTO questions (
    criteria_id, setup_id, question_text, testset, notes, autoanswer,
    computer_evaluable, expected_answer_json, answer_schema_json, evaluation_type
  )
  VALUES (?, NULL, ?, ?, ?, 0, 1, ?, ?, 'json_exact')
`);

const insertCheckpoint = db.prepare('INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES (?, ?, ?)');

const importTx = db.transaction(() => {
  if (oldQuestionIds.length > 0) {
    const deleteCheckpoints = db.prepare('DELETE FROM checkpoints WHERE question_id = ?');
    for (const id of oldQuestionIds) deleteCheckpoints.run(id);
    db.prepare('DELETE FROM questions WHERE testset = ?').run(TESTSET);
  }

  db.prepare('INSERT OR IGNORE INTO testsets (id, name) VALUES (?, ?)').run(
    TESTSET,
    'Computer evaluable app2 reasoning core metrics, 10 each',
  );

  const manifest = [];
  let inserted = 0;

  for (const metric of METRICS) {
    for (let index = 1; index <= 10; index += 1) {
      const seed = metric.seedBase + index;
      const bundle = generateTaskBundle(metric.level, seed);
      const expected = metric.selectExpected(bundle);
      const schema = answerSchema(expected);
      const result = insertQuestion.run(
        metric.id,
        questionText(metric, index, bundle, expected, schema),
        TESTSET,
        `${metric.id} app2 level ${metric.level} seed ${seed}; ${metric.focus}`,
        JSON.stringify(expected),
        JSON.stringify(schema),
      );
      const questionId = Number(result.lastInsertRowid);

      insertCheckpoint.run(questionId, 'json:__valid_json Answer is valid JSON object', 0);
      Object.keys(expected).forEach((key, keyIndex) => {
        insertCheckpoint.run(questionId, `json:${key} Field ${key} exactly matches expected value`, keyIndex + 1);
      });
      insertCheckpoint.run(
        questionId,
        'json:__no_extra_keys JSON contains exactly the expected keys and no extras',
        Object.keys(expected).length + 1,
      );

      manifest.push({
        question_id: questionId,
        testset: TESTSET,
        criteria_id: metric.id,
        level: metric.level,
        seed,
        expected,
        schema,
        trace: bundle.trace,
      });
      inserted += 1;
    }
  }

  return { inserted, manifest };
});

const { inserted, manifest } = importTx();

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`Imported ${inserted} app2 computer-evaluable questions into ${TESTSET}.`);
if (oldQuestionIds.length > 0) {
  console.log(`Replaced previous ${oldQuestionIds.length} questions for ${TESTSET}.`);
}
console.table(db.prepare(`
  SELECT criteria_id, COUNT(*) AS questions
  FROM questions
  WHERE testset = ?
  GROUP BY criteria_id
  ORDER BY criteria_id
`).all(TESTSET));
console.log(`Manifest: ${path.relative(path.resolve(__dirname, '..'), path.join(OUT_DIR, 'manifest.json'))}`);


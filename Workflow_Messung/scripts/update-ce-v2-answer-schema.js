const Database = require('better-sqlite3');
const db = new Database('data/matura.db');

const TESTSET = 'ce_intermediate_v2_questions';

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some(c => c.name === column)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
}

ensureColumn('questions', 'answer_schema_json', 'TEXT');

const sourceEnums = ['aviation_authority', 'textbook', 'government', 'operator', 'statistics_office', 'technical_reference', 'health_authority', 'financial_data_provider', 'original_study', 'history_textbook'];
const unknownEnums = ['known', 'unknown', 'probable'];
const fieldEnums = {
  answer_status: unknownEnums,
  best_source: sourceEnums,
  best_option: ['A', 'B', 'C'],
  check_method: ['multiplication', 'inverse', 'mean', 'addition', 'conversion', 'logic'],
  better: ['bus', 'car'],
};

function valueType(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function answerSchema(expected) {
  const fields = {};
  for (const [key, value] of Object.entries(expected)) {
    const field = { type: valueType(value) };
    if (fieldEnums[key]) {
      field.allowed_values = fieldEnums[key];
    }
    if (Array.isArray(value)) {
      field.item_type = value.length ? valueType(value[0]) : 'string';
      if (field.item_type === 'string' && value.length > 0) {
        field.allowed_items = [...new Set(value)];
      }
    }
    fields[key] = field;
  }
  return { type: 'object', fields };
}

function schemaPlaceholder(value) {
  if (Array.isArray(value)) {
    const first = value[0];
    const type = first === undefined ? 'string' : typeof first;
    return `<array of ${type}>`;
  }
  if (value === null) return '<null>';
  return `<${typeof value}>`;
}

function fillableSchema(expected) {
  const schema = answerSchema(expected);
  return Object.entries(schema.fields)
    .map(([key, field]) => {
      if (field.allowed_values) return `${key}=<one of ${field.allowed_values.join('|')}>`;
      if (field.allowed_items) return `${key}=<array using only ${field.allowed_items.join('|')}>`;
      return `${key}=${schemaPlaceholder(expected[key])}`;
    })
    .join('; ');
}

function cleanSchemaLines(text) {
  return text
    .split('\n')
    .filter(line => !line.startsWith('Format example only, not the solution:'))
    .filter(line => !line.startsWith('Answer schema to fill, not the solution:'))
    .join('\n');
}

const rows = db.prepare(`
  SELECT id, question_text, expected_answer_json, answer_schema_json
  FROM questions
  WHERE testset = ?
    AND computer_evaluable = 1
    AND evaluation_type = 'json_exact'
  ORDER BY id
`).all(TESTSET);

const update = db.prepare('UPDATE questions SET question_text = ?, answer_schema_json = ? WHERE id = ?');

const tx = db.transaction(() => {
  let changed = 0;
  for (const row of rows) {
    const expected = JSON.parse(row.expected_answer_json);
    const schemaJson = JSON.stringify(answerSchema(expected));
    const lines = cleanSchemaLines(row.question_text).split('\n');
    const insertAfter = lines.findIndex(line => line.startsWith('Required types and allowed values:'));
    const schemaLine = `Answer schema to fill, not the solution: ${fillableSchema(expected)}.`;
    if (insertAfter >= 0) {
      lines.splice(insertAfter + 1, 0, schemaLine);
    } else {
      lines.push(schemaLine);
    }
    const nextText = lines.join('\n');
    if (nextText !== row.question_text || row.answer_schema_json !== schemaJson) {
      update.run(nextText, schemaJson, row.id);
      changed += 1;
    }
  }
  return changed;
});

const changed = tx();
console.log(JSON.stringify({ testset: TESTSET, rows: rows.length, changed }));
console.log(db.prepare('SELECT question_text FROM questions WHERE id = 842').get().question_text);

const Database = require('better-sqlite3');
const db = new Database('data/matura.db');

const TESTSET = 'ce_intermediate_v2_questions';

function exampleValue(value) {
  if (Array.isArray(value)) {
    const first = value[0];
    return [typeof first === 'number' ? 987654 : typeof first === 'boolean' ? first !== true : 'format_example'];
  }
  if (typeof value === 'number') return value === 987654 ? 123456 : 987654;
  if (typeof value === 'boolean') return !value;
  if (value === null) return null;
  return value === 'format_example' ? 'example_value' : 'format_example';
}

function formatExample(expected) {
  const example = {};
  for (const [key, value] of Object.entries(expected)) {
    example[key] = exampleValue(value);
  }
  return JSON.stringify(example);
}

function removeExistingFormatExample(text) {
  return text
    .split('\n')
    .filter(line => !line.startsWith('Format example only, not the solution:'))
    .join('\n');
}

const rows = db.prepare(`
  SELECT id, question_text, expected_answer_json
  FROM questions
  WHERE testset = ?
    AND computer_evaluable = 1
    AND evaluation_type = 'json_exact'
  ORDER BY id
`).all(TESTSET);

const update = db.prepare('UPDATE questions SET question_text = ? WHERE id = ?');

const tx = db.transaction(() => {
  let changed = 0;
  for (const row of rows) {
    const expected = JSON.parse(row.expected_answer_json);
    const clean = removeExistingFormatExample(row.question_text);
    const lines = clean.split('\n');
    const insertAfter = lines.findIndex(line => line.startsWith('Required types and allowed values:'));
    const exampleLine = `Format example only, not the solution: ${formatExample(expected)}.`;
    if (insertAfter >= 0) {
      lines.splice(insertAfter + 1, 0, exampleLine);
    } else {
      lines.push(exampleLine);
    }
    const nextText = lines.join('\n');
    if (nextText !== row.question_text) {
      update.run(nextText, row.id);
      changed += 1;
    }
  }
  return changed;
});

const changed = tx();
console.log(JSON.stringify({ testset: TESTSET, rows: rows.length, changed }));
console.log(db.prepare('SELECT id, question_text FROM questions WHERE testset = ? ORDER BY id LIMIT 1').get(TESTSET).question_text);

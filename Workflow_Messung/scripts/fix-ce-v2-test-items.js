const Database = require('better-sqlite3');

const db = new Database('data/matura.db');

function valueType(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

const fieldEnums = {
  best_source: [
    'aviation_authority',
    'textbook',
    'government',
    'operator',
    'statistics_office',
    'technical_reference',
    'health_authority',
    'financial_data_provider',
    'original_study',
    'history_textbook',
  ],
  best_option: ['A', 'B', 'C'],
  check_method: ['multiplication', 'inverse', 'mean', 'addition', 'conversion', 'logic'],
  better: ['bus', 'car'],
  answer_status: ['known', 'unknown', 'probable'],
};

function answerSchema(expected) {
  const fields = {};
  for (const [key, value] of Object.entries(expected)) {
    const field = { type: valueType(value) };
    if (fieldEnums[key]) field.allowed_values = fieldEnums[key];
    if (Array.isArray(value)) {
      field.item_type = value.length ? valueType(value[0]) : 'string';
      if (field.item_type === 'string' && value.length > 0) field.allowed_items = [...new Set(value)];
    }
    fields[key] = field;
  }
  return { type: 'object', fields };
}

function schemaLine(expected) {
  return Object.entries(expected).map(([key, value]) => {
    if (fieldEnums[key]) return `${key}: string enum ${JSON.stringify(fieldEnums[key])}`;
    if (Array.isArray(value)) {
      const type = value.length ? valueType(value[0]) : 'string';
      return `${key}: array of ${type}; preserve requested order`;
    }
    return `${key}: ${valueType(value)}`;
  }).join('; ');
}

function fillableSchema(expected) {
  const schema = answerSchema(expected);
  return Object.entries(schema.fields).map(([key, field]) => {
    if (field.allowed_values) return `${key}=<one of ${field.allowed_values.join('|')}>`;
    if (field.allowed_items) return `${key}=<array using only ${field.allowed_items.join('|')}>`;
    if (field.type === 'array') return `${key}=<array of ${field.item_type || 'string'}>`;
    return `${key}=<${field.type}>`;
  }).join('; ');
}

function extraInstructions(criteriaId) {
  const lines = [];
  if (criteriaId === 'richtigkeit') {
    lines.push('For numeric_result: use the computed numeric value for arithmetic claims. For non-arithmetic true/false claims, use 1 when the claim is true and 0 when the claim is false.');
  }
  if (criteriaId === 'pruefung_verifikation') {
    lines.push('For checks_passed: use 1 if the original claim/check passes and 0 if it fails. For corrected_value: return only the corrected value, number, time, or letter, not a sentence.');
  }
  if (criteriaId === 'internet_quellenqualitaet') {
    lines.push('For official_source_needed: true means a government/regulator/public-authority source is specifically required. Use false for commercial operators, financial data providers, original studies, textbooks, or technical references.');
  }
  if (criteriaId === 'klarheit') {
    lines.push('For unrelated_options: list the option IDs that are not acceptable clear answers to the question.');
  }
  return lines;
}

function baseTask(questionText) {
  return questionText
    .split('\n')
    .filter(line => line.trim())
    .find(line => !line.startsWith('Computer-evaluable ') &&
      !line.startsWith('For ') &&
      !line.startsWith('Return ONLY ') &&
      !line.startsWith('Required ') &&
      !line.startsWith('Answer schema ') &&
      !line.startsWith('Use booleans ') &&
      !line.startsWith('Use numbers '));
}

function rebuildQuestionText(row, expected) {
  const task = baseTask(row.question_text);
  return [
    `Computer-evaluable ${row.criteria_id} v2 task #${row.taskNumber}.`,
    task,
    ...extraInstructions(row.criteria_id),
    'Return ONLY one valid JSON object. No markdown, no explanation, no extra keys.',
    `Required keys in this exact set: ${JSON.stringify(Object.keys(expected))}.`,
    `Required types and allowed values: ${schemaLine(expected)}.`,
    `Answer schema to fill, not the solution: ${fillableSchema(expected)}.`,
    'Use booleans true/false, not strings like "yes" or "no", unless a string enum is explicitly specified.',
    'Use numbers as numbers. For percentages, follow the rounding instruction in the task.',
  ].join('\n');
}

const rows = db.prepare(`
  SELECT id, criteria_id, question_text, expected_answer_json
  FROM questions
  WHERE testset = 'ce_intermediate_v2_questions'
    AND computer_evaluable = 1
    AND evaluation_type = 'json_exact'
  ORDER BY id
`).all();

const byCriteria = new Map();
for (const row of rows) {
  const n = (byCriteria.get(row.criteria_id) || 0) + 1;
  byCriteria.set(row.criteria_id, n);
  row.taskNumber = n;
}

const update = db.prepare(`
  UPDATE questions
  SET question_text = ?, expected_answer_json = ?, answer_schema_json = ?
  WHERE id = ?
`);

const tx = db.transaction(() => {
  let changed = 0;
  for (const row of rows) {
    const expected = JSON.parse(row.expected_answer_json);
    if (row.id === 924) {
      expected.unrelated_options = ['B', 'C'];
    }
    const questionText = rebuildQuestionText(row, expected);
    const expectedJson = JSON.stringify(expected);
    const schemaJson = JSON.stringify(answerSchema(expected));
    update.run(questionText, expectedJson, schemaJson, row.id);
    changed += 1;
  }
  return changed;
});

console.log(JSON.stringify({ changed: tx() }, null, 2));

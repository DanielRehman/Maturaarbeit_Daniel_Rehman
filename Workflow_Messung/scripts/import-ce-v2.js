const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.resolve(__dirname, '../data/matura.db'));
const TESTSET = 'ce_intermediate_v2_questions';

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some(c => c.name === column)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
}

ensureColumn('questions', 'computer_evaluable', 'INTEGER DEFAULT 0');
ensureColumn('questions', 'expected_answer_json', 'TEXT');
ensureColumn('questions', 'answer_schema_json', 'TEXT');
ensureColumn('questions', 'evaluation_type', "TEXT DEFAULT 'llm_checkpoint'");

const sourceEnums = ['aviation_authority', 'textbook', 'government', 'operator', 'statistics_office', 'technical_reference', 'health_authority', 'financial_data_provider', 'original_study', 'history_textbook'];
const yesNoEnum = ['yes', 'no'];
const unknownEnums = ['known', 'unknown', 'probable'];

const criteriaSeeds = {
  richtigkeit: [
    { s: 'Claim: A shop gives 15 percent discount on 80 CHF. The final price is 68 CHF.', e: { claim_true: true, numeric_result: 68, error_count: 0 } },
    { s: 'Claim: A train travels 120 km in 1.5 hours. The average speed is 90 km/h.', e: { claim_true: false, numeric_result: 80, error_count: 1 } },
    { s: 'Claim: 7 times 8 equals 54.', e: { claim_true: false, numeric_result: 56, error_count: 1 } },
    { s: 'Claim: The mean of 6, 8, 10, and 12 is 9.', e: { claim_true: true, numeric_result: 9, error_count: 0 } },
    { s: 'Claim: 18 percent of 250 is 45.', e: { claim_true: true, numeric_result: 45, error_count: 0 } },
    { s: 'Claim: A 20 percent increase from 50 gives 55.', e: { claim_true: false, numeric_result: 60, error_count: 1 } },
    { s: 'Claim: In a leap year, February has 29 days.', e: { claim_true: true, numeric_result: 29, error_count: 0 } },
    { s: 'Claim: Water always boils at exactly 100 degrees Celsius, independent of air pressure.', e: { claim_true: false, numeric_result: 0, error_count: 1 } },
    { s: 'Claim: If all cats are mammals and Luna is a cat, Luna is a mammal.', e: { claim_true: true, numeric_result: 1, error_count: 0 } },
    { s: 'Claim: A square is always a rectangle, but a rectangle is not always a square.', e: { claim_true: true, numeric_result: 1, error_count: 0 } },
  ],
  vollstaendigkeit_frage: [
    { s: 'Extract exactly the requested fields. Text: Mara is 16. Requested fields: name and age.', e: { name: 'Mara', age: 16, all_requested_fields_present: true } },
    { s: 'Extract exactly the requested fields. Text: Basel is in Switzerland. Requested fields: city and country.', e: { city: 'Basel', country: 'Switzerland', all_requested_fields_present: true } },
    { s: 'Extract exactly the requested fields. Text: The box contains wood, glass, and metal. Requested fields: first_material and second_material.', e: { first_material: 'wood', second_material: 'glass', all_requested_fields_present: true } },
    { s: 'Extract exactly the requested fields. Text: Meeting 09:15 to 10:00. Requested fields: start_time and end_time.', e: { start_time: '09:15', end_time: '10:00', all_requested_fields_present: true } },
    { s: 'Extract exactly the requested fields. Text: Heavy rain caused flooding. Requested fields: cause and effect.', e: { cause: 'heavy rain', effect: 'flooding', all_requested_fields_present: true } },
    { s: 'Extract exactly the requested fields. Text: The fraction is 3/8. Requested fields: numerator and denominator.', e: { numerator: 3, denominator: 8, all_requested_fields_present: true } },
    { s: 'Extract exactly the requested fields. Text: Claim: 2+2=5. Verdict: false. Requested fields: claim and verdict_boolean.', e: { claim: '2+2=5', verdict_boolean: false, all_requested_fields_present: true } },
    { s: 'Extract exactly the requested fields. Text: Risks are heat and dehydration. Requested fields: risks array in the order mentioned.', e: { risks: ['heat', 'dehydration'], all_requested_fields_present: true } },
    { s: 'Extract exactly the requested fields. Text: German, B1. Requested fields: language and level.', e: { language: 'German', level: 'B1', all_requested_fields_present: true } },
    { s: 'Extract exactly the requested fields. Text: 3 liters of water. Requested fields: item, quantity, and unit.', e: { item: 'water', quantity: 3, unit: 'liters', all_requested_fields_present: true } },
  ],
  vollstaendigkeit_moeglichkeit: [
    { s: 'Planning check: exam in 10 days, 5 chapters, weak chapter is chapter 3. Return a feasible daily chapter count and the priority chapter.', e: { daily_chapters: 1, priority_chapter: 3, feasible: true } },
    { s: 'Budget check: budget 300 CHF, train 120, hotel 150, food 80. Decide if the plan is within budget and compute the overage.', e: { total_cost: 350, within_budget: false, over_by: 50 } },
    { s: 'Recipe scaling: 2 portions need 300 g pasta. Compute pasta grams for 5 portions.', e: { pasta_g: 750, scale_factor: 2.5, complete: true } },
    { s: 'Battery check: device uses 8 Wh per hour, battery has 40 Wh. Compute runtime and whether it is enough for 6 hours.', e: { runtime_hours: 5, enough_for_6h: false, short_by_hours: 1 } },
    { s: 'Classroom groups: 23 students, groups of 4. Compute full groups, leftover students, and whether an extra group is needed.', e: { full_groups: 5, leftover: 3, needs_extra_group: true } },
    { s: 'Savings: goal 500, already 140, save 45 per week. Compute remaining money and weeks needed rounded up to a whole week.', e: { remaining: 360, weeks_rounded_up: 8, exact_division: true } },
    { s: 'Reading plan: 180 pages in 6 days. Compute pages per day and whether all needed information is present.', e: { pages_per_day: 30, feasible: true, missing_info: false } },
    { s: 'CO2 comparison: bus 12 kg, car 36 kg. Compute saving choosing bus, reduction percent rounded to exactly 2 decimals, and better option.', e: { saving_kg: 24, reduction_percent: 66.67, better: 'bus' }, enums: { better: ['bus', 'car'] } },
    { s: 'Storage: files are 2 GB, 3 GB, and 4 GB. USB has 8 GB free. Compute total and whether files fit.', e: { total_gb: 9, fits: false, short_by_gb: 1 } },
    { s: 'Schedule: task A 25 min, task B 35 min, break 10 min. Compute total and how much it exceeds one hour.', e: { total_minutes: 70, over_one_hour: true, over_by_minutes: 10 } },
  ],
  pruefung_verifikation: [
    { s: 'Verify the claim: 9 * 6 = 54.', e: { claim_correct: true, check_method: 'multiplication', corrected_value: 54 }, enums: { check_method: ['multiplication', 'inverse', 'mean', 'addition', 'conversion', 'logic'] } },
    { s: 'Verify the claim: 144 / 12 = 11. Use inverse multiplication.', e: { claim_correct: false, check_method: 'inverse', corrected_value: 12 }, enums: { check_method: ['multiplication', 'inverse', 'mean', 'addition', 'conversion', 'logic'] } },
    { s: 'Verify the claim: list [4,4,4] has mean 4 and median 4.', e: { claim_correct: true, checks_passed: 2, corrected_value: 4 } },
    { s: 'Verify the claim: 30 percent of 200 is 50.', e: { claim_correct: false, checks_passed: 0, corrected_value: 60 } },
    { s: 'Verify the claim: 08:20 plus 45 minutes is 09:05.', e: { claim_correct: true, checks_passed: 1, corrected_value: '09:05' } },
    { s: 'Verify the claim: 2.5 km equals 250 m.', e: { claim_correct: false, checks_passed: 0, corrected_value: 2500 } },
    { s: 'Verify the logic: If A implies B and A is true, B follows.', e: { claim_correct: true, checks_passed: 1, corrected_value: 'B' } },
    { s: 'Verify the claim: 17 + 28 + 35 = 80.', e: { claim_correct: true, checks_passed: 1, corrected_value: 80 } },
    { s: 'Verify the claim: 10 percent of 90 is 9.', e: { claim_correct: true, checks_passed: 1, corrected_value: 9 } },
    { s: 'Verify the claim: the word "Matura" has 6 letters.', e: { claim_correct: true, checks_passed: 1, corrected_value: 6 } },
  ],
  unsicherheit: [
    { s: 'Alex studied "quite a lot"; no exam difficulty or past performance is given. Decide certainty and answer status.', e: { certain: false, answer_status: 'unknown', missing_info_count: 2 }, enums: { answer_status: unknownEnums } },
    { s: 'A medicine helped one person. Decide if it will surely help another person.', e: { certain: false, answer_status: 'unknown', missing_info_count: 3 }, enums: { answer_status: unknownEnums } },
    { s: 'A photo may show Zurich in 1900, but no source or metadata is given.', e: { certain: false, answer_status: 'unknown', missing_info_count: 2 }, enums: { answer_status: unknownEnums } },
    { s: 'A stock rumor says the price will rise, but no source or timeframe is given.', e: { certain: false, answer_status: 'unknown', missing_info_count: 2 }, enums: { answer_status: unknownEnums } },
    { s: 'An official weather forecast says rain tomorrow. Decide certainty and answer status.', e: { certain: false, answer_status: 'probable', missing_info_count: 1 }, enums: { answer_status: unknownEnums } },
    { s: 'A sealed coin is fair by definition. Give probability of heads on one toss.', e: { certain: true, answer_status: 'known', probability: 0.5 }, enums: { answer_status: unknownEnums } },
    { s: 'A student has stomach pain before school. Decide whether it is definitely anxiety.', e: { certain: false, answer_status: 'unknown', missing_info_count: 2 }, enums: { answer_status: unknownEnums } },
    { s: 'A product has many good reviews. Decide whether it is guaranteed good.', e: { certain: false, answer_status: 'unknown', missing_info_count: 2 }, enums: { answer_status: unknownEnums } },
    { s: 'A small study with 20 people finds an effect. Decide whether it proves the claim.', e: { certain: false, answer_status: 'unknown', missing_info_count: 2 }, enums: { answer_status: unknownEnums } },
    { s: 'A message claims to be from an authority, but no sender address or domain is shown.', e: { certain: false, answer_status: 'unknown', missing_info_count: 2 }, enums: { answer_status: unknownEnums } },
  ],
  rueckfragefaehigkeit: [
    { s: 'User asks: Plan my trip. Dates are given, but destination and budget are missing.', e: { followup_needed: true, missing_fields: ['destination', 'budget'], can_final_answer: false } },
    { s: 'User asks: Which phone should I buy? Budget and operating system preference are missing.', e: { followup_needed: true, missing_fields: ['budget', 'operating_system'], can_final_answer: false } },
    { s: 'User asks: Improve this text. No text is provided.', e: { followup_needed: true, missing_fields: ['text'], can_final_answer: false } },
    { s: 'User asks: Make a learning plan. Subject and exam date are missing.', e: { followup_needed: true, missing_fields: ['subject', 'exam_date'], can_final_answer: false } },
    { s: 'User asks: Calculate 18 percent of 250. All needed data is present.', e: { followup_needed: false, missing_fields: [], can_final_answer: true } },
    { s: 'User asks: Explain photosynthesis simply. All needed data is present.', e: { followup_needed: false, missing_fields: [], can_final_answer: true } },
    { s: 'User asks: Which insurance do I need? Country and personal situation are missing.', e: { followup_needed: true, missing_fields: ['country', 'situation'], can_final_answer: false } },
    { s: 'User asks: Write my application. Job and personal profile are missing.', e: { followup_needed: true, missing_fields: ['job', 'profile'], can_final_answer: false } },
    { s: 'User asks: Summarize this. No source text is provided.', e: { followup_needed: true, missing_fields: ['source_text'], can_final_answer: false } },
    { s: 'User asks: Explain DNA vs RNA. All needed data is present.', e: { followup_needed: false, missing_fields: [], can_final_answer: true } },
  ],
  internet_quellenqualitaet: [
    { s: 'Need current Swiss drone rules. Choose whether current information is needed, whether an official source is needed, and the best source category.', e: { current_needed: true, official_source_needed: true, best_source: 'aviation_authority' }, enums: { best_source: sourceEnums } },
    { s: 'Need a school definition of photosynthesis. Choose source category.', e: { current_needed: false, official_source_needed: false, best_source: 'textbook' }, enums: { best_source: sourceEnums } },
    { s: 'Need 2026 entry rules for Switzerland. Choose source category.', e: { current_needed: true, official_source_needed: true, best_source: 'government' }, enums: { best_source: sourceEnums } },
    { s: 'Need current train price Zurich to Geneva. Choose source category.', e: { current_needed: true, official_source_needed: true, best_source: 'operator' }, enums: { best_source: sourceEnums } },
    { s: 'Need latest unemployment rate Switzerland. Choose source category.', e: { current_needed: true, official_source_needed: true, best_source: 'statistics_office' }, enums: { best_source: sourceEnums } },
    { s: 'Need meaning of HTTP vs HTTPS. Choose source category.', e: { current_needed: false, official_source_needed: false, best_source: 'technical_reference' }, enums: { best_source: sourceEnums } },
    { s: 'Need current vaccine recommendation in Switzerland. Choose source category.', e: { current_needed: true, official_source_needed: true, best_source: 'health_authority' }, enums: { best_source: sourceEnums } },
    { s: 'Need current exchange rate CHF/EUR. Choose source category.', e: { current_needed: true, official_source_needed: false, best_source: 'financial_data_provider' }, enums: { best_source: sourceEnums } },
    { s: 'Need whether a media claim matches a scientific study. Choose source category.', e: { current_needed: true, official_source_needed: false, best_source: 'original_study' }, enums: { best_source: sourceEnums } },
    { s: 'Need historical causes of World War I for class. Choose source category.', e: { current_needed: false, official_source_needed: false, best_source: 'history_textbook' }, enums: { best_source: sourceEnums } },
  ],
  relevanz: [
    { s: 'Question: Why is sleep important for learning? Options: A memory, B concentration, C car engines. Select relevant IDs only.', e: { relevant_ids: ['A', 'B'], irrelevant_ids: ['C'], on_topic: true } },
    { s: 'Question: Compare e-books and printed books for learning. Options: A screen fatigue, B note taking, C bookshop rent. Select relevant IDs only.', e: { relevant_ids: ['A', 'B'], irrelevant_ids: ['C'], on_topic: true } },
    { s: 'Question: Explain bee pollination, not honey production. Options: A pollen transfer, B plant reproduction, C honey jars. Select relevant IDs only.', e: { relevant_ids: ['A', 'B'], irrelevant_ids: ['C'], on_topic: true } },
    { s: 'Question: Causes of stress in teenagers. Options: A steam engines, B school pressure, C social media. Select relevant IDs only in alphabetical order.', e: { relevant_ids: ['B', 'C'], irrelevant_ids: ['A'], on_topic: true } },
    { s: 'Question: Purpose of a table of contents in a paper. Options: A printer ink chemistry, B structure, C navigation. Select relevant IDs only in alphabetical order.', e: { relevant_ids: ['B', 'C'], irrelevant_ids: ['A'], on_topic: true } },
    { s: 'Question: Renewable vs non-renewable energy. Options: A replenishment, B shoe sizes, C fossil fuels. Select relevant IDs only in alphabetical order.', e: { relevant_ids: ['A', 'C'], irrelevant_ids: ['B'], on_topic: true } },
    { s: 'Question: Operating system task for beginners. Options: A manages hardware, B photosynthesis, C runs programs. Select relevant IDs only in alphabetical order.', e: { relevant_ids: ['A', 'C'], irrelevant_ids: ['B'], on_topic: true } },
    { s: 'Question: Source citation in Matura work. Options: A traceability, B plagiarism prevention, C cooking pasta. Select relevant IDs only.', e: { relevant_ids: ['A', 'B'], irrelevant_ids: ['C'], on_topic: true } },
    { s: 'Question: Plastic in the ocean. Options: A medieval castles, B pollution, C wildlife harm. Select relevant IDs only in alphabetical order.', e: { relevant_ids: ['B', 'C'], irrelevant_ids: ['A'], on_topic: true } },
    { s: 'Question: Democracy. Options: A elections, B battery voltage, C participation. Select relevant IDs only in alphabetical order.', e: { relevant_ids: ['A', 'C'], irrelevant_ids: ['B'], on_topic: true } },
  ],
  klarheit: [
    { s: 'Choose the clearest explanation for a 12-year-old. Options: A uses jargon, B says "A variable is a placeholder for a number", C is unrelated.', e: { best_option: 'B', simple_language: true, unrelated_options: ['C'] }, enums: { best_option: ['A', 'B', 'C'] } },
    { s: 'Choose the clearest sentence. Options: A "Photosynthesis makes food from light, water and CO2", B "Biochemical photonic conversion", C "Cars move".', e: { best_option: 'A', simple_language: true, unrelated_options: ['C'] }, enums: { best_option: ['A', 'B', 'C'] } },
    { s: 'Order explanation steps for a rainbow. Steps: A light enters drop, B light bends and splits, C colors reach eye.', e: { ordered_steps: ['A', 'B', 'C'], complete: true } },
    { s: 'Choose the simpler word for "utilize". Options: A use, B obfuscate, C terminate.', e: { best_option: 'A', simple_language: true, unrelated_options: ['B', 'C'] }, enums: { best_option: ['A', 'B', 'C'] } },
    { s: 'Choose the best definition of hypothesis. Options: A testable guess, B proven law, C random fact.', e: { best_option: 'A', simple_language: true, unrelated_options: ['C'] }, enums: { best_option: ['A', 'B', 'C'] } },
    { s: 'Order cause-effect explanation. Steps: A cause happens, B effect follows, C example illustrates.', e: { ordered_steps: ['A', 'B', 'C'], complete: true } },
    { s: 'Choose the clearest beginner algorithm sentence. Options: A step-by-step instructions, B transcendental procedure, C weather map.', e: { best_option: 'A', simple_language: true, unrelated_options: ['C'] }, enums: { best_option: ['A', 'B', 'C'] } },
    { s: 'Choose the clearest net vs gross sentence. Options: A gross before deductions, net after deductions, B gross is always a bigger animal, C net is internet.', e: { best_option: 'A', simple_language: true, unrelated_options: ['B', 'C'] }, enums: { best_option: ['A', 'B', 'C'] } },
    { s: 'Choose the sentence with one idea only. Options: A Metal feels cold because it conducts heat away fast, B long mixed paragraph about all materials and history, C unrelated.', e: { best_option: 'A', simple_language: true, unrelated_options: ['C'] }, enums: { best_option: ['A', 'B', 'C'] } },
    { s: 'Choose the best child-friendly ecosystem sentence. Options: A living things and environment interact, B ontological biospheric matrix, C stock prices change.', e: { best_option: 'A', simple_language: true, unrelated_options: ['C'] }, enums: { best_option: ['A', 'B', 'C'] } },
  ],
};

function schemaLine(expected, enums = {}) {
  return Object.entries(expected).map(([key, value]) => {
    if (enums[key]) return `${key}: string enum ${JSON.stringify(enums[key])}`;
    if (Array.isArray(value)) {
      const first = value[0];
      const type = first === undefined ? 'string' : typeof first;
      return `${key}: array of ${type}; preserve requested order`;
    }
    if (value === null) return `${key}: null`;
    return `${key}: ${typeof value}`;
  }).join('; ');
}

function valueType(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function answerSchema(expected, enums = {}) {
  const fields = {};
  for (const [key, value] of Object.entries(expected)) {
    const field = { type: valueType(value) };
    if (enums[key]) {
      field.allowed_values = enums[key];
    }
    if (Array.isArray(value)) {
      field.item_type = value.length ? valueType(value[0]) : 'string';
      if (field.item_type === 'string') {
        field.allowed_items = [...new Set(value)];
      }
    }
    fields[key] = field;
  }
  return { type: 'object', fields };
}

function schemaPlaceholder(value, enumValues) {
  if (enumValues) return `<one of ${enumValues.join('|')}>`;
  if (Array.isArray(value)) {
    const first = value[0];
    const type = first === undefined ? 'string' : typeof first;
    return `<array of ${type}>`;
  }
  if (value === null) return '<null>';
  return `<${typeof value}>`;
}

function fillableSchema(expected, enums = {}) {
  const schema = answerSchema(expected, enums);
  return Object.entries(schema.fields)
    .map(([key, field]) => {
      if (field.allowed_values) return `${key}=<one of ${field.allowed_values.join('|')}>`;
      if (field.allowed_items) return `${key}=<array using only ${field.allowed_items.join('|')}>`;
      return `${key}=${schemaPlaceholder(expected[key], enums[key])}`;
    })
    .join('; ');
}

function questionText(criteriaId, index, seed) {
  const expected = seed.e;
  const extraInstructions = [];
  if (criteriaId === 'richtigkeit') {
    extraInstructions.push('For numeric_result: use the computed numeric value for arithmetic claims. For non-arithmetic true/false claims, use 1 when the claim is true and 0 when the claim is false.');
  }
  if (criteriaId === 'pruefung_verifikation') {
    extraInstructions.push('For checks_passed: use 1 if the original claim/check passes and 0 if it fails. For corrected_value: return only the corrected value, number, time, or letter, not a sentence.');
  }
  if (criteriaId === 'internet_quellenqualitaet') {
    extraInstructions.push('For official_source_needed: true means a government/regulator/public-authority source is specifically required. Use false for commercial operators, financial data providers, original studies, textbooks, or technical references.');
  }
  if (criteriaId === 'klarheit') {
    extraInstructions.push('For unrelated_options: list the option IDs that are not acceptable clear answers to the question.');
  }
  return [
    `Computer-evaluable ${criteriaId} v2 task #${index}.`,
    seed.s,
    ...extraInstructions,
    'Return ONLY one valid JSON object. No markdown, no explanation, no extra keys.',
    `Required keys in this exact set: ${JSON.stringify(Object.keys(expected))}.`,
    `Required types and allowed values: ${schemaLine(expected, seed.enums || {})}.`,
    `Answer schema to fill, not the solution: ${fillableSchema(expected, seed.enums || {})}.`,
    'Use booleans true/false, not strings like "yes" or "no", unless a string enum is explicitly specified.',
    'Use numbers as numbers. For percentages, follow the rounding instruction in the task.',
  ].join('\n');
}

const existing = db.prepare('SELECT COUNT(*) as count FROM questions WHERE testset = ?').get(TESTSET).count;
if (existing > 0) {
  console.error(`Aborted: ${existing} questions already exist for ${TESTSET}.`);
  process.exit(1);
}

const insertQuestion = db.prepare(`
  INSERT INTO questions (
    criteria_id, setup_id, question_text, testset, notes, autoanswer,
    computer_evaluable, expected_answer_json, answer_schema_json, evaluation_type
  )
  VALUES (?, NULL, ?, ?, ?, 0, 1, ?, ?, 'json_exact')
`);

const insertCheckpoint = db.prepare('INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES (?, ?, ?)');

const tx = db.transaction(() => {
  db.prepare('INSERT OR IGNORE INTO testsets (id, name) VALUES (?, ?)').run(TESTSET, 'Computer evaluable v2 JSON set');
  let inserted = 0;
  for (const [criteriaId, seeds] of Object.entries(criteriaSeeds)) {
    if (seeds.length !== 10) throw new Error(`${criteriaId} must have exactly 10 questions.`);
    seeds.forEach((seed, idx) => {
      const expectedJson = JSON.stringify(seed.e);
      const schemaJson = JSON.stringify(answerSchema(seed.e, seed.enums || {}));
      const result = insertQuestion.run(
        criteriaId,
        questionText(criteriaId, idx + 1, seed),
        TESTSET,
        `${criteriaId} ce-intermediate-v2 json_exact #${idx + 1}; explicit schema/types/enums`,
        expectedJson,
        schemaJson,
      );
      const questionId = result.lastInsertRowid;
      insertCheckpoint.run(questionId, 'json:__valid_json Answer is valid JSON object', 0);
      Object.keys(seed.e).forEach((key, keyIndex) => {
        insertCheckpoint.run(questionId, `json:${key} Field ${key} exactly matches expected value`, keyIndex + 1);
      });
      insertCheckpoint.run(questionId, 'json:__no_extra_keys JSON contains exactly the expected keys and no extras', Object.keys(seed.e).length + 1);
      inserted += 1;
    });
  }
  return inserted;
});

const inserted = tx();
console.log(`Inserted ${inserted} computer-evaluable questions into ${TESTSET}.`);
console.table(db.prepare(`
  SELECT criteria_id, COUNT(*) as questions
  FROM questions
  WHERE testset = ?
  GROUP BY criteria_id
  ORDER BY criteria_id
`).all(TESTSET));

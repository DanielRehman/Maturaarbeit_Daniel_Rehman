const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.resolve(__dirname, '../data/matura.db'));
const TESTSET = 'ce_main_structured_questions';

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some(c => c.name === column)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
}

ensureColumn('questions', 'computer_evaluable', 'INTEGER DEFAULT 0');
ensureColumn('questions', 'expected_answer_json', 'TEXT');
ensureColumn('questions', 'evaluation_type', "TEXT DEFAULT 'llm_checkpoint'");

const criteriaSeeds = {
  richtigkeit: [
    ['A shop gives 15 percent discount on 80 CHF. Final price is 68 CHF.', { answer: 'yes', value: 68, error_count: 0 }],
    ['A train travels 120 km in 1.5 hours. Average speed is 90 km/h.', { answer: 'no', value: 80, error_count: 1 }],
    ['A square is always a rectangle, but a rectangle is not always a square.', { answer: 'yes', value: 1, error_count: 0 }],
    ['Water always boils at exactly 100 C, independent of air pressure.', { answer: 'no', value: 0, error_count: 1 }],
    ['7 times 8 equals 54.', { answer: 'no', value: 56, error_count: 1 }],
    ['The mean of 6, 8, 10, and 12 is 9.', { answer: 'yes', value: 9, error_count: 0 }],
    ['18 percent of 250 is 45.', { answer: 'yes', value: 45, error_count: 0 }],
    ['In a leap year February has 29 days.', { answer: 'yes', value: 29, error_count: 0 }],
    ['If all cats are mammals and Luna is a cat, Luna is a mammal.', { answer: 'yes', value: 1, error_count: 0 }],
    ['A 20 percent increase from 50 gives 55.', { answer: 'no', value: 60, error_count: 1 }],
  ],
  vollstaendigkeit_frage: [
    ['Task asks for name and age. Text: Mara is 16. Include exactly requested fields.', { name: 'Mara', age: 16, complete: 'yes' }],
    ['Task asks for city and country. Text: Basel is in Switzerland.', { city: 'Basel', country: 'Switzerland', complete: 'yes' }],
    ['Task asks for two materials. Text: The box contains wood, glass, and metal. Use first two mentioned.', { material_1: 'wood', material_2: 'glass', complete: 'yes' }],
    ['Task asks for start and end. Text: Meeting 09:15 to 10:00.', { start: '09:15', end: '10:00', complete: 'yes' }],
    ['Task asks for cause and effect. Text: Heavy rain caused flooding.', { cause: 'heavy rain', effect: 'flooding', complete: 'yes' }],
    ['Task asks for numerator and denominator. Text: The fraction is 3/8.', { numerator: 3, denominator: 8, complete: 'yes' }],
    ['Task asks for claim and verdict. Text: Claim: 2+2=5. Verdict: false.', { claim: '2+2=5', verdict: 'false', complete: 'yes' }],
    ['Task asks for two risks. Text: Risks are heat and dehydration.', { risk_1: 'heat', risk_2: 'dehydration', complete: 'yes' }],
    ['Task asks for language and level. Text: German, B1.', { language: 'German', level: 'B1', complete: 'yes' }],
    ['Task asks for item, quantity, unit. Text: 3 liters of water.', { item: 'water', quantity: 3, unit: 'liters', complete: 'yes' }],
  ],
  vollstaendigkeit_moeglichkeit: [
    ['Plan check: exam in 10 days, 5 chapters, weak chapter 3. Include feasible daily chapters and priority.', { daily_chapters: 1, priority: 'chapter 3', feasible: 'yes' }],
    ['Trip check: budget 300 CHF, train 120, hotel 150, food 80. Decide feasible.', { total_cost: 350, within_budget: 'no', over_by: 50 }],
    ['Recipe scale: 2 portions need 300 g pasta. Need 5 portions.', { pasta_g: 750, factor: 2.5, complete: 'yes' }],
    ['Battery check: device uses 8 Wh per hour, battery 40 Wh. Runtime.', { runtime_hours: 5, enough_for_6h: 'no', short_by_hours: 1 }],
    ['Classroom groups: 23 students, groups of 4. Compute full groups and leftover.', { full_groups: 5, leftover: 3, needs_extra_group: 'yes' }],
    ['Savings: goal 500, already 140, save 45 per week. Weeks needed rounded up.', { remaining: 360, weeks: 8, exact: 'yes' }],
    ['Reading plan: 180 pages in 6 days. Pages per day.', { pages_per_day: 30, feasible: 'yes', missing_info: 'no' }],
    ['CO2 comparison: bus 12 kg, car 36 kg. Savings choosing bus.', { saving_kg: 24, reduction_percent: 66.67, better: 'bus' }],
    ['Storage: files are 2 GB, 3 GB, 4 GB. USB has 8 GB free.', { total_gb: 9, fits: 'no', short_by_gb: 1 }],
    ['Schedule: task A 25 min, B 35 min, break 10 min. Total.', { total_minutes: 70, over_one_hour: 'yes', over_by_minutes: 10 }],
  ],
  pruefung_verifikation: [
    ['Verify claim: 9*6=54. Use multiplication check.', { claim_correct: 'yes', checked_by: 'multiplication', corrected_value: 54 }],
    ['Verify claim: 144/12=11. Use inverse multiplication.', { claim_correct: 'no', checked_by: 'inverse', corrected_value: 12 }],
    ['Verify data: list [4,4,4] has mean 4 and median 4.', { claim_correct: 'yes', checks_passed: 2, corrected_value: 4 }],
    ['Verify statement: 30 percent of 200 is 50.', { claim_correct: 'no', checks_passed: 0, corrected_value: 60 }],
    ['Verify schedule: 08:20 plus 45 minutes is 09:05.', { claim_correct: 'yes', checks_passed: 1, corrected_value: '09:05' }],
    ['Verify unit conversion: 2.5 km equals 250 m.', { claim_correct: 'no', checks_passed: 0, corrected_value: 2500 }],
    ['Verify logic: If A implies B and A is true, B follows.', { claim_correct: 'yes', checks_passed: 1, corrected_value: 'B' }],
    ['Verify sum: 17+28+35=80.', { claim_correct: 'yes', checks_passed: 1, corrected_value: 80 }],
    ['Verify percentage: 10 percent of 90 is 9.', { claim_correct: 'yes', checks_passed: 1, corrected_value: 9 }],
    ['Verify spelling count: word "Matura" has 6 letters.', { claim_correct: 'yes', checks_passed: 1, corrected_value: 6 }],
  ],
  unsicherheit: [
    ['Alex studied "quite a lot"; no exam difficulty or past performance given. Predict pass/fail responsibly.', { certain: 'no', answer: 'unknown', missing_info_count: 2 }],
    ['A medicine helped one person; decide if it will surely help another person.', { certain: 'no', answer: 'unknown', missing_info_count: 3 }],
    ['A photo may show Zurich in 1900; no source or metadata.', { certain: 'no', answer: 'unknown', missing_info_count: 2 }],
    ['A stock rumor says price will rise; no source or timeframe.', { certain: 'no', answer: 'unknown', missing_info_count: 2 }],
    ['A weather forecast says rain tomorrow from official service. Decide certainty.', { certain: 'no', answer: 'probable', missing_info_count: 1 }],
    ['A sealed coin is fair by definition. Probability of heads on one toss.', { certain: 'yes', answer: '0.5', missing_info_count: 0 }],
    ['A student has stomach pain before school; decide if it is definitely anxiety.', { certain: 'no', answer: 'unknown', missing_info_count: 2 }],
    ['A product has many good reviews; decide if it is guaranteed good.', { certain: 'no', answer: 'unknown', missing_info_count: 2 }],
    ['A small study with 20 people finds an effect; decide if it proves the claim.', { certain: 'no', answer: 'unknown', missing_info_count: 2 }],
    ['A message claims to be from an authority but no sender/domain is shown.', { certain: 'no', answer: 'unknown', missing_info_count: 2 }],
  ],
  rueckfragefaehigkeit: [
    ['User asks: Plan my trip. Missing destination and budget; dates are given. Decide whether follow-up is needed.', { ask_followup: 'yes', missing_fields: ['destination', 'budget'], can_final_answer: 'no' }],
    ['User asks: Which phone should I buy? Budget and operating system missing.', { ask_followup: 'yes', missing_fields: ['budget', 'operating_system'], can_final_answer: 'no' }],
    ['User asks: Improve this text. No text is provided.', { ask_followup: 'yes', missing_fields: ['text'], can_final_answer: 'no' }],
    ['User asks: Make a learning plan. Subject and exam date missing.', { ask_followup: 'yes', missing_fields: ['subject', 'exam_date'], can_final_answer: 'no' }],
    ['User asks: Calculate 18 percent of 250. All needed data is present.', { ask_followup: 'no', missing_fields: [], can_final_answer: 'yes' }],
    ['User asks: Explain photosynthesis simply. All needed data is present.', { ask_followup: 'no', missing_fields: [], can_final_answer: 'yes' }],
    ['User asks: Which insurance do I need? Country and situation missing.', { ask_followup: 'yes', missing_fields: ['country', 'situation'], can_final_answer: 'no' }],
    ['User asks: Write my application. Job and personal profile missing.', { ask_followup: 'yes', missing_fields: ['job', 'profile'], can_final_answer: 'no' }],
    ['User asks: Summarize this. No source text is provided.', { ask_followup: 'yes', missing_fields: ['source_text'], can_final_answer: 'no' }],
    ['User asks: Explain DNA vs RNA. All needed data is present.', { ask_followup: 'no', missing_fields: [], can_final_answer: 'yes' }],
  ],
  internet_quellenqualitaet: [
    ['Need current Swiss drone rules. Choose source type and whether current info is required.', { current_needed: 'yes', official_source_needed: 'yes', best_source: 'aviation_authority' }],
    ['Need definition of photosynthesis for school. Choose source type.', { current_needed: 'no', official_source_needed: 'no', best_source: 'textbook' }],
    ['Need 2026 entry rules for Switzerland. Choose source type.', { current_needed: 'yes', official_source_needed: 'yes', best_source: 'government' }],
    ['Need current train price Zurich to Geneva. Choose source type.', { current_needed: 'yes', official_source_needed: 'yes', best_source: 'operator' }],
    ['Need latest unemployment rate Switzerland. Choose source type.', { current_needed: 'yes', official_source_needed: 'yes', best_source: 'statistics_office' }],
    ['Need meaning of HTTP vs HTTPS. Choose source type.', { current_needed: 'no', official_source_needed: 'no', best_source: 'technical_reference' }],
    ['Need current vaccine recommendation in Switzerland. Choose source type.', { current_needed: 'yes', official_source_needed: 'yes', best_source: 'health_authority' }],
    ['Need current exchange rate CHF EUR. Choose source type.', { current_needed: 'yes', official_source_needed: 'no', best_source: 'financial_data_provider' }],
    ['Need whether a media claim matches a scientific study. Choose source type.', { current_needed: 'yes', official_source_needed: 'no', best_source: 'original_study' }],
    ['Need historical causes of World War I for class. Choose source type.', { current_needed: 'no', official_source_needed: 'no', best_source: 'history_textbook' }],
  ],
  relevanz: [
    ['Question: Why is sleep important for learning? Candidate topics: A memory, B concentration, C car engines. Return relevant IDs only.', { relevant_ids: ['A', 'B'], irrelevant_count: 1, on_topic: 'yes' }],
    ['Question: Compare e-books and printed books for learning. Topics: A screen fatigue, B note taking, C bookshop rent.', { relevant_ids: ['A', 'B'], irrelevant_count: 1, on_topic: 'yes' }],
    ['Question: Explain bee pollination, not honey production. Topics: A pollen transfer, B plant reproduction, C honey jars.', { relevant_ids: ['A', 'B'], irrelevant_count: 1, on_topic: 'yes' }],
    ['Question: Causes of stress in teenagers. Topics: A school pressure, B social media, C steam engines.', { relevant_ids: ['A', 'B'], irrelevant_count: 1, on_topic: 'yes' }],
    ['Question: Purpose of table of contents in a paper. Topics: A structure, B navigation, C printer ink chemistry.', { relevant_ids: ['A', 'B'], irrelevant_count: 1, on_topic: 'yes' }],
    ['Question: Renewable vs non-renewable energy. Topics: A replenishment, B fossil fuels, C shoe sizes.', { relevant_ids: ['A', 'B'], irrelevant_count: 1, on_topic: 'yes' }],
    ['Question: Operating system task for beginners. Topics: A manages hardware, B runs programs, C photosynthesis.', { relevant_ids: ['A', 'B'], irrelevant_count: 1, on_topic: 'yes' }],
    ['Question: Source citation in Matura work. Topics: A traceability, B plagiarism prevention, C cooking pasta.', { relevant_ids: ['A', 'B'], irrelevant_count: 1, on_topic: 'yes' }],
    ['Question: Plastic in the ocean. Topics: A pollution, B wildlife harm, C medieval castles.', { relevant_ids: ['A', 'B'], irrelevant_count: 1, on_topic: 'yes' }],
    ['Question: Democracy. Topics: A elections, B participation, C battery voltage.', { relevant_ids: ['A', 'B'], irrelevant_count: 1, on_topic: 'yes' }],
  ],
  klarheit: [
    ['Choose the clearest explanation for a 12-year-old: A uses jargon, B says "A variable is a placeholder for a number", C is unrelated.', { best_option: 'B', jargon_count: 0, clear: 'yes' }],
    ['Choose the clearest sentence: A "Photosynthesis makes food from light, water and CO2", B "Biochemical photonic conversion", C "Cars move".', { best_option: 'A', jargon_count: 0, clear: 'yes' }],
    ['Order explanation steps for rainbow: A light enters drop, B light bends/splits, C colors reach eye.', { first: 'A', second: 'B', third: 'C' }],
    ['Choose simpler word: "utilize" -> A use, B obfuscate, C terminate.', { best_option: 'A', jargon_count: 0, clear: 'yes' }],
    ['Choose best definition: hypothesis. A testable guess, B proven law, C random fact.', { best_option: 'A', jargon_count: 0, clear: 'yes' }],
    ['Order cause-effect explanation: A cause happens, B effect follows, C example illustrates.', { first: 'A', second: 'B', third: 'C' }],
    ['Choose clearest beginner algorithm sentence: A step-by-step instructions, B transcendental procedure, C weather map.', { best_option: 'A', jargon_count: 0, clear: 'yes' }],
    ['Choose clearest net vs gross sentence: A gross before deductions, net after deductions, B gross is always bigger animal, C net is internet.', { best_option: 'A', jargon_count: 0, clear: 'yes' }],
    ['Choose sentence with one idea only: A "Metal feels cold because it conducts heat away fast", B long mixed paragraph about all materials and history, C unrelated.', { best_option: 'A', jargon_count: 0, clear: 'yes' }],
    ['Choose best child-friendly ecosystem sentence: A living things and environment interact, B ontological biospheric matrix, C stock prices change.', { best_option: 'A', jargon_count: 0, clear: 'yes' }],
  ],
};

function questionText(criteriaId, index, scenario, expected) {
  return [
    `Computer-evaluable ${criteriaId} task #${index}.`,
    `Consider these facts: ${scenario}`,
    'Return ONLY valid JSON. No markdown, no explanation, no extra keys.',
    `The JSON keys must be exactly: ${JSON.stringify(Object.keys(expected))}.`,
    'Use strings, numbers, booleans/arrays exactly as required by the facts.',
  ].join('\n');
}

const existing = db.prepare('SELECT COUNT(*) as count FROM questions WHERE testset = ?').get(TESTSET).count;
if (existing > 0) {
  console.error(`Aborted: ${existing} questions already exist for ${TESTSET}.`);
  process.exit(1);
}

const insertQuestion = db.prepare(`
  INSERT INTO questions (
    criteria_id,
    setup_id,
    question_text,
    testset,
    notes,
    autoanswer,
    computer_evaluable,
    expected_answer_json,
    evaluation_type
  )
  VALUES (?, NULL, ?, ?, ?, 0, 1, ?, 'json_exact')
`);

const insertCheckpoint = db.prepare('INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES (?, ?, ?)');

const tx = db.transaction(() => {
  db.prepare('INSERT OR IGNORE INTO testsets (id, name) VALUES (?, ?)').run(TESTSET, 'Computer evaluable main JSON set');

  let inserted = 0;
  for (const [criteriaId, seeds] of Object.entries(criteriaSeeds)) {
    if (seeds.length !== 10) throw new Error(`${criteriaId} must have exactly 10 questions.`);
    seeds.forEach(([scenario, expected], idx) => {
      const expectedJson = JSON.stringify(expected);
      const result = insertQuestion.run(
        criteriaId,
        questionText(criteriaId, idx + 1, scenario, expected),
        TESTSET,
        `${criteriaId} computer-evaluable json_exact #${idx + 1}; usable with Direct, Flowreview, Flowmap, and Prompt-Optimierung`,
        expectedJson,
      );
      const questionId = result.lastInsertRowid;
      insertCheckpoint.run(questionId, 'json:__valid_json Answer is valid JSON object', 0);
      Object.keys(expected).forEach((key, keyIndex) => {
        insertCheckpoint.run(questionId, `json:${key} Field ${key} exactly matches expected value`, keyIndex + 1);
      });
      insertCheckpoint.run(questionId, 'json:__no_extra_keys JSON contains exactly the expected keys and no extras', Object.keys(expected).length + 1);
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

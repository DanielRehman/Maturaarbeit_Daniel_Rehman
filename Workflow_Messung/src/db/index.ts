import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'matura.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS llm_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    provider TEXT NOT NULL,
    model_id TEXT NOT NULL,
    base_url TEXT,
    api_key_env TEXT NOT NULL,
    supports_native_search INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS setups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    max_steps INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS setup_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setup_id TEXT NOT NULL,
    step INTEGER NOT NULL,
    internet_allowed INTEGER DEFAULT 1,
    UNIQUE(setup_id, step),
    FOREIGN KEY(setup_id) REFERENCES setups(id)
  );

  CREATE TABLE IF NOT EXISTS system_prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setup_id TEXT NOT NULL,
    step INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    UNIQUE(setup_id, step),
    FOREIGN KEY(setup_id) REFERENCES setups(id)
  );

  CREATE TABLE IF NOT EXISTS criteria (
    id TEXT PRIMARY KEY,
    name_de TEXT NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS testsets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS run_sets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    criteria_id TEXT NOT NULL,
    setup_id TEXT,
    question_text TEXT NOT NULL,
    testset TEXT DEFAULT 'basic_general_questions',
    notes TEXT,
    autoanswer INTEGER DEFAULT 1,
    FOREIGN KEY(criteria_id) REFERENCES criteria(id),
    FOREIGN KEY(setup_id) REFERENCES setups(id)
  );

  CREATE TABLE IF NOT EXISTS checkpoints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    item_text TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY(question_id) REFERENCES questions(id)
  );

  CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setup_id TEXT NOT NULL,
    llm_config_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    testset TEXT,
    run_set_id TEXT,
    run_nr INTEGER,
    comparison_group_id TEXT,
    status TEXT DEFAULT 'pending',
    exclude_from_analysis INTEGER DEFAULT 0,
    exclude_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(setup_id) REFERENCES setups(id),
    FOREIGN KEY(llm_config_id) REFERENCES llm_configs(id),
    FOREIGN KEY(question_id) REFERENCES questions(id),
    FOREIGN KEY(run_set_id) REFERENCES run_sets(id)
  );

  CREATE TABLE IF NOT EXISTS run_pairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    direct_run_id INTEGER NOT NULL,
    workflow_run_id INTEGER NOT NULL UNIQUE,
    run_set_id TEXT,
    comparison_group_id TEXT,
    run_nr INTEGER,
    pair_source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(direct_run_id, workflow_run_id),
    FOREIGN KEY(direct_run_id) REFERENCES runs(id),
    FOREIGN KEY(workflow_run_id) REFERENCES runs(id),
    FOREIGN KEY(run_set_id) REFERENCES run_sets(id)
  );

  CREATE TABLE IF NOT EXISTS run_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL,
    step INTEGER NOT NULL,
    formal_step INTEGER,
    internet_allowed INTEGER,
    system_prompt_used TEXT,
    messages_json TEXT,
    response_text TEXT,
    search_queries_json TEXT,
    search_results_json TEXT,
    final_answer TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(run_id) REFERENCES runs(id)
  );

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER UNIQUE NOT NULL,
    scoring_model TEXT,
    score_percent REAL,
    total_checkpoints INTEGER,
    passed_checkpoints INTEGER,
    report TEXT,
    review_required INTEGER DEFAULT 0,
    review_reason TEXT,
    scored_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(run_id) REFERENCES runs(id)
  );

  CREATE TABLE IF NOT EXISTS checkpoint_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    score_id INTEGER NOT NULL,
    checkpoint_id INTEGER NOT NULL,
    passed INTEGER,
    explanation TEXT,
    FOREIGN KEY(score_id) REFERENCES scores(id),
    FOREIGN KEY(checkpoint_id) REFERENCES checkpoints(id)
  );

  CREATE TABLE IF NOT EXISTS score_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_score_id INTEGER NOT NULL,
    run_id INTEGER NOT NULL,
    scoring_model TEXT,
    score_percent REAL,
    total_checkpoints INTEGER,
    passed_checkpoints INTEGER,
    report TEXT,
    review_required INTEGER DEFAULT 0,
    review_reason TEXT,
    scored_at DATETIME,
    created_at DATETIME,
    archived_reason TEXT,
    archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS checkpoint_results_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    score_history_id INTEGER NOT NULL,
    original_checkpoint_result_id INTEGER,
    checkpoint_id INTEGER NOT NULL,
    passed INTEGER,
    explanation TEXT,
    FOREIGN KEY(score_history_id) REFERENCES score_history(id),
    FOREIGN KEY(checkpoint_id) REFERENCES checkpoints(id)
  );

  CREATE TABLE IF NOT EXISTS run_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_run_id INTEGER NOT NULL,
    setup_id TEXT,
    llm_config_id INTEGER,
    question_id INTEGER,
    testset TEXT,
    run_set_id TEXT,
    run_nr INTEGER,
    comparison_group_id TEXT,
    status TEXT,
    score_percent REAL,
    archived_reason TEXT,
    run_json TEXT NOT NULL,
    steps_json TEXT NOT NULL,
    score_json TEXT,
    checkpoint_results_json TEXT,
    archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

function ensureColumn(table: string, column: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some(c => c.name === column)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
}

ensureColumn('runs', 'exclude_from_analysis', 'INTEGER DEFAULT 0');
ensureColumn('runs', 'exclude_reason', 'TEXT');
ensureColumn('runs', 'run_set_id', "TEXT DEFAULT 'legacy_existing_import'");
ensureColumn('questions', 'autoanswer', 'INTEGER DEFAULT 1');
ensureColumn('questions', 'computer_evaluable', 'INTEGER DEFAULT 0');
ensureColumn('questions', 'expected_answer_json', 'TEXT');
ensureColumn('questions', 'answer_schema_json', 'TEXT');
ensureColumn('questions', 'evaluation_type', "TEXT DEFAULT 'llm_checkpoint'");
ensureColumn('run_steps', 'formal_step', 'INTEGER');
ensureColumn('scores', 'review_required', 'INTEGER DEFAULT 0');
ensureColumn('scores', 'review_reason', 'TEXT');
ensureColumn('scores', 'scored_at', 'DATETIME');
ensureColumn('run_history', 'setup_id', 'TEXT');
ensureColumn('run_history', 'llm_config_id', 'INTEGER');
ensureColumn('run_history', 'question_id', 'INTEGER');
ensureColumn('run_history', 'testset', 'TEXT');
ensureColumn('run_history', 'run_set_id', 'TEXT');
ensureColumn('run_history', 'run_nr', 'INTEGER');
ensureColumn('run_history', 'comparison_group_id', 'TEXT');
ensureColumn('run_history', 'status', 'TEXT');
ensureColumn('run_history', 'score_percent', 'REAL');
db.prepare("UPDATE scores SET scored_at = COALESCE(scored_at, created_at, CURRENT_TIMESTAMP)").run();

function syncKnownRunSets(): void {
  const insert = db.prepare('INSERT OR IGNORE INTO run_sets (id, name) VALUES (?, ?)');
  insert.run('legacy_existing_import', 'Bestandsdaten | vor Strukturierung importiert');

  db.prepare(`
    UPDATE runs
    SET run_set_id = 'legacy_existing_import'
    WHERE run_set_id IS NULL OR TRIM(run_set_id) = ''
  `).run();

  const known = db.prepare(`
    SELECT DISTINCT run_set_id
    FROM runs
    WHERE run_set_id IS NOT NULL AND TRIM(run_set_id) != ''
    ORDER BY run_set_id
  `).all() as Array<{ run_set_id: string }>;

  for (const row of known) {
    insert.run(row.run_set_id, row.run_set_id);
  }
}

function syncKnownTestsets(): void {
  const insert = db.prepare('INSERT OR IGNORE INTO testsets (id, name) VALUES (?, ?)');
  insert.run('basic_general_questions', 'Basis-Fragenset');

  const known = db.prepare(`
    SELECT DISTINCT testset
    FROM (
      SELECT testset FROM questions WHERE testset IS NOT NULL AND TRIM(testset) != ''
      UNION
      SELECT testset FROM runs WHERE testset IS NOT NULL AND TRIM(testset) != ''
    )
    ORDER BY testset
  `).all() as Array<{ testset: string }>;

  for (const row of known) {
    insert.run(row.testset, row.testset);
  }
}

function syncDefaultSetups(): void {
  const insertSetup = db.prepare('INSERT OR IGNORE INTO setups (id, name, description, max_steps) VALUES (?, ?, ?, ?)');
  const insertStep = db.prepare('INSERT OR IGNORE INTO setup_steps (setup_id, step, internet_allowed) VALUES (?, ?, ?)');
  const insertPrompt = db.prepare('INSERT OR IGNORE INTO system_prompts (setup_id, step, prompt) VALUES (?, ?, ?)');

  insertSetup.run('setup_direct', 'A - Direkt', 'Einzelner direkter Aufruf', 1);
  insertStep.run('setup_direct', 1, 1);
  insertPrompt.run('setup_direct', 1, 'Answer the question.');

  insertSetup.run('setup_wf_revision', 'B - Revision', 'Zweistufig: Antwort + Ueberarbeitung', 2);
  insertStep.run('setup_wf_revision', 1, 1);
  insertStep.run('setup_wf_revision', 2, 1);
  insertPrompt.run('setup_wf_revision', 1, 'Answer the question.');
  insertPrompt.run('setup_wf_revision', 2, 'You are in step 2 of a revision workflow. Critically review the previous answer and improve it: fix errors, fill gaps, improve clarity and completeness.');

  insertSetup.run('setup_wf_prompt_optimise', 'C - Prompt-Optimierung', 'Zweistufig: Prompt optimieren + ausfuehren', 2);
  insertStep.run('setup_wf_prompt_optimise', 1, 0);
  insertStep.run('setup_wf_prompt_optimise', 2, 1);
  insertPrompt.run('setup_wf_prompt_optimise', 1, 'Your only task is to rewrite the given question as a better, clearer, more specific prompt. Return only the improved prompt text in the answer field - nothing else.');
  insertPrompt.run('setup_wf_prompt_optimise', 2, 'Answer the question.');

  insertSetup.run('setup_flowmap', 'Flowmap', 'Dreistufig: Themenliste + Recherche + finale Antwort', 3);
  insertStep.run('setup_flowmap', 1, 0);
  insertStep.run('setup_flowmap', 2, 1);
  insertStep.run('setup_flowmap', 3, 0);
  insertPrompt.run('setup_flowmap', 1, 'Create internal preparation only: list themes, subtopics, constraints, and missing aspects relevant for solving the original user question. Do not answer the question yet. This step is not the final user answer.');
  insertPrompt.run('setup_flowmap', 2, 'Use the previous topic map as internal notes. Research or reason through each relevant topic. Use internet search for current information, best wording, news, rules, or sources when useful. Produce a concise preparation summary for the final answer step. Do not output the final user answer yet.');
  insertPrompt.run('setup_flowmap', 3, 'Write the final user-facing answer to the original user question. Use the topic map and preparation summary only as notes. Do not output a topic map, planning list, research summary, review report, or JSON object unless the original question explicitly asks for that format. Follow the original requested format, target group, limits, and constraints.');

  insertSetup.run('setup_flowreview', 'Flowreview', 'Zweistufig: direkte Antwort + Pruefung/Verbesserung', 2);
  insertStep.run('setup_flowreview', 1, 1);
  insertStep.run('setup_flowreview', 2, 1);
  insertPrompt.run('setup_flowreview', 1, 'Answer the question.');
  insertPrompt.run('setup_flowreview', 2, 'Review the original user input and your previous output internally. Check correctness, completeness, constraints, format, uncertainty, and relevance. Use internet search if useful. Then return only the improved final user-facing answer. Do not output a review report, checklist, critique, planning text, or JSON object unless the original question explicitly asks for that format. Preserve correct content and only change what should be improved.');

  insertSetup.run('setup_flowreview2', 'PICK_Flowreview2', 'Dreistufig: direkte Antwort + Verbesserung + Auswahl der besseren Antwort', 3);
  insertStep.run('setup_flowreview2', 1, 1);
  insertStep.run('setup_flowreview2', 2, 1);
  insertStep.run('setup_flowreview2', 3, 0);
  insertPrompt.run('setup_flowreview2', 1, 'Answer the question.');
  insertPrompt.run('setup_flowreview2', 2, 'Review the original user input and your previous output internally. Check correctness, completeness, constraints, format, uncertainty, and relevance. Use internet search if useful. Then return only the improved final user-facing answer. Do not output a review report, checklist, critique, planning text, or JSON object unless the original question explicitly asks for that format. Preserve correct content and only change what should be improved.');
  insertPrompt.run('setup_flowreview2', 3, 'Compare the first direct answer and the reviewed/improved answer against the original user question. Decide which one has better overall quality: correctness, completeness, format adherence, relevance, clarity, uncertainty handling, and source use when relevant. Return only the better final user-facing answer in the answer field. Do not explain your choice. Do not merge the answers unless the merged text is already clearly the better final answer. In the answer field, do not output a review report, comparison table, checklist, critique, planning text, or JSON object unless the original question explicitly asks for that format.');

  insertSetup.run('setup_flowreview_same', 'SS_PICK_FlowreviewSame', 'Dreistufig: Direct-Antwort kopieren + Verbesserung + Auswahl der besseren Antwort', 3);
  insertStep.run('setup_flowreview_same', 1, 0);
  insertStep.run('setup_flowreview_same', 2, 1);
  insertStep.run('setup_flowreview_same', 3, 0);
  insertPrompt.run('setup_flowreview_same', 1, 'Copy the matching Direct answer as step 1. This step is executed by the engine and does not call the model.');
  insertPrompt.run('setup_flowreview_same', 2, 'Review the original user input and your previous output internally. Check correctness, completeness, constraints, format, uncertainty, and relevance. Use internet search if useful. Then return only the improved final user-facing answer. Do not output a review report, checklist, critique, planning text, or JSON object unless the original question explicitly asks for that format. Preserve correct content and only change what should be improved.');
  insertPrompt.run('setup_flowreview_same', 3, 'Compare the copied Direct answer and the reviewed/improved answer against the original user question. Decide which one has better overall quality: correctness, completeness, format adherence, relevance, clarity, uncertainty handling, and source use when relevant. Return only the better final user-facing answer in the answer field. Do not explain your choice. Do not merge the answers unless the merged text is already clearly the better final answer. In the answer field, do not output a review report, comparison table, checklist, critique, planning text, or JSON object unless the original question explicitly asks for that format.');

  const ceJsonRule = 'This is a computer-evaluable JSON task. Return ONLY the final JSON object requested by the user. No markdown, no code fence, no explanation, no extra keys.';
  insertSetup.run('setup_ce_direct', 'CE_Direkt', 'Computer-evaluable direct JSON run', 1);
  insertStep.run('setup_ce_direct', 1, 1);
  insertPrompt.run('setup_ce_direct', 1, `Solve the task exactly. ${ceJsonRule}`);

  insertSetup.run('setup_ce_promptoptimise', 'CE_Prompt-Optimierung', 'Computer-evaluable prompt optimisation JSON workflow', 2);
  insertStep.run('setup_ce_promptoptimise', 1, 0);
  insertStep.run('setup_ce_promptoptimise', 2, 0);
  insertPrompt.run('setup_ce_promptoptimise', 1, 'Rewrite the user task as a precise JSON-answering prompt. Preserve every fact, rule, option, required key, value type, and constraint. Do not solve the task. Return only the improved prompt text.');
  insertPrompt.run('setup_ce_promptoptimise', 2, `Answer the optimized prompt. ${ceJsonRule}`);

  insertSetup.run('setup_ce_flowmap', 'CE_Flowmap', 'Computer-evaluable planning JSON workflow', 3);
  insertStep.run('setup_ce_flowmap', 1, 0);
  insertStep.run('setup_ce_flowmap', 2, 0);
  insertStep.run('setup_ce_flowmap', 3, 0);
  insertPrompt.run('setup_ce_flowmap', 1, 'Create concise internal notes for solving the JSON task: facts, rules, required keys, calculations, and possible traps. Do not output the final JSON yet.');
  insertPrompt.run('setup_ce_flowmap', 2, 'Use the previous notes to compute the exact values for every required JSON field. Keep this as preparation only. Do not output the final JSON yet.');
  insertPrompt.run('setup_ce_flowmap', 3, `Write the final answer to the original user task. ${ceJsonRule}`);

  insertSetup.run('setup_ce_reason_flowmap', 'CE_REASON_Flowmap', 'Computer-evaluable 3-step JSON workflow with one unscored ai_reasoning field', 3);
  insertStep.run('setup_ce_reason_flowmap', 1, 0);
  insertStep.run('setup_ce_reason_flowmap', 2, 0);
  insertStep.run('setup_ce_reason_flowmap', 3, 0);
  insertPrompt.run('setup_ce_reason_flowmap', 1, 'Create a working JSON draft for the original task. Include every required answer field you can determine. Add exactly one required workflow metadata field named ai_reasoning containing a concise explanation of how you derived the answer fields: evidence, calculations, applied rules, and uncertainty if relevant. ai_reasoning is context for later steps and is not scored. Return only one JSON object. No markdown.');
  insertPrompt.run('setup_ce_reason_flowmap', 2, 'You are the second AI checker. The previous JSON contains answer fields plus ai_reasoning written by another AI. Treat ai_reasoning as working notes, not as guaranteed truth. Check the quality of the answer fields against the original task. Do not fully rewrite. Only fix a field when you find a severe concrete error, missing required value, wrong type, wrong option, wrong calculation, or clear quality issue. If the answer fields are acceptable, keep them unchanged. Return one JSON object with the required answer fields plus ai_reasoning explaining what you checked and any fixes. No markdown.');
  insertPrompt.run('setup_ce_reason_flowmap', 3, 'Prepare the final computer-evaluable JSON from the checked draft. Preserve the checked answer fields unless there is an obvious formatting/type issue. Keep ai_reasoning as concise reasoning context. Do not solve from scratch. Do not add any other keys. Return only one JSON object. No markdown, no explanation outside JSON.');

  insertSetup.run('setup_ce_reason_pick_flowmap', 'CE_REASON_PICK_Flowmap', 'Computer-evaluable reasoning workflow with an AI pick-best-of-two final step', 4);
  insertStep.run('setup_ce_reason_pick_flowmap', 1, 0);
  insertStep.run('setup_ce_reason_pick_flowmap', 2, 0);
  insertStep.run('setup_ce_reason_pick_flowmap', 3, 0);
  insertStep.run('setup_ce_reason_pick_flowmap', 4, 0);
  insertPrompt.run('setup_ce_reason_pick_flowmap', 1, 'Create a working JSON draft for the original task. Include every required answer field you can determine. Add exactly one required workflow metadata field named ai_reasoning containing a concise explanation of how you derived the answer fields: evidence, calculations, applied rules, and uncertainty if relevant. ai_reasoning is context for later steps and is not scored. Return only one JSON object. No markdown.');
  insertPrompt.run('setup_ce_reason_pick_flowmap', 2, 'You are the second AI checker. The previous JSON contains answer fields plus ai_reasoning written by another AI. Treat ai_reasoning as working notes, not as guaranteed truth. Check the quality of the answer fields against the original task. Do not fully rewrite. Only fix a field when you find a severe concrete error, missing required value, wrong type, wrong option, wrong calculation, or clear quality issue. If the answer fields are acceptable, keep them unchanged. Return one JSON object with the required answer fields plus ai_reasoning explaining what you checked and any fixes. No markdown.');
  insertPrompt.run('setup_ce_reason_pick_flowmap', 3, 'Prepare a checked final candidate JSON from the previous draft. Preserve the checked answer fields unless there is an obvious formatting/type issue. Keep ai_reasoning as concise reasoning context. Do not solve from scratch. Do not add any other keys. Return only one JSON object. No markdown, no explanation outside JSON.');
  insertPrompt.run('setup_ce_reason_pick_flowmap', 4, 'You are the PICK step. You receive the original task plus two named candidate JSON answers, both including ai_reasoning. You do not know the true solution and must not pretend to. Pick exactly one candidate as final; do not merge unless one candidate is clearly only a formatting/type repair of the other. Decision priority: 1. Correctness first. Never pick nicer wording if it is less correct. 2. Candidate A is the default. Keep Candidate A when uncertain or when Candidate B is only different/nicer but not materially better. 3. Pick Candidate B only if it clearly fixes an important, concrete, evidence-backed problem. 4. Penalize new claims or changed values not supported by prompt/context. 5. Penalize removed constraints, removed required fields, or lost details. 6. Then compare completeness. 7. Then compare clarity/style. 8. Prefer the shorter answer if quality is equal. 9. If both have different issues, choose the one with fewer correctness risks. Return one JSON object with the selected candidate answer fields plus ai_reasoning, picked_candidate ("A" or "B"), and pick_checklist. pick_checklist must list the priority checks used for the decision. These metadata fields are not scored. No markdown, no explanation outside JSON.');

  insertSetup.run('setup_ce_reason_pick_iso_flowmap', 'CE_REASON_PICK_ISO_Flowmap', 'Computer-evaluable reasoning workflow with isolated pick step: no history/reasoning, different picker model via env', 4);
  insertStep.run('setup_ce_reason_pick_iso_flowmap', 1, 0);
  insertStep.run('setup_ce_reason_pick_iso_flowmap', 2, 0);
  insertStep.run('setup_ce_reason_pick_iso_flowmap', 3, 0);
  insertStep.run('setup_ce_reason_pick_iso_flowmap', 4, 0);
  insertPrompt.run('setup_ce_reason_pick_iso_flowmap', 1, 'Create a working JSON draft for the original task. Include every required answer field you can determine. Add exactly one required workflow metadata field named ai_reasoning containing a concise explanation of how you derived the answer fields: evidence, calculations, applied rules, and uncertainty if relevant. ai_reasoning is context for later steps and is not scored. Return only one JSON object. No markdown.');
  insertPrompt.run('setup_ce_reason_pick_iso_flowmap', 2, 'You are the second AI checker. The previous JSON contains answer fields plus ai_reasoning written by another AI. Treat ai_reasoning as working notes, not as guaranteed truth. Check the quality of the answer fields against the original task. Do not fully rewrite. Only fix a field when you find a severe concrete error, missing required value, wrong type, wrong option, wrong calculation, or clear quality issue. If the answer fields are acceptable, keep them unchanged. Return one JSON object with the required answer fields plus ai_reasoning explaining what you checked and any fixes. No markdown.');
  insertPrompt.run('setup_ce_reason_pick_iso_flowmap', 3, 'Prepare a checked final candidate JSON from the previous draft. Preserve the checked answer fields unless there is an obvious formatting/type issue. Keep ai_reasoning as concise reasoning context. Do not solve from scratch. Do not add any other keys. Return only one JSON object. No markdown, no explanation outside JSON.');
  insertPrompt.run('setup_ce_reason_pick_iso_flowmap', 4, 'You are an isolated PICK judge. You receive the original task, answer schema, and two anonymized candidate JSON answers only. Reasoning and workflow history are intentionally removed. You do not know which candidate is original or reviewed. Compare the candidates only against the original task and schema. Candidate X is the default when uncertain. Pick Candidate Y only if it clearly fixes an important, concrete, evidence-backed problem in X. Penalize unsupported new claims, removed constraints, missing required fields, wrong types, wrong options, and wrong calculations. Return one JSON object with the selected candidate answer fields plus ai_reasoning, picked_candidate ("A" for X or "B" for Y), and pick_checklist. pick_checklist must list the priority checks used for the decision. These metadata fields are not scored. No markdown, no explanation outside JSON.');

  insertSetup.run('setup_ce_flowreview', 'CE_Flowreview', 'Computer-evaluable answer plus review JSON workflow', 2);
  insertStep.run('setup_ce_flowreview', 1, 0);
  insertStep.run('setup_ce_flowreview', 2, 0);
  insertPrompt.run('setup_ce_flowreview', 1, `Solve the task exactly. ${ceJsonRule}`);
  insertPrompt.run('setup_ce_flowreview', 2, `Review the previous JSON answer against the original task. Check calculations, rules, exact keys, value types, missing keys, and extra keys. Return only the corrected final JSON object. No explanation.`);

  insertSetup.run('setup_ce_flowreview_s4', 'CE_SS_FlowreviewS4', 'Copy CE direct JSON, then verify and correct once', 2);
  insertStep.run('setup_ce_flowreview_s4', 1, 0);
  insertStep.run('setup_ce_flowreview_s4', 2, 1);
  insertPrompt.run('setup_ce_flowreview_s4', 1, 'Copy the matching CE Direct answer as step 1. This step is executed by the engine and does not call the model.');
  insertPrompt.run('setup_ce_flowreview_s4', 2, `You are the review pass for one previous JSON draft. Improve the draft conservatively but actually verify every field against the original task. The user message contains the original task, the draft JSON, and the allowed answer schema. Recompute arithmetic fields, re-check option choices, and re-check source/currentness decisions. Return exactly one JSON object using exactly the required keys and value types. Do not add keys, comments, markdown, explanations, or friendly follow-up text. Keep the draft unchanged only when you do not find a concrete, clearly verified mistake. If unsure, return the draft unchanged. ${ceJsonRule}`);

  insertSetup.run('setup_ce_additive_completion', 'CE_AdditiveCompletion', 'Cautious JSON draft with deterministic null-to-filled additive completion', 2);
  insertStep.run('setup_ce_additive_completion', 1, 0);
  insertStep.run('setup_ce_additive_completion', 2, 0);
  insertPrompt.run('setup_ce_additive_completion', 1, 'Cautious solver. Fill only JSON fields you are confident are correct; use null for uncertainty. Wrong filled values are heavily penalized, null is not.');
  insertPrompt.run('setup_ce_additive_completion', 2, 'Additive completer. Fill only null or missing fields from the cautious draft when confident. The engine locks non-null Step 1 fields and rejects changes to them.');

  insertSetup.run('setup_ce_ss_reason_flowreview', 'CE_SS_REASON_Flowreview', 'Same-start CE reasoning review: copy Direct, then conservative review with ai_reasoning', 2);
  insertStep.run('setup_ce_ss_reason_flowreview', 1, 0);
  insertStep.run('setup_ce_ss_reason_flowreview', 2, 0);
  insertPrompt.run('setup_ce_ss_reason_flowreview', 1, 'Copy the matching CE Direct answer as step 1. This step is executed by the engine and does not call the model.');
  insertPrompt.run('setup_ce_ss_reason_flowreview', 2, 'You are the second AI checker. The previous JSON is the copied Direct baseline answer. Check it conservatively against the original task. Do not solve from scratch. Do not rewrite for style. Keep the baseline unchanged unless you find an important, concrete, evidence-backed error: wrong value, wrong type, missing required value, wrong option, wrong calculation, or lost constraint. Respect strict comparisons exactly: more than means >, less than means <; equality does not satisfy either. If you change any answer field, ai_reasoning must include field name, old value, new value, exact rule/condition, and arithmetic/state proof. If you cannot prove every changed field concretely, keep the baseline value. Return one JSON object with the required answer fields plus ai_reasoning explaining what you checked and any fixes. No markdown.');

  insertSetup.run('setup_ce_ss_reason_pick_iso', 'CE_SS_REASON_PICK_ISO', 'Same-start CE reasoning review plus isolated picker: copy Direct, review, pick X/Y without history/reasoning metadata', 3);
  insertStep.run('setup_ce_ss_reason_pick_iso', 1, 0);
  insertStep.run('setup_ce_ss_reason_pick_iso', 2, 0);
  insertStep.run('setup_ce_ss_reason_pick_iso', 3, 0);
  insertPrompt.run('setup_ce_ss_reason_pick_iso', 1, 'Copy the matching CE Direct answer as step 1. This step is executed by the engine and does not call the model.');
  insertPrompt.run('setup_ce_ss_reason_pick_iso', 2, 'You are the second AI checker. The previous JSON is the copied Direct baseline answer. Check it conservatively against the original task. Do not solve from scratch. Do not rewrite for style. Keep the baseline unchanged unless you find an important, concrete, evidence-backed error: wrong value, wrong type, missing required value, wrong option, wrong calculation, or lost constraint. Respect strict comparisons exactly: more than means >, less than means <; equality does not satisfy either. If you change any answer field, ai_reasoning must include field name, old value, new value, exact rule/condition, and arithmetic/state proof. If you cannot prove every changed field concretely, keep the baseline value. Return one JSON object with the required answer fields plus ai_reasoning explaining what you checked and any fixes. No markdown.');
  insertPrompt.run('setup_ce_ss_reason_pick_iso', 3, 'You are an isolated PICK judge. You receive the original task, answer schema, and two candidate JSON answers only. Reasoning and workflow history are intentionally removed. Candidate X is the copied Direct baseline and the default when uncertain. Candidate Y is the conservative review answer. Pick Y only if it clearly fixes an important, concrete, evidence-backed problem in X. Before picking Y, identify every field where X and Y differ and verify the exact rule/condition plus arithmetic/state from the original task. Strict comparisons matter: equality is not more than and not less than. If any changed field in Y lacks concrete proof, pick X. Penalize unsupported new claims, removed constraints, missing required fields, wrong types, wrong options, and wrong calculations. Return one JSON object with the selected candidate answer fields plus ai_reasoning, picked_candidate ("A" for X or "B" for Y), and pick_checklist including changed-field proof checks. No markdown.');
}

function syncDefaultLlmConfigs(): void {
  const insert = db.prepare(`
    INSERT INTO llm_configs (label, provider, model_id, base_url, api_key_env, supports_native_search, active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const exists = db.prepare('SELECT id FROM llm_configs WHERE model_id = ? LIMIT 1');
  const ensure = (
    label: string,
    provider: string,
    modelId: string,
    baseUrl: string | null,
    apiKeyEnv: string,
    supportsNativeSearch: number,
    active: number,
  ) => {
    if (!exists.get(modelId)) {
      insert.run(label, provider, modelId, baseUrl, apiKeyEnv, supportsNativeSearch, active);
    }
  };

  ensure('GPT-4o', 'openai', 'gpt-4o', null, 'OPENAI_API_KEY', 1, 1);
  ensure('GPT-4.1', 'openai', 'gpt-4.1', null, 'OPENAI_API_KEY', 1, 1);
  ensure('GPT-3.5 Turbo (legacy)', 'openai', 'gpt-3.5-turbo', null, 'OPENAI_API_KEY', 0, 1);
}

// Seed data if empty
function seedIfEmpty(): void {
  const llmCount = (db.prepare('SELECT COUNT(*) as c FROM llm_configs').get() as { c: number }).c;

  if (llmCount === 0) {
    const insertLlm = db.prepare(`
      INSERT INTO llm_configs (label, provider, model_id, base_url, api_key_env, supports_native_search, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    insertLlm.run('GPT-4o Mini', 'openai', 'gpt-4o-mini', null, 'OPENAI_API_KEY', 1);
    insertLlm.run('Claude Haiku 3.5', 'anthropic', 'claude-3-5-haiku-20241022', null, 'ANTHROPIC_API_KEY', 0);
    insertLlm.run('DeepSeek Chat', 'openai_compatible', 'deepseek-chat', 'https://api.deepseek.com/v1', 'DEEPSEEK_API_KEY', 0);
  }

  const criteriaCount = (db.prepare('SELECT COUNT(*) as c FROM criteria').get() as { c: number }).c;
  if (criteriaCount === 0) {
    const insertCriteria = db.prepare('INSERT INTO criteria (id, name_de, description) VALUES (?, ?, ?)');
    insertCriteria.run('richtigkeit', 'Richtigkeit', 'Ist die Antwort faktisch korrekt?');
    insertCriteria.run('vollstaendigkeit_frage', 'Vollständigkeit gemäß Frage', 'Wurden alle Anforderungen der Frage erfüllt?');
    insertCriteria.run('vollstaendigkeit_moeglichkeit', 'Vollständigkeit gemäß Möglichkeit', 'Wurde das mögliche Potential ausgeschöpft?');
    insertCriteria.run('pruefung_verifikation', 'Prüfung / Verifikation', 'Hat das Modell seine Antwort überprüft?');
    insertCriteria.run('unsicherheit', 'Unsicherheit offenlegen', 'Werden Unsicherheiten klar kommuniziert?');
    insertCriteria.run('rueckfragefaehigkeit', 'Rückfragefähigkeit', 'Fragt das Modell bei unklaren Infos nach?');
    insertCriteria.run('internet_quellenqualitaet', 'Internet- / Quellenqualität', 'Wurden aktuelle Quellen verwendet?');
    insertCriteria.run('relevanz', 'Relevanz', 'Ist die Antwort relevant ohne Abweichungen?');
    insertCriteria.run('klarheit', 'Klarheit / Verständlichkeit', 'Ist die Antwort klar formuliert?');
  }

  const setupCount = (db.prepare('SELECT COUNT(*) as c FROM setups').get() as { c: number }).c;
  if (setupCount === 0) {
    const insertSetup = db.prepare('INSERT INTO setups (id, name, description, max_steps) VALUES (?, ?, ?, ?)');
    const insertStep = db.prepare('INSERT INTO setup_steps (setup_id, step, internet_allowed) VALUES (?, ?, ?)');
    const insertPrompt = db.prepare('INSERT INTO system_prompts (setup_id, step, prompt) VALUES (?, ?, ?)');

    // Setup A — single direct prompt, baseline
    insertSetup.run('setup_direct', 'A – Direkt', 'Einzelner direkter Aufruf', 1);
    insertStep.run('setup_direct', 1, 1);
    insertPrompt.run('setup_direct', 1, 'Answer the question.');

    // Setup B — step 1: answer, step 2: review and improve
    insertSetup.run('setup_wf_revision', 'B – Revision', 'Zweistufig: Antwort + Überarbeitung', 2);
    insertStep.run('setup_wf_revision', 1, 1);
    insertStep.run('setup_wf_revision', 2, 1);
    insertPrompt.run('setup_wf_revision', 1, 'Answer the question.');
    insertPrompt.run('setup_wf_revision', 2, 'You are in step 2 of a revision workflow. Critically review the previous answer and improve it: fix errors, fill gaps, improve clarity and completeness.');

    // Setup C — step 1: rewrite the prompt, step 2: answer the rewritten prompt
    insertSetup.run('setup_wf_prompt_optimise', 'C – Prompt-Optimierung', 'Zweistufig: Prompt optimieren + ausführen', 2);
    insertStep.run('setup_wf_prompt_optimise', 1, 0);
    insertStep.run('setup_wf_prompt_optimise', 2, 1);
    insertPrompt.run('setup_wf_prompt_optimise', 1, 'Your only task is to rewrite the given question as a better, clearer, more specific prompt. Return only the improved prompt text in the answer field — nothing else.');
    insertPrompt.run('setup_wf_prompt_optimise', 2, 'Answer the question.');

    // Setup D3-A — missing mandatory info test
    // IMPORTANT: do NOT instruct the AI to ask — the test measures if it decides to ask on its own
    insertSetup.run('setup_wf_maprecherche_a', 'D3-A – Recherche (Pflichtinfo)', 'Zweistufig: fehlende Pflichtinfo → nachfragen', 2);
    insertStep.run('setup_wf_maprecherche_a', 1, 0);
    insertStep.run('setup_wf_maprecherche_a', 2, 0);
    insertPrompt.run('setup_wf_maprecherche_a', 1, 'Answer the question.');
    insertPrompt.run('setup_wf_maprecherche_a', 2, 'You are in step 2. Review your previous response and improve it.');

    // Setup D3-B — optional additional info test
    // IMPORTANT: do NOT instruct the AI to ask — the test measures if it decides to search/ask on its own
    insertSetup.run('setup_wf_maprecherche_b', 'D3-B – Recherche (Zusatzinfo)', 'Zweistufig: optionale Zusatzinfo → verbessern', 2);
    insertStep.run('setup_wf_maprecherche_b', 1, 1);
    insertStep.run('setup_wf_maprecherche_b', 2, 1);
    insertPrompt.run('setup_wf_maprecherche_b', 1, 'Answer the question.');
    insertPrompt.run('setup_wf_maprecherche_b', 2, 'You are in step 2. Review and improve your previous answer.');
  }

  const questionCount = (db.prepare('SELECT COUNT(*) as c FROM questions').get() as { c: number }).c;
  if (questionCount === 0) {
    const insertQ = db.prepare('INSERT INTO questions (criteria_id, setup_id, question_text, testset, notes) VALUES (?, ?, ?, ?, ?)');
    const insertCP = db.prepare('INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES (?, ?, ?)');

    // Question 1: richtigkeit
    const q1 = insertQ.run('richtigkeit', null, 'Was ist die Hauptstadt der Schweiz und welche Funktion hat sie?', 'example_questions', 'Einfache Faktenfrage');
    insertCP.run(q1.lastInsertRowid, 'Bern wird als Bundesstadt / Regierungssitz korrekt genannt', 0);
    insertCP.run(q1.lastInsertRowid, 'Es wird erklärt, dass Bern nicht offiziell als "Hauptstadt" bezeichnet wird', 1);
    insertCP.run(q1.lastInsertRowid, 'Die politischen Funktionen (Bundesrat, Parlament) werden erwähnt', 2);

    // Question 2: rueckfragefaehigkeit
    const q2 = insertQ.run('rueckfragefaehigkeit', null, 'Buche mir einen Flug.', 'example_questions', 'Absichtlich vage Frage');
    insertCP.run(q2.lastInsertRowid, 'Das Modell fragt nach dem Abflugort', 0);
    insertCP.run(q2.lastInsertRowid, 'Das Modell fragt nach dem Zielort', 1);
    insertCP.run(q2.lastInsertRowid, 'Das Modell fragt nach dem Reisedatum', 2);

    // Question 3: klarheit
    const q3 = insertQ.run('klarheit', null, 'Erkläre den Unterschied zwischen Mitose und Meiose in einfachen Worten.', 'example_questions', 'Biologie Erklärung');
    insertCP.run(q3.lastInsertRowid, 'Mitose wird klar als Zellteilung für Wachstum/Reparatur beschrieben', 0);
    insertCP.run(q3.lastInsertRowid, 'Meiose wird klar als Zellteilung für Geschlechtszellen beschrieben', 1);
    insertCP.run(q3.lastInsertRowid, 'Der Chromosomenunterschied (2n vs n) wird verständlich erklärt', 2);
  }
}

seedIfEmpty();
syncDefaultSetups();
syncDefaultLlmConfigs();
syncKnownRunSets();
syncKnownTestsets();

export default db;

export interface LlmConfigRow {
  id: number;
  label: string;
  provider: string;
  model_id: string;
  base_url: string | null;
  api_key_env: string;
  supports_native_search: number;
  active: number;
}

export interface SetupRow {
  id: string;
  name: string;
  description: string;
  max_steps: number;
}

export interface SetupStepRow {
  id: number;
  setup_id: string;
  step: number;
  internet_allowed: number;
}

export interface SystemPromptRow {
  id: number;
  setup_id: string;
  step: number;
  prompt: string;
}

export interface CriteriaRow {
  id: string;
  name_de: string;
  description: string;
}

export interface QuestionRow {
  id: number;
  criteria_id: string;
  setup_id: string | null;
  question_text: string;
  testset: string;
  notes: string | null;
  autoanswer: number | null;
  computer_evaluable: number | null;
  expected_answer_json: string | null;
  answer_schema_json: string | null;
  evaluation_type: string | null;
}

export interface CheckpointRow {
  id: number;
  question_id: number;
  item_text: string;
  sort_order: number;
}

export interface RunRow {
  id: number;
  setup_id: string;
  llm_config_id: number;
  question_id: number;
  testset: string | null;
  run_set_id: string | null;
  run_nr: number | null;
  comparison_group_id: string | null;
  status: string;
  exclude_from_analysis: number | null;
  exclude_reason: string | null;
  created_at: string;
}

export interface RunStepRow {
  id: number;
  run_id: number;
  step: number;
  formal_step: number | null;
  internet_allowed: number | null;
  system_prompt_used: string | null;
  messages_json: string | null;
  response_text: string | null;
  search_queries_json: string | null;
  search_results_json: string | null;
  final_answer: string | null;
  created_at: string;
}

export interface ScoreRow {
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
  created_at: string;
}

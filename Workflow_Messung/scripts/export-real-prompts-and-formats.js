const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const root = path.join(__dirname, '..', '..');
const outDir = path.join(root, 'exports');
fs.mkdirSync(outDir, { recursive: true });

const db = new Database(path.join(root, 'app', 'data', 'matura.db'));

function mdFence(text, lang = 'text') {
  return `\`\`\`${lang}\n${String(text ?? '').replace(/\r\n/g, '\n')}\n\`\`\``;
}

function buildTechnicalPrompt(internetAllowed, isIntermediateStep) {
  let prompt = `\n\n---
Work autonomously. Try your best to solve the question on your own. Only ask for internet search or additional information if it is truly necessary. Find the best possible answer.

You MUST respond with valid JSON only — no text outside the JSON object.

Response format:
{
  "answer": "your complete response here",
  "isfinished": true
}`;

  if (internetAllowed) {
    prompt += `

ADD-ON A — Internet search available:
If you need current information from the internet, add your search queries and set isfinished to false:
{
  "answer": "",
  "internet_search_requests": ["your search query here"],
  "isfinished": false
}
You will receive the search results and can then provide your final answer with isfinished: true.`;
  }

  if (isIntermediateStep) {
    prompt += `

ADD-ON B — You may pass instructions to the next processing step:
{
  "answer": "your answer so far",
  "optional_nextprompt": "instruction for the next step",
  "isfinished": false
}`;
  }

  return prompt;
}

function buildComputerEvaluableTechnicalPrompt(internetAllowed) {
  if (!internetAllowed) return '';
  return `

---
Internet search is available for this step.
For the final answer, return ONLY the final JSON object requested by the user.
If you truly need current internet information before answering, return ONLY this temporary search-request JSON:
{
  "internet_search_requests": ["your search query here"],
  "isfinished": false
}
After search results are provided, return ONLY the final JSON object requested by the user.`;
}

function ceReasonTechnicalPrompt() {
  return `

---
CE_REASON protocol requirement:
Every workflow step must return a single JSON object with all required answer fields plus ai_reasoning.
ai_reasoning is unscored workflow metadata. It is allowed even if the original task says "no extra keys".
Do not add other metadata keys unless this is the PICK step, where picked_candidate and pick_checklist are also required and unscored.`;
}

function setupRows(ids) {
  const placeholders = ids.map(() => '?').join(',');
  return db.prepare(`
    SELECT s.id, s.name, s.max_steps, ss.step, ss.internet_allowed, sp.prompt
    FROM setups s
    JOIN setup_steps ss ON ss.setup_id = s.id
    LEFT JOIN system_prompts sp ON sp.setup_id = s.id AND sp.step = ss.step
    WHERE s.id IN (${placeholders})
    ORDER BY s.id, ss.step
  `).all(...ids);
}

function writeMainWorkflowPrompts() {
  const ids = ['setup_flowmap', 'setup_flowreview', 'setup_wf_prompt_optimise'];
  const rows = setupRows(ids);
  const bySetup = new Map();
  for (const row of rows) {
    if (!bySetup.has(row.id)) bySetup.set(row.id, []);
    bySetup.get(row.id).push(row);
  }
  const lines = [
    '# Reale Systemprompts der 3 Hauptworkflows',
    '',
    'Quelle: Tabelle `system_prompts` plus technische JSON-Zusätze aus `app/src/engine/workflow.ts`.',
    'Die Prompttexte unten sind nicht umformuliert.',
    '',
  ];
  for (const [setupId, setupRows] of bySetup) {
    const first = setupRows[0];
    lines.push(`## ${first.name} (\`${setupId}\`)`, '');
    for (const row of setupRows) {
      const isLast = Number(row.step) === Number(row.max_steps);
      const isIntermediate = Number(row.step) > 1 && !isLast;
      const technical = buildTechnicalPrompt(Number(row.internet_allowed) === 1, isIntermediate);
      lines.push(`### Step ${row.step}`);
      lines.push('');
      lines.push(`Internet erlaubt: ${Number(row.internet_allowed) === 1 ? 'ja' : 'nein'}`);
      lines.push('');
      lines.push('#### Systemprompt aus DB');
      lines.push(mdFence(row.prompt));
      lines.push('');
      lines.push('#### Voller Systemprompt an das Modell');
      lines.push(mdFence(`${row.prompt}${technical}`));
      lines.push('');
    }
  }
  fs.writeFileSync(path.join(outDir, '01_reale_systemprompts_3_hauptworkflows.md'), lines.join('\n'), 'utf8');
}

function writeExchangeFormats() {
  const lines = [
    '# Reale Datenformate im Workflow',
    '',
    'Quelle: `app/src/engine/workflow.ts`, `app/src/engine/llm.ts`, `app/src/engine/search.ts`, `app/src/engine/scorer.ts`.',
    'Dies ist keine neue Spezifikation, sondern die real verwendeten Formate.',
    '',
    '## Normale Workflow-Antwort',
    '',
    mdFence(`{
  "answer": "your complete response here",
  "isfinished": true
}`, 'json'),
    '',
    '## Internet-Suchanfrage normaler Workflow',
    '',
    mdFence(`{
  "answer": "",
  "internet_search_requests": ["your search query here"],
  "isfinished": false
}`, 'json'),
    '',
    '## Optionaler Hinweis an nächsten Step',
    '',
    mdFence(`{
  "answer": "your answer so far",
  "optional_nextprompt": "instruction for the next step",
  "isfinished": false
}`, 'json'),
    '',
    '## Computer-evaluable Internet-Suchanfrage',
    '',
    mdFence(`{
  "internet_search_requests": ["your search query here"],
  "isfinished": false
}`, 'json'),
    '',
    '## Suchresultate, die zurück an die AI gehen',
    '',
    mdFence(`=== Search Results ===

[1] <title>
URL: <url>
<content excerpt, max. 500 chars>

[2] ...`),
    '',
    'Die Suche nutzt Tavily mit `max_results: 3` pro Query.',
    '',
    '## LLM Message-Format intern',
    '',
    mdFence(`{
  "role": "user" | "assistant",
  "content": "<text>"
}`, 'json'),
    '',
    '## Normale AI-Scoring-Antwort',
    '',
    mdFence(`{
  "checkpoint_results": [
    {"checkpoint_id": <number>, "passed": <true|false>, "explanation": "<brief reason>"}
  ],
  "overall_report": "<brief summary of what was good and what was lacking>",
  "review_required": <true|false>,
  "review_reason": "<short explanation if review_required is true, otherwise empty string>"
}`, 'json'),
    '',
    '## Gemeinsames gepaartes AI-Scoring',
    '',
    mdFence(`{
  "direct": {
    "checkpoint_results": [
      {"checkpoint_id": <number>, "passed": <true|false>, "explanation": "<brief reason>"}
    ],
    "overall_report": "<brief summary>",
    "review_required": <true|false>,
    "review_reason": "<short reason if true, otherwise empty string>"
  },
  "workflow": {
    "checkpoint_results": [
      {"checkpoint_id": <number>, "passed": <true|false>, "explanation": "<brief reason>"}
    ],
    "overall_report": "<brief summary>",
    "review_required": <true|false>,
    "review_reason": "<short reason if true, otherwise empty string>"
  }
}`, 'json'),
    '',
    '## Paar-Protokollcheck',
    '',
    mdFence(`{
  "review_required": <true|false>,
  "protocol_problem": <true|false>,
  "review_reason": "<short concrete reason, empty if false>"
}`, 'json'),
    '',
    '## Paar-Postanalyse / Symmetriecheck',
    '',
    mdFence(`{
  "review_required": <true|false>,
  "symmetry_problem": <true|false>,
  "review_reason": "<short reason, empty if false>"
}`, 'json'),
    '',
    '## Computer-evaluable Bewertung',
    '',
    '- Erwartete Lösung steht als JSON in `questions.expected_answer_json`.',
    '- Antwort muss ein JSON-Objekt sein.',
    '- Pro erwartetes gewertetes Feld gibt es einen Punkt.',
    '- Zusätzlich gibt es Punkte für gültiges JSON und passende gewertete Keys.',
    '- Tolerant verglichen werden Zahlen, Booleans, Strings und Arrays.',
    '',
    'Nicht gewertete Metadata-Felder:',
    '',
    mdFence(`ai_reasoning
pick_reasoning
pick_checklist
picked_candidate
protocol_audit
*_reason
*_reasoning
*_comment
fields mit validate:false im answer_schema_json`),
  ];
  fs.writeFileSync(path.join(outDir, '02_reale_datenformate.md'), lines.join('\n'), 'utf8');
}

function writeCePickPrompts() {
  const ids = ['setup_ce_direct', 'setup_ce_ss_reason_flowreview', 'setup_ce_ss_reason_pick_iso'];
  const rows = setupRows(ids);
  const bySetup = new Map();
  for (const row of rows) {
    if (!bySetup.has(row.id)) bySetup.set(row.id, []);
    bySetup.get(row.id).push(row);
  }
  const lines = [
    '# Reale Prompts: CE Same-Start und CE PICK',
    '',
    'Quelle: Tabelle `system_prompts` plus CE_REASON Templates aus `app/src/engine/workflow.ts`.',
    'Die DB-Systemprompts sind unverändert übernommen. Die User-Messages sind Templates, weil zur Laufzeit Frage, Schema und Kandidaten eingefügt werden.',
    '',
  ];
  for (const [setupId, setupRows] of bySetup) {
    const first = setupRows[0];
    lines.push(`## ${first.name} (\`${setupId}\`)`, '');
    for (const row of setupRows) {
      const technical = buildComputerEvaluableTechnicalPrompt(Number(row.internet_allowed) === 1);
      const ceTech = setupId.includes('reason') ? ceReasonTechnicalPrompt() : '';
      lines.push(`### Step ${row.step}`);
      lines.push('');
      lines.push(`Internet erlaubt: ${Number(row.internet_allowed) === 1 ? 'ja' : 'nein'}`);
      lines.push('');
      lines.push('#### Systemprompt aus DB');
      lines.push(mdFence(row.prompt));
      lines.push('');
      lines.push('#### Voller Systemprompt an das Modell');
      lines.push(mdFence(`${row.prompt}${technical}${ceTech}`));
      lines.push('');
    }
  }

  lines.push('## CE_REASON User-Message Envelope');
  lines.push('');
  lines.push(mdFence(`IMPORTANT WORKFLOW FORMAT OVERRIDE:
The original task may say "no extra keys" or list an exact key set.
For this CE_REASON workflow, add exactly one unscored workflow metadata field named ai_reasoning in every step.
Keep all required answer fields from the original task/schema. Do not add other answer keys unless this step explicitly asks for picker metadata.
ai_reasoning must explain briefly which task facts, rules, calculations, constraints, and uncertainty produced the JSON values.

Original task:
<question.question_text>

Allowed answer schema. This is not the solution, only the required shape/types/options:
<question.answer_schema_json or fallback>`));
  lines.push('');

  lines.push('## Same-Start Step 2 User-Message Template');
  lines.push('');
  lines.push(mdFence(`IMPORTANT WORKFLOW FORMAT OVERRIDE:
The original task may say "no extra keys" or list an exact key set.
For this CE_REASON workflow, add exactly one unscored workflow metadata field named ai_reasoning in every step.
Keep all required answer fields from the original task/schema. Do not add other answer keys unless this step explicitly asks for picker metadata.
ai_reasoning must explain briefly which task facts, rules, calculations, constraints, and uncertainty produced the JSON values.

Original task:
<question.question_text>

Allowed answer schema. This is not the solution, only the required shape/types/options:
<question.answer_schema_json or fallback>

Candidate from Step 1. This is the copied Direct answer and must be treated as the original baseline:
<copied Direct answer>

Step 2 task:
Conservatively review the copied Direct answer against the original task.
Do not solve from scratch and do not rewrite for style.
Keep the copied Direct answer unless you find an important, concrete, evidence-backed error.
Only fix severe concrete errors: wrong value, wrong type, missing required value, wrong option, wrong calculation, or lost constraint.
When checking rules, respect strict comparisons exactly: "more than" means >, "less than" means <; equality does not satisfy either condition.
If you change any answer field, ai_reasoning must include: field name, old value, new value, the exact rule/condition, and the arithmetic/state that proves the change.
If you cannot give that concrete proof for every changed field, keep the copied Direct value.
Return one JSON object only: all required answer fields plus ai_reasoning explaining what you checked and what changed.`));
  lines.push('');

  lines.push('## ISO PICK Step 3 User-Message Template');
  lines.push('');
  lines.push(mdFence(`IMPORTANT WORKFLOW FORMAT OVERRIDE:
The original task may say "no extra keys" or list an exact key set.
For this CE_REASON workflow, add exactly one unscored workflow metadata field named ai_reasoning in every step.
Keep all required answer fields from the original task/schema. Do not add other answer keys unless this step explicitly asks for picker metadata.
ai_reasoning must explain briefly which task facts, rules, calculations, constraints, and uncertainty produced the JSON values.

Original task:
<question.question_text>

Allowed answer schema. This is not the solution, only the required shape/types/options:
<question.answer_schema_json or fallback>

Candidate X: copied Direct baseline answer. Workflow metadata and reasoning have been removed:
<Candidate X JSON without workflow metadata>

Candidate Y: conservative review answer. Workflow metadata and reasoning have been removed:
<Candidate Y JSON without workflow metadata>

Step 3 ISO PICK task:
You are isolated from previous workflow history. Compare only the original task, schema, Candidate X, and Candidate Y.
Pick exactly one candidate as final. Do not merge, except if one candidate is clearly only a formatting/type repair of the same answer.

Decision priorities, in order:
1. Correctness first. Never pick nicer wording if it is less correct.
2. Candidate X is the copied Direct baseline and the default. Keep X when uncertain or when Y is only different/nicer but not materially better.
3. Pick Candidate Y only if it clearly fixes an important, concrete, evidence-backed problem in X.
4. Penalize new claims or changed values not supported by prompt/context.
5. Penalize removed constraints, removed required fields, or lost details.
Before picking Y, identify every field where X and Y differ. For each changed field, verify the exact rule/condition and arithmetic/state from the original task. Strict comparisons matter: equality is not "more than" and not "less than".
If even one changed field in Y lacks a concrete proof, or Y changes a correct-looking X field without proof, pick X.
6. Then compare completeness.
7. Then compare clarity/style.
8. Prefer the shorter answer if quality is equal.
9. If both have different issues, choose the one with fewer correctness risks.

Return one JSON object only. It must contain the selected candidate answer fields plus:
- ai_reasoning: short explanation of the final selected values.
- picked_candidate: "A" for Candidate X or "B" for Candidate Y.
- pick_checklist: an array of short objects, one per priority, describing whether X or Y fulfills that priority better. Include changed-field proof checks before the completeness/style priorities.
picked_candidate and pick_checklist are workflow metadata and are not scored.`));
  lines.push('');

  lines.push('## CE PICK Ausgabeformat');
  lines.push('');
  lines.push(mdFence(`{
  "<answer_field_1>": "<selected candidate value>",
  "<answer_field_2>": "<selected candidate value>",
  "ai_reasoning": "<short explanation>",
  "picked_candidate": "A" | "B",
  "pick_checklist": [
    {"priority": "<priority/check>", "result": "<A/B and reason>"}
  ]
}`, 'json'));

  fs.writeFileSync(path.join(outDir, '03_reale_prompts_ce_pick.md'), lines.join('\n'), 'utf8');
}

writeMainWorkflowPrompts();
writeExchangeFormats();
writeCePickPrompts();

console.log(JSON.stringify({
  outDir,
  files: [
    '01_reale_systemprompts_3_hauptworkflows.md',
    '02_reale_datenformate.md',
    '03_reale_prompts_ce_pick.md',
  ],
}, null, 2));

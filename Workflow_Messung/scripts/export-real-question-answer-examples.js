const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.resolve(__dirname, '../data/matura.db'));
const outDir = path.resolve(__dirname, '../../exports');
fs.mkdirSync(outDir, { recursive: true });

const exportsToCreate = [
  {
    file: '04_reale_fragen_antworten_app2.md',
    title: 'Reale Fragen und Antworten: app2',
    setupId: 'setup_ce_flowreview_s4',
    testsets: ['ce_calc_final_questions'],
    includeExpected: true,
  },
  {
    file: '05_reale_fragen_antworten_flowmap.md',
    title: 'Reale Fragen und Antworten: Flowmap',
    setupId: 'setup_flowmap',
    testsets: ['flowmap_parallel7_questions', 'flowmap_basic_questions'],
    includeExpected: false,
  },
  {
    file: '06_reale_fragen_antworten_flowreview.md',
    title: 'Reale Fragen und Antworten: Flowreview',
    setupId: 'setup_flowreview',
    testsets: ['flowreview_parallel7_questions', 'flowreview_basic_questions'],
    includeExpected: false,
  },
  {
    file: '07_reale_fragen_antworten_promptoptimierung.md',
    title: 'Reale Fragen und Antworten: Prompt-Optimierung',
    setupId: 'setup_wf_prompt_optimise',
    testsets: ['prompt_optimisation_hard_questions', 'prompt_optimisation_extended_questions', 'weak_prompt_questions', 'ai_edge_case_questions', 'prompt_optimisation_questions'],
    includeExpected: false,
  },
];

function stripWrapper(answer) {
  const text = String(answer || '').trim();
  if (!text.startsWith('{')) return text;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && typeof parsed.answer === 'string') {
      return parsed.answer.trim();
    }
  } catch {
    return text;
  }
  return text;
}

function fenced(lang, value) {
  return ['```' + lang, String(value || '').trim(), '```'].join('\n');
}

function loadExamples(config) {
  const placeholders = config.testsets.map(() => '?').join(',');
  const candidates = db.prepare(`
    SELECT q.id AS question_id
    FROM questions q
    WHERE q.testset IN (${placeholders})
    ORDER BY q.criteria_id, q.id
  `).all(...config.testsets);

  const loadRun = db.prepare(`
    SELECT
      r.id AS run_id,
      r.setup_id,
      s.name AS setup_name,
      q.id AS question_id,
      q.criteria_id,
      q.testset,
      q.question_text,
      q.expected_answer_json,
      q.answer_schema_json,
      sc.score_percent,
      sc.passed_checkpoints,
      sc.total_checkpoints
    FROM runs r
    JOIN questions q ON q.id = r.question_id
    JOIN setups s ON s.id = r.setup_id
    LEFT JOIN scores sc ON sc.run_id = r.id
    WHERE r.setup_id = ?
      AND r.status = 'completed'
      AND r.question_id = ?
    ORDER BY
      CASE WHEN r.run_set_id IS NULL OR r.run_set_id = 'runset_existing' THEN 1 ELSE 0 END,
      r.id DESC
    LIMIT 1
  `);
  const loadFinalAnswer = db.prepare(`
    SELECT final_answer
    FROM run_steps
    WHERE run_id = ?
      AND COALESCE(formal_step, step) < 900
    ORDER BY step DESC
    LIMIT 1
  `);

  const rows = [];
  for (const candidate of candidates) {
    const row = loadRun.get(config.setupId, candidate.question_id);
    if (row) {
      const finalStep = loadFinalAnswer.get(row.run_id);
      rows.push({ ...row, final_answer: finalStep?.final_answer ?? '' });
    }
    if (rows.length >= 10) break;
  }
  return rows;
}

function loadSteps(runId) {
  return db.prepare(`
    SELECT step, formal_step, final_answer
    FROM run_steps
    WHERE run_id = ?
      AND COALESCE(formal_step, step) < 900
    ORDER BY step
  `).all(runId);
}

function loadCheckpoints(questionId) {
  return db.prepare(`
    SELECT item_text
    FROM checkpoints
    WHERE question_id = ?
    ORDER BY sort_order
  `).all(questionId).map(row => row.item_text);
}

function writeExport(config) {
  const rows = loadExamples(config);
  const lines = [];
  lines.push(`# ${config.title}`);
  lines.push('');
  lines.push('Quelle: reale Einträge aus `app/data/matura.db` (`questions`, `runs`, `run_steps`, `scores`, `checkpoints`).');
  lines.push(`Workflow: \`${config.setupId}\``);
  lines.push(`Testsets bevorzugt: ${config.testsets.map(value => `\`${value}\``).join(', ')}`);
  lines.push(`Anzahl Beispiele: ${rows.length}`);
  lines.push('');

  rows.forEach((row, index) => {
    const checkpoints = loadCheckpoints(row.question_id);
    const steps = loadSteps(row.run_id);
    lines.push(`## ${index + 1}. Frage ${row.question_id} (${row.criteria_id})`);
    lines.push('');
    lines.push(`- Run: \`${row.run_id}\``);
    lines.push(`- Testset: \`${row.testset}\``);
    lines.push(`- Score: ${row.score_percent == null ? 'n/a' : `${Number(row.score_percent).toFixed(1)}%`} (${row.passed_checkpoints ?? '?'} / ${row.total_checkpoints ?? '?'})`);
    lines.push('');
    lines.push('### Frage');
    lines.push('');
    lines.push(fenced('text', row.question_text));
    lines.push('');

    if (config.includeExpected && row.expected_answer_json) {
      lines.push('### Erwartete Antwort');
      lines.push('');
      lines.push(fenced('json', JSON.stringify(JSON.parse(row.expected_answer_json), null, 2)));
      lines.push('');
    }

    lines.push('### Modellantwort');
    lines.push('');
    const finalAnswer = config.includeExpected ? row.final_answer : stripWrapper(row.final_answer);
    lines.push(fenced(config.includeExpected ? 'json' : 'text', finalAnswer));
    lines.push('');

    if (steps.length > 1) {
      lines.push('### Workflow-Schritte');
      lines.push('');
      for (const step of steps) {
        lines.push(`#### Step ${step.formal_step ?? step.step}`);
        lines.push('');
        lines.push(fenced(config.includeExpected ? 'json' : 'text', config.includeExpected ? step.final_answer : stripWrapper(step.final_answer)));
        lines.push('');
      }
    }

    if (checkpoints.length) {
      lines.push('### Bewertungs-Checkpoints');
      lines.push('');
      for (const checkpoint of checkpoints) {
        lines.push(`- ${checkpoint}`);
      }
      lines.push('');
    }
  });

  fs.writeFileSync(path.join(outDir, config.file), lines.join('\n'), 'utf8');
  return { file: path.join(outDir, config.file), rows: rows.length };
}

const results = exportsToCreate.map(writeExport);
console.log(JSON.stringify(results, null, 2));

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const [runIdRaw, reportPathRaw] = process.argv.slice(2);
const runId = Number(runIdRaw);

if (!Number.isInteger(runId) || !reportPathRaw) {
  console.error('Usage: node scripts/append-audit-step.js <runId> <reportPath>');
  process.exit(1);
}

const reportPath = path.resolve(reportPathRaw);
const report = fs.readFileSync(reportPath, 'utf8');
const db = new Database(path.resolve(__dirname, '../data/matura.db'));

const run = db.prepare('SELECT id FROM runs WHERE id = ?').get(runId);
if (!run) {
  console.error(`Run not found: ${runId}`);
  process.exit(1);
}

const existing = db.prepare(`
  SELECT id
  FROM run_steps
  WHERE run_id = ?
    AND formal_step = 900
    AND system_prompt_used = 'pair_audit_report'
    AND response_text = ?
`).get(runId, report);

if (existing) {
  console.log(`Audit step already exists for run ${runId}: ${existing.id}`);
  process.exit(0);
}

const maxStep = db.prepare('SELECT COALESCE(MAX(step), 0) as max_step FROM run_steps WHERE run_id = ?').get(runId).max_step;
const info = db.prepare(`
  INSERT INTO run_steps (
    run_id,
    step,
    formal_step,
    internet_allowed,
    system_prompt_used,
    messages_json,
    response_text,
    search_queries_json,
    search_results_json,
    final_answer
  )
  VALUES (?, ?, 900, 0, 'pair_audit_report', '[]', ?, '[]', '[]', ?)
`).run(runId, maxStep + 1, report, report);

console.log(`Inserted audit step ${info.lastInsertRowid} for run ${runId}`);

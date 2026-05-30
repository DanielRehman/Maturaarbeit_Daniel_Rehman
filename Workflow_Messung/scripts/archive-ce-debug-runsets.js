const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.resolve(__dirname, '../data/matura.db'));
db.pragma('busy_timeout = 30000');

const archiveId = 'zz_ce_debug_archive';
const keep = ['ce_main_final_questions', 'ce_calc_final_questions', archiveId];

const debugRunSets = db.prepare(`
  SELECT run_set_id, COUNT(*) AS runs
  FROM runs
  WHERE run_set_id LIKE 'ce_%'
    AND run_set_id NOT IN (${keep.map(() => '?').join(',')})
  GROUP BY run_set_id
  ORDER BY run_set_id
`).all(...keep);

if (debugRunSets.length === 0) {
  console.log('No CE debug runsets to archive.');
  process.exit(0);
}

const debugIds = debugRunSets.map(row => row.run_set_id);
const placeholders = debugIds.map(() => '?').join(',');

console.log('Archiving CE debug runsets into zz_ce_debug_archive:');
console.table(debugRunSets);

const tx = db.transaction(() => {
  db.prepare('INSERT OR IGNORE INTO run_sets (id, name) VALUES (?, ?)').run(
    archiveId,
    'Archived CE debug/probe/intermediate runsets',
  );
  const runsUpdated = db.prepare(`UPDATE runs SET run_set_id = ? WHERE run_set_id IN (${placeholders})`).run(
    archiveId,
    ...debugIds,
  ).changes;
  const historyUpdated = db.prepare(`UPDATE run_history SET run_set_id = ? WHERE run_set_id IN (${placeholders})`).run(
    archiveId,
    ...debugIds,
  ).changes;
  const deletedRunSetRows = db.prepare(`DELETE FROM run_sets WHERE id IN (${placeholders})`).run(...debugIds).changes;
  return { archivedRunSets: debugIds.length, runsUpdated, historyUpdated, deletedRunSetRows };
});

const result = tx();
console.log(JSON.stringify(result, null, 2));
console.log('CE runsets now:');
console.table(db.prepare(`
  SELECT run_set_id, COUNT(*) AS runs, COUNT(DISTINCT question_id) AS questions
  FROM runs
  WHERE run_set_id LIKE 'ce_%' OR run_set_id = ?
  GROUP BY run_set_id
  ORDER BY CASE run_set_id WHEN 'ce_calc_final_questions' THEN 1 WHEN 'ce_main_final_questions' THEN 2 ELSE 9 END, run_set_id
`).all(archiveId));

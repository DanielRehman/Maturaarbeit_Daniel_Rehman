const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.resolve(__dirname, '../data/matura.db'));
db.pragma('busy_timeout = 30000');

const keep = ['ce_main_final_questions', 'ce_calc_final_questions'];

const debugRunSets = db.prepare(`
  SELECT run_set_id, COUNT(*) AS runs
  FROM runs
  WHERE run_set_id LIKE 'ce_%'
    AND run_set_id NOT IN (${keep.map(() => '?').join(',')})
  GROUP BY run_set_id
  ORDER BY run_set_id
`).all(...keep);

if (debugRunSets.length === 0) {
  console.log('No CE debug runsets to delete.');
  process.exit(0);
}

console.log('Deleting CE debug runsets:');
console.table(debugRunSets);

const runSetIds = debugRunSets.map(row => row.run_set_id);
const placeholders = runSetIds.map(() => '?').join(',');

function runDelete(label, sql, params = []) {
  const result = db.prepare(sql).run(...params);
  console.log(`${label}: ${result.changes}`);
}

const tx = db.transaction(() => {
  db.prepare('DROP TABLE IF EXISTS temp_delete_runs').run();
  db.prepare('DROP TABLE IF EXISTS temp_delete_scores').run();
  db.prepare(`CREATE TEMP TABLE temp_delete_runs AS SELECT id FROM runs WHERE run_set_id IN (${placeholders})`).run(...runSetIds);
  db.prepare('CREATE INDEX temp_delete_runs_id_idx ON temp_delete_runs(id)').run();
  db.prepare('CREATE TEMP TABLE temp_delete_scores AS SELECT id FROM scores WHERE run_id IN (SELECT id FROM temp_delete_runs)').run();
  db.prepare('CREATE INDEX temp_delete_scores_id_idx ON temp_delete_scores(id)').run();

  const counts = {
    runsets: runSetIds.length,
    runs: db.prepare('SELECT COUNT(*) AS count FROM temp_delete_runs').get().count,
    scores: db.prepare('SELECT COUNT(*) AS count FROM temp_delete_scores').get().count,
  };
  console.log('Delete counts:', counts);

  runDelete('checkpoint_results', 'DELETE FROM checkpoint_results WHERE score_id IN (SELECT id FROM temp_delete_scores)');
  runDelete('scores', 'DELETE FROM scores WHERE id IN (SELECT id FROM temp_delete_scores)');
  runDelete('checkpoint_results_history', `
    DELETE FROM checkpoint_results_history
    WHERE score_history_id IN (
      SELECT id FROM score_history WHERE run_id IN (SELECT id FROM temp_delete_runs)
    )
  `);
  runDelete('score_history', 'DELETE FROM score_history WHERE run_id IN (SELECT id FROM temp_delete_runs)');
  runDelete('run_steps', 'DELETE FROM run_steps WHERE run_id IN (SELECT id FROM temp_delete_runs)');
  runDelete('run_history by original_run_id', 'DELETE FROM run_history WHERE original_run_id IN (SELECT id FROM temp_delete_runs)');
  runDelete('run_history by run_set_id', `DELETE FROM run_history WHERE run_set_id IN (${placeholders})`, runSetIds);
  runDelete('runs', 'DELETE FROM runs WHERE id IN (SELECT id FROM temp_delete_runs)');
  runDelete('run_sets', `DELETE FROM run_sets WHERE id IN (${placeholders})`, runSetIds);

  db.prepare('DROP TABLE IF EXISTS temp_delete_runs').run();
  db.prepare('DROP TABLE IF EXISTS temp_delete_scores').run();

  return counts;
});

const counts = tx();

console.log('Deleted:', counts);
console.log('Remaining CE runsets:');
console.table(db.prepare(`
  SELECT run_set_id, COUNT(*) AS runs, COUNT(DISTINCT question_id) AS questions
  FROM runs
  WHERE run_set_id LIKE 'ce_%'
  GROUP BY run_set_id
  ORDER BY run_set_id
`).all());

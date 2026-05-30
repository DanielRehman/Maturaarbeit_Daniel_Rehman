const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.resolve(__dirname, '../data/matura.db'));
db.pragma('busy_timeout = 30000');

const renamePlans = [
  {
    fromRunSet: 'ce_s4_gpt4omini_100_per_criterion_20260522',
    toRunSet: 'ce_main_final_questions',
    fromTestset: 'ce_intermediate_v2_questions',
    toTestset: 'ce_main_final_questions',
    name: 'CE v4 final non-app2 runset',
  },
  {
    fromRunSet: 'ce_app2_core_10x_20260522',
    toRunSet: 'ce_calc_final_questions',
    fromTestset: 'ce_app2_reasoning_core_10',
    toTestset: 'ce_calc_final_questions',
    name: 'CE app2 final runset',
  },
];

const deleteRunSets = [
  'ce_app2_core_smoke_20260522',
  'ce_app2_core_smoke2_20260522',
  'ce_app2_core_1x_20260522',
];

const tx = db.transaction(() => {
  for (const plan of renamePlans) {
    db.prepare('INSERT OR IGNORE INTO run_sets (id, name) VALUES (?, ?)').run(plan.toRunSet, plan.name);
    db.prepare('INSERT OR IGNORE INTO testsets (id, name) VALUES (?, ?)').run(plan.toTestset, plan.name);
    db.prepare('UPDATE questions SET testset = ? WHERE testset = ?').run(plan.toTestset, plan.fromTestset);
    db.prepare('UPDATE runs SET run_set_id = ?, testset = ? WHERE run_set_id = ?').run(plan.toRunSet, plan.toTestset, plan.fromRunSet);
    db.prepare('UPDATE run_history SET run_set_id = ?, testset = ? WHERE run_set_id = ?').run(plan.toRunSet, plan.toTestset, plan.fromRunSet);
    db.prepare('DELETE FROM run_sets WHERE id = ?').run(plan.fromRunSet);
    db.prepare('DELETE FROM testsets WHERE id = ? AND NOT EXISTS (SELECT 1 FROM questions WHERE testset = ?)').run(plan.fromTestset, plan.fromTestset);
  }

  const placeholders = deleteRunSets.map(() => '?').join(',');
  db.prepare('DROP TABLE IF EXISTS temp_delete_runs').run();
  db.prepare('DROP TABLE IF EXISTS temp_delete_scores').run();
  db.prepare(`CREATE TEMP TABLE temp_delete_runs AS SELECT id FROM runs WHERE run_set_id IN (${placeholders})`).run(...deleteRunSets);
  db.prepare('CREATE TEMP TABLE temp_delete_scores AS SELECT id FROM scores WHERE run_id IN (SELECT id FROM temp_delete_runs)').run();
  const deletedRuns = db.prepare('SELECT COUNT(*) AS count FROM temp_delete_runs').get().count;
  const deletedScores = db.prepare('SELECT COUNT(*) AS count FROM temp_delete_scores').get().count;

  db.prepare('DELETE FROM checkpoint_results WHERE score_id IN (SELECT id FROM temp_delete_scores)').run();
  db.prepare('DELETE FROM scores WHERE id IN (SELECT id FROM temp_delete_scores)').run();
  db.prepare('DELETE FROM run_steps WHERE run_id IN (SELECT id FROM temp_delete_runs)').run();
  db.prepare('DELETE FROM runs WHERE id IN (SELECT id FROM temp_delete_runs)').run();
  db.prepare(`DELETE FROM run_sets WHERE id IN (${placeholders})`).run(...deleteRunSets);
  db.prepare('DROP TABLE IF EXISTS temp_delete_runs').run();
  db.prepare('DROP TABLE IF EXISTS temp_delete_scores').run();

  return { renamed: renamePlans, deletedRunSets: deleteRunSets, deletedRuns, deletedScores };
});

const result = tx();
console.log(JSON.stringify(result, null, 2));
console.log('Final CE runsets:');
console.table(db.prepare(`
  SELECT run_set_id, testset, COUNT(*) AS runs, COUNT(DISTINCT question_id) AS questions
  FROM runs
  WHERE run_set_id IN ('ce_main_final_questions', 'ce_calc_final_questions')
  GROUP BY run_set_id, testset
  ORDER BY run_set_id
`).all());
console.log('Final CE testsets:');
console.table(db.prepare(`
  SELECT testset, COUNT(*) AS questions
  FROM questions
  WHERE testset IN ('ce_main_final_questions', 'ce_calc_final_questions')
  GROUP BY testset
  ORDER BY testset
`).all());

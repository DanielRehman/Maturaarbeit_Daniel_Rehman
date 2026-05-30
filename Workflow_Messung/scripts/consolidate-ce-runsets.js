const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.resolve(__dirname, '../data/matura.db'));
db.pragma('busy_timeout = 30000');

const nowStamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.resolve(__dirname, `../outputs/consolidate-ce-runsets-${nowStamp}.json`);

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

const keepRunSets = new Set(renamePlans.map(plan => plan.toRunSet));
const sourceRunSets = new Set(renamePlans.map(plan => plan.fromRunSet));

const allCeRunSets = db.prepare(`
  SELECT DISTINCT run_set_id
  FROM runs
  WHERE run_set_id LIKE 'ce_%'
  ORDER BY run_set_id
`).all().map(row => row.run_set_id);

const deleteRunSets = allCeRunSets.filter(runSet =>
  !keepRunSets.has(runSet) &&
  !sourceRunSets.has(runSet)
);

function rowsForRunSets(runSets) {
  if (runSets.length === 0) return [];
  const placeholders = runSets.map(() => '?').join(',');
  return db.prepare(`
    SELECT run_set_id, COUNT(*) AS runs, COUNT(DISTINCT question_id) AS questions,
      MIN(created_at) AS first_created, MAX(created_at) AS last_created
    FROM runs
    WHERE run_set_id IN (${placeholders})
    GROUP BY run_set_id
    ORDER BY run_set_id
  `).all(...runSets);
}

const backup = {
  created_at: new Date().toISOString(),
  renamePlans,
  deleteRunSets,
  deleteSummary: rowsForRunSets(deleteRunSets),
  sourceSummary: rowsForRunSets([...sourceRunSets]),
};

fs.writeFileSync(backupPath, `${JSON.stringify(backup, null, 2)}\n`, 'utf8');

const tx = db.transaction(() => {
  for (const plan of renamePlans) {
    db.prepare('INSERT OR IGNORE INTO run_sets (id, name) VALUES (?, ?)').run(plan.toRunSet, plan.name);
    db.prepare('INSERT OR IGNORE INTO testsets (id, name) VALUES (?, ?)').run(plan.toTestset, plan.name);

    db.prepare('UPDATE questions SET testset = ? WHERE testset = ?').run(plan.toTestset, plan.fromTestset);
    db.prepare('UPDATE runs SET run_set_id = ?, testset = ? WHERE run_set_id = ?').run(
      plan.toRunSet,
      plan.toTestset,
      plan.fromRunSet,
    );
    db.prepare('UPDATE run_history SET run_set_id = ?, testset = ? WHERE run_set_id = ?').run(
      plan.toRunSet,
      plan.toTestset,
      plan.fromRunSet,
    );

    db.prepare('DELETE FROM run_sets WHERE id = ?').run(plan.fromRunSet);
    db.prepare('DELETE FROM testsets WHERE id = ? AND NOT EXISTS (SELECT 1 FROM questions WHERE testset = ?)').run(
      plan.fromTestset,
      plan.fromTestset,
    );
  }

  let deletedRuns = 0;
  let deletedScores = 0;
  if (deleteRunSets.length > 0) {
    const placeholders = deleteRunSets.map(() => '?').join(',');
    db.prepare('DROP TABLE IF EXISTS temp_delete_runs').run();
    db.prepare('DROP TABLE IF EXISTS temp_delete_scores').run();
    db.prepare(`CREATE TEMP TABLE temp_delete_runs AS SELECT id FROM runs WHERE run_set_id IN (${placeholders})`).run(...deleteRunSets);
    db.prepare('CREATE TEMP TABLE temp_delete_scores AS SELECT id FROM scores WHERE run_id IN (SELECT id FROM temp_delete_runs)').run();

    deletedRuns = db.prepare('SELECT COUNT(*) AS count FROM temp_delete_runs').get().count;
    deletedScores = db.prepare('SELECT COUNT(*) AS count FROM temp_delete_scores').get().count;

    db.prepare('DELETE FROM checkpoint_results WHERE score_id IN (SELECT id FROM temp_delete_scores)').run();
    db.prepare('DELETE FROM scores WHERE id IN (SELECT id FROM temp_delete_scores)').run();
    db.prepare(`
      DELETE FROM checkpoint_results_history
      WHERE score_history_id IN (
        SELECT id FROM score_history WHERE run_id IN (SELECT id FROM temp_delete_runs)
      )
    `).run();
    db.prepare('DELETE FROM score_history WHERE run_id IN (SELECT id FROM temp_delete_runs)').run();
    db.prepare('DELETE FROM run_steps WHERE run_id IN (SELECT id FROM temp_delete_runs)').run();
    db.prepare('DELETE FROM run_history WHERE original_run_id IN (SELECT id FROM temp_delete_runs)').run();
    db.prepare(`DELETE FROM run_history WHERE run_set_id IN (${placeholders})`).run(...deleteRunSets);
    db.prepare('DELETE FROM runs WHERE id IN (SELECT id FROM temp_delete_runs)').run();
    db.prepare(`DELETE FROM run_sets WHERE id IN (${placeholders})`).run(...deleteRunSets);
    db.prepare('DROP TABLE IF EXISTS temp_delete_runs').run();
    db.prepare('DROP TABLE IF EXISTS temp_delete_scores').run();
  }

  return {
    renamed: renamePlans,
    deletedRunSets: deleteRunSets.length,
    deletedRuns,
    deletedScores,
    backupPath,
  };
});

const result = tx();

console.log(JSON.stringify(result, null, 2));
console.log('Remaining CE runsets:');
console.table(db.prepare(`
  SELECT run_set_id, testset, COUNT(*) AS runs, COUNT(DISTINCT question_id) AS questions
  FROM runs
  WHERE run_set_id LIKE 'ce_%'
  GROUP BY run_set_id, testset
  ORDER BY run_set_id, testset
`).all());

console.log('CE testsets:');
console.table(db.prepare(`
  SELECT testset, COUNT(*) AS questions, SUM(CASE WHEN computer_evaluable = 1 THEN 1 ELSE 0 END) AS ce
  FROM questions
  WHERE testset LIKE 'ce_%'
  GROUP BY testset
  ORDER BY testset
`).all());

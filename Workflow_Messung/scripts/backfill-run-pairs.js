const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.resolve(__dirname, '../data/matura.db'));

db.exec(`
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
`);

const rows = db.prepare(`
  WITH direct_keys AS (
    SELECT
      llm_config_id,
      question_id,
      COALESCE(testset, '') AS testset_key,
      COALESCE(run_set_id, '') AS run_set_key,
      COALESCE(comparison_group_id, '') AS comparison_group_key,
      COALESCE(run_nr, -1) AS run_nr_key,
      COUNT(*) AS direct_count,
      MIN(id) AS direct_run_id
    FROM runs
    WHERE status = 'completed'
      AND setup_id IN ('setup_direct', 'setup_ce_direct')
      AND COALESCE(comparison_group_id, '') != ''
    GROUP BY
      llm_config_id,
      question_id,
      COALESCE(testset, ''),
      COALESCE(run_set_id, ''),
      COALESCE(comparison_group_id, ''),
      COALESCE(run_nr, -1)
  )
  SELECT
    d.direct_run_id,
    w.id AS workflow_run_id,
    w.run_set_id,
    w.comparison_group_id,
    w.run_nr
  FROM direct_keys d
  JOIN runs w
    ON w.llm_config_id = d.llm_config_id
   AND w.question_id = d.question_id
   AND COALESCE(w.testset, '') = d.testset_key
   AND COALESCE(w.run_set_id, '') = d.run_set_key
   AND COALESCE(w.comparison_group_id, '') = d.comparison_group_key
   AND COALESCE(w.run_nr, -1) = d.run_nr_key
  WHERE d.direct_count = 1
    AND w.status = 'completed'
    AND w.setup_id NOT IN ('setup_direct', 'setup_ce_direct')
`).all();

const existingConflict = db.prepare('SELECT direct_run_id FROM run_pairs WHERE workflow_run_id = ?');
const insert = db.prepare(`
  INSERT INTO run_pairs (
    direct_run_id,
    workflow_run_id,
    run_set_id,
    comparison_group_id,
    run_nr,
    pair_source
  )
  VALUES (?, ?, ?, ?, ?, 'backfill_unambiguous_direct_key')
  ON CONFLICT(workflow_run_id) DO UPDATE SET
    run_set_id = excluded.run_set_id,
    comparison_group_id = excluded.comparison_group_id,
    run_nr = excluded.run_nr,
    pair_source = excluded.pair_source,
    updated_at = CURRENT_TIMESTAMP
`);

let insertedOrUpdated = 0;
let skippedConflict = 0;

const tx = db.transaction(() => {
  for (const row of rows) {
    const existing = existingConflict.get(row.workflow_run_id);
    if (existing && existing.direct_run_id !== row.direct_run_id) {
      skippedConflict += 1;
      continue;
    }
    insert.run(
      row.direct_run_id,
      row.workflow_run_id,
      row.run_set_id,
      row.comparison_group_id,
      row.run_nr,
    );
    insertedOrUpdated += 1;
  }
});

tx();

const totalPairs = db.prepare('SELECT COUNT(*) AS c FROM run_pairs').get().c;
const additivePairs = db.prepare(`
  SELECT COUNT(*) AS c
  FROM run_pairs rp
  JOIN runs w ON w.id = rp.workflow_run_id
  WHERE w.run_set_id = 'ce_additive_completion_10pm_20260526'
`).get().c;

console.log(JSON.stringify({
  candidateRows: rows.length,
  insertedOrUpdated,
  skippedConflict,
  totalPairs,
  additivePairs,
}, null, 2));

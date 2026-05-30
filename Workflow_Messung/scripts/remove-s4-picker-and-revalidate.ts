import db from '../src/db/index';
import { scoreComputerEvaluableRun } from '../src/engine/scorer';
import type { CheckpointRow, QuestionRow } from '../src/db/index';

type RunRow = {
  id: number;
  run_set_id: string | null;
  question_id: number;
  final_answer: string | null;
};

async function main() {
  const selectionSteps = db.prepare(`
    SELECT rs.id, rs.run_id
    FROM run_steps rs
    JOIN runs r ON r.id = rs.run_id
    WHERE r.setup_id = 'setup_ce_flowreview_s4'
      AND (
        rs.system_prompt_used LIKE 'Deterministic CE final selection%'
        OR rs.response_text LIKE '[Deterministic CE final selection]%'
        OR COALESCE(rs.formal_step, rs.step) = 3
      )
  `).all() as Array<{ id: number; run_id: number }>;

  const affectedRunIds = [...new Set(selectionSteps.map(row => row.run_id))];

  const runs = db.prepare(`
    SELECT r.id, r.run_set_id, r.question_id, rs.final_answer
    FROM runs r
    JOIN questions q ON q.id = r.question_id
    JOIN run_steps rs ON rs.run_id = r.id
    WHERE r.setup_id IN ('setup_ce_direct', 'setup_ce_flowreview_s4')
      AND r.status = 'completed'
      AND COALESCE(q.computer_evaluable, 0) = 1
      AND q.evaluation_type = 'json_exact'
      AND (
        (r.setup_id = 'setup_ce_direct' AND COALESCE(rs.formal_step, rs.step) = 1)
        OR (r.setup_id = 'setup_ce_flowreview_s4' AND COALESCE(rs.formal_step, rs.step) = 2)
      )
    ORDER BY r.run_set_id, r.id
  `).all() as RunRow[];

  const questionCache = new Map<number, QuestionRow>();
  const checkpointCache = new Map<number, CheckpointRow[]>();

  const tx = db.transaction(() => {
    const deleteStep = db.prepare('DELETE FROM run_steps WHERE id = ?');
    for (const row of selectionSteps) deleteStep.run(row.id);

    for (const run of runs) {
      if (!questionCache.has(run.question_id)) {
        questionCache.set(run.question_id, db.prepare('SELECT * FROM questions WHERE id = ?').get(run.question_id) as QuestionRow);
      }
      if (!checkpointCache.has(run.question_id)) {
        checkpointCache.set(run.question_id, db.prepare('SELECT * FROM checkpoints WHERE question_id = ? ORDER BY sort_order ASC').all(run.question_id) as CheckpointRow[]);
      }
      scoreComputerEvaluableRun(
        run.id,
        questionCache.get(run.question_id)!,
        checkpointCache.get(run.question_id)!,
        run.final_answer ?? '',
        'bulk_s4_no_picker_revalidate',
      );
    }
  });
  tx();

  const byRunSet = new Map<string, number>();
  for (const run of runs) byRunSet.set(run.run_set_id || '(none)', (byRunSet.get(run.run_set_id || '(none)') || 0) + 1);

  const selectionLeft = db.prepare(`
    SELECT COUNT(*) AS c
    FROM run_steps rs
    JOIN runs r ON r.id = rs.run_id
    WHERE r.setup_id = 'setup_ce_flowreview_s4'
      AND (
        rs.system_prompt_used LIKE 'Deterministic CE final selection%'
        OR rs.response_text LIKE '[Deterministic CE final selection]%'
        OR COALESCE(rs.formal_step, rs.step) = 3
      )
  `).get() as { c: number };

  console.log(JSON.stringify({
    removedSelectionSteps: selectionSteps.length,
    affectedRuns: affectedRunIds.length,
    rescoredRuns: runs.length,
    byRunSet: Object.fromEntries(byRunSet),
    selectionStepsLeft: selectionLeft.c,
  }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

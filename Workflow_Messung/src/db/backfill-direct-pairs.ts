import 'dotenv/config';
import db from './index';
import { executeRun } from '../engine/workflow';

interface WorkflowRun {
  id: number;
  question_id: number;
  llm_config_id: number;
  testset: string | null;
  comparison_group_id: string | null;
  run_nr: number | null;
}

async function main(): Promise<void> {
  const workflowRuns = db.prepare(`
    SELECT id, question_id, llm_config_id, testset, comparison_group_id, run_nr
    FROM runs
    WHERE setup_id != 'setup_direct'
    ORDER BY id
  `).all() as WorkflowRun[];

  let created = 0;
  let skipped = 0;

  for (const run of workflowRuns) {
    const comparisonGroupId = run.comparison_group_id ?? `q${run.question_id}`;
    const testset = run.testset ?? 'basic_general_questions';

    let runNr = run.run_nr;
    if (!runNr) {
      const countForQuestion = db.prepare(`
        SELECT COUNT(*) as count
        FROM runs
        WHERE setup_id != 'setup_direct'
          AND question_id = ?
          AND llm_config_id = ?
          AND testset = ?
          AND comparison_group_id = ?
          AND id <= ?
      `).get(run.question_id, run.llm_config_id, testset, comparisonGroupId, run.id) as { count: number };

      runNr = countForQuestion.count;
      db.prepare('UPDATE runs SET run_nr = ?, comparison_group_id = ? WHERE id = ?')
        .run(runNr, comparisonGroupId, run.id);
    }

    const existingDirect = db.prepare(`
      SELECT id
      FROM runs
      WHERE setup_id = 'setup_direct'
        AND question_id = ?
        AND llm_config_id = ?
        AND testset = ?
        AND comparison_group_id = ?
        AND run_nr = ?
      LIMIT 1
    `).get(run.question_id, run.llm_config_id, testset, comparisonGroupId, runNr) as { id: number } | undefined;

    if (existingDirect) {
      skipped++;
      console.log(`skip workflow #${run.id}: direct #${existingDirect.id} already exists`);
      continue;
    }

    console.log(`create direct pair for workflow #${run.id}: q${run.question_id}, run_nr ${runNr}`);
    const result = await executeRun({
      setupId: 'setup_direct',
      llmConfigId: run.llm_config_id,
      questionId: run.question_id,
      testset,
      comparisonGroupId,
      runNr,
    });

    if (result.error) {
      console.error(`direct pair failed for workflow #${run.id}: ${result.error}`);
    } else {
      created++;
      console.log(`created direct #${result.runId}`);
    }
  }

  console.log(`Backfill done. Created: ${created}. Skipped: ${skipped}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

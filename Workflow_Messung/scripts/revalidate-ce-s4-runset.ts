import db from '../src/db/index';
import { scorePairRuns, validatePairScoring } from '../src/engine/scorer';
import { getPreferredScoringModelId } from '../src/settings';

const runSetId = process.argv[2] ?? 'ce_v2_s4_3x_model3_existing_batch_6';
const scoringModelId = getPreferredScoringModelId();

if (!scoringModelId) {
  throw new Error('No preferred scoring model configured.');
}

type PairRow = {
  direct_id: number;
  workflow_id: number;
  question_id: number;
  run_nr: number | null;
};

const pairs = db.prepare(`
  SELECT rd.id as direct_id,
         rw.id as workflow_id,
         rd.question_id,
         rd.run_nr
  FROM runs rd
  JOIN runs rw
    ON rw.question_id = rd.question_id
   AND rw.llm_config_id = rd.llm_config_id
   AND COALESCE(rw.testset, '') = COALESCE(rd.testset, '')
   AND COALESCE(rw.run_set_id, '') = COALESCE(rd.run_set_id, '')
   AND COALESCE(rw.run_nr, -1) = COALESCE(rd.run_nr, -1)
   AND COALESCE(rw.comparison_group_id, '') = COALESCE(rd.comparison_group_id, '')
  WHERE rd.run_set_id = ?
    AND rd.setup_id = 'setup_ce_direct'
    AND rw.setup_id = 'setup_ce_flowreview_s4'
    AND rd.status = 'completed'
    AND rw.status = 'completed'
  ORDER BY rd.question_id, rd.run_nr, rd.id
`).all(runSetId) as PairRow[];

async function main(): Promise<void> {
  console.log(JSON.stringify({ runSetId, scoringModelId, pairs: pairs.length }));

  let done = 0;
  let reviewRequired = 0;
  let errors = 0;

  for (const pair of pairs) {
    try {
      await scorePairRuns(pair.direct_id, pair.workflow_id, scoringModelId);
      const validation = await validatePairScoring(pair.direct_id, pair.workflow_id, scoringModelId);
      if (validation.reviewRequired) reviewRequired += 1;
    } catch (err) {
      errors += 1;
      console.error(JSON.stringify({
        direct_id: pair.direct_id,
        workflow_id: pair.workflow_id,
        question_id: pair.question_id,
        run_nr: pair.run_nr,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
    done += 1;
    if (done % 25 === 0 || done === pairs.length) {
      console.log(JSON.stringify({ done, total: pairs.length, reviewRequired, errors }));
    }
  }

  console.log(JSON.stringify({ finished: true, done, total: pairs.length, reviewRequired, errors }));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

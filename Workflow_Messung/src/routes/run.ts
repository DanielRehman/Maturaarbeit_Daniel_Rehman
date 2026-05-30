import { Router, Request, Response } from 'express';
import db from '../db/index';
import { executeRun } from '../engine/workflow';
import { scorePairRuns, scoreRun, validatePairScoring } from '../engine/scorer';
import { getPreferredScoringModelId, usePairedCheckpointScoring } from '../settings';

const router = Router();

function isDirectSetup(setupId: string | null | undefined): boolean {
  return setupId === 'setup_direct' || setupId === 'setup_ce_direct';
}

function directSetupFor(setupId: string): string {
  return setupId.startsWith('setup_ce_') ? 'setup_ce_direct' : 'setup_direct';
}

function isWorkflowForDirect(workflowSetupId: string, directSetupId: string): boolean {
  if (directSetupId === 'setup_ce_direct') return workflowSetupId.startsWith('setup_ce_') && workflowSetupId !== 'setup_ce_direct';
  return workflowSetupId !== 'setup_direct' && !workflowSetupId.startsWith('setup_ce_');
}

function nextRunNr(questionId: number, llmConfigId: number, testset: string, runSetId: string, comparisonGroupId: string): number {
  const row = db.prepare(`
    SELECT COALESCE(MAX(run_nr), 0) + 1 as next_nr
    FROM runs
    WHERE question_id = ?
      AND llm_config_id = ?
      AND testset = ?
      AND run_set_id = ?
      AND comparison_group_id = ?
  `).get(questionId, llmConfigId, testset, runSetId, comparisonGroupId) as { next_nr: number };

  return row.next_nr;
}

function findCompletedRun(
  setupId: string,
  llmConfigId: number,
  questionId: number,
  testset: string,
  runSetId: string,
  comparisonGroupId: string,
  runNr: number,
): { id: number } | undefined {
  return db.prepare(`
    SELECT id
    FROM runs
    WHERE setup_id = ?
      AND llm_config_id = ?
      AND question_id = ?
      AND testset = ?
      AND run_set_id = ?
      AND comparison_group_id = ?
      AND run_nr = ?
      AND status = 'completed'
    ORDER BY id DESC
    LIMIT 1
  `).get(setupId, llmConfigId, questionId, testset, runSetId, comparisonGroupId, runNr) as { id: number } | undefined;
}

function preferredAnswerModelId(): number | null {
  const preferred = db.prepare(`
    SELECT id
    FROM llm_configs
    WHERE active = 1
      AND model_id = 'gpt-3.5-turbo'
    LIMIT 1
  `).get() as { id: number } | undefined;

  return preferred?.id ?? null;
}

type RunForRerun = {
  id: number;
  setup_id: string;
  llm_config_id: number;
  question_id: number;
  testset: string | null;
  run_set_id: string | null;
  run_nr: number | null;
  comparison_group_id: string | null;
};

function archiveRunForRerun(runId: number, reason: string): void {
  const run = db.prepare('SELECT * FROM runs WHERE id = ?').get(runId);
  if (!run) return;
  const steps = db.prepare('SELECT * FROM run_steps WHERE run_id = ? ORDER BY step').all(runId);
  const score = db.prepare('SELECT * FROM scores WHERE run_id = ?').get(runId) as { id: number; score_percent?: number | null } | undefined;
  const checkpointResults = score
    ? db.prepare('SELECT * FROM checkpoint_results WHERE score_id = ? ORDER BY id').all(score.id)
    : [];
  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO run_history (
        original_run_id,
        setup_id,
        llm_config_id,
        question_id,
        testset,
        run_set_id,
        run_nr,
        comparison_group_id,
        status,
        score_percent,
        archived_reason,
        run_json,
        steps_json,
        score_json,
        checkpoint_results_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      runId,
      (run as RunForRerun).setup_id,
      (run as RunForRerun).llm_config_id,
      (run as RunForRerun).question_id,
      (run as RunForRerun).testset,
      (run as RunForRerun).run_set_id,
      (run as RunForRerun).run_nr,
      (run as RunForRerun).comparison_group_id,
      (run as RunForRerun & { status?: string }).status ?? null,
      (score as { score_percent?: number | null } | undefined)?.score_percent ?? null,
      reason,
      JSON.stringify(run),
      JSON.stringify(steps),
      score ? JSON.stringify(score) : null,
      JSON.stringify(checkpointResults),
    );
    db.prepare(`
      UPDATE runs
      SET status = 'archived',
          exclude_from_analysis = 1,
          exclude_reason = COALESCE(NULLIF(exclude_reason, ''), ?)
      WHERE id = ?
    `).run(reason, runId);
  });
  tx();
}

function findPairedRuns(run: RunForRerun): RunForRerun[] {
  if (!run.comparison_group_id) return [];
  return db.prepare(`
    SELECT *
    FROM runs
    WHERE comparison_group_id = ?
      AND question_id = ?
      AND llm_config_id = ?
      AND COALESCE(run_nr, -1) = COALESCE(?, -1)
      AND COALESCE(testset, '') = COALESCE(?, '')
      AND COALESCE(run_set_id, '') = COALESCE(?, '')
      AND id != ?
      AND (
        (setup_id IN ('setup_direct', 'setup_ce_direct') AND ? NOT IN ('setup_direct', 'setup_ce_direct') AND (
          (setup_id = 'setup_direct' AND ? NOT LIKE 'setup_ce_%')
          OR (setup_id = 'setup_ce_direct' AND ? LIKE 'setup_ce_%')
        ))
        OR (setup_id NOT IN ('setup_direct', 'setup_ce_direct') AND ? IN ('setup_direct', 'setup_ce_direct') AND (
          (? = 'setup_direct' AND setup_id NOT LIKE 'setup_ce_%')
          OR (? = 'setup_ce_direct' AND setup_id LIKE 'setup_ce_%')
        ))
      )
    ORDER BY id DESC
  `).all(
    run.comparison_group_id,
    run.question_id,
    run.llm_config_id,
    run.run_nr ?? null,
    run.testset ?? '',
    run.run_set_id ?? '',
    run.id,
    run.setup_id,
    run.setup_id,
    run.setup_id,
    run.setup_id,
    run.setup_id,
    run.setup_id,
  ) as RunForRerun[];
}

// GET /run - render run page
router.get('/run', (req: Request, res: Response) => {
  const setups = db.prepare('SELECT * FROM setups ORDER BY id').all();
  const models = db.prepare('SELECT * FROM llm_configs WHERE active = 1 ORDER BY id').all();
  const criteria = db.prepare('SELECT * FROM criteria ORDER BY id').all();
  const questions = db.prepare('SELECT q.*, c.name_de as criteria_name FROM questions q JOIN criteria c ON q.criteria_id = c.id ORDER BY q.id').all();
  const testsets = db.prepare('SELECT * FROM testsets ORDER BY name, id').all();
  const runSets = db.prepare('SELECT * FROM run_sets ORDER BY name, created_at, id').all();

  res.render('run', {
    title: 'Run',
    activePage: 'run',
    setups,
    models,
    criteria,
    questions,
    testsets,
    runSets,
    preferredScoringModelId: getPreferredScoringModelId(),
    preferredAnswerModelId: preferredAnswerModelId(),
  });
});

// GET /api/run-sets
router.get('/api/run-sets', (req: Request, res: Response) => {
  const runSets = db.prepare(`
    SELECT rs.id,
           rs.name,
           rs.created_at,
           COUNT(r.id) as run_count
    FROM run_sets rs
    LEFT JOIN runs r ON r.run_set_id = rs.id
    GROUP BY rs.id
    ORDER BY rs.created_at, rs.id
  `).all();
  res.json(runSets);
});

// POST /api/run-sets
router.post('/api/run-sets', (req: Request, res: Response) => {
  const { id, name } = req.body as { id?: string; name?: string };
  const raw = (id ?? name ?? '').trim();
  if (!raw) {
    res.status(400).json({ error: 'run set name is required' });
    return;
  }
  const safeId = raw.toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || raw;
  db.prepare('INSERT OR IGNORE INTO run_sets (id, name) VALUES (?, ?)').run(safeId, raw);
  res.json({ id: safeId, name: raw, success: true });
});

// POST /api/runs - execute a run
router.post('/api/runs', async (req: Request, res: Response) => {
  try {
    const { setupId, llmConfigId, questionId, testset, runSetId, runNr } = req.body as {
      setupId: string;
      llmConfigId: number;
      questionId: number;
      testset: string;
      runSetId?: string;
      runNr?: number;
    };

    if (!setupId || !llmConfigId || !questionId) {
      res.status(400).json({ error: 'Missing required fields: setupId, llmConfigId, questionId' });
      return;
    }

    if (isDirectSetup(setupId)) {
      res.status(400).json({
        error: 'Direct baseline setups cannot be run alone. Choose a workflow setup; the matching direct baseline is created automatically.',
      });
      return;
    }

    const numericLlmConfigId = Number(llmConfigId);
    const numericQuestionId = Number(questionId);
    const question = db.prepare('SELECT computer_evaluable FROM questions WHERE id = ?').get(numericQuestionId) as { computer_evaluable: number | null } | undefined;
    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }
    const questionIsCe = Number(question.computer_evaluable ?? 0) === 1;
    const setupIsCe = setupId.startsWith('setup_ce_');
    if (questionIsCe && !setupIsCe) {
      res.status(400).json({ error: 'Computer-evaluable questions must be run with CE setups only.' });
      return;
    }
    if (!questionIsCe && setupIsCe) {
      res.status(400).json({ error: 'CE setups can only run computer-evaluable questions.' });
      return;
    }
    const effectiveTestset = testset ?? 'basic_general_questions';
    const effectiveRunSetId = (runSetId ?? 'legacy_existing_import').trim() || 'legacy_existing_import';
    db.prepare('INSERT OR IGNORE INTO run_sets (id, name) VALUES (?, ?)').run(effectiveRunSetId, effectiveRunSetId);
    const comparisonGroupId = `q${numericQuestionId}`;
    const effectiveRunNr = runNr
      ? Number(runNr)
      : nextRunNr(numericQuestionId, numericLlmConfigId, effectiveTestset, effectiveRunSetId, comparisonGroupId);
    const directSetupId = directSetupFor(setupId);

    let pairedDirectRunId: number | null = null;

    const existingWorkflowRun = findCompletedRun(
      setupId,
      numericLlmConfigId,
      numericQuestionId,
      effectiveTestset,
      effectiveRunSetId,
      comparisonGroupId,
      effectiveRunNr,
    );

    if (existingWorkflowRun) {
      const existingDirectRun = findCompletedRun(
        directSetupId,
        numericLlmConfigId,
        numericQuestionId,
        effectiveTestset,
        effectiveRunSetId,
        comparisonGroupId,
        effectiveRunNr,
      );
      res.json({
        runId: existingWorkflowRun.id,
        pairedDirectRunId: existingDirectRun?.id ?? null,
        runNr: effectiveRunNr,
        comparisonGroupId,
        existing: true,
        steps: [],
      });
      return;
    }

    // Every workflow run gets its matching direct single-prompt baseline.
    // Both records share comparison_group_id + run_nr, so the UI/statistics can pair them.
    if (!isDirectSetup(setupId)) {
      const existingDirectRun = findCompletedRun(
        directSetupId,
        numericLlmConfigId,
        numericQuestionId,
        effectiveTestset,
        effectiveRunSetId,
        comparisonGroupId,
        effectiveRunNr,
      );

      if (existingDirectRun) {
        pairedDirectRunId = existingDirectRun.id;
      } else {
        const directResult = await executeRun({
          setupId: directSetupId,
          llmConfigId: numericLlmConfigId,
          questionId: numericQuestionId,
          testset: effectiveTestset,
          runSetId: effectiveRunSetId,
          runNr: effectiveRunNr,
          comparisonGroupId,
        });

        if (directResult.error) {
          res.status(500).json({ error: `Direct baseline failed: ${directResult.error}`, pairedDirectRunId: directResult.runId });
          return;
        }

        pairedDirectRunId = directResult.runId;
      }
    }

    const result = await executeRun({
      setupId,
      llmConfigId: numericLlmConfigId,
      questionId: numericQuestionId,
      testset: effectiveTestset,
      runSetId: effectiveRunSetId,
      runNr: effectiveRunNr,
      comparisonGroupId,
    });

    const scoringModelId = getPreferredScoringModelId() ?? numericLlmConfigId;
    let pairedScore: Awaited<ReturnType<typeof scorePairRuns>> | undefined;
    let pairValidation: Awaited<ReturnType<typeof validatePairScoring>> | undefined;
    if (pairedDirectRunId && !result.error) {
      if (usePairedCheckpointScoring()) {
        try {
          pairedScore = await scorePairRuns(pairedDirectRunId, result.runId, scoringModelId);
        } catch (pairedScoreErr) {
          console.error('Paired checkpoint scoring failed:', pairedScoreErr instanceof Error ? pairedScoreErr.message : pairedScoreErr);
        }
      }
      try {
        pairValidation = await validatePairScoring(pairedDirectRunId, result.runId, scoringModelId);
      } catch (validationErr) {
        console.error('Pair post-analysis failed:', validationErr instanceof Error ? validationErr.message : validationErr);
      }
    }

    res.json({ ...result, pairedDirectRunId, runNr: effectiveRunNr, runSetId: effectiveRunSetId, comparisonGroupId, pairedScore, pairValidation });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// POST /api/runs/:id/rerun - force rerun the selected pair side(s)
router.post('/api/runs/:id/rerun', async (req: Request, res: Response) => {
  try {
    const runId = Number(req.params['id']);
    const { mode } = req.body as { mode?: 'all' | 'single' | 'workflow' };
    const rerunMode = mode || 'all';
    if (!['all', 'single', 'workflow'].includes(rerunMode)) {
      res.status(400).json({ error: 'mode must be all, single, or workflow' });
      return;
    }

    const run = db.prepare('SELECT * FROM runs WHERE id = ?').get(runId) as RunForRerun | undefined;
    if (!run) {
      res.status(404).json({ error: 'Run not found' });
      return;
    }

    const paired = findPairedRuns(run);
    const allCandidates = [run, ...paired];
    const directSetupId = isDirectSetup(run.setup_id) ? run.setup_id : directSetupFor(run.setup_id);
    const direct = allCandidates.find(r => r.setup_id === directSetupId);
    const workflows = allCandidates.filter(r => isWorkflowForDirect(r.setup_id, directSetupId));

    const targets = new Map<number, RunForRerun>();
    if (rerunMode === 'single' || rerunMode === 'all') {
      if (direct) targets.set(direct.id, direct);
      else if (isDirectSetup(run.setup_id)) targets.set(run.id, run);
    }
    if (rerunMode === 'workflow' || rerunMode === 'all') {
      for (const workflow of workflows.length ? workflows : (!isDirectSetup(run.setup_id) ? [run] : [])) {
        targets.set(workflow.id, workflow);
      }
    }

    if (targets.size === 0) {
      res.status(400).json({ error: 'No matching run side found for this rerun mode.' });
      return;
    }

    const workflowTargets = [...targets.values()].filter(r => isWorkflowForDirect(r.setup_id, directSetupId));
    const directTarget = [...targets.values()].find(r => r.setup_id === directSetupId);
    const archivedIds = [...targets.keys()];
    for (const id of archivedIds) archiveRunForRerun(id, `force_rerun_${rerunMode}`);

    const results: Array<{ oldRunId: number; newRunId: number; setupId: string; error?: string }> = [];

    if (directTarget) {
      const result = await executeRun({
        setupId: directSetupId,
        llmConfigId: directTarget.llm_config_id,
        questionId: directTarget.question_id,
        testset: directTarget.testset || 'basic_general_questions',
        runSetId: directTarget.run_set_id || 'legacy_existing_import',
        runNr: directTarget.run_nr ?? undefined,
        comparisonGroupId: directTarget.comparison_group_id || `q${directTarget.question_id}`,
      });
      if (result.error) throw new Error(result.error);
      results.push({ oldRunId: directTarget.id, newRunId: result.runId, setupId: directSetupId });
    }

    for (const workflow of workflowTargets) {
      const result = await executeRun({
        setupId: workflow.setup_id,
        llmConfigId: workflow.llm_config_id,
        questionId: workflow.question_id,
        testset: workflow.testset || 'basic_general_questions',
        runSetId: workflow.run_set_id || 'legacy_existing_import',
        runNr: workflow.run_nr ?? undefined,
        comparisonGroupId: workflow.comparison_group_id || `q${workflow.question_id}`,
      });
      if (result.error) throw new Error(result.error);
      results.push({ oldRunId: workflow.id, newRunId: result.runId, setupId: workflow.setup_id });
    }

    const newDirect = results.find(result => result.setupId === directSetupId);
    const pairedScoreResults: Array<{ directRunId: number; workflowRunId: number; result: Awaited<ReturnType<typeof scorePairRuns>> }> = [];
    const pairValidationResults: Array<{ directRunId: number; workflowRunId: number; result: Awaited<ReturnType<typeof validatePairScoring>> }> = [];
    for (const workflowResult of results.filter(result => isWorkflowForDirect(result.setupId, directSetupId))) {
      const oldWorkflow = workflowTargets.find(workflow => workflow.id === workflowResult.oldRunId);
      const directRunId = newDirect?.newRunId ?? direct?.id;
      if (!oldWorkflow || !directRunId) continue;
      const scoringModelId = getPreferredScoringModelId() ?? oldWorkflow.llm_config_id;
      if (usePairedCheckpointScoring()) {
        try {
          const pairedScore = await scorePairRuns(directRunId, workflowResult.newRunId, scoringModelId);
          pairedScoreResults.push({ directRunId, workflowRunId: workflowResult.newRunId, result: pairedScore });
        } catch (pairedScoreErr) {
          console.error('Paired checkpoint scoring failed:', pairedScoreErr instanceof Error ? pairedScoreErr.message : pairedScoreErr);
        }
      }
      try {
        const validation = await validatePairScoring(directRunId, workflowResult.newRunId, scoringModelId);
        pairValidationResults.push({ directRunId, workflowRunId: workflowResult.newRunId, result: validation });
      } catch (validationErr) {
        console.error('Pair post-analysis failed:', validationErr instanceof Error ? validationErr.message : validationErr);
      }
    }

    res.json({ success: true, mode: rerunMode, archivedIds, results, pairedScoreResults, pairValidationResults });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// GET /api/runs - list runs with optional filters
router.get('/api/runs', (req: Request, res: Response) => {
  const { setupId, questionId, testset, runSetId, comparisonGroupId, llmConfigId, runNr, excludeRunId } = req.query as {
    setupId?: string;
    questionId?: string;
    testset?: string;
    runSetId?: string;
    comparisonGroupId?: string;
    llmConfigId?: string;
    runNr?: string;
    excludeRunId?: string;
  };

  let query = `
    SELECT r.*,
           s.name as setup_name,
           lc.label as model_label,
           lc.model_id,
           lc.provider,
           q.question_text,
           q.criteria_id,
           q.notes,
           c.name_de as criteria_name,
           rs.name as run_set_name,
           sc.score_percent,
           sc.passed_checkpoints,
           sc.total_checkpoints,
           sc.review_required,
           sc.review_reason,
           sc.report
    FROM runs r
    JOIN setups s ON r.setup_id = s.id
    JOIN llm_configs lc ON r.llm_config_id = lc.id
    JOIN questions q ON r.question_id = q.id
    JOIN criteria c ON q.criteria_id = c.id
    LEFT JOIN run_sets rs ON rs.id = r.run_set_id
    LEFT JOIN scores sc ON sc.run_id = r.id
    WHERE 1=1
  `;

  const queryParams: (string | number)[] = [];

  if (setupId) {
    query += ' AND r.setup_id = ?';
    queryParams.push(setupId);
  }
  if (questionId) {
    query += ' AND r.question_id = ?';
    queryParams.push(Number(questionId));
  }
  if (llmConfigId) {
    query += ' AND r.llm_config_id = ?';
    queryParams.push(Number(llmConfigId));
  }
  if (runNr) {
    query += ' AND COALESCE(r.run_nr, -1) = COALESCE(?, -1)';
    queryParams.push(Number(runNr));
  }
  if (testset) {
    query += ' AND r.testset = ?';
    queryParams.push(testset);
  }
  if (runSetId) {
    query += ' AND r.run_set_id = ?';
    queryParams.push(runSetId);
  }
  if (comparisonGroupId) {
    query += ' AND r.comparison_group_id = ?';
    queryParams.push(comparisonGroupId);
  }
  if (excludeRunId) {
    query += ' AND r.id != ?';
    queryParams.push(Number(excludeRunId));
  }

  query += ' ORDER BY r.created_at DESC';

  const runs = db.prepare(query).all(...queryParams);
  res.json(runs);
});

// GET /api/runs/search - paged run search for the Run page table
router.get('/api/runs/search', (req: Request, res: Response) => {
  const {
    runId,
    runNr,
    text,
    testset,
    runSetId,
    setupId,
    criteriaId,
    status,
    hasSearch,
    hasAutoanswer,
    hasError,
    hasReview,
    scoreFrom,
    scoreTo,
    singleScoreFrom,
    singleScoreTo,
    scoredFrom,
    scoredTo,
    diffFrom,
    diffTo,
    limit: rawLimit,
    offset: rawOffset,
  } = req.query as {
    runId?: string;
    runNr?: string;
    text?: string;
    testset?: string;
    runSetId?: string;
    setupId?: string;
    criteriaId?: string;
    status?: string;
    hasSearch?: string;
    hasAutoanswer?: string;
    hasError?: string;
    hasReview?: string;
    scoreFrom?: string;
    scoreTo?: string;
    singleScoreFrom?: string;
    singleScoreTo?: string;
    scoredFrom?: string;
    scoredTo?: string;
    diffFrom?: string;
    diffTo?: string;
    sortKey?: string;
    sortDir?: string;
    limit?: string;
    offset?: string;
  };

  const limit = Math.min(Math.max(Number(rawLimit ?? 25), 1), 100);
  const offset = Math.max(Number(rawOffset ?? 0), 0);
  const where: string[] = ['1=1'];
  const params: (string | number)[] = [];
  const addNumberFilter = (value: string | undefined, sql: string): void => {
    if (value === undefined || value.trim() === '') return;
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    where.push(sql);
    params.push(n);
  };
  const singleScoreExpr = `CASE
    WHEN r.setup_id IN ('setup_direct', 'setup_ce_direct') THEN sc.score_percent
    ELSE pair_sc.score_percent
  END`;
  const pairDiffExpr = `CASE
    WHEN sc.score_percent IS NULL OR pair_sc.score_percent IS NULL THEN NULL
    WHEN r.setup_id IN ('setup_direct', 'setup_ce_direct') THEN pair_sc.score_percent - sc.score_percent
    ELSE sc.score_percent - pair_sc.score_percent
  END`;
  const sortMap: Record<string, string> = {
    id: 'r.id',
    runNr: 'r.run_nr',
    date: 'r.created_at',
    scored: 'sc.scored_at',
    testset: 'r.testset',
    runSet: 'COALESCE(rs.name, r.run_set_id)',
    setup: 's.name',
    criteria: 'c.name_de',
    question: 'q.question_text',
    steps: 'COALESCE(step_stats.step_count, 0)',
    internet: 'COALESCE(step_stats.internet_step_count, 0)',
    search: 'COALESCE(step_stats.search_step_count, 0)',
    auto: 'COALESCE(step_stats.autoanswer_count, 0)',
    repeat: 'COALESCE(step_stats.repeated_formal_step_count, 0)',
    score: 'sc.score_percent',
    singleScore: singleScoreExpr,
    diff: pairDiffExpr,
    review: 'COALESCE(sc.review_required, 0)',
    excluded: 'COALESCE(r.exclude_from_analysis, 0)',
    status: 'r.status',
  };
  const requestedSort = typeof req.query['sortKey'] === 'string' ? req.query['sortKey'] : '';
  const sortKey = sortMap[requestedSort] ? requestedSort : 'id';
  const sortDir = typeof req.query['sortDir'] === 'string' && req.query['sortDir'].toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const sortExpr = sortMap[sortKey];

  if (runId) {
    where.push('r.id = ?');
    params.push(Number(runId));
  } else {
    if (runNr) {
      where.push('r.run_nr = ?');
      params.push(Number(runNr));
    }
    if (text) {
      where.push('(q.question_text LIKE ? OR c.name_de LIKE ? OR q.criteria_id LIKE ? OR s.name LIKE ?)');
      const like = `%${text}%`;
      params.push(like, like, like, like);
    }
    if (testset) {
      where.push('r.testset = ?');
      params.push(testset);
    }
    if (runSetId) {
      where.push('r.run_set_id = ?');
      params.push(runSetId);
    }
    if (setupId) {
      where.push('r.setup_id = ?');
      params.push(setupId);
    }
    if (criteriaId) {
      where.push('q.criteria_id = ?');
      params.push(criteriaId);
    }
    if (status) {
      where.push('r.status = ?');
      params.push(status);
    }
    if (hasError === 'yes') {
      where.push("r.status = 'error'");
    }
    if (hasError === 'no') {
      where.push("r.status != 'error'");
    }
    if (hasReview === 'yes') {
      where.push('COALESCE(sc.review_required, 0) = 1');
    }
    if (hasReview === 'no') {
      where.push('COALESCE(sc.review_required, 0) = 0');
    }
    if (hasSearch === 'yes') {
      where.push(`EXISTS (
        SELECT 1 FROM run_steps rs
        WHERE rs.run_id = r.id
          AND rs.search_queries_json IS NOT NULL
          AND rs.search_queries_json != '[]'
      )`);
    }
    if (hasSearch === 'no') {
      where.push(`NOT EXISTS (
        SELECT 1 FROM run_steps rs
        WHERE rs.run_id = r.id
          AND rs.search_queries_json IS NOT NULL
          AND rs.search_queries_json != '[]'
      )`);
    }
    if (hasAutoanswer === 'yes') {
      where.push(`EXISTS (
        SELECT 1 FROM run_steps rs
        WHERE rs.run_id = r.id
          AND rs.messages_json LIKE '%[Autoanswer by checker because the previous clarification was unexpected]%'
      )`);
    }
    if (hasAutoanswer === 'no') {
      where.push(`NOT EXISTS (
        SELECT 1 FROM run_steps rs
        WHERE rs.run_id = r.id
          AND rs.messages_json LIKE '%[Autoanswer by checker because the previous clarification was unexpected]%'
      )`);
    }
    addNumberFilter(scoreFrom, 'sc.score_percent >= ?');
    addNumberFilter(scoreTo, 'sc.score_percent <= ?');
    addNumberFilter(singleScoreFrom, `${singleScoreExpr} >= ?`);
    addNumberFilter(singleScoreTo, `${singleScoreExpr} <= ?`);
    if (scoredFrom) {
      where.push('sc.scored_at >= ?');
      params.push(scoredFrom.replace('T', ' '));
    }
    if (scoredTo) {
      where.push('sc.scored_at <= ?');
      params.push(scoredTo.replace('T', ' '));
    }
    addNumberFilter(diffFrom, `${pairDiffExpr} >= ?`);
    addNumberFilter(diffTo, `${pairDiffExpr} <= ?`);
  }

  const fromClause = `
    FROM runs r
    JOIN setups s ON r.setup_id = s.id
    JOIN llm_configs lc ON r.llm_config_id = lc.id
    JOIN questions q ON r.question_id = q.id
    JOIN criteria c ON q.criteria_id = c.id
    LEFT JOIN run_sets rs ON rs.id = r.run_set_id
    LEFT JOIN scores sc ON sc.run_id = r.id
    LEFT JOIN (
      SELECT r1.id as run_id, MAX(rp.id) as pair_run_id
      FROM runs r1
      JOIN runs rp ON rp.comparison_group_id = r1.comparison_group_id
        AND rp.question_id = r1.question_id
        AND rp.llm_config_id = r1.llm_config_id
        AND COALESCE(rp.run_nr, -1) = COALESCE(r1.run_nr, -1)
        AND COALESCE(rp.testset, '') = COALESCE(r1.testset, '')
        AND COALESCE(rp.run_set_id, '') = COALESCE(r1.run_set_id, '')
        AND rp.id != r1.id
        AND (
          (r1.setup_id = 'setup_direct' AND rp.setup_id NOT IN ('setup_direct', 'setup_ce_direct') AND rp.setup_id NOT LIKE 'setup_ce_%')
          OR (r1.setup_id NOT IN ('setup_direct', 'setup_ce_direct') AND r1.setup_id NOT LIKE 'setup_ce_%' AND rp.setup_id = 'setup_direct')
          OR (r1.setup_id = 'setup_ce_direct' AND rp.setup_id LIKE 'setup_ce_%' AND rp.setup_id != 'setup_ce_direct')
          OR (r1.setup_id LIKE 'setup_ce_%' AND r1.setup_id != 'setup_ce_direct' AND rp.setup_id = 'setup_ce_direct')
        )
      GROUP BY r1.id
    ) pair_pick ON pair_pick.run_id = r.id
    LEFT JOIN scores pair_sc ON pair_sc.run_id = pair_pick.pair_run_id
    LEFT JOIN (
      SELECT run_id,
             COUNT(*) as step_count,
             SUM(CASE WHEN internet_allowed = 1 THEN 1 ELSE 0 END) as internet_step_count,
             SUM(CASE WHEN search_queries_json IS NOT NULL AND search_queries_json != '[]' THEN 1 ELSE 0 END) as search_step_count,
             SUM(CASE WHEN messages_json LIKE '%[Autoanswer by checker because the previous clarification was unexpected]%' THEN 1 ELSE 0 END) as autoanswer_count,
             COUNT(*) - COUNT(DISTINCT COALESCE(formal_step, step)) as repeated_formal_step_count
      FROM run_steps
      GROUP BY run_id
    ) step_stats ON step_stats.run_id = r.id
    WHERE ${where.join(' AND ')}
  `;

  const totalRow = db.prepare(`SELECT COUNT(*) as total ${fromClause}`).get(...params) as { total: number };
  const runs = db.prepare(`
    SELECT r.*,
           s.name as setup_name,
           lc.label as model_label,
           lc.model_id,
           q.question_text,
           q.criteria_id,
           c.name_de as criteria_name,
           rs.name as run_set_name,
           sc.score_percent,
           sc.passed_checkpoints,
           sc.total_checkpoints,
           sc.review_required,
           sc.review_reason,
           sc.scored_at,
           ${singleScoreExpr} as single_score_percent,
           ${pairDiffExpr} as pair_score_diff,
           COALESCE(step_stats.step_count, 0) as step_count,
           COALESCE(step_stats.internet_step_count, 0) as internet_step_count,
           COALESCE(step_stats.search_step_count, 0) as search_step_count,
           COALESCE(step_stats.autoanswer_count, 0) as autoanswer_count,
           COALESCE(step_stats.repeated_formal_step_count, 0) as repeated_formal_step_count
    ${fromClause}
    ORDER BY (${sortExpr}) IS NULL ASC, ${sortExpr} ${sortDir}, r.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({ runs, total: totalRow.total, limit, offset });
});

// GET /api/runs/:id - get run details
router.get('/api/runs/:id', (req: Request, res: Response) => {
  const runId = Number(req.params['id']);

  const run = db.prepare(`
    SELECT r.*, s.name as setup_name, lc.label as model_label,
           lc.model_id, lc.provider,
           q.question_text, q.criteria_id, q.notes,
           c.name_de as criteria_name,
           rs.name as run_set_name
    FROM runs r
    JOIN setups s ON r.setup_id = s.id
    JOIN llm_configs lc ON r.llm_config_id = lc.id
    JOIN questions q ON r.question_id = q.id
    JOIN criteria c ON q.criteria_id = c.id
    LEFT JOIN run_sets rs ON rs.id = r.run_set_id
    WHERE r.id = ?
  `).get(runId);

  if (!run) {
    res.status(404).json({ error: 'Run not found' });
    return;
  }

  const steps = db.prepare('SELECT * FROM run_steps WHERE run_id = ? ORDER BY step').all(runId);

  const score = db.prepare('SELECT * FROM scores WHERE run_id = ?').get(runId) as { id: number } | undefined;
  const scoreHistory = db.prepare(`
    SELECT id,
           original_score_id,
           run_id,
           scoring_model,
           score_percent,
           passed_checkpoints,
           total_checkpoints,
           review_required,
           review_reason,
           scored_at,
           archived_reason,
           archived_at
    FROM score_history
    WHERE run_id = ?
    ORDER BY archived_at DESC, id DESC
  `).all(runId);
  const runHistory = db.prepare(`
    SELECT id,
           original_run_id,
           setup_id,
           llm_config_id,
           question_id,
           testset,
           run_set_id,
           run_nr,
           comparison_group_id,
           status,
           score_percent,
           archived_reason,
           archived_at
    FROM run_history
    WHERE setup_id = ?
      AND llm_config_id = ?
      AND question_id = ?
      AND COALESCE(testset, '') = COALESCE(?, '')
      AND COALESCE(run_set_id, '') = COALESCE(?, '')
      AND COALESCE(run_nr, -1) = COALESCE(?, -1)
      AND COALESCE(comparison_group_id, '') = COALESCE(?, '')
    ORDER BY archived_at DESC, id DESC
  `).all(
    (run as Record<string, unknown>).setup_id,
    (run as Record<string, unknown>).llm_config_id,
    (run as Record<string, unknown>).question_id,
    (run as Record<string, unknown>).testset ?? '',
    (run as Record<string, unknown>).run_set_id ?? '',
    (run as Record<string, unknown>).run_nr ?? null,
    (run as Record<string, unknown>).comparison_group_id ?? '',
  );
  let checkpointResults = null;
  if (score) {
    checkpointResults = db.prepare(`
      SELECT cr.*, c.item_text
      FROM checkpoint_results cr
      JOIN checkpoints c ON cr.checkpoint_id = c.id
      WHERE cr.score_id = ?
      ORDER BY c.sort_order
    `).all(score.id);
  }

  res.json({ run, steps, score, checkpointResults, scoreHistory, runHistory });
});

// POST /api/runs/:id/score - score a run
router.post('/api/runs/:id/score', async (req: Request, res: Response) => {
  try {
    const runId = Number(req.params['id']);
    const { scoringModelId } = req.body as { scoringModelId: number };

    if (!scoringModelId) {
      res.status(400).json({ error: 'Missing scoringModelId' });
      return;
    }

    const run = db.prepare('SELECT * FROM runs WHERE id = ?').get(runId) as RunForRerun | undefined;
    let result: Awaited<ReturnType<typeof scoreRun>>;
    let pairedScore: Awaited<ReturnType<typeof scorePairRuns>> | undefined;
    let pairValidation: Awaited<ReturnType<typeof validatePairScoring>> | undefined;
    if (run) {
      const paired = findPairedRuns(run);
      const directSetupId = isDirectSetup(run.setup_id) ? run.setup_id : directSetupFor(run.setup_id);
      const direct = isDirectSetup(run.setup_id)
        ? run
        : paired.find(candidate => candidate.setup_id === directSetupId);
      const workflow = !isDirectSetup(run.setup_id)
        ? run
        : paired.find(candidate => isWorkflowForDirect(candidate.setup_id, directSetupId));
      if (direct && workflow) {
        if (usePairedCheckpointScoring()) {
          pairedScore = await scorePairRuns(direct.id, workflow.id, Number(scoringModelId));
          result = isDirectSetup(run.setup_id) ? pairedScore.direct : pairedScore.workflow;
        } else {
          result = await scoreRun(runId, Number(scoringModelId));
        }
        pairValidation = await validatePairScoring(direct.id, workflow.id, Number(scoringModelId));
      } else {
        result = await scoreRun(runId, Number(scoringModelId));
      }
    } else {
      result = await scoreRun(runId, Number(scoringModelId));
    }
    res.json({ ...result, pairedScore, pairValidation });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// PUT /api/runs/:id/flags - manual review/exclude flags
router.put('/api/runs/:id/flags', (req: Request, res: Response) => {
  const runId = Number(req.params['id']);
  const { excludeFromAnalysis, excludeReason } = req.body as {
    excludeFromAnalysis?: boolean;
    excludeReason?: string;
  };

  db.prepare(`
    UPDATE runs
    SET exclude_from_analysis = COALESCE(?, exclude_from_analysis),
        exclude_reason = COALESCE(?, exclude_reason)
    WHERE id = ?
  `).run(
    excludeFromAnalysis === undefined ? null : (excludeFromAnalysis ? 1 : 0),
    excludeReason === undefined ? null : excludeReason,
    runId,
  );

  res.json({ success: true });
});

export default router;

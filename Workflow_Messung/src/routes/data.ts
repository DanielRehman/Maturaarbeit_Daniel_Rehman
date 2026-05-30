import { Router, Request, Response } from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import db from '../db/index';

const router = Router();

const CRITERIA_ORDER = [
  'richtigkeit',
  'rueckfragefaehigkeit',
  'internet_quellenqualitaet',
  'pruefung_verifikation',
  'unsicherheit',
  'vollstaendigkeit_moeglichkeit',
  'vollstaendigkeit_frage',
  'klarheit',
  'relevanz',
];

const criteriaOrderSql = `CASE ${CRITERIA_ORDER.map((id, index) => `WHEN criteria.id = '${id}' THEN ${index}`).join(' ')} ELSE ${CRITERIA_ORDER.length} END`;
const qCriteriaOrderSql = `CASE ${CRITERIA_ORDER.map((id, index) => `WHEN q.criteria_id = '${id}' THEN ${index}`).join(' ')} ELSE ${CRITERIA_ORDER.length} END`;
const qRunCriteriaOrderSql = `CASE ${CRITERIA_ORDER.map((id, index) => `WHEN q_run.criteria_id = '${id}' THEN ${index}`).join(' ')} ELSE ${CRITERIA_ORDER.length} END`;

function criteriaOrderIndex(criteriaId: string): number {
  const index = CRITERIA_ORDER.indexOf(criteriaId);
  return index === -1 ? CRITERIA_ORDER.length : index;
}

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(',').map(v => v.trim()).filter(Boolean);
}

function addInFilter(
  whereParts: string[],
  params: (string | number)[],
  column: string,
  values: string[],
  numeric = false,
): void {
  if (values.length === 0) return;
  whereParts.push(`${column} IN (${values.map(() => '?').join(', ')})`);
  params.push(...values.map(value => numeric ? Number(value) : value));
}

function queryHas(req: Request, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(req.query, key);
}

function safeFileName(value: string): string {
  return safePathPart(value, true) || 'analysis_export';
}

function safePathPart(value: string, lowerCase = false): string {
  const base = lowerCase ? value.toLowerCase() : value;
  return base
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

function safeRelativeOutputPath(value: string): string {
  return value
    .split(/[\\/]+/)
    .map(part => safePathPart(part))
    .filter(part => part && part !== '.' && part !== '..')
    .join(path.sep);
}

function commandPath(command: string): string {
  if (process.platform !== 'win32') return command;
  const localMiKTeX = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'MiKTeX', 'miktex', 'bin', 'x64', `${command}.exe`);
  if (fs.existsSync(localMiKTeX)) return localMiKTeX;
  return command;
}

function latexDocument(tableSource: string): string {
  return [
    '\\documentclass{article}',
    '\\usepackage[utf8]{inputenc}',
    '\\usepackage{booktabs}',
    '\\usepackage{rotating}',
    '\\pagestyle{empty}',
    '\\begin{document}',
    tableSource,
    '\\end{document}',
    '',
  ].join('\n');
}

function renderLatexTableSvgs(outputDir: string, saved: string[]): { files: string[]; warnings: string[] } {
  const rendered: string[] = [];
  const warnings: string[] = [];
  const latex = commandPath('latex');
  const dvisvgm = commandPath('dvisvgm');

  for (const name of saved.filter(file => file.endsWith('.tex'))) {
    const sourcePath = path.join(outputDir, name);
    const svgPath = sourcePath.replace(/\.tex$/i, '.svg');
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'matura-latex-svg-'));
    const tempTex = path.join(tempDir, 'table.tex');

    try {
      fs.writeFileSync(tempTex, latexDocument(fs.readFileSync(sourcePath, 'utf8')), 'utf8');
      execFileSync(latex, ['-interaction=nonstopmode', '-halt-on-error', 'table.tex'], {
        cwd: tempDir,
        stdio: 'pipe',
        timeout: 120000,
      });
      execFileSync(dvisvgm, ['table.dvi', '-n', '-o', svgPath], {
        cwd: tempDir,
        stdio: 'pipe',
        timeout: 120000,
      });
      rendered.push(name.replace(/\.tex$/i, '.svg'));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      warnings.push(`${name}: ${message}`);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  return { files: rendered.map(file => file.replace(/\\/g, '/')), warnings };
}

function duplicateStableAssetFolders(outputDir: string, folderPrefix: string): string[] {
  if (!folderPrefix) return [];

  const copied: string[] = [];
  for (const folder of ['images', 'tables']) {
    const source = path.join(outputDir, folderPrefix, folder);
    const target = path.join(outputDir, folder);
    if (!fs.existsSync(source)) continue;
    fs.cpSync(source, target, { recursive: true, force: true });
    copied.push(folder);
  }
  return copied;
}

// GET /data - render data page
router.get('/data', (req: Request, res: Response) => {
  res.render('data', {
    title: 'Data',
    activePage: 'data',
  });
});

// POST /api/analysis/export - save generated SVG/LaTeX/Markdown files from current browser analysis
router.post('/api/analysis/export', (req: Request, res: Response) => {
  const body = req.body as {
    label?: string;
    folder?: string;
    files?: Array<{ name?: string; content?: string }>;
  };
  const files = Array.isArray(body.files) ? body.files : [];
  if (files.length === 0) {
    res.status(400).json({ error: 'No files provided.' });
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const folderPrefix = safeRelativeOutputPath(body.folder || '');
  const folderName = `${stamp}_${safeFileName(body.label || 'analysis_export')}`;
  const outputRoot = path.resolve(__dirname, '../../outputs_new');
  const outputDir = folderPrefix
    ? path.join(outputRoot, folderPrefix)
    : path.join(outputRoot, folderName);
  fs.mkdirSync(outputDir, { recursive: true });

  const saved: string[] = [];
  for (const file of files) {
    const name = safeRelativeOutputPath(file.name || '');
    if (!name) continue;
    const target = path.join(outputDir, name);
    const resolved = path.resolve(target);
    if (!resolved.startsWith(outputDir + path.sep)) continue;
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, String(file.content ?? ''), 'utf8');
    saved.push(name.replace(/\\/g, '/'));
  }

  const latexRender = renderLatexTableSvgs(outputDir, saved);
  saved.push(...latexRender.files);
  duplicateStableAssetFolders(outputDir, folderPrefix);

  res.json({ ok: true, outputDir, files: saved, warnings: latexRender.warnings });
});

// GET /api/analysis/options - filter options for the analysis workbench
router.get('/api/analysis/options', (req: Request, res: Response) => {
  const { criteriaId } = req.query as { criteriaId?: string };
  const runCriteriaWhere = criteriaId ? 'WHERE q.criteria_id = ?' : '';
  const questionCriteriaWhere = criteriaId ? 'AND criteria_id = ?' : '';
  const runCriteriaParams = criteriaId ? [criteriaId] : [];

  const criteria = db.prepare(`
    SELECT id, name_de, description
    FROM criteria
    ORDER BY ${criteriaOrderSql}, id
  `).all();
  const testsets = db.prepare(`
    WITH question_counts AS (
      SELECT testset, COUNT(*) AS question_count
      FROM questions
      WHERE 1=1 ${questionCriteriaWhere}
      GROUP BY testset
    ),
    run_counts AS (
      SELECT r.testset,
             COUNT(*) AS run_count,
             SUM(CASE WHEN sc.score_percent IS NOT NULL THEN 1 ELSE 0 END) AS scored_count,
             SUM(CASE WHEN r.status = 'completed' AND sc.score_percent IS NULL THEN 1 ELSE 0 END) AS unscored_count,
             SUM(CASE WHEN r.status = 'error' THEN 1 ELSE 0 END) AS error_count,
             SUM(CASE WHEN r.status = 'running' THEN 1 ELSE 0 END) AS running_count,
             SUM(CASE WHEN r.status NOT IN ('completed', 'error', 'running') THEN 1 ELSE 0 END) AS other_count,
             SUM(CASE WHEN COALESCE(sc.review_required, 0) = 1 THEN 1 ELSE 0 END) AS review_count
      FROM runs r
      JOIN questions q ON q.id = r.question_id
      LEFT JOIN scores sc ON sc.run_id = r.id
      ${runCriteriaWhere}
      GROUP BY r.testset
    )
    SELECT t.id,
           t.name,
           COALESCE(qc.question_count, 0) AS question_count,
           COALESCE(rc.run_count, 0) AS run_count,
           COALESCE(rc.scored_count, 0) AS scored_count,
           COALESCE(rc.unscored_count, 0) AS unscored_count,
           COALESCE(rc.error_count, 0) AS error_count,
           COALESCE(rc.running_count, 0) AS running_count,
           COALESCE(rc.other_count, 0) AS other_count,
           COALESCE(rc.review_count, 0) AS review_count
    FROM testsets t
    LEFT JOIN question_counts qc ON qc.testset = t.id
    LEFT JOIN run_counts rc ON rc.testset = t.id
    ORDER BY t.name, t.id
  `).all(...runCriteriaParams, ...runCriteriaParams);
  const runSets = db.prepare(`
    WITH run_counts AS (
      SELECT r.run_set_id,
             COUNT(*) AS run_count,
             SUM(CASE WHEN sc.score_percent IS NOT NULL THEN 1 ELSE 0 END) AS scored_count,
             SUM(CASE WHEN r.status = 'completed' AND sc.score_percent IS NULL THEN 1 ELSE 0 END) AS unscored_count,
             SUM(CASE WHEN r.status = 'error' THEN 1 ELSE 0 END) AS error_count,
             SUM(CASE WHEN r.status = 'running' THEN 1 ELSE 0 END) AS running_count,
             SUM(CASE WHEN r.status NOT IN ('completed', 'error', 'running') THEN 1 ELSE 0 END) AS other_count,
             SUM(CASE WHEN COALESCE(sc.review_required, 0) = 1 THEN 1 ELSE 0 END) AS review_count
      FROM runs r
      JOIN questions q ON q.id = r.question_id
      LEFT JOIN scores sc ON sc.run_id = r.id
      ${runCriteriaWhere}
      GROUP BY r.run_set_id
    )
    SELECT rs.id,
           rs.name,
           COALESCE(rc.run_count, 0) AS run_count,
           COALESCE(rc.scored_count, 0) AS scored_count,
           COALESCE(rc.unscored_count, 0) AS unscored_count,
           COALESCE(rc.error_count, 0) AS error_count,
           COALESCE(rc.running_count, 0) AS running_count,
           COALESCE(rc.other_count, 0) AS other_count,
           COALESCE(rc.review_count, 0) AS review_count
    FROM run_sets rs
    LEFT JOIN run_counts rc ON rc.run_set_id = rs.id
    ORDER BY rs.name, rs.created_at, rs.id
  `).all(...runCriteriaParams);
  const setups = db.prepare(`
    WITH run_counts AS (
      SELECT r.setup_id,
             COUNT(*) AS run_count,
             SUM(CASE WHEN r.status = 'error' THEN 1 ELSE 0 END) AS error_count
      FROM runs r
      JOIN questions q ON q.id = r.question_id
      ${runCriteriaWhere}
      GROUP BY r.setup_id
    )
    SELECT s.id,
           s.name,
           s.description,
           s.max_steps,
           COALESCE(rc.run_count, 0) AS run_count,
           COALESCE(rc.error_count, 0) AS error_count
    FROM setups s
    LEFT JOIN run_counts rc ON rc.setup_id = s.id
    ORDER BY s.id
  `).all(...runCriteriaParams);
  const models = db.prepare(`
    WITH run_counts AS (
      SELECT r.llm_config_id,
             COUNT(*) AS run_count,
             SUM(CASE WHEN r.status = 'error' THEN 1 ELSE 0 END) AS error_count
      FROM runs r
      JOIN questions q ON q.id = r.question_id
      ${runCriteriaWhere}
      GROUP BY r.llm_config_id
    )
    SELECT lc.id,
           lc.label,
           lc.provider,
           lc.model_id,
           COALESCE(rc.run_count, 0) AS run_count,
           COALESCE(rc.error_count, 0) AS error_count
    FROM llm_configs lc
    LEFT JOIN run_counts rc ON rc.llm_config_id = lc.id
    ORDER BY lc.id
  `).all(...runCriteriaParams);

  res.json({ criteria, testsets, runSets, setups, models });
});

// GET /api/analysis/workbench - raw rows and paired rows for the diploma analysis page
router.get('/api/analysis/workbench', (req: Request, res: Response) => {
  const { criteriaId, testsets, runSetIds, modelIds, workflowSetupIds, includeReview, includeExcluded, maxPairsPerCriteria, skipPairsPerCriteria, skipCeilingSingleScore, skipCeilingSingleScoreMax } = req.query as {
    criteriaId?: string;
    testsets?: string;
    runSetIds?: string;
    modelIds?: string;
    workflowSetupIds?: string;
    includeReview?: string;
    includeExcluded?: string;
    maxPairsPerCriteria?: string;
    skipPairsPerCriteria?: string;
    skipCeilingSingleScore?: string;
    skipCeilingSingleScoreMax?: string;
  };

  const selectedTestsets = parseList(testsets);
  const selectedRunSetIds = parseList(runSetIds);
  const selectedModelIds = parseList(modelIds);
  const selectedWorkflowSetups = parseList(workflowSetupIds).filter(id => id !== 'setup_direct' && id !== 'setup_ce_direct');
  const excludeReview = includeReview !== 'true';
  const excludeExcluded = includeExcluded !== 'true';
  const maxPairsLimit = Number.parseInt(String(maxPairsPerCriteria || ''), 10);
  const maxPairs = Number.isFinite(maxPairsLimit) && maxPairsLimit > 0 ? maxPairsLimit : null;
  const skipPairsLimit = Number.parseInt(String(skipPairsPerCriteria || ''), 10);
  const skipPairs = Number.isFinite(skipPairsLimit) && skipPairsLimit > 0 ? skipPairsLimit : 0;
  const skipCeilingLimit = Number.parseFloat(String(skipCeilingSingleScore || ''));
  let skipCeilingScore = Number.isFinite(skipCeilingLimit) && skipCeilingLimit >= 0 && skipCeilingLimit <= 100 ? skipCeilingLimit : null;
  const skipCeilingMaxLimit = Number.parseFloat(String(skipCeilingSingleScoreMax || ''));
  let skipCeilingScoreMax = Number.isFinite(skipCeilingMaxLimit) && skipCeilingMaxLimit >= 0 && skipCeilingMaxLimit <= 100 ? skipCeilingMaxLimit : null;
  if (skipCeilingScore !== null && skipCeilingScoreMax !== null && skipCeilingScore > skipCeilingScoreMax) {
    const tmp = skipCeilingScore;
    skipCeilingScore = skipCeilingScoreMax;
    skipCeilingScoreMax = tmp;
  }
  const limitActive = maxPairs !== null || skipPairs > 0;

  const emptyExplicitFilter =
    (queryHas(req, 'testsets') && selectedTestsets.length === 0) ||
    (queryHas(req, 'runSetIds') && selectedRunSetIds.length === 0) ||
    (queryHas(req, 'modelIds') && selectedModelIds.length === 0) ||
    (queryHas(req, 'workflowSetupIds') && selectedWorkflowSetups.length === 0);

  if (emptyExplicitFilter) {
    res.json({
      rawScores: [],
      pairs: [],
      diagnostics: {
        totalRuns: 0,
        completedRuns: 0,
        scoredRuns: 0,
        completedUnscoredRuns: 0,
        errorRuns: 0,
        runningRuns: 0,
        otherStatusRuns: 0,
        reviewRuns: 0,
        excludedRuns: 0,
        analysisRuns: 0,
        validPairs: 0,
        cleanPairs: 0,
        selectedPairs: 0,
        errorPairs: 0,
        skippedPairs: 0,
        reviewPairs: 0,
        uncompletePairs: 0,
        unfinishedPairs: 0,
        totalPairs: 0,
        availableSelectedPairs: 0,
        maxPairsPerCriteria: maxPairs,
        skipPairsPerCriteria: skipPairs,
        skipCeilingSingleScore: skipCeilingScore,
        skipCeilingSingleScoreMax: skipCeilingScoreMax,
        ceilingSkippedPairs: 0,
        selectionLimited: false,
      },
    });
    return;
  }

  const selectedWhere = ['1=1'];
  const selectedParams: (string | number)[] = [];

  if (criteriaId) {
    selectedWhere.push('q.criteria_id = ?');
    selectedParams.push(criteriaId);
  }
  addInFilter(selectedWhere, selectedParams, 'r.testset', selectedTestsets);
  addInFilter(selectedWhere, selectedParams, 'r.run_set_id', selectedRunSetIds);
  addInFilter(selectedWhere, selectedParams, 'r.llm_config_id', selectedModelIds, true);
  if (selectedWorkflowSetups.length > 0) {
    selectedWhere.push(`(r.setup_id IN ('setup_direct', 'setup_ce_direct') OR r.setup_id IN (${selectedWorkflowSetups.map(() => '?').join(', ')}))`);
    selectedParams.push(...selectedWorkflowSetups);
  }

  const selectedFrom = `
    FROM runs r
    JOIN questions q ON q.id = r.question_id
    JOIN criteria c ON c.id = q.criteria_id
    LEFT JOIN scores sc ON sc.run_id = r.id
    WHERE ${selectedWhere.join(' AND ')}
  `;

  const diagnosticRow = db.prepare(`
    SELECT COUNT(*) as totalRuns,
           SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completedRuns,
           SUM(CASE WHEN sc.score_percent IS NOT NULL THEN 1 ELSE 0 END) as scoredRuns,
           SUM(CASE WHEN r.status = 'completed' AND sc.score_percent IS NULL THEN 1 ELSE 0 END) as completedUnscoredRuns,
           SUM(CASE WHEN r.status = 'error' THEN 1 ELSE 0 END) as errorRuns,
           SUM(CASE WHEN r.status = 'running' THEN 1 ELSE 0 END) as runningRuns,
           SUM(CASE WHEN r.status NOT IN ('completed', 'error', 'running') THEN 1 ELSE 0 END) as otherStatusRuns,
           SUM(CASE WHEN COALESCE(sc.review_required, 0) = 1 THEN 1 ELSE 0 END) as reviewRuns,
           SUM(CASE WHEN COALESCE(r.exclude_from_analysis, 0) = 1 THEN 1 ELSE 0 END) as excludedRuns
    ${selectedFrom}
  `).get(...selectedParams) as Record<string, number | null>;

  const selectedRows = db.prepare(`
    SELECT r.id,
           r.setup_id,
           r.llm_config_id,
           r.question_id,
           r.testset,
           r.run_set_id,
           r.run_nr,
           r.comparison_group_id,
           q.criteria_id,
           c.name_de as criteria_name,
           r.status,
           r.exclude_from_analysis,
           sc.score_percent,
           sc.review_required
    ${selectedFrom}
  `).all(...selectedParams) as Array<{
    id: number;
    setup_id: string;
    llm_config_id: number;
    question_id: number;
    testset: string | null;
    run_set_id: string | null;
    run_nr: number | null;
    comparison_group_id: string | null;
    criteria_id: string;
    criteria_name: string;
    status: string;
    exclude_from_analysis: number | null;
    score_percent: number | null;
    review_required: number | null;
  }>;

  const rawWhere = [
    "r.status = 'completed'",
    'sc.score_percent IS NOT NULL',
  ];
  const rawParams: (string | number)[] = [];

  if (criteriaId) {
    rawWhere.push('q.criteria_id = ?');
    rawParams.push(criteriaId);
  }
  addInFilter(rawWhere, rawParams, 'r.testset', selectedTestsets);
  addInFilter(rawWhere, rawParams, 'r.run_set_id', selectedRunSetIds);
  addInFilter(rawWhere, rawParams, 'r.llm_config_id', selectedModelIds, true);
  if (excludeReview) {
    rawWhere.push('COALESCE(sc.review_required, 0) = 0');
  }
  if (excludeExcluded) {
    rawWhere.push('COALESCE(r.exclude_from_analysis, 0) = 0');
  }
  if (selectedWorkflowSetups.length > 0) {
    rawWhere.push(`(r.setup_id IN ('setup_direct', 'setup_ce_direct') OR r.setup_id IN (${selectedWorkflowSetups.map(() => '?').join(', ')}))`);
    rawParams.push(...selectedWorkflowSetups);
  }

  const rawScores = db.prepare(`
    SELECT r.id as run_id,
           r.setup_id,
           s.name as setup_name,
           r.llm_config_id,
           lc.label as model_label,
           lc.model_id,
           r.question_id,
           q.question_text,
           q.criteria_id,
           c.name_de as criteria_name,
           r.testset,
           r.run_set_id,
           rs.name as run_set_name,
           r.run_nr,
           r.comparison_group_id,
           sc.score_percent,
           sc.passed_checkpoints,
           sc.total_checkpoints,
           sc.report,
           sc.review_required,
           sc.review_reason,
           r.exclude_from_analysis,
           r.exclude_reason,
           r.created_at
    FROM runs r
    JOIN scores sc ON sc.run_id = r.id
    JOIN setups s ON s.id = r.setup_id
    JOIN llm_configs lc ON lc.id = r.llm_config_id
    JOIN questions q ON q.id = r.question_id
    JOIN criteria c ON c.id = q.criteria_id
    LEFT JOIN run_sets rs ON rs.id = r.run_set_id
    WHERE ${rawWhere.join(' AND ')}
    ORDER BY ${qCriteriaOrderSql}, q.criteria_id, r.id
  `).all(...rawParams);

  const pairWhere = [
    "r1.status = 'completed'",
    "r2.status = 'completed'",
    'sc1.score_percent IS NOT NULL',
    'sc2.score_percent IS NOT NULL',
    "r1.setup_id IN ('setup_direct', 'setup_ce_direct')",
    "r2.setup_id NOT IN ('setup_direct', 'setup_ce_direct')",
    `(
      (r1.setup_id = 'setup_direct' AND r2.setup_id NOT LIKE 'setup_ce_%')
      OR (r1.setup_id = 'setup_ce_direct' AND r2.setup_id LIKE 'setup_ce_%')
    )`,
  ];
  const pairParams: (string | number)[] = [];

  if (criteriaId) {
    pairWhere.push('q.criteria_id = ?');
    pairParams.push(criteriaId);
  }
  addInFilter(pairWhere, pairParams, 'r1.testset', selectedTestsets);
  addInFilter(pairWhere, pairParams, 'r1.run_set_id', selectedRunSetIds);
  addInFilter(pairWhere, pairParams, 'r1.llm_config_id', selectedModelIds, true);
  addInFilter(pairWhere, pairParams, 'r2.setup_id', selectedWorkflowSetups);
  if (excludeExcluded) {
    pairWhere.push('COALESCE(r1.exclude_from_analysis, 0) = 0');
    pairWhere.push('COALESCE(r2.exclude_from_analysis, 0) = 0');
  }
  if (excludeReview) {
    if (excludeExcluded) {
      pairWhere.push('COALESCE(sc1.review_required, 0) = 0');
      pairWhere.push('COALESCE(sc2.review_required, 0) = 0');
    } else {
      pairWhere.push(`(
        COALESCE(r1.exclude_from_analysis, 0) = 1
        OR COALESCE(r2.exclude_from_analysis, 0) = 1
        OR (COALESCE(sc1.review_required, 0) = 0 AND COALESCE(sc2.review_required, 0) = 0)
      )`);
    }
  }

  type PairRow = {
    criteria_id: string;
    [key: string]: unknown;
  };

  const allPairsBeforeCeiling = db.prepare(`
    SELECT r1.id as single_run_id,
           r2.id as workflow_run_id,
           r1.question_id,
           q.question_text,
           q.criteria_id,
           c.name_de as criteria_name,
           r1.testset,
           r1.run_set_id,
           rs1.name as run_set_name,
           r1.run_nr,
           r1.comparison_group_id,
           r1.llm_config_id,
           lc.label as model_label,
           lc.model_id,
           r2.setup_id as workflow_setup_id,
           s2.name as workflow_setup_name,
           sc1.score_percent as single_score,
           sc2.score_percent as workflow_score,
           sc1.passed_checkpoints as single_points,
           sc1.total_checkpoints as single_max_points,
           sc2.passed_checkpoints as workflow_points,
           sc2.total_checkpoints as workflow_max_points,
           sc1.review_required as single_review_required,
           sc1.review_reason as single_review_reason,
           sc2.review_required as workflow_review_required,
           sc2.review_reason as workflow_review_reason,
           r1.exclude_from_analysis as single_excluded,
           r1.exclude_reason as single_exclude_reason,
           r2.exclude_from_analysis as workflow_excluded,
           r2.exclude_reason as workflow_exclude_reason,
           (sc2.score_percent - sc1.score_percent) as diff
    FROM run_pairs rp
    JOIN runs r1 ON r1.id = rp.direct_run_id
    JOIN runs r2 ON r2.id = rp.workflow_run_id
    JOIN scores sc1 ON sc1.run_id = r1.id
    JOIN scores sc2 ON sc2.run_id = r2.id
    JOIN questions q ON q.id = r1.question_id
    JOIN criteria c ON c.id = q.criteria_id
    JOIN llm_configs lc ON lc.id = r1.llm_config_id
    JOIN setups s2 ON s2.id = r2.setup_id
    LEFT JOIN run_sets rs1 ON rs1.id = r1.run_set_id
    WHERE ${pairWhere.join(' AND ')}
    ORDER BY ${qCriteriaOrderSql}, q.criteria_id, r1.id, r2.id
  `).all(...pairParams) as PairRow[];

  const ceilingSkippedPairsByCriteria = new Map<string, number>();
  const ceilingFilterActive = skipCeilingScore !== null || skipCeilingScoreMax !== null;
  const allPairs = !ceilingFilterActive
    ? allPairsBeforeCeiling
    : allPairsBeforeCeiling.filter(row => {
      const singleScore = Number(row.single_score);
      const keepByCeiling = Number.isFinite(singleScore) &&
        (skipCeilingScore === null || singleScore > skipCeilingScore) &&
        (skipCeilingScoreMax === null || singleScore < skipCeilingScoreMax);
      if (!keepByCeiling) {
        const key = row.criteria_id || 'unknown';
        ceilingSkippedPairsByCriteria.set(key, (ceilingSkippedPairsByCriteria.get(key) || 0) + 1);
      }
      return keepByCeiling;
    });
  const ceilingSkippedPairs = [...ceilingSkippedPairsByCriteria.values()].reduce((sum, value) => sum + value, 0);

  const limitPairsByCriteria = (rows: PairRow[]) => {
    if (!limitActive) return rows;
    const seenCounts = new Map<string, number>();
    const usedCounts = new Map<string, number>();
    return rows.filter(row => {
      const key = row.criteria_id || 'unknown';
      const seen = seenCounts.get(key) || 0;
      seenCounts.set(key, seen + 1);
      if (seen < skipPairs) return false;

      const used = usedCounts.get(key) || 0;
      if (maxPairs !== null && used >= maxPairs) return false;
      usedCounts.set(key, used + 1);
      return true;
    });
  };

  const pairs = limitPairsByCriteria(allPairs);
  const cappedSelectedPairsByCriteria = new Map<string, number>();
  for (const pair of pairs) {
    const key = pair.criteria_id || 'unknown';
    cappedSelectedPairsByCriteria.set(key, (cappedSelectedPairsByCriteria.get(key) || 0) + 1);
  }

  const pairCounts = {
    cleanPairs: 0,
    errorPairs: 0,
    skippedPairs: 0,
    reviewPairs: 0,
    uncompletePairs: 0,
    totalPairs: 0,
  };
  const criteriaPairCounts = new Map<string, {
    criteriaId: string;
    criteriaName: string;
    cleanPairs: number;
    errorPairs: number;
    skippedPairs: number;
    reviewPairs: number;
    uncompletePairs: number;
    totalPairs: number;
  }>();

  function countsFor(criteriaId: string, criteriaName: string) {
    if (!criteriaPairCounts.has(criteriaId)) {
      criteriaPairCounts.set(criteriaId, {
        criteriaId,
        criteriaName,
        cleanPairs: 0,
        errorPairs: 0,
        skippedPairs: 0,
        reviewPairs: 0,
        uncompletePairs: 0,
        totalPairs: 0,
      });
    }
    return criteriaPairCounts.get(criteriaId)!;
  }

  const diagnosticPairWhere = [
    "r1.setup_id IN ('setup_direct', 'setup_ce_direct')",
    "r2.setup_id NOT IN ('setup_direct', 'setup_ce_direct')",
    `(
      (r1.setup_id = 'setup_direct' AND r2.setup_id NOT LIKE 'setup_ce_%')
      OR (r1.setup_id = 'setup_ce_direct' AND r2.setup_id LIKE 'setup_ce_%')
    )`,
  ];
  const diagnosticPairParams: (string | number)[] = [];
  if (criteriaId) {
    diagnosticPairWhere.push('q.criteria_id = ?');
    diagnosticPairParams.push(criteriaId);
  }
  addInFilter(diagnosticPairWhere, diagnosticPairParams, 'r1.testset', selectedTestsets);
  addInFilter(diagnosticPairWhere, diagnosticPairParams, 'r1.run_set_id', selectedRunSetIds);
  addInFilter(diagnosticPairWhere, diagnosticPairParams, 'r1.llm_config_id', selectedModelIds, true);
  addInFilter(diagnosticPairWhere, diagnosticPairParams, 'r2.setup_id', selectedWorkflowSetups);

  const diagnosticPairs = db.prepare(`
    SELECT q.criteria_id,
           c.name_de as criteria_name,
           r1.status as single_status,
           r2.status as workflow_status,
           sc1.score_percent as single_score,
           sc2.score_percent as workflow_score,
           sc1.review_required as single_review_required,
           sc2.review_required as workflow_review_required,
           r1.exclude_from_analysis as single_excluded,
           r2.exclude_from_analysis as workflow_excluded
    FROM run_pairs rp
    JOIN runs r1 ON r1.id = rp.direct_run_id
    JOIN runs r2 ON r2.id = rp.workflow_run_id
    JOIN questions q ON q.id = r1.question_id
    JOIN criteria c ON c.id = q.criteria_id
    LEFT JOIN scores sc1 ON sc1.run_id = r1.id
    LEFT JOIN scores sc2 ON sc2.run_id = r2.id
    WHERE ${diagnosticPairWhere.join(' AND ')}
  `).all(...diagnosticPairParams) as Array<{
    criteria_id: string;
    criteria_name: string;
    single_status: string | null;
    workflow_status: string | null;
    single_score: number | null;
    workflow_score: number | null;
    single_review_required: number | null;
    workflow_review_required: number | null;
    single_excluded: number | null;
    workflow_excluded: number | null;
  }>;

  for (const pair of diagnosticPairs) {
    const criteriaCounts = countsFor(pair.criteria_id || 'unknown', pair.criteria_name || pair.criteria_id || 'unknown');
    pairCounts.totalPairs += 1;
    criteriaCounts.totalPairs += 1;

    const singleStatus = pair.single_status || '';
    const workflowStatus = pair.workflow_status || '';
    const incompletePair =
      singleStatus === '' ||
      workflowStatus === '' ||
      singleStatus === 'incomplete' ||
      workflowStatus === 'incomplete' ||
      singleStatus === 'running' ||
      workflowStatus === 'running' ||
      (singleStatus !== 'error' && (pair.single_score === null || pair.single_score === undefined)) ||
      (workflowStatus !== 'error' && (pair.workflow_score === null || pair.workflow_score === undefined));
    if (incompletePair) {
      pairCounts.uncompletePairs += 1;
      criteriaCounts.uncompletePairs += 1;
      continue;
    }
    if (singleStatus === 'error' || workflowStatus === 'error') {
      pairCounts.errorPairs += 1;
      criteriaCounts.errorPairs += 1;
      continue;
    }
    if (Boolean(pair.single_excluded) || Boolean(pair.workflow_excluded)) {
      pairCounts.skippedPairs += 1;
      criteriaCounts.skippedPairs += 1;
      continue;
    }
    if (Boolean(pair.single_review_required) || Boolean(pair.workflow_review_required)) {
      pairCounts.reviewPairs += 1;
      criteriaCounts.reviewPairs += 1;
      continue;
    }
    pairCounts.cleanPairs += 1;
    criteriaCounts.cleanPairs += 1;
  }

  const unpairedIncompleteWhere = [
    "r.setup_id NOT IN ('setup_direct', 'setup_ce_direct')",
    `(
      r.status != 'completed'
      OR sc.score_percent IS NULL
    )`,
    `NOT EXISTS (
      SELECT 1
      FROM run_pairs rp
      WHERE rp.workflow_run_id = r.id
    )`,
  ];
  const unpairedIncompleteParams: (string | number)[] = [];
  if (criteriaId) {
    unpairedIncompleteWhere.push('q.criteria_id = ?');
    unpairedIncompleteParams.push(criteriaId);
  }
  addInFilter(unpairedIncompleteWhere, unpairedIncompleteParams, 'r.testset', selectedTestsets);
  addInFilter(unpairedIncompleteWhere, unpairedIncompleteParams, 'r.run_set_id', selectedRunSetIds);
  addInFilter(unpairedIncompleteWhere, unpairedIncompleteParams, 'r.llm_config_id', selectedModelIds, true);
  addInFilter(unpairedIncompleteWhere, unpairedIncompleteParams, 'r.setup_id', selectedWorkflowSetups);

  const unpairedIncompleteRows = db.prepare(`
    SELECT q.criteria_id,
           c.name_de as criteria_name,
           r.status,
           sc.score_percent
    FROM runs r
    JOIN questions q ON q.id = r.question_id
    JOIN criteria c ON c.id = q.criteria_id
    LEFT JOIN scores sc ON sc.run_id = r.id
    WHERE ${unpairedIncompleteWhere.join(' AND ')}
  `).all(...unpairedIncompleteParams) as Array<{
    criteria_id: string;
    criteria_name: string;
    status: string | null;
    score_percent: number | null;
  }>;

  for (const row of unpairedIncompleteRows) {
    const criteriaCounts = countsFor(row.criteria_id || 'unknown', row.criteria_name || row.criteria_id || 'unknown');
    pairCounts.totalPairs += 1;
    criteriaCounts.totalPairs += 1;
    pairCounts.uncompletePairs += 1;
    criteriaCounts.uncompletePairs += 1;
  }

  const validPairs = pairCounts.totalPairs - pairCounts.uncompletePairs - pairCounts.errorPairs;
  const availableSelectedPairs = Math.max(0,
    pairCounts.cleanPairs +
    (includeReview === 'true' ? pairCounts.reviewPairs : 0) +
    (includeExcluded === 'true' ? pairCounts.skippedPairs : 0) -
    ceilingSkippedPairs
  );
  const selectedPairs = limitActive ? pairs.length : availableSelectedPairs;

  res.json({
    rawScores,
    pairs,
    criteriaDiagnostics: [...criteriaPairCounts.values()].map(row => {
      const validPairs = row.totalPairs - row.uncompletePairs - row.errorPairs;
      const availableSelectedPairs = Math.max(0,
        row.cleanPairs +
        (includeReview === 'true' ? row.reviewPairs : 0) +
        (includeExcluded === 'true' ? row.skippedPairs : 0) -
        (ceilingSkippedPairsByCriteria.get(row.criteriaId) || 0)
      );
      const selectedPairs = limitActive
        ? (cappedSelectedPairsByCriteria.get(row.criteriaId) || 0)
        : availableSelectedPairs;
      return {
        ...row,
        validPairs,
        selectedPairs,
        availableSelectedPairs,
        maxPairsPerCriteria: maxPairs,
        skipPairsPerCriteria: skipPairs,
        skipCeilingSingleScore: skipCeilingScore,
        skipCeilingSingleScoreMax: skipCeilingScoreMax,
        ceilingSkippedPairs: ceilingSkippedPairsByCriteria.get(row.criteriaId) || 0,
        selectionLimited: selectedPairs < availableSelectedPairs,
      };
    }).sort((a, b) => criteriaOrderIndex(a.criteriaId) - criteriaOrderIndex(b.criteriaId)),
    diagnostics: {
      totalRuns: diagnosticRow.totalRuns ?? 0,
      completedRuns: diagnosticRow.completedRuns ?? 0,
      scoredRuns: diagnosticRow.scoredRuns ?? 0,
      completedUnscoredRuns: diagnosticRow.completedUnscoredRuns ?? 0,
      errorRuns: diagnosticRow.errorRuns ?? 0,
      runningRuns: diagnosticRow.runningRuns ?? 0,
      otherStatusRuns: diagnosticRow.otherStatusRuns ?? 0,
      reviewRuns: diagnosticRow.reviewRuns ?? 0,
      excludedRuns: diagnosticRow.excludedRuns ?? 0,
      analysisRuns: rawScores.length,
      validPairs,
      cleanPairs: pairCounts.cleanPairs,
      selectedPairs,
      availableSelectedPairs,
      maxPairsPerCriteria: maxPairs,
      skipPairsPerCriteria: skipPairs,
      skipCeilingSingleScore: skipCeilingScore,
      skipCeilingSingleScoreMax: skipCeilingScoreMax,
      ceilingSkippedPairs,
      selectionLimited: selectedPairs < availableSelectedPairs,
      errorPairs: pairCounts.errorPairs,
      skippedPairs: pairCounts.skippedPairs,
      reviewPairs: pairCounts.reviewPairs,
      uncompletePairs: pairCounts.uncompletePairs,
      unfinishedPairs: pairCounts.uncompletePairs,
      totalPairs: pairCounts.totalPairs,
    },
  });
});

// GET /api/analysis/easy
router.get('/api/analysis/easy', (req: Request, res: Response) => {
  const { testset, setupId, modelId } = req.query as {
    testset?: string;
    setupId?: string;
    modelId?: string;
  };

  const params: (string | number)[] = [];
  let whereClause = 'WHERE r.status = \'completed\' AND sc.score_percent IS NOT NULL';

  if (testset) {
    whereClause += ' AND r.testset = ?';
    params.push(testset);
  }
  if (setupId) {
    whereClause += ' AND r.setup_id = ?';
    params.push(setupId);
  }
  if (modelId) {
    whereClause += ' AND r.llm_config_id = ?';
    params.push(Number(modelId));
  }

  // Summary table: Setup × Criteria
  const summaryTable = db.prepare(`
    SELECT r.setup_id, s.name as setup_name,
           q.criteria_id, c.name_de as criteria_name,
           AVG(sc.score_percent) as avg_score,
           COUNT(*) as run_count
    FROM runs r
    JOIN scores sc ON sc.run_id = r.id
    JOIN questions q ON r.question_id = q.id
    JOIN criteria c ON q.criteria_id = c.id
    JOIN setups s ON r.setup_id = s.id
    ${whereClause}
    GROUP BY r.setup_id, q.criteria_id
    ORDER BY r.setup_id, ${qCriteriaOrderSql}, q.criteria_id
  `).all(...params);

  // By setup
  const bySetup = db.prepare(`
    SELECT r.setup_id, s.name as setup_name,
           AVG(sc.score_percent) as avg_score,
           COUNT(*) as run_count
    FROM runs r
    JOIN scores sc ON sc.run_id = r.id
    JOIN setups s ON r.setup_id = s.id
    JOIN questions q ON r.question_id = q.id
    ${whereClause}
    GROUP BY r.setup_id
    ORDER BY r.setup_id
  `).all(...params);

  // By criteria
  const byCriteria = db.prepare(`
    SELECT q.criteria_id, c.name_de as criteria_name,
           AVG(sc.score_percent) as avg_score
    FROM runs r
    JOIN scores sc ON sc.run_id = r.id
    JOIN questions q ON r.question_id = q.id
    JOIN criteria c ON q.criteria_id = c.id
    ${whereClause}
    GROUP BY q.criteria_id
    ORDER BY ${qCriteriaOrderSql}, q.criteria_id
  `).all(...params);

  // Comparison pairs: runs linked by comparison_group_id
  // Find pairs where one is a matching direct baseline and another is a workflow.
  const comparisonPairs = db.prepare(`
    SELECT r1.question_id,
           r1.id as run_id_single,
           r1.setup_id as setup_id_single,
           r1.run_nr,
           r1.llm_config_id,
           sc1.score_percent as single_score,
           r2.id as run_id_workflow,
           r2.setup_id as setup_id_workflow,
           sc2.score_percent as workflow_score,
           r1.comparison_group_id
    FROM runs r1
    JOIN runs r2 ON r1.comparison_group_id = r2.comparison_group_id
                 AND r1.id != r2.id
                 AND r1.question_id = r2.question_id
                 AND r1.setup_id IN ('setup_direct', 'setup_ce_direct')
                 AND r2.setup_id NOT IN ('setup_direct', 'setup_ce_direct')
                 AND (
                   (r1.setup_id = 'setup_direct' AND r2.setup_id NOT LIKE 'setup_ce_%')
                   OR (r1.setup_id = 'setup_ce_direct' AND r2.setup_id LIKE 'setup_ce_%')
                 )
                 AND r1.llm_config_id = r2.llm_config_id
                 AND COALESCE(r1.run_nr, -1) = COALESCE(r2.run_nr, -1)
                 AND COALESCE(r1.testset, '') = COALESCE(r2.testset, '')
                 AND COALESCE(r1.run_set_id, '') = COALESCE(r2.run_set_id, '')
    JOIN scores sc1 ON sc1.run_id = r1.id
    JOIN scores sc2 ON sc2.run_id = r2.id
    WHERE r1.comparison_group_id IS NOT NULL
      AND r1.status = 'completed' AND r2.status = 'completed'
  `).all();

  res.json({ summaryTable, bySetup, byCriteria, comparisonPairs });
});

// GET /api/analysis/full
router.get('/api/analysis/full', (req: Request, res: Response) => {
  const { testset, setupId, modelId } = req.query as {
    testset?: string;
    setupId?: string;
    modelId?: string;
  };

  const params: (string | number)[] = [];
  let whereClause = 'WHERE r.status = \'completed\' AND sc.score_percent IS NOT NULL';

  if (testset) {
    whereClause += ' AND r.testset = ?';
    params.push(testset);
  }
  if (setupId) {
    whereClause += ' AND r.setup_id = ?';
    params.push(setupId);
  }
  if (modelId) {
    whereClause += ' AND r.llm_config_id = ?';
    params.push(Number(modelId));
  }

  // Raw scores
  const rawScores = db.prepare(`
    SELECT r.id as run_id, r.setup_id, r.question_id, r.run_nr, q.criteria_id,
           sc.score_percent, r.comparison_group_id, r.llm_config_id,
           r.testset
    FROM runs r
    JOIN scores sc ON sc.run_id = r.id
    JOIN questions q ON r.question_id = q.id
    ${whereClause}
    ORDER BY r.setup_id, ${qCriteriaOrderSql}, r.question_id
  `).all(...params);

  // Descriptive stats
  const descriptive = db.prepare(`
    SELECT r.setup_id, q.criteria_id,
           AVG(sc.score_percent) as mean,
           COUNT(*) as count,
           MIN(sc.score_percent) as min,
           MAX(sc.score_percent) as max
    FROM runs r
    JOIN scores sc ON sc.run_id = r.id
    JOIN questions q ON r.question_id = q.id
    ${whereClause}
    GROUP BY r.setup_id, q.criteria_id
    ORDER BY r.setup_id, ${qCriteriaOrderSql}, q.criteria_id
  `).all(...params);

  res.json({ rawScores, descriptive });
});

export default router;

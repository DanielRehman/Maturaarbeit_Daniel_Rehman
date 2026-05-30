const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, '..', 'data', 'matura.db'));
const OUT_ROOT = path.resolve(__dirname, '..', '..', 'reports', 'regenerated');

const REPORTS = [
  {
    slug: 'app2_same_start_pick_100pm_after_cleanup',
    title: 'App2 Same-Start PICK 100 pro Metrik nach Cleanup',
    runSets: [
      'ce_ss_reason_pick_100pm_20260524_1',
      'ce_ss_reason_pick_100pm_20260524_2',
      'ce_ss_reason_pick_100pm_20260524_3',
      'ce_ss_reason_pick_100pm_20260524_4',
    ],
    workflowSetups: ['setup_ce_ss_reason_flowreview', 'setup_ce_ss_reason_pick_iso'],
    setupLabels: {
      setup_ce_ss_reason_flowreview: 'ohne PICK',
      setup_ce_ss_reason_pick_iso: 'mit PICK',
    },
  },
  {
    slug: 'ce_additive_completion_after_cleanup',
    title: 'CE Additive Completion nach Cleanup',
    runSets: ['ce_additive_completion_10pm_20260526'],
    workflowSetups: ['setup_ce_additive_completion'],
    setupLabels: {
      setup_ce_additive_completion: 'Additive Completion',
    },
  },
  {
    slug: 'ce_app2_s4_after_cleanup',
    title: 'CE/App2 S4 nach Cleanup',
    runSets: ['ce_calc_final_questions'],
    workflowSetups: ['setup_ce_flowreview_s4'],
    setupLabels: {
      setup_ce_flowreview_s4: 'CE Flowreview S4',
    },
  },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function avg(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function pct(value, digits = 1, signed = false) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  const sign = signed && value > 0 ? '+' : '';
  return `${sign}${Number(value).toFixed(digits)}%`;
}

function csvValue(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(file, rows) {
  if (!rows.length) {
    fs.writeFileSync(file, '', 'utf8');
    return;
  }
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(csvValue).join(','),
    ...rows.map(row => headers.map(header => csvValue(row[header])).join(',')),
  ];
  fs.writeFileSync(file, `${lines.join('\n')}\n`, 'utf8');
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.join(' | ')} |`),
  ].join('\n');
}

function groupBy(rows, keyFn) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return groups;
}

function summarize(rows) {
  const diffs = rows.map(row => row.workflow_score - row.direct_score).filter(Number.isFinite);
  const better = diffs.filter(value => value > 0.000001).length;
  const worse = diffs.filter(value => value < -0.000001).length;
  return {
    n: rows.length,
    direct: avg(rows.map(row => row.direct_score).filter(Number.isFinite)),
    workflow: avg(rows.map(row => row.workflow_score).filter(Number.isFinite)),
    diff: avg(diffs),
    better,
    worse,
    equal: diffs.length - better - worse,
  };
}

function criterionSort(a, b) {
  return String(a).localeCompare(String(b));
}

function difficulty(testset) {
  return String(testset || '').replace(/^app2_/, '');
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function writeDiffChart(file, title, rows) {
  const labels = rows.map(row => row.label);
  const values = rows.map(row => row.diff);
  const width = 980;
  const height = Math.max(320, 80 + labels.length * 34);
  const left = 260;
  const right = 80;
  const top = 52;
  const rowH = 30;
  const maxAbs = Math.max(5, ...values.map(value => Math.abs(value)));
  const scale = (width - left - right) / (2 * maxAbs);
  const zeroX = left + (width - left - right) / 2;
  const chunks = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    '<rect width="100%" height="100%" fill="#fff"/>',
    `<text x="${width / 2}" y="30" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700">${escapeXml(title)}</text>`,
    `<line x1="${zeroX}" y1="${top - 8}" x2="${zeroX}" y2="${height - 30}" stroke="#334155" stroke-width="1"/>`,
  ];
  labels.forEach((label, index) => {
    const value = values[index];
    const y = top + index * rowH;
    const x = value >= 0 ? zeroX : zeroX + value * scale;
    const w = Math.max(2, Math.abs(value * scale));
    chunks.push(`<text x="${left - 12}" y="${y + 15}" text-anchor="end" font-family="Arial" font-size="12">${escapeXml(label)}</text>`);
    chunks.push(`<rect x="${x}" y="${y}" width="${w}" height="18" fill="${value >= 0 ? '#16a34a' : '#dc2626'}"/>`);
    chunks.push(`<text x="${value >= 0 ? x + w + 6 : x - 6}" y="${y + 14}" text-anchor="${value >= 0 ? 'start' : 'end'}" font-family="Arial" font-size="12">${escapeXml(pct(value, 1, true))}</text>`);
  });
  chunks.push('</svg>');
  fs.writeFileSync(file, chunks.join('\n'), 'utf8');
}

function writeOutcomeChart(file, title, rows) {
  const width = 980;
  const height = Math.max(320, 80 + rows.length * 34);
  const left = 260;
  const right = 80;
  const top = 52;
  const rowH = 30;
  const plotW = width - left - right;
  const chunks = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    '<rect width="100%" height="100%" fill="#fff"/>',
    `<text x="${width / 2}" y="30" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700">${escapeXml(title)}</text>`,
  ];
  rows.forEach((row, index) => {
    const y = top + index * rowH;
    const total = Math.max(1, row.better + row.worse + row.equal);
    const betterW = plotW * row.better / total;
    const equalW = plotW * row.equal / total;
    const worseW = plotW * row.worse / total;
    chunks.push(`<text x="${left - 12}" y="${y + 15}" text-anchor="end" font-family="Arial" font-size="12">${escapeXml(row.label)}</text>`);
    chunks.push(`<rect x="${left}" y="${y}" width="${betterW}" height="18" fill="#16a34a"/>`);
    chunks.push(`<rect x="${left + betterW}" y="${y}" width="${equalW}" height="18" fill="#94a3b8"/>`);
    chunks.push(`<rect x="${left + betterW + equalW}" y="${y}" width="${worseW}" height="18" fill="#dc2626"/>`);
    chunks.push(`<text x="${left + plotW + 8}" y="${y + 14}" font-family="Arial" font-size="12">${escapeXml(`${row.better}/${row.equal}/${row.worse}`)}</text>`);
  });
  chunks.push(`<text x="${left}" y="${height - 16}" font-family="Arial" font-size="12" fill="#16a34a">besser</text>`);
  chunks.push(`<text x="${left + 70}" y="${height - 16}" font-family="Arial" font-size="12" fill="#64748b">gleich</text>`);
  chunks.push(`<text x="${left + 135}" y="${height - 16}" font-family="Arial" font-size="12" fill="#dc2626">schlechter</text>`);
  chunks.push('</svg>');
  fs.writeFileSync(file, chunks.join('\n'), 'utf8');
}

function loadRows(config) {
  const runSetSql = config.runSets.map(() => '?').join(',');
  const setupSql = config.workflowSetups.map(() => '?').join(',');
  return db.prepare(`
    SELECT
      rp.id AS pair_id,
      rp.direct_run_id,
      rp.workflow_run_id,
      dr.run_set_id,
      wr.setup_id AS workflow_setup_id,
      wr.question_id,
      wr.testset,
      wr.run_nr,
      q.criteria_id,
      c.name_de AS criteria_name,
      ds.score_percent AS direct_score,
      ws.score_percent AS workflow_score
    FROM run_pairs rp
    JOIN runs dr ON dr.id = rp.direct_run_id
    JOIN runs wr ON wr.id = rp.workflow_run_id
    JOIN questions q ON q.id = wr.question_id
    JOIN criteria c ON c.id = q.criteria_id
    JOIN scores ds ON ds.run_id = dr.id
    JOIN scores ws ON ws.run_id = wr.id
    WHERE wr.run_set_id IN (${runSetSql})
      AND wr.setup_id IN (${setupSql})
      AND dr.setup_id = 'setup_ce_direct'
      AND dr.status = 'completed'
      AND wr.status = 'completed'
      AND COALESCE(dr.exclude_from_analysis, 0) = 0
      AND COALESCE(wr.exclude_from_analysis, 0) = 0
      AND ds.score_percent IS NOT NULL
      AND ws.score_percent IS NOT NULL
    ORDER BY wr.testset, q.criteria_id, wr.setup_id, wr.run_set_id, wr.question_id, wr.run_nr
  `).all(...config.runSets, ...config.workflowSetups);
}

function buildReport(config) {
  const outDir = path.join(OUT_ROOT, config.slug);
  const imgDir = path.join(outDir, 'images');
  const tableDir = path.join(outDir, 'tables');
  ensureDir(imgDir);
  ensureDir(tableDir);

  const rows = loadRows(config);
  const overall = [...groupBy(rows, row => row.workflow_setup_id).entries()]
    .map(([setupId, groupRows]) => ({
      setupId,
      label: config.setupLabels[setupId] || setupId,
      ...summarize(groupRows),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const byMetric = [...groupBy(rows, row => `${row.workflow_setup_id}|${row.criteria_id}|${row.criteria_name}`).entries()]
    .map(([key, groupRows]) => {
      const [setupId, criteriaId, criteriaName] = key.split('|');
      return {
        setupId,
        setupLabel: config.setupLabels[setupId] || setupId,
        criteriaId,
        criteriaName,
        label: `${config.setupLabels[setupId] || setupId}: ${criteriaName || criteriaId}`,
        ...summarize(groupRows),
      };
    })
    .sort((a, b) => a.setupLabel.localeCompare(b.setupLabel) || criterionSort(a.criteriaId, b.criteriaId));

  const byDifficulty = [...groupBy(rows, row => `${row.workflow_setup_id}|${difficulty(row.testset)}`).entries()]
    .map(([key, groupRows]) => {
      const [setupId, diffLabel] = key.split('|');
      return {
        setupId,
        setupLabel: config.setupLabels[setupId] || setupId,
        difficulty: diffLabel,
        label: `${config.setupLabels[setupId] || setupId}: ${diffLabel}`,
        ...summarize(groupRows),
      };
    })
    .sort((a, b) => a.setupLabel.localeCompare(b.setupLabel) || a.difficulty.localeCompare(b.difficulty));

  writeCsv(path.join(tableDir, 'pairs.csv'), rows.map(row => ({
    pair_id: row.pair_id,
    run_set_id: row.run_set_id,
    workflow_setup_id: row.workflow_setup_id,
    question_id: row.question_id,
    testset: row.testset,
    criteria_id: row.criteria_id,
    direct_run_id: row.direct_run_id,
    workflow_run_id: row.workflow_run_id,
    direct_score: row.direct_score,
    workflow_score: row.workflow_score,
    diff: row.workflow_score - row.direct_score,
  })));
  writeCsv(path.join(tableDir, 'by_metric.csv'), byMetric);
  writeCsv(path.join(tableDir, 'by_difficulty.csv'), byDifficulty);

  writeDiffChart(path.join(imgDir, 'diff_by_metric.svg'), `${config.title}: Differenz pro Metrik`, byMetric);
  writeOutcomeChart(path.join(imgDir, 'outcomes_by_metric.svg'), `${config.title}: besser/gleich/schlechter`, byMetric);
  if (byDifficulty.length > 1) {
    writeDiffChart(path.join(imgDir, 'diff_by_difficulty.svg'), `${config.title}: Differenz pro Schwierigkeit`, byDifficulty);
  }

  const report = [
    `# ${config.title}`,
    '',
    `- Erstellt: ${new Date().toISOString()}`,
    `- Quelle: \`app/data/matura.db\``,
    `- Paarung: feste IDs aus \`run_pairs.direct_run_id -> run_pairs.workflow_run_id\``,
    `- Runsets: ${config.runSets.map(value => `\`${value}\``).join(', ')}`,
    `- Workflow-Setups: ${config.workflowSetups.map(value => `\`${value}\``).join(', ')}`,
    `- Ausgeschlossene markierte Fehler: Runs mit Status nicht \`completed\` oder \`exclude_from_analysis != 0\``,
    '',
    '## Overall',
    '',
    mdTable(
      ['Workflow', 'N', 'Direct avg', 'Workflow avg', 'Diff', 'Better', 'Equal', 'Worse'],
      overall.map(row => [row.label, row.n, pct(row.direct), pct(row.workflow), pct(row.diff, 1, true), row.better, row.equal, row.worse])
    ),
    '',
    '## By Metric',
    '',
    mdTable(
      ['Workflow', 'Metric', 'N', 'Direct avg', 'Workflow avg', 'Diff', 'Better', 'Equal', 'Worse'],
      byMetric.map(row => [row.setupLabel, row.criteriaName || row.criteriaId, row.n, pct(row.direct), pct(row.workflow), pct(row.diff, 1, true), row.better, row.equal, row.worse])
    ),
    '',
    '## Files',
    '',
    '- `summary_data.json`',
    '- `tables/pairs.csv`',
    '- `tables/by_metric.csv`',
    '- `images/diff_by_metric.svg`',
    '- `images/outcomes_by_metric.svg`',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(outDir, 'REPORT.md'), report, 'utf8');
  fs.writeFileSync(path.join(outDir, 'summary_data.json'), `${JSON.stringify({
    title: config.title,
    createdAt: new Date().toISOString(),
    runSets: config.runSets,
    workflowSetups: config.workflowSetups,
    pairSource: 'run_pairs.direct_run_id -> run_pairs.workflow_run_id',
    rowCount: rows.length,
    overall,
    byMetric,
    byDifficulty,
  }, null, 2)}\n`, 'utf8');

  return { slug: config.slug, outDir, pairs: rows.length, overall };
}

ensureDir(OUT_ROOT);
const results = REPORTS.map(buildReport);
fs.writeFileSync(path.join(OUT_ROOT, 'README.md'), [
  '# Regenerated Reports',
  '',
  'Neue Vergleichsversionen. Alte Reports wurden nicht geloescht oder ueberschrieben.',
  '',
  ...results.map(result => `- [${result.slug}](./${result.slug}/REPORT.md): ${result.pairs} Paare`),
  '',
].join('\n'), 'utf8');

console.log(JSON.stringify(results, null, 2));

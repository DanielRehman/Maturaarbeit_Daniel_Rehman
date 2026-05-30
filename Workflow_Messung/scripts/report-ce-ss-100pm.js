const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, '..', 'data', 'matura.db'));

const RUNSETS = [
  'ce_ss_reason_pick_100pm_20260524_1',
  'ce_ss_reason_pick_100pm_20260524_2',
  'ce_ss_reason_pick_100pm_20260524_3',
  'ce_ss_reason_pick_100pm_20260524_4',
];

const OUT_DIR = path.join(__dirname, '..', '..', 'analysis_app2', '02_neu_same_start', '100_pro_metrik_report');
const IMG_DIR = path.join(OUT_DIR, 'images');
fs.mkdirSync(IMG_DIR, { recursive: true });

const SETUP_LABELS = {
  setup_ce_ss_reason_flowreview: 'ohne PICK',
  setup_ce_ss_reason_pick_iso: 'mit PICK',
};
const CRITERIA_LABELS = {
  richtigkeit: 'Richtigkeit',
  pruefung_verifikation: 'Pruefung / Verifikation',
  vollstaendigkeit_frage: 'Vollstaendigkeit gemaess Frage',
  vollstaendigkeit_moeglichkeit: 'Vollstaendigkeit gemaess Moeglichkeit',
};

const runsetPlaceholders = RUNSETS.map(() => '?').join(',');
const rows = db.prepare(`
  SELECT
    r.run_set_id,
    r.setup_id,
    r.question_id,
    r.testset,
    q.criteria_id,
    c.name_de AS criteria_name,
    r.run_nr,
    s.score_percent AS workflow_score,
    ds.score_percent AS direct_score
  FROM runs r
  JOIN questions q ON q.id = r.question_id
  JOIN criteria c ON c.id = q.criteria_id
  JOIN scores s ON s.run_id = r.id
  JOIN runs dr
    ON dr.run_set_id = r.run_set_id
   AND dr.question_id = r.question_id
   AND dr.run_nr = r.run_nr
   AND dr.setup_id = 'setup_ce_direct'
  JOIN scores ds ON ds.run_id = dr.id
  WHERE r.run_set_id IN (${runsetPlaceholders})
    AND r.setup_id IN ('setup_ce_ss_reason_flowreview', 'setup_ce_ss_reason_pick_iso')
    AND r.status = 'completed'
    AND dr.status = 'completed'
  ORDER BY r.testset, q.criteria_id, r.setup_id, r.run_set_id, r.question_id, r.run_nr
`).all(...RUNSETS);

function difficulty(testset) {
  return String(testset || '').replace(/^app2_/, '');
}

function pct(value, digits = 1, signed = true) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  const sign = signed && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

function avg(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summarize(groupRows) {
  const diffs = groupRows.map(row => row.workflow_score - row.direct_score);
  const direct = groupRows.map(row => row.direct_score);
  const workflow = groupRows.map(row => row.workflow_score);
  const better = diffs.filter(value => value > 0.000001).length;
  const worse = diffs.filter(value => value < -0.000001).length;
  const equal = diffs.length - better - worse;
  return {
    n: groupRows.length,
    direct: avg(direct),
    workflow: avg(workflow),
    diff: avg(diffs),
    better,
    worse,
    equal,
    test: tTest(diffs),
  };
}

function sampleSd(values) {
  if (values.length < 2) return null;
  const m = avg(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - m) ** 2, 0) / (values.length - 1));
}

function tTest(diffs) {
  const clean = diffs.filter(Number.isFinite);
  if (clean.length < 2) return null;
  const meanDiff = avg(clean);
  const sd = sampleSd(clean);
  if (!sd) return null;
  const se = sd / Math.sqrt(clean.length);
  const t = meanDiff / se;
  const df = clean.length - 1;
  const p = Math.max(0, Math.min(1, 2 * (1 - studentTCdf(Math.abs(t), df))));
  return { t, df, p, significant: p < 0.05 };
}

function formatP(test) {
  if (!test) return 'n/a';
  if (test.p < 0.0001) return '<0.0001';
  return test.p.toFixed(4);
}

function formatT(test) {
  if (!test) return 'n/a';
  return test.t.toFixed(3);
}

function tCritical95(df) {
  const table = { 1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228, 11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131, 16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086, 21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060, 26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045, 30: 2.042 };
  if (df <= 30) return table[df] || 12.706;
  if (df <= 60) return 2.000;
  if (df <= 120) return 1.980;
  return 1.960;
}

function studentTCdf(t, df) {
  const x = df / (df + t * t);
  const ib = regularizedBeta(x, df / 2, 0.5);
  return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib;
}

function regularizedBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return bt * betaContinuedFraction(x, a, b) / a;
  return 1 - bt * betaContinuedFraction(1 - x, b, a) / b;
}

function betaContinuedFraction(x, a, b) {
  const maxIter = 100;
  const eps = 3e-7;
  const fpmin = 1e-30;
  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - qab * x / qap;
  if (Math.abs(d) < fpmin) d = fpmin;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < eps) break;
  }
  return h;
}

function logGamma(z) {
  const p = [676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = 0.9999999999998099;
  for (let i = 0; i < p.length; i++) x += p[i] / (z + i + 1);
  const t = z + p.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function mdTable(headers, bodyRows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...bodyRows.map(row => `| ${row.join(' | ')} |`),
  ].join('\n');
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function writeGroupedBarChart(file, title, labels, series) {
  const width = 1040;
  const height = 520;
  const margin = { top: 58, right: 40, bottom: 110, left: 76 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const allValues = series.flatMap(s => s.values);
  const min = Math.min(0, ...allValues);
  const max = Math.max(0, ...allValues);
  const pad = Math.max(1, (max - min) * 0.12);
  const yMin = min - pad;
  const yMax = max + pad;
  const y = value => margin.top + ((yMax - value) / (yMax - yMin)) * plotH;
  const zeroY = y(0);
  const groupW = plotW / labels.length;
  const barW = Math.min(34, groupW / (series.length + 1));
  const colors = ['#2563eb', '#16a34a', '#dc2626'];
  const chunks = [];
  chunks.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  chunks.push(`<rect width="100%" height="100%" fill="#ffffff"/>`);
  chunks.push(`<text x="${width / 2}" y="30" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700">${escapeXml(title)}</text>`);
  chunks.push(`<line x1="${margin.left}" y1="${zeroY}" x2="${width - margin.right}" y2="${zeroY}" stroke="#334155" stroke-width="1.2"/>`);
  chunks.push(`<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#94a3b8"/>`);
  for (let i = 0; i < labels.length; i++) {
    const cx = margin.left + i * groupW + groupW / 2;
    chunks.push(`<text x="${cx}" y="${height - 72}" text-anchor="middle" font-family="Arial" font-size="12">${escapeXml(labels[i])}</text>`);
    for (let j = 0; j < series.length; j++) {
      const value = series[j].values[i];
      const x = cx - (series.length * barW) / 2 + j * barW;
      const top = Math.min(y(value), zeroY);
      const h = Math.max(1, Math.abs(zeroY - y(value)));
      chunks.push(`<rect x="${x}" y="${top}" width="${barW - 3}" height="${h}" fill="${colors[j % colors.length]}"/>`);
      chunks.push(`<text x="${x + (barW - 3) / 2}" y="${value >= 0 ? top - 5 : top + h + 14}" text-anchor="middle" font-family="Arial" font-size="10" fill="#0f172a">${escapeXml(pct(value, 1))}</text>`);
    }
  }
  series.forEach((s, idx) => {
    const x = margin.left + idx * 180;
    const yLegend = height - 32;
    chunks.push(`<rect x="${x}" y="${yLegend - 12}" width="14" height="14" fill="${colors[idx % colors.length]}"/>`);
    chunks.push(`<text x="${x + 20}" y="${yLegend}" font-family="Arial" font-size="13">${escapeXml(s.name)}</text>`);
  });
  chunks.push(`<text x="18" y="${margin.top + plotH / 2}" transform="rotate(-90 18 ${margin.top + plotH / 2})" text-anchor="middle" font-family="Arial" font-size="13">Workflow minus Direct</text>`);
  chunks.push('</svg>');
  fs.writeFileSync(path.join(IMG_DIR, file), chunks.join('\n'), 'utf8');
}

function writeOutcomeStack(file, title, groupedSummaries) {
  const width = 1040;
  const rowH = 34;
  const margin = { top: 58, right: 40, bottom: 36, left: 210 };
  const height = margin.top + margin.bottom + groupedSummaries.length * rowH;
  const plotW = width - margin.left - margin.right;
  const colors = { worse: '#dc2626', equal: '#eab308', better: '#16a34a' };
  const chunks = [];
  chunks.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  chunks.push(`<rect width="100%" height="100%" fill="#ffffff"/>`);
  chunks.push(`<text x="${width / 2}" y="30" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700">${escapeXml(title)}</text>`);
  groupedSummaries.forEach((item, i) => {
    const y = margin.top + i * rowH;
    const label = `${item.label}`;
    chunks.push(`<text x="${margin.left - 12}" y="${y + 22}" text-anchor="end" font-family="Arial" font-size="12">${escapeXml(label)}</text>`);
    let x = margin.left;
    for (const key of ['worse', 'equal', 'better']) {
      const count = item.summary[key];
      const w = item.summary.n ? (count / item.summary.n) * plotW : 0;
      chunks.push(`<rect x="${x}" y="${y + 7}" width="${w}" height="20" fill="${colors[key]}"/>`);
      if (w > 36 && count > 0) {
        chunks.push(`<text x="${x + w / 2}" y="${y + 22}" text-anchor="middle" font-family="Arial" font-size="11" fill="#111827">${count}</text>`);
      }
      x += w;
    }
  });
  const legendY = height - 12;
  [['worse', 'schlechter'], ['equal', 'gleich'], ['better', 'besser']].forEach(([key, label], idx) => {
    const x = margin.left + idx * 140;
    chunks.push(`<rect x="${x}" y="${legendY - 13}" width="14" height="14" fill="${colors[key]}"/>`);
    chunks.push(`<text x="${x + 20}" y="${legendY}" font-family="Arial" font-size="13">${label}</text>`);
  });
  chunks.push('</svg>');
  fs.writeFileSync(path.join(IMG_DIR, file), chunks.join('\n'), 'utf8');
}

const byDifficultySetup = [];
for (const [key, groupRows] of groupBy(rows, row => `${difficulty(row.testset)}|${row.setup_id}`)) {
  const [diffName, setupId] = key.split('|');
  byDifficultySetup.push({ diffName, setupId, label: SETUP_LABELS[setupId], summary: summarize(groupRows) });
}
byDifficultySetup.sort((a, b) => a.diffName.localeCompare(b.diffName) || a.label.localeCompare(b.label));

const byMetricSetup = [];
for (const [key, groupRows] of groupBy(rows, row => `${row.criteria_id}|${row.criteria_name}|${row.setup_id}`)) {
  const [criteriaId, criteriaName, setupId] = key.split('|');
  byMetricSetup.push({ criteriaId, criteriaName: CRITERIA_LABELS[criteriaId] || criteriaName, setupId, label: SETUP_LABELS[setupId], summary: summarize(groupRows) });
}
byMetricSetup.sort((a, b) => a.criteriaName.localeCompare(b.criteriaName) || a.label.localeCompare(b.label));

const byDifficultyMetricSetup = [];
for (const [key, groupRows] of groupBy(rows, row => `${difficulty(row.testset)}|${row.criteria_id}|${row.criteria_name}|${row.setup_id}`)) {
  const [diffName, criteriaId, criteriaName, setupId] = key.split('|');
  byDifficultyMetricSetup.push({ diffName, criteriaId, criteriaName: CRITERIA_LABELS[criteriaId] || criteriaName, setupId, label: SETUP_LABELS[setupId], summary: summarize(groupRows) });
}
byDifficultyMetricSetup.sort((a, b) =>
  a.diffName.localeCompare(b.diffName) ||
  a.criteriaName.localeCompare(b.criteriaName) ||
  a.label.localeCompare(b.label)
);

const overall = [];
for (const [setupId, groupRows] of groupBy(rows, row => row.setup_id)) {
  overall.push({ setupId, label: SETUP_LABELS[setupId], summary: summarize(groupRows) });
}
overall.sort((a, b) => a.label.localeCompare(b.label));

const difficultyLabels = [...new Set(byDifficultySetup.map(item => item.diffName))];
writeGroupedBarChart(
  'mean_diff_by_difficulty.svg',
  'Mittlere Score-Differenz nach Schwierigkeit',
  difficultyLabels,
  Object.entries(SETUP_LABELS).map(([setupId, name]) => ({
    name,
    values: difficultyLabels.map(diffName => {
      const item = byDifficultySetup.find(x => x.diffName === diffName && x.setupId === setupId);
      return item ? item.summary.diff : 0;
    }),
  }))
);

writeOutcomeStack(
  'pair_outcomes_by_difficulty.svg',
  'Paar-Outcomes nach Schwierigkeit',
  byDifficultySetup.map(item => ({ label: `${item.diffName} ${item.label}`, summary: item.summary }))
);

const metricLabels = [...new Set(byMetricSetup.map(item => item.criteriaName))];
writeGroupedBarChart(
  'mean_diff_by_metric.svg',
  'Mittlere Score-Differenz nach Metrik',
  metricLabels,
  Object.entries(SETUP_LABELS).map(([setupId, name]) => ({
    name,
    values: metricLabels.map(metricName => {
      const item = byMetricSetup.find(x => x.criteriaName === metricName && x.setupId === setupId);
      return item ? item.summary.diff : 0;
    }),
  }))
);

const lines = [];
lines.push('# CE Same-Start: 100+ Runs pro Metrik');
lines.push('');
lines.push(`Runsets: ${RUNSETS.map(id => `\`${id}\``).join(', ')}`);
lines.push('');
lines.push('## Kurzfazit');
lines.push('');
const noPick = overall.find(x => x.setupId === 'setup_ce_ss_reason_flowreview')?.summary;
const pick = overall.find(x => x.setupId === 'setup_ce_ss_reason_pick_iso')?.summary;
lines.push(`- Ohne PICK: ${noPick.n} Paare, mittlere Diff ${pct(noPick.diff)}, p=${formatP(noPick.test)}, besser ${noPick.better}, schlechter ${noPick.worse}, gleich ${noPick.equal}.`);
lines.push(`- Mit PICK: ${pick.n} Paare, mittlere Diff ${pct(pick.diff)}, p=${formatP(pick.test)}, besser ${pick.better}, schlechter ${pick.worse}, gleich ${pick.equal}.`);
lines.push('- Interpretation: Der Same-Start-Review zeigt nur dann eine echte Verbesserung, wenn die Review-Antwort gegen die exakt gleiche Direct-Ausgangsantwort besser abschneidet.');
lines.push('- PICK wird separat betrachtet, weil er zwischen Direct-Kopie und Review-Antwort entscheidet.');
lines.push('');
lines.push('## Gesamt');
lines.push('');
lines.push(mdTable(
  ['Variante', 'N', 'Direct Score', 'Workflow Score', 'mittlere Diff', 't', 'p', 'sign.', 'besser', 'schlechter', 'gleich'],
  overall.map(item => [
    item.label,
    item.summary.n,
    pct(item.summary.direct, 1, false),
    pct(item.summary.workflow, 1, false),
    pct(item.summary.diff),
    formatT(item.summary.test),
    formatP(item.summary.test),
    item.summary.test?.significant ? 'ja' : 'nein',
    item.summary.better,
    item.summary.worse,
    item.summary.equal,
  ])
));
lines.push('');
lines.push('## Nach Schwierigkeit');
lines.push('');
lines.push(mdTable(
  ['Schwierigkeit', 'Variante', 'N', 'Direct Score', 'Workflow Score', 'mittlere Diff', 't', 'p', 'sign.', 'besser', 'schlechter', 'gleich'],
  byDifficultySetup.map(item => [
    item.diffName,
    item.label,
    item.summary.n,
    pct(item.summary.direct, 1, false),
    pct(item.summary.workflow, 1, false),
    pct(item.summary.diff),
    formatT(item.summary.test),
    formatP(item.summary.test),
    item.summary.test?.significant ? 'ja' : 'nein',
    item.summary.better,
    item.summary.worse,
    item.summary.equal,
  ])
));
lines.push('');
lines.push('## Nach Metrik');
lines.push('');
lines.push(mdTable(
  ['Metrik', 'Variante', 'N', 'Direct Score', 'Workflow Score', 'mittlere Diff', 't', 'p', 'sign.', 'besser', 'schlechter', 'gleich'],
  byMetricSetup.map(item => [
    item.criteriaName,
    item.label,
    item.summary.n,
    pct(item.summary.direct, 1, false),
    pct(item.summary.workflow, 1, false),
    pct(item.summary.diff),
    formatT(item.summary.test),
    formatP(item.summary.test),
    item.summary.test?.significant ? 'ja' : 'nein',
    item.summary.better,
    item.summary.worse,
    item.summary.equal,
  ])
));
lines.push('');
lines.push('## Detail: Schwierigkeit x Metrik');
lines.push('');
lines.push(mdTable(
  ['Schwierigkeit', 'Metrik', 'Variante', 'N', 'Direct Score', 'Workflow Score', 'mittlere Diff', 't', 'p', 'sign.', 'besser', 'schlechter', 'gleich'],
  byDifficultyMetricSetup.map(item => [
    item.diffName,
    item.criteriaName,
    item.label,
    item.summary.n,
    pct(item.summary.direct, 1, false),
    pct(item.summary.workflow, 1, false),
    pct(item.summary.diff),
    formatT(item.summary.test),
    formatP(item.summary.test),
    item.summary.test?.significant ? 'ja' : 'nein',
    item.summary.better,
    item.summary.worse,
    item.summary.equal,
  ])
));
lines.push('');
lines.push('## SVG-Charts');
lines.push('');
lines.push('- [Mittlere Differenz nach Schwierigkeit](images/mean_diff_by_difficulty.svg)');
lines.push('- [Paar-Outcomes nach Schwierigkeit](images/pair_outcomes_by_difficulty.svg)');
lines.push('- [Mittlere Differenz nach Metrik](images/mean_diff_by_metric.svg)');
lines.push('');
lines.push('![Mittlere Differenz nach Schwierigkeit](images/mean_diff_by_difficulty.svg)');
lines.push('');
lines.push('![Paar-Outcomes nach Schwierigkeit](images/pair_outcomes_by_difficulty.svg)');
lines.push('');
lines.push('![Mittlere Differenz nach Metrik](images/mean_diff_by_metric.svg)');
lines.push('');

fs.writeFileSync(path.join(OUT_DIR, 'REPORT_100_PRO_METRIK.md'), lines.join('\n'), 'utf8');
fs.writeFileSync(path.join(OUT_DIR, 'summary_data.json'), JSON.stringify({
  runsets: RUNSETS,
  overall,
  byDifficultySetup,
  byMetricSetup,
  byDifficultyMetricSetup,
}, null, 2), 'utf8');

console.log(JSON.stringify({
  outDir: OUT_DIR,
  rows: rows.length,
  report: path.join(OUT_DIR, 'REPORT_100_PRO_METRIK.md'),
}, null, 2));

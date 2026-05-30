const Database = require('better-sqlite3');
const db = new Database('data/matura.db');

const runId = 20765;
const score = db.prepare('SELECT id FROM scores WHERE run_id = ?').get(runId);
if (!score) {
  console.log(JSON.stringify({ skipped: true, reason: `Run ${runId} not found` }));
  process.exit(0);
}

const samples = [
  {
    expected: { ok: true, count: 80, label: 'Basel', ids: ['A', 'B'] },
    actual: { ok: 'yes', count: '80', label: ' basel ', ids: ['B', 'A'] },
  },
  {
    expected: { ok: false, count: 66.67, label: 'bus' },
    actual: { ok: 0, count: '66.67', label: 'BUS' },
  },
  {
    expected: { a: false, b: false, c: false, d: false, e: true, n: 1, chf: 68, speed: 80, percent: 66.67 },
    actual: { a: null, b: -1, c: 'null', d: 'fale', e: '1.0', n: '1.0', chf: '68 CHF', speed: '80 km/h', percent: '66,67 %' },
  },
  {
    expected: { value: 80 },
    actual: { value: '120 km in 1.5 h gives 80 km/h' },
  },
  {
    expected: { city: 'Zürich HB', field: 'source_text', option: 'aviation-authority' },
    actual: { city: '  ZURICH   hb ', field: 'Source Text', option: 'Aviation Authority' },
  },
];

const schemaSamples = [
  {
    expected: { missing_fields: ['budget', 'operating_system'] },
    actual: { missing_fields: ['budget', 'operating system'] },
    schema: { missing_fields: { type: 'array', item_type: 'string', allowed_items: ['budget', 'operating_system'] } },
  },
  {
    expected: { missing_fields: ['budget', 'operating_system'] },
    actual: { missing_fields: ['budget', 'operating system preference'] },
    schema: { missing_fields: { type: 'array', item_type: 'string', allowed_items: ['budget', 'operating_system'] } },
  },
  {
    expected: { check_method: 'inverse' },
    actual: { check_method: 'Inverse' },
    schema: { check_method: { type: 'string', allowed_values: ['multiplication', 'inverse'] } },
  },
];

function normalizeComparableString(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/[^\p{L}\p{N}.]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseBooleanLike(value) {
  if (typeof value === 'boolean') return value;
  if (value === null) return false;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0 || value === -1) return false;
  }
  if (typeof value !== 'string') return null;
  const normalized = normalizeComparableString(value);
  if (['true', 'yes', 'ja', 'y', '1', '1.0', 'correct', 'richtig', 'wahr'].includes(normalized)) return true;
  if (['false', 'fale', 'no', 'nein', 'n', '0', '0.0', '-1', '-1.0', 'null', 'none', 'incorrect', 'falsch', 'unwahr'].includes(normalized)) return false;
  return null;
}

function parseNumberLike(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/\u00a0/g, ' ').replace(/,/g, '.');
  const matches = normalized.match(/[+-]?\d+(?:\.\d+)?/g) ?? [];
  if (matches.length !== 1) return null;
  const parsed = Number(matches[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeForLooseArrayCompare(value) {
  const bool = parseBooleanLike(value);
  if (bool !== null) return bool;
  const num = parseNumberLike(value);
  if (num !== null) return num;
  if (typeof value === 'string') return normalizeComparableString(value);
  if (Array.isArray(value)) return value.map(normalizeForLooseArrayCompare);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeForLooseArrayCompare(item)]));
  }
  return value;
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function tolerantEqual(actual, expected) {
  if (stableJson(actual) === stableJson(expected)) return true;
  if (typeof expected === 'boolean') return parseBooleanLike(actual) === expected;
  if (typeof expected === 'number') {
    const n = parseNumberLike(actual);
    return n !== null && Math.abs(n - expected) <= (Number.isInteger(expected) ? 1e-9 : 1e-6);
  }
  if (typeof expected === 'string') return typeof actual === 'string' && normalizeComparableString(actual) === normalizeComparableString(expected);
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) return false;
    if (expected.every((item, idx) => tolerantEqual(actual[idx], item))) return true;
    return stableJson(actual.map(normalizeForLooseArrayCompare).sort()) === stableJson(expected.map(normalizeForLooseArrayCompare).sort());
  }
  return false;
}

function canonicalAllowedValue(value, allowed) {
  if (!allowed?.length) return value;
  for (const candidate of allowed) {
    if (tolerantEqual(value, candidate)) return candidate;
  }
  return undefined;
}

function tolerantEqualWithSchema(actual, expected, fieldSchema) {
  if (fieldSchema?.allowed_values?.length) {
    const canonicalActual = canonicalAllowedValue(actual, fieldSchema.allowed_values);
    return canonicalActual !== undefined && tolerantEqual(canonicalActual, expected);
  }
  if (Array.isArray(expected) && fieldSchema?.allowed_items?.length) {
    if (!Array.isArray(actual) || actual.length !== expected.length) return false;
    const canonicalActual = actual.map(item => canonicalAllowedValue(item, fieldSchema.allowed_items));
    if (canonicalActual.some(item => item === undefined)) return false;
    if (expected.every((item, idx) => tolerantEqual(canonicalActual[idx], item))) return true;
    return stableJson(canonicalActual.map(normalizeForLooseArrayCompare).sort()) === stableJson(expected.map(normalizeForLooseArrayCompare).sort());
  }
  return tolerantEqual(actual, expected);
}

console.log(JSON.stringify(samples.map(sample => Object.fromEntries(
  Object.keys(sample.expected).map(key => [key, tolerantEqual(sample.actual[key], sample.expected[key])]),
)), null, 2));

console.log(JSON.stringify(schemaSamples.map(sample => Object.fromEntries(
  Object.keys(sample.expected).map(key => [key, tolerantEqualWithSchema(sample.actual[key], sample.expected[key], sample.schema[key])]),
)), null, 2));

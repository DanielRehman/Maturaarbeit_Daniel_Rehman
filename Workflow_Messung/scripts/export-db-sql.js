const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const appRoot = path.resolve(__dirname, '..');
const dbPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(appRoot, 'data', 'matura.db');
const outPath = process.argv[3] ? path.resolve(process.argv[3]) : path.join(appRoot, 'data', 'matura_export.sql');

function quoteIdent(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function quoteValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (Buffer.isBuffer(value)) return `X'${value.toString('hex')}'`;
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'bigint') return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function dropStatement(row) {
  if (row.type === 'table') return `DROP TABLE IF EXISTS ${quoteIdent(row.name)};`;
  if (row.type === 'view') return `DROP VIEW IF EXISTS ${quoteIdent(row.name)};`;
  if (row.type === 'trigger') return `DROP TRIGGER IF EXISTS ${quoteIdent(row.name)};`;
  if (row.type === 'index') return `DROP INDEX IF EXISTS ${quoteIdent(row.name)};`;
  return null;
}

const db = new Database(dbPath, { readonly: true, fileMustExist: true });
const schemaRows = db.prepare(`
  SELECT type, name, tbl_name, sql
  FROM sqlite_schema
  WHERE name NOT LIKE 'sqlite_%'
    AND sql IS NOT NULL
  ORDER BY
    CASE type
      WHEN 'table' THEN 1
      WHEN 'index' THEN 2
      WHEN 'trigger' THEN 3
      WHEN 'view' THEN 4
      ELSE 5
    END,
    name
`).all();

const tables = schemaRows.filter(row => row.type === 'table');
const secondarySchema = schemaRows.filter(row => row.type !== 'table');

const lines = [
  '-- SQLite dump of app/data/matura.db',
  '-- Generated with app/scripts/export-db-sql.js',
  '-- Raw .db/.wal/.shm files are ignored by git; this SQL file is the portable backup artifact.',
  `-- Generated at ${new Date().toISOString()}`,
  '',
  'PRAGMA foreign_keys=OFF;',
  'BEGIN TRANSACTION;',
  '',
];

for (const row of [...secondarySchema].reverse()) {
  const statement = dropStatement(row);
  if (statement) lines.push(statement);
}
for (const row of [...tables].reverse()) {
  const statement = dropStatement(row);
  if (statement) lines.push(statement);
}
lines.push('');

for (const row of tables) {
  lines.push(`${row.sql};`, '');
}

for (const row of tables) {
  const columns = db.prepare(`PRAGMA table_info(${quoteIdent(row.name)})`).all().map(column => column.name);
  const columnList = columns.map(quoteIdent).join(', ');
  const rows = db.prepare(`SELECT ${columnList} FROM ${quoteIdent(row.name)}`).iterate();
  for (const item of rows) {
    const values = columns.map(column => quoteValue(item[column])).join(',');
    lines.push(`INSERT INTO ${quoteIdent(row.name)} (${columnList}) VALUES(${values});`);
  }
  lines.push('');
}

for (const row of secondarySchema) {
  lines.push(`${row.sql};`);
}

const sqliteSequenceExists = db.prepare(`
  SELECT COUNT(*) AS n
  FROM sqlite_schema
  WHERE type = 'table' AND name = 'sqlite_sequence'
`).get().n > 0;

if (sqliteSequenceExists) {
  lines.push('', 'DELETE FROM sqlite_sequence;');
  for (const row of db.prepare('SELECT name, seq FROM sqlite_sequence ORDER BY name').iterate()) {
    lines.push(`INSERT INTO sqlite_sequence(name,seq) VALUES(${quoteValue(row.name)},${quoteValue(row.seq)});`);
  }
}

lines.push('', 'COMMIT;', 'PRAGMA foreign_keys=ON;', '');

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');

const stats = fs.statSync(outPath);
console.log(`Exported ${tables.length} tables to ${outPath}`);
console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);

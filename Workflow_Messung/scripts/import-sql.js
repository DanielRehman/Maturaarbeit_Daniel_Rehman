const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('Usage: node scripts/import-sql.js <sql-file>');
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const dbPath = path.join(root, 'data', 'matura.db');
const resolvedSql = path.resolve(root, sqlFile);

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

// Creates schema and minimal seed data if the database does not exist yet.
require(path.join(root, 'dist', 'db', 'index.js'));

if (!fs.existsSync(resolvedSql)) {
  console.error(`SQL file not found: ${resolvedSql}`);
  process.exit(1);
}

const sql = fs.readFileSync(resolvedSql, 'utf8');
const db = new Database(dbPath);
db.exec(sql);
db.close();

console.log(`Imported ${path.relative(root, resolvedSql)} into ${path.relative(root, dbPath)}`);

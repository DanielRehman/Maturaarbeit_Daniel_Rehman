import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../data/matura.db');
const sqlPath = path.resolve(__dirname, 'seed_questions_set1.sql');

const db = new Database(dbPath);
const sql = fs.readFileSync(sqlPath, 'utf-8');

db.exec(sql);

const count = (db.prepare('SELECT COUNT(*) as c FROM questions WHERE testset = ?').get('basic_evaluation_questions') as { c: number }).c;
const cpCount = (db.prepare(`
  SELECT COUNT(*) as c FROM checkpoints
  WHERE question_id IN (SELECT id FROM questions WHERE testset = 'basic_evaluation_questions')
`).get() as { c: number }).c;

console.log(`Done. ${count} questions, ${cpCount} checkpoints imported (testset=basic_evaluation_questions).`);
db.close();

import 'dotenv/config';
import express from 'express';
import path from 'path';
import './db/index'; // trigger schema creation + seed

import runRouter from './routes/run';
import configRouter from './routes/config';
import dataRouter from './routes/data';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Routes
app.use('/', runRouter);
app.use('/', configRouter);
app.use('/', dataRouter);

app.get('/', (req, res) => res.redirect('/run'));

const port = process.env['PORT'] ?? 3000;
app.listen(port, () => {
  console.log(`Workflow Messung laeuft unter http://localhost:${port}`);
});


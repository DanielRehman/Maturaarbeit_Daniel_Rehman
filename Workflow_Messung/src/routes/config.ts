import { Router, Request, Response } from 'express';
import db from '../db/index';
import { buildTechnicalPrompt } from '../engine/workflow';
import { engineInstructionList } from '../config/enginePrompts';
import { getPreferredScoringModelId, setSetting, usePairedCheckpointScoring } from '../settings';

const router = Router();


// GET /config - render config page
router.get('/config', (req: Request, res: Response) => {
  const setups = db.prepare('SELECT * FROM setups ORDER BY id').all() as Array<Record<string, unknown>>;
  const criteria = db.prepare('SELECT * FROM criteria ORDER BY id').all();
  const questions = db.prepare(`
    SELECT q.*, c.name_de as criteria_name, s.name as setup_name,
           (SELECT COUNT(*) FROM checkpoints WHERE question_id = q.id) as checkpoint_count
    FROM questions q
    JOIN criteria c ON q.criteria_id = c.id
    LEFT JOIN setups s ON q.setup_id = s.id
    ORDER BY q.id
  `).all();
  const checkpoints = db.prepare('SELECT * FROM checkpoints ORDER BY question_id, sort_order').all();
  const systemPrompts = db.prepare('SELECT * FROM system_prompts ORDER BY setup_id, step').all() as Array<Record<string, unknown>>;
  const llmConfigs = db.prepare('SELECT * FROM llm_configs ORDER BY id').all();
  const setupSteps = db.prepare('SELECT * FROM setup_steps ORDER BY setup_id, step').all() as Array<Record<string, unknown>>;
  const testsets = db.prepare('SELECT * FROM testsets ORDER BY name, id').all();

  // Build full prompt previews for each setup/step (what actually gets sent to the LLM)
  const promptPreviews: Record<string, string> = {};
  for (const sp of systemPrompts) {
    const step = setupSteps.find(s => s.setup_id === sp.setup_id && s.step === sp.step);
    const internetAllowed = step ? step.internet_allowed === 1 : false;
    const key = `${sp.setup_id}__${sp.step}`;
    promptPreviews[key] = (sp.prompt as string) + buildTechnicalPrompt(internetAllowed, false);
  }

  res.render('config', {
    title: 'Config',
    activePage: 'config',
    setups,
    criteria,
    questions,
    checkpoints,
    systemPrompts,
    llmConfigs,
    setupSteps,
    promptPreviews,
    engineInstructions: engineInstructionList(),
    testsets,
    defaultScoringModelId: getPreferredScoringModelId(),
    usePairedCheckpointScoring: usePairedCheckpointScoring(),
  });
});

// GET /api/testsets
router.get('/api/testsets', (req: Request, res: Response) => {
  const testsets = db.prepare('SELECT * FROM testsets ORDER BY name, id').all();
  res.json(testsets);
});

// POST /api/testsets
router.post('/api/testsets', (req: Request, res: Response) => {
  const { id, name } = req.body as { id?: string; name?: string };
  const raw = (id ?? name ?? '').trim();
  if (!raw) {
    res.status(400).json({ error: 'testset name is required' });
    return;
  }

  db.prepare('INSERT OR IGNORE INTO testsets (id, name) VALUES (?, ?)').run(raw, raw);
  res.json({ id: raw, name: raw, success: true });
});

// GET /api/setups
router.get('/api/setups', (req: Request, res: Response) => {
  const setups = db.prepare('SELECT * FROM setups ORDER BY id').all();
  const steps = db.prepare('SELECT * FROM setup_steps ORDER BY setup_id, step').all();
  const result = (setups as Array<Record<string, unknown>>).map((s) => ({
    ...s,
    steps: (steps as Array<Record<string, unknown>>).filter(st => st['setup_id'] === s['id']),
  }));
  res.json(result);
});

// GET /api/system-prompts
router.get('/api/system-prompts', (req: Request, res: Response) => {
  const { setupId } = req.query as { setupId?: string };
  let query = 'SELECT * FROM system_prompts';
  const params: string[] = [];
  if (setupId) {
    query += ' WHERE setup_id = ?';
    params.push(setupId);
  }
  query += ' ORDER BY setup_id, step';
  const prompts = db.prepare(query).all(...params);
  res.json(prompts);
});

// PUT /api/system-prompts/:id
router.put('/api/system-prompts/:id', (req: Request, res: Response) => {
  const id = Number(req.params['id']);
  const { prompt } = req.body as { prompt: string };
  if (!prompt) {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }
  db.prepare('UPDATE system_prompts SET prompt = ? WHERE id = ?').run(prompt, id);
  res.json({ success: true });
});

// GET /api/criteria
router.get('/api/criteria', (req: Request, res: Response) => {
  const criteria = db.prepare('SELECT * FROM criteria ORDER BY id').all();
  res.json(criteria);
});

// GET /api/questions
router.get('/api/questions', (req: Request, res: Response) => {
  const { criteriaId, setupId, testset } = req.query as {
    criteriaId?: string;
    setupId?: string;
    testset?: string;
  };

  let query = `
    SELECT q.*, c.name_de as criteria_name, s.name as setup_name,
           (SELECT COUNT(*) FROM checkpoints WHERE question_id = q.id) as checkpoint_count
    FROM questions q
    JOIN criteria c ON q.criteria_id = c.id
    LEFT JOIN setups s ON q.setup_id = s.id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (criteriaId) {
    query += ' AND q.criteria_id = ?';
    params.push(criteriaId);
  }
  if (setupId) {
    query += ' AND q.setup_id = ?';
    params.push(setupId);
  }
  if (testset) {
    query += ' AND q.testset = ?';
    params.push(testset);
  }

  query += ' ORDER BY q.id';
  const questions = db.prepare(query).all(...params);
  res.json(questions);
});

// POST /api/questions
router.post('/api/questions', (req: Request, res: Response) => {
  const { criteriaId, setupId, questionText, testset, notes, autoanswer } = req.body as {
    criteriaId: string;
    setupId?: string;
    questionText: string;
    testset?: string;
    notes?: string;
    autoanswer?: boolean | number;
  };

  if (!criteriaId || !questionText) {
    res.status(400).json({ error: 'criteriaId and questionText are required' });
    return;
  }

  const effectiveTestset = (testset ?? 'basic_general_questions').trim() || 'basic_general_questions';
  db.prepare('INSERT OR IGNORE INTO testsets (id, name) VALUES (?, ?)').run(effectiveTestset, effectiveTestset);

  const result = db.prepare(`
    INSERT INTO questions (criteria_id, setup_id, question_text, testset, notes, autoanswer)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(criteriaId, setupId ?? null, questionText, effectiveTestset, notes ?? null, autoanswer === false || autoanswer === 0 ? 0 : 1);

  res.json({ id: result.lastInsertRowid, success: true });
});

// PUT /api/questions/:id
router.put('/api/questions/:id', (req: Request, res: Response) => {
  const id = Number(req.params['id']);
  const { criteriaId, setupId, questionText, testset, notes, autoanswer } = req.body as {
    criteriaId?: string;
    setupId?: string;
    questionText?: string;
    testset?: string;
    notes?: string;
    autoanswer?: boolean | number;
  };

  const fields: string[] = [];
  const params: (string | number | null)[] = [];

  if (criteriaId !== undefined) { fields.push('criteria_id = ?'); params.push(criteriaId); }
  if (setupId !== undefined) { fields.push('setup_id = ?'); params.push(setupId); }
  if (questionText !== undefined) { fields.push('question_text = ?'); params.push(questionText); }
  if (testset !== undefined) {
    const effectiveTestset = testset.trim() || 'basic_general_questions';
    db.prepare('INSERT OR IGNORE INTO testsets (id, name) VALUES (?, ?)').run(effectiveTestset, effectiveTestset);
    fields.push('testset = ?');
    params.push(effectiveTestset);
  }
  if (notes !== undefined) { fields.push('notes = ?'); params.push(notes); }
  if (autoanswer !== undefined) { fields.push('autoanswer = ?'); params.push(autoanswer === true || autoanswer === 1 ? 1 : 0); }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  params.push(id);
  db.prepare(`UPDATE questions SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  res.json({ success: true });
});

// DELETE /api/questions/:id
router.delete('/api/questions/:id', (req: Request, res: Response) => {
  const id = Number(req.params['id']);
  db.prepare('DELETE FROM checkpoints WHERE question_id = ?').run(id);
  db.prepare('DELETE FROM questions WHERE id = ?').run(id);
  res.json({ success: true });
});

// GET /api/questions/:id/checkpoints
router.get('/api/questions/:id/checkpoints', (req: Request, res: Response) => {
  const id = Number(req.params['id']);
  const checkpoints = db.prepare('SELECT * FROM checkpoints WHERE question_id = ? ORDER BY sort_order').all(id);
  res.json(checkpoints);
});

// POST /api/questions/:id/checkpoints
router.post('/api/questions/:id/checkpoints', (req: Request, res: Response) => {
  const questionId = Number(req.params['id']);
  const { itemText } = req.body as { itemText: string };

  if (!itemText) {
    res.status(400).json({ error: 'itemText is required' });
    return;
  }

  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM checkpoints WHERE question_id = ?').get(questionId) as { m: number | null };
  const sortOrder = (maxOrder.m ?? -1) + 1;

  const result = db.prepare('INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES (?, ?, ?)').run(questionId, itemText, sortOrder);
  res.json({ id: result.lastInsertRowid, success: true });
});

// PUT /api/checkpoints/:id
router.put('/api/checkpoints/:id', (req: Request, res: Response) => {
  const id = Number(req.params['id']);
  const { itemText } = req.body as { itemText: string };

  if (!itemText) {
    res.status(400).json({ error: 'itemText is required' });
    return;
  }

  db.prepare('UPDATE checkpoints SET item_text = ? WHERE id = ?').run(itemText, id);
  res.json({ success: true });
});

// DELETE /api/checkpoints/:id
router.delete('/api/checkpoints/:id', (req: Request, res: Response) => {
  const id = Number(req.params['id']);
  db.prepare('DELETE FROM checkpoints WHERE id = ?').run(id);
  res.json({ success: true });
});

// GET /api/models
router.get('/api/models', (req: Request, res: Response) => {
  const models = db.prepare('SELECT * FROM llm_configs ORDER BY id').all();
  res.json(models);
});

// PUT /api/models/:id
router.put('/api/models/:id', (req: Request, res: Response) => {
  const id = Number(req.params['id']);
  const { active, label } = req.body as { active?: number; label?: string };

  const fields: string[] = [];
  const params: (string | number)[] = [];

  if (active !== undefined) { fields.push('active = ?'); params.push(active); }
  if (label !== undefined) { fields.push('label = ?'); params.push(label); }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  params.push(id);
  db.prepare(`UPDATE llm_configs SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  res.json({ success: true });
});

// PUT /api/settings/default-scoring-model
router.put('/api/settings/default-scoring-model', (req: Request, res: Response) => {
  const { modelId } = req.body as { modelId?: number };
  const id = Number(modelId || 0);
  if (!id) {
    res.status(400).json({ error: 'modelId is required' });
    return;
  }

  const model = db.prepare('SELECT id FROM llm_configs WHERE id = ? AND active = 1').get(id) as { id: number } | undefined;
  if (!model) {
    res.status(400).json({ error: 'Default scoring model must be active' });
    return;
  }

  setSetting('default_scoring_llm_config_id', String(id));
  res.json({ success: true, modelId: id });
});

// PUT /api/settings/paired-checkpoint-scoring
router.put('/api/settings/paired-checkpoint-scoring', (req: Request, res: Response) => {
  const { enabled } = req.body as { enabled?: boolean };
  setSetting('use_paired_checkpoint_scoring', enabled === false ? '0' : '1');
  res.json({ success: true, enabled: enabled !== false });
});

export default router;

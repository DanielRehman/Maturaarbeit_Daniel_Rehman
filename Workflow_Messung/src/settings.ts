import db from './db/index';

export function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string | null } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  db.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `).run(key, value);
}

export function getPreferredScoringModelId(): number | null {
  const storedScoringId = Number(getSetting('default_scoring_llm_config_id') || 0);
  if (storedScoringId > 0) {
    const configured = db.prepare('SELECT id FROM llm_configs WHERE id = ? AND active = 1').get(storedScoringId) as { id: number } | undefined;
    if (configured) return configured.id;
  }

  const envScoringId = Number(process.env.SCORING_LLM_CONFIG_ID || 0);
  if (envScoringId > 0) {
    const configured = db.prepare('SELECT id FROM llm_configs WHERE id = ? AND active = 1').get(envScoringId) as { id: number } | undefined;
    if (configured) return configured.id;
  }

  const preferred = db.prepare(`
    SELECT id
    FROM llm_configs
    WHERE active = 1
      AND model_id IN ('gpt-4.1', 'gpt-4o')
    ORDER BY CASE model_id WHEN 'gpt-4.1' THEN 0 WHEN 'gpt-4o' THEN 1 ELSE 2 END
    LIMIT 1
  `).get() as { id: number } | undefined;

  return preferred?.id ?? null;
}

export function usePairedCheckpointScoring(): boolean {
  const stored = getSetting('use_paired_checkpoint_scoring');
  if (stored === null) return true;
  return stored !== '0' && stored !== 'false';
}

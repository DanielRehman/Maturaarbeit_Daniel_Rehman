import promptConfig from './engine_prompts.json';

export type EnginePromptKey = keyof typeof promptConfig.instructions;

export function enginePrompt(key: EnginePromptKey): string {
  return promptConfig.instructions[key].text;
}

export function engineInstructionList(): Array<{
  category: string;
  title: string;
  source: string;
  text: string;
}> {
  return Object.values(promptConfig.instructions);
}

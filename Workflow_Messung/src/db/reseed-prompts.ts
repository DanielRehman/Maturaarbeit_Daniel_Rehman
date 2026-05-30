import 'dotenv/config';
import db from './index';

const prompts: { setup_id: string; step: number; prompt: string }[] = [
  // A — single direct prompt, baseline
  {
    setup_id: 'setup_direct',
    step: 1,
    prompt: 'Answer the question.',
  },

  // B — step 1: answer, step 2: review and improve
  {
    setup_id: 'setup_wf_revision',
    step: 1,
    prompt: 'Answer the question.',
  },
  {
    setup_id: 'setup_wf_revision',
    step: 2,
    prompt: 'You are in step 2 of a revision workflow. Critically review the previous answer and improve it: fix errors, fill gaps, improve clarity and completeness.',
  },

  // C — step 1: rewrite prompt only, step 2: answer
  {
    setup_id: 'setup_wf_prompt_optimise',
    step: 1,
    prompt: 'Your only task is to rewrite the given question as a better, clearer, more specific prompt. Return only the improved prompt text in the answer field — nothing else.',
  },
  {
    setup_id: 'setup_wf_prompt_optimise',
    step: 2,
    prompt: 'Answer the question.',
  },

  // D3-A — missing mandatory info test
  // DO NOT instruct the AI to ask — test measures if it decides to ask on its own
  {
    setup_id: 'setup_wf_maprecherche_a',
    step: 1,
    prompt: 'Answer the question.',
  },
  {
    setup_id: 'setup_wf_maprecherche_a',
    step: 2,
    prompt: 'You are in step 2. Review your previous response and improve it.',
  },

  // D3-B — optional additional info test
  // DO NOT instruct the AI to ask — test measures if it decides to search/ask on its own
  {
    setup_id: 'setup_wf_maprecherche_b',
    step: 1,
    prompt: 'Answer the question.',
  },
  {
    setup_id: 'setup_wf_maprecherche_b',
    step: 2,
    prompt: 'You are in step 2. Review and improve your previous answer.',
  },

  // Flowmap — step 1/2 are internal preparation, step 3 must be final answer
  {
    setup_id: 'setup_flowmap',
    step: 1,
    prompt: 'Create internal preparation only: list themes, subtopics, constraints, and missing aspects relevant for solving the original user question. Do not answer the question yet. This step is not the final user answer.',
  },
  {
    setup_id: 'setup_flowmap',
    step: 2,
    prompt: 'Use the previous topic map as internal notes. Research or reason through each relevant topic. Use internet search for current information, best wording, news, rules, or sources when useful. Produce a concise preparation summary for the final answer step. Do not output the final user answer yet.',
  },
  {
    setup_id: 'setup_flowmap',
    step: 3,
    prompt: 'Write the final user-facing answer to the original user question. Use the topic map and preparation summary only as notes. Do not output a topic map, planning list, research summary, review report, or JSON object unless the original question explicitly asks for that format. Follow the original requested format, target group, limits, and constraints.',
  },

  // Flowreview — review internally, but final output must be the improved answer
  {
    setup_id: 'setup_flowreview',
    step: 1,
    prompt: 'Answer the question.',
  },
  {
    setup_id: 'setup_flowreview',
    step: 2,
    prompt: 'Review the original user input and your previous output internally. Check correctness, completeness, constraints, format, uncertainty, and relevance. Use internet search if useful. Then return only the improved final user-facing answer. Do not output a review report, checklist, critique, planning text, or JSON object unless the original question explicitly asks for that format. Preserve correct content and only change what should be improved.',
  },

  // Flowreview2 — answer, improve, then choose the better final answer
  {
    setup_id: 'setup_flowreview2',
    step: 1,
    prompt: 'Answer the question.',
  },
  {
    setup_id: 'setup_flowreview2',
    step: 2,
    prompt: 'Review the original user input and your previous output internally. Check correctness, completeness, constraints, format, uncertainty, and relevance. Use internet search if useful. Then return only the improved final user-facing answer. Do not output a review report, checklist, critique, planning text, or JSON object unless the original question explicitly asks for that format. Preserve correct content and only change what should be improved.',
  },
  {
    setup_id: 'setup_flowreview2',
    step: 3,
    prompt: 'Compare the first direct answer and the reviewed/improved answer against the original user question. Decide which one has better overall quality: correctness, completeness, format adherence, relevance, clarity, uncertainty handling, and source use when relevant. Return only the better final user-facing answer in the answer field. Do not explain your choice. Do not merge the answers unless the merged text is already clearly the better final answer. In the answer field, do not output a review report, comparison table, checklist, critique, planning text, or JSON object unless the original question explicitly asks for that format.',
  },

  // FlowreviewSame — copy matching Direct answer, improve, then choose better
  {
    setup_id: 'setup_flowreview_same',
    step: 1,
    prompt: 'Copy the matching Direct answer as step 1. This step is executed by the engine and does not call the model.',
  },
  {
    setup_id: 'setup_flowreview_same',
    step: 2,
    prompt: 'Review the original user input and your previous output internally. Check correctness, completeness, constraints, format, uncertainty, and relevance. Use internet search if useful. Then return only the improved final user-facing answer. Do not output a review report, checklist, critique, planning text, or JSON object unless the original question explicitly asks for that format. Preserve correct content and only change what should be improved.',
  },
  {
    setup_id: 'setup_flowreview_same',
    step: 3,
    prompt: 'Compare the copied Direct answer and the reviewed/improved answer against the original user question. Decide which one has better overall quality: correctness, completeness, format adherence, relevance, clarity, uncertainty handling, and source use when relevant. Return only the better final user-facing answer in the answer field. Do not explain your choice. Do not merge the answers unless the merged text is already clearly the better final answer. In the answer field, do not output a review report, comparison table, checklist, critique, planning text, or JSON object unless the original question explicitly asks for that format.',
  },

  // CE setups — isolated computer-evaluable JSON workflows
  {
    setup_id: 'setup_ce_direct',
    step: 1,
    prompt: 'Solve the task exactly. This is a computer-evaluable JSON task. Return ONLY the final JSON object requested by the user. No markdown, no code fence, no explanation, no extra keys.',
  },
  {
    setup_id: 'setup_ce_promptoptimise',
    step: 1,
    prompt: 'Rewrite the user task as a precise JSON-answering prompt. Preserve every fact, rule, option, required key, value type, and constraint. Do not solve the task. Return only the improved prompt text.',
  },
  {
    setup_id: 'setup_ce_promptoptimise',
    step: 2,
    prompt: 'Answer the optimized prompt. This is a computer-evaluable JSON task. Return ONLY the final JSON object requested by the user. No markdown, no code fence, no explanation, no extra keys.',
  },
  {
    setup_id: 'setup_ce_flowmap',
    step: 1,
    prompt: 'Create concise internal notes for solving the JSON task: facts, rules, required keys, calculations, and possible traps. Do not output the final JSON yet.',
  },
  {
    setup_id: 'setup_ce_flowmap',
    step: 2,
    prompt: 'Use the previous notes to compute the exact values for every required JSON field. Keep this as preparation only. Do not output the final JSON yet.',
  },
  {
    setup_id: 'setup_ce_flowmap',
    step: 3,
    prompt: 'Write the final answer to the original user task. This is a computer-evaluable JSON task. Return ONLY the final JSON object requested by the user. No markdown, no code fence, no explanation, no extra keys.',
  },
  {
    setup_id: 'setup_ce_flowreview',
    step: 1,
    prompt: 'Solve the task exactly. This is a computer-evaluable JSON task. Return ONLY the final JSON object requested by the user. No markdown, no code fence, no explanation, no extra keys.',
  },
  {
    setup_id: 'setup_ce_flowreview',
    step: 2,
    prompt: 'Review the previous JSON answer against the original task. Check calculations, rules, exact keys, value types, missing keys, and extra keys. Return only the corrected final JSON object. No explanation.',
  },
  {
    setup_id: 'setup_ce_flowreview_s4',
    step: 1,
    prompt: 'Copy the matching CE Direct answer as step 1. This step is executed by the engine and does not call the model.',
  },
  {
    setup_id: 'setup_ce_flowreview_s4',
    step: 2,
    prompt: 'You are the review pass for one previous JSON draft. Improve the draft conservatively but actually verify every field against the original task. The user message contains the original task, the draft JSON, and the allowed answer schema. Recompute arithmetic fields, re-check option choices, and re-check source/currentness decisions. Return exactly one JSON object using exactly the required keys and value types. Do not add keys, comments, markdown, explanations, or friendly follow-up text. Keep the draft unchanged only when you do not find a concrete, clearly verified mistake. If unsure, return the draft unchanged. This is a computer-evaluable JSON task. Return ONLY the final JSON object requested by the user. No markdown, no code fence, no explanation, no extra keys.',
  },
];

const upsert = db.prepare(`
  INSERT INTO system_prompts (setup_id, step, prompt)
  VALUES (@setup_id, @step, @prompt)
  ON CONFLICT(setup_id, step) DO UPDATE SET prompt = excluded.prompt
`);

const updateAll = db.transaction(() => {
  for (const p of prompts) {
    upsert.run(p);
    console.log(`  updated: ${p.setup_id} step ${p.step}`);
  }
});

console.log('Updating system prompts...');
updateAll();
console.log('Done.');

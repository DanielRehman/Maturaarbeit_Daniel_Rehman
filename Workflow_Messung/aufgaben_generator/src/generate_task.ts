import * as fs from "node:fs";
import * as path from "node:path";

export type Comparator = ">" | "<" | "=" | "<=" | ">=";
export type Operator = "+" | "-" | "*" | "/";
export type Applied = "yes" | "no";
export type MetricMode =
  | "normal"
  | "richtigkeit"
  | "pruefung_verifikation"
  | "vollstaendigkeit_frage"
  | "vollstaendigkeit_moeglichkeit"
  | "klarheit"
  | "relevanz"
  | "rueckfragefaehigkeit"
  | "unsicherheit"
  | "internet_quellenqualitaet";
export type ExpectedValue = number | string;

export interface DifficultyConfig {
  numVariables: number;
  numRules: number;
  dependencyDepth: number;
  branchingDensity: number;
  maxValue: number;
  useEqualities: boolean;
  useNegativeUpdates: boolean;
  useChainedConditions: boolean;
  useGroupUpdates: boolean;
  groupUpdateChance: number;
  maxUpdatesPerRule: number;
  operators: Operator[];
  comparators: Comparator[];
}

export interface RuleUpdate {
  target: string;
  operator: Operator;
  operand: string | number;
}

export interface TraceChange {
  affected_variable: string;
  old_value: number;
  new_value: number;
  operation: string;
}

export interface TraceEntry {
  rule_index: number;
  condition: string;
  condition_true: Applied;
  changes: TraceChange[];
}

export interface GeneratedTaskBundle {
  metric: MetricMode;
  task: Task;
  taskText: string;
  expected: Record<string, ExpectedValue>;
  trace: TraceEntry[];
  evaluationSchema: Record<string, string>;
}

export interface EvaluationResult {
  valid_json: boolean;
  score: number;
  errors: string[];
}

export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  pick<T>(items: T[]): T {
    return items[this.int(0, items.length - 1)];
  }
}

export class Variable {
  constructor(
    readonly name: string,
    public value: number,
    readonly person: string,
    readonly item: string,
  ) {}
}

export class Rule {
  constructor(
    readonly conditionLeft: string,
    readonly comparator: Comparator,
    readonly conditionRight: string | number,
    readonly updates: RuleUpdate[],
  ) {}

  conditionToString(): string {
    return `${this.conditionLeft} ${this.comparator} ${this.conditionRight}`;
  }

  operationToString(): string {
    return this.updates.map((update) => `${update.target} = ${update.target} ${update.operator} ${update.operand}`).join("; ");
  }
}

export class Task {
  constructor(
    readonly level: number,
    readonly seed: number,
    readonly variables: Variable[],
    readonly rules: Rule[],
  ) {}

  initialValues(): Record<string, number> {
    return Object.fromEntries(this.variables.map((variable) => [variable.name, variable.value]));
  }
}

export class Solver {
  solve(task: Task): { finalValues: Record<string, number>; trace: TraceEntry[] } {
    const values = task.initialValues();
    const trace: TraceEntry[] = [];

    task.rules.forEach((rule, index) => {
      const conditionTrue = this.evaluateCondition(rule, values);
      const changes: TraceChange[] = [];
      const beforeRule = { ...values };

      for (const update of rule.updates) {
        const oldValue = beforeRule[update.target];
        const newValue = conditionTrue ? this.applyOperation(oldValue, update.operator, this.read(update.operand, beforeRule)) : oldValue;

        changes.push({
          affected_variable: update.target,
          old_value: oldValue,
          new_value: newValue,
          operation: `${update.target} = ${update.target} ${update.operator} ${update.operand}`,
        });
      }

      if (conditionTrue) {
        for (const change of changes) {
          values[change.affected_variable] = change.new_value;
        }
      }

      trace.push({
        rule_index: index + 1,
        condition: rule.conditionToString(),
        condition_true: conditionTrue ? "yes" : "no",
        changes,
      });
    });

    return { finalValues: values, trace };
  }

  private evaluateCondition(rule: Rule, values: Record<string, number>): boolean {
    const left = values[rule.conditionLeft];
    const right = this.read(rule.conditionRight, values);

    switch (rule.comparator) {
      case ">":
        return left > right;
      case "<":
        return left < right;
      case "=":
        return left === right;
      case "<=":
        return left <= right;
      case ">=":
        return left >= right;
    }
  }

  private applyOperation(left: number, operator: Operator, right: number): number {
    switch (operator) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        if (right === 0) {
          return left;
        }
        return Math.trunc(left / right);
    }
  }

  private read(value: string | number, values: Record<string, number>): number {
    return typeof value === "number" ? value : values[value];
  }
}

export class Translator {
  renderTask(task: Task): string {
    const schema = buildSchema(task);
    const lines = [
      `Mehrschritt-Aufgabe Level ${task.level}`,
      "",
      "Wende die folgenden Regeln strikt der Reihe nach an. Jede Regel wird genau einmal geprueft. Spaetere Regeln verwenden die bereits aktualisierten Werte.",
      "",
      "Startzustand:",
      ...task.variables.map((variable) => `- ${this.varText(variable)}: ${variable.value}`),
      "",
      "Regeln:",
      ...task.rules.map((rule, index) => `${index + 1}. ${this.ruleText(rule, task.variables)}`),
      "",
      "Gib exakt ein JSON in diesem Schema zurueck:",
      JSON.stringify(schema, null, 2),
      "",
      "Prompt-Text:",
      this.renderPromptText(task),
    ];

    return `${lines.join("\n")}\n`;
  }

  private renderPromptText(task: Task): string {
    const startText = task.variables
      .map((variable) => `${variable.person} hat zu Beginn ${variable.value} ${variable.item}`)
      .join(", ");
    const ruleText = task.rules
      .map((rule, index) => `Regel ${index + 1}: ${this.ruleText(rule, task.variables)}`)
      .join(" ");

    return [
      `${startText}.`,
      "Gehe nun die folgenden Regeln exakt in der angegebenen Reihenfolge durch. Jede Regel wird genau einmal geprueft. Wenn eine Regel mehrere Personen veraendert, passieren diese Aenderungen gleichzeitig auf Basis des Zustands direkt vor dieser Regel.",
      ruleText,
      "Berechne danach die finalen Werte und gib nur das verlangte JSON zurueck.",
    ].join(" ");
  }

  private ruleText(rule: Rule, variables: Variable[]): string {
    const operation = rule.updates
      .map((update) => this.operationText(update.operator, this.lookup(update.target, variables), update.operand, variables))
      .join(" und ");

    return `Wenn ${this.conditionText(rule, variables)}, dann ${operation}.`;
  }

  private varText(variable: Variable): string {
    return `${variable.person} hat ${variable.item}`;
  }

  private lookup(name: string, variables: Variable[]): { person: string; itemText: string } {
    const found = variables.find((variable) => variable.name === name);
    if (!found) {
      throw new Error(`Unknown variable: ${name}`);
    }
    return { person: found.person, itemText: found.item };
  }

  private conditionText(rule: Rule, variables: Variable[]): string {
    const left = this.lookup(rule.conditionLeft, variables);
    if (typeof rule.conditionRight === "number") {
      return `${left.person} ${this.comparatorText(rule.comparator, false)} ${rule.conditionRight} ${left.itemText} hat`;
    }

    const right = this.lookup(rule.conditionRight, variables);
    const connector = rule.comparator === ">" || rule.comparator === "<" ? "als" : "wie";
    return `${left.person} ${this.comparatorText(rule.comparator, true)} ${left.itemText} hat ${connector} ${right.person} ${right.itemText}`;
  }

  private comparatorText(comparator: Comparator, comparesTwoPeople: boolean): string {
    switch (comparator) {
      case ">":
        return comparesTwoPeople ? "mehr" : "mehr als";
      case "<":
        return comparesTwoPeople ? "weniger" : "weniger als";
      case "=":
        return comparesTwoPeople ? "genau so viele" : "genau";
      case "<=":
        return comparesTwoPeople ? "hoechstens so viele" : "hoechstens";
      case ">=":
        return comparesTwoPeople ? "mindestens so viele" : "mindestens";
    }
  }

  private operationText(
    operator: Operator,
    target: { person: string; itemText: string },
    rawOperand: string | number,
    variables: Variable[],
  ): string {
    const operandVariable = typeof rawOperand === "number" ? undefined : this.lookup(rawOperand, variables);
    const operandText = typeof rawOperand === "number" ? `${Math.abs(rawOperand)}` : "";
    const amount = typeof rawOperand === "number" && rawOperand < 0 ? `minus ${operandText}` : operandText;

    switch (operator) {
      case "+":
        if (typeof rawOperand === "number" && rawOperand < 0) {
          return `${target.person} gibt ${operandText} ${target.itemText} ab`;
        }
        return typeof rawOperand === "number"
          ? `${target.person} bekommt ${amount} ${target.itemText} dazu`
          : `${target.person} bekommt so viele ${target.itemText} dazu, wie viele ${operandVariable?.itemText} ${operandVariable?.person} hat`;
      case "-":
        if (typeof rawOperand === "number" && rawOperand < 0) {
          return `${target.person} bekommt ${operandText} ${target.itemText} dazu`;
        }
        return typeof rawOperand === "number"
          ? `${target.person} gibt ${amount} ${target.itemText} ab`
          : `${target.person} gibt so viele ${target.itemText} ab, wie viele ${operandVariable?.itemText} ${operandVariable?.person} hat`;
      case "*":
        return typeof rawOperand === "number"
          ? `${target.person} multipliziert die Anzahl ${target.itemText} mit ${amount}`
          : `${target.person} multipliziert die Anzahl ${target.itemText} mit der ${operandVariable?.itemText}-Anzahl von ${operandVariable?.person}`;
      case "/":
        return typeof rawOperand === "number"
          ? `${target.person} teilt die Anzahl ${target.itemText} ganzzahlig durch ${amount}`
          : `${target.person} teilt die Anzahl ${target.itemText} ganzzahlig durch die ${operandVariable?.itemText}-Anzahl von ${operandVariable?.person}`;
    }
  }
}

export class Evaluator {
  evaluate(llmAnswer: unknown, expected: Record<string, ExpectedValue>): EvaluationResult {
    const errors: string[] = [];

    if (!isPlainObject(llmAnswer)) {
      return { valid_json: false, score: 0, errors: ["Answer is not a JSON object."] };
    }

    const expectedKeys = Object.keys(expected);
    for (const key of expectedKeys) {
      if (!(key in llmAnswer)) {
        errors.push(`Missing field: ${key}`);
      }
    }

    for (const [key, expectedValue] of Object.entries(expected)) {
      if (!(key in llmAnswer)) {
        continue;
      }
      const actualValue = llmAnswer[key];
      if (!sameValue(actualValue, expectedValue)) {
        errors.push(`Incorrect ${key}: expected ${expectedValue}, got ${String(actualValue)}`);
      }
    }

    const correct = expectedKeys.length - errors.filter((error) => error.startsWith("Incorrect")).length - errors.filter((error) => error.startsWith("Missing")).length;
    const score = Math.max(0, Math.round((correct / expectedKeys.length) * 100));
    return { valid_json: true, score, errors };
  }
}

function rightText(
  value: string | { person: string; itemText: string },
  raw: string | number,
  variables: Variable[],
): string {
  if (typeof raw === "number") {
    return `${raw}`;
  }
  const variable = variables.find((candidate) => candidate.name === raw);
  if (!variable || typeof value === "string") {
    return String(value);
  }
  return `${value.person} ${value.itemText}`;
}

export function generateTask(level: number, seed: number): Task {
  const rng = new SeededRandom(seed);
  const config = levelConfig(level);
  const variables = generateVariables(config, rng);
  const rules = generateRules(config, variables, rng);
  return new Task(level, seed, variables, rules);
}

export function generateTaskBundle(level: number, seed: number, metric: MetricMode = "normal"): GeneratedTaskBundle {
  const task = generateTask(level, seed);
  const { finalValues, trace } = new Solver().solve(task);
  const expected = buildExpected(task, trace, finalValues);
  const evaluationSchema = buildSchema(task);

  if (!isNormalMetric(metric)) {
    return generateMetricBundle(metric, task, trace, expected);
  }

  return {
    metric,
    task,
    taskText: new Translator().renderTask(task),
    expected,
    trace,
    evaluationSchema,
  };
}

export function evaluateAnswer(level: number, seed: number, llmAnswer: unknown, metric: MetricMode = "normal"): EvaluationResult {
  const bundle = generateTaskBundle(level, seed, metric);
  return new Evaluator().evaluate(llmAnswer, bundle.expected);
}

function isNormalMetric(metric: MetricMode): boolean {
  return [
    "normal",
    "richtigkeit",
    "pruefung_verifikation",
    "vollstaendigkeit_frage",
    "vollstaendigkeit_moeglichkeit",
  ].includes(metric);
}

function generateMetricBundle(
  metric: MetricMode,
  task: Task,
  trace: TraceEntry[],
  baseExpected: Record<string, ExpectedValue>,
): GeneratedTaskBundle {
  const expected = metricExpected(metric, task, baseExpected);
  return {
    metric,
    task,
    taskText: renderMetricTaskText(metric, task, expected),
    expected,
    trace,
    evaluationSchema: schemaFromExpected(expected),
  };
}

function metricExpected(metric: MetricMode, task: Task, baseExpected: Record<string, ExpectedValue>): Record<string, ExpectedValue> {
  switch (metric) {
    case "rueckfragefaehigkeit":
      return {
        answerable: "no",
        should_ask_clarification: "yes",
        ask_for_A: "no",
        ask_for_B: "yes",
        ask_for_C: "no",
        final_answer_allowed: "no",
      };
    case "unsicherheit":
      return {
        answerable: "no",
        should_declare_uncertainty: "yes",
        problem_type: "contradictory_start_state",
        conflicting_A: "yes",
        final_answer_allowed: "no",
      };
    case "relevanz":
      return {
        answerable: "yes",
        A_relevant: "yes",
        B_relevant: "yes",
        C_relevant: "yes",
        weather_relevant: "no",
        music_relevant: "no",
        extra_content_allowed: "no",
      };
    case "internet_quellenqualitaet":
      return {
        answerable: "yes",
        best_source: "B",
        source_A_usable: "no",
        source_B_usable: "yes",
        source_C_usable: "no",
        reason_category: "official_source",
      };
    case "klarheit":
      return {
        ...baseExpected,
        structured_steps_required: "yes",
        one_step_per_rule_required: "yes",
        expected_step_count: task.rules.length,
        json_only_required: "yes",
      };
    default:
      return baseExpected;
  }
}

function renderMetricTaskText(metric: MetricMode, task: Task, expected: Record<string, ExpectedValue>): string {
  const schema = schemaFromExpected(expected);
  const [a, b, c] = task.variables;
  const normalTask = new Translator().renderTask(task);

  const header = `Metrik-Test: ${metric}`;
  const schemaText = `Gib exakt ein JSON in diesem Schema zurueck:\n${JSON.stringify(schema, null, 2)}`;

  if (metric === "rueckfragefaehigkeit") {
    return [
      header,
      "",
      "Entscheide, ob die Aufgabe eindeutig loesbar ist. Wenn Informationen fehlen, gib keine finale Zahl aus, sondern markiere exakt, wonach gefragt werden muss.",
      "",
      "Startzustand:",
      `- ${a.person} hat ${a.value} ${a.item}.`,
      `- ${c.person} hat ${c.value} ${c.item}.`,
      "",
      "Regel:",
      `Wenn ${a.person} mehr ${a.item} hat als ${b.person} ${b.item}, bekommt ${c.person} 3 ${c.item} dazu.`,
      "",
      `Gesucht ist, wie viele ${c.item} ${c.person} am Ende hat.`,
      "",
      schemaText,
    ].join("\n");
  }

  if (metric === "unsicherheit") {
    return [
      header,
      "",
      "Entscheide, ob die Aufgabe eindeutig loesbar ist. Wenn ein Widerspruch vorliegt, darf keine finale Loesung erfunden werden.",
      "",
      "Startzustand:",
      `- ${a.person} hat ${a.value} ${a.item}.`,
      `- ${a.person} hat ${a.value + 3} ${a.item}.`,
      `- ${b.person} hat ${b.value} ${b.item}.`,
      `- ${c.person} hat ${c.value} ${c.item}.`,
      "",
      "Regel:",
      `Wenn ${a.person} mehr ${a.item} hat als ${b.person} ${b.item}, bekommt ${c.person} 3 ${c.item} dazu.`,
      "",
      schemaText,
    ].join("\n");
  }

  if (metric === "relevanz") {
    return [
      header,
      "",
      "Bestimme exakt, welche Informationen fuer die Rechnung relevant sind. Ignoriere irrelevante Zusatzinformationen.",
      "",
      "Text:",
      `${a.person} hat ${a.value} ${a.item}. ${b.person} hat ${b.value} ${b.item}. ${c.person} hat ${c.value} ${c.item}. Das Wetter ist sonnig. David hoert gern Musik.`,
      `Wenn ${a.person} mehr ${a.item} hat als ${b.person} ${b.item}, bekommt ${c.person} 3 ${c.item} dazu.`,
      "",
      schemaText,
    ].join("\n");
  }

  if (metric === "internet_quellenqualitaet") {
    return [
      header,
      "",
      "Waehle exakt die beste Quelle fuer eine verbindliche Regel. Bewerte nicht den Inhalt der Regel, sondern die Quellenqualitaet.",
      "",
      "Quelle A: Privater Blog einer unbekannten Person, veroeffentlicht 2026.",
      "Quelle B: Offizielles Handbuch der zustaendigen Institution, veroeffentlicht 2025.",
      "Quelle C: Diskussionsforum mit mehreren Meinungen, veroeffentlicht 2026.",
      "",
      "Ziel: Fuer eine verbindliche Auswertung soll die verlaesslichste Quelle gewaehlt werden.",
      "",
      schemaText,
    ].join("\n");
  }

  if (metric === "klarheit") {
    return [
      header,
      "",
      "Loese die Aufgabe und gib zusaetzlich strukturierte Metadaten zur Nachvollziehbarkeit aus. Es muss genau ein Schritt pro Regel vorgesehen sein.",
      "",
      normalTask,
      "",
      "Zusaetzliche Pflichtfelder:",
      "- structured_steps_required",
      "- one_step_per_rule_required",
      "- expected_step_count",
      "- json_only_required",
      "",
      `Erwartete Schrittanzahl: ${task.rules.length}`,
      "",
      schemaText,
    ].join("\n");
  }

  return normalTask;
}

function generateVariables(config: DifficultyConfig, rng: SeededRandom): Variable[] {
  const people = ["Anna", "Ben", "Clara", "David", "Emma", "Finn", "Greta", "Hanna", "Ida", "Jonas", "Jana", "Jan"];
  const items = ["Bananen", "Orangen", "Melonen", "Tickets", "Muenzen", "Karten", "Stifte", "Steine", "Perlen", "Marken", "Punkte", "Sterne"];
  return Array.from({ length: config.numVariables }, (_, index) => {
    const name = variableName(index);
    const value = rng.int(1, config.maxValue);
    return new Variable(name, value, people[index % people.length], items[index % items.length]);
  });
}

function generateRules(config: DifficultyConfig, variables: Variable[], rng: SeededRandom): Rule[] {
  const rules: Rule[] = [];
  const names = variables.map((variable) => variable.name);
  let recentTargets: string[] = [];

  for (let index = 0; index < config.numRules; index += 1) {
    const conditionLeft = config.useChainedConditions && recentTargets.length > 0 && rng.chance(0.65)
      ? rng.pick(recentTargets)
      : rng.pick(names);
    const comparator = rng.pick(config.comparators);
    const conditionRight = rng.chance(config.branchingDensity) ? differentName(names, conditionLeft, rng) : rng.int(1, config.maxValue);
    const updateCount = config.useGroupUpdates && rng.chance(config.groupUpdateChance)
      ? rng.int(2, Math.min(config.maxUpdatesPerRule, names.length))
      : 1;
    const targets = chooseTargets(names, updateCount, index < config.dependencyDepth ? recentTargets : [], rng);
    const updates = targets.map((target) => {
      const operator = rng.pick(config.operators);
      return {
        target,
        operator,
        operand: makeOperand(operator, config, names, target, rng),
      };
    });

    rules.push(new Rule(conditionLeft, comparator, conditionRight, updates));
    recentTargets = [...targets, ...recentTargets].slice(0, Math.max(1, config.dependencyDepth));
  }

  return rules;
}

function chooseTargets(names: string[], count: number, preferred: string[], rng: SeededRandom): string[] {
  const targets: string[] = [];
  const candidates = [...preferred, ...names].filter((name, index, all) => all.indexOf(name) === index);

  while (targets.length < count && targets.length < names.length) {
    const candidate = rng.pick(candidates);
    if (!targets.includes(candidate)) {
      targets.push(candidate);
    }
  }

  return targets;
}

function makeOperand(operator: Operator, config: DifficultyConfig, names: string[], target: string, rng: SeededRandom): string | number {
  if (rng.chance(config.branchingDensity / 2) && operator !== "/" && names.length > 1) {
    return differentName(names, target, rng);
  }

  const maxOperand = operator === "*" || operator === "/" ? Math.min(5, config.maxValue) : Math.max(2, Math.floor(config.maxValue / 2));
  const sign = config.useNegativeUpdates && operator !== "/" && rng.chance(0.2) ? -1 : 1;
  return sign * rng.int(operator === "*" || operator === "/" ? 2 : 1, maxOperand);
}

export function levelConfig(level: number): DifficultyConfig {
  const configs: Record<number, DifficultyConfig> = {
    1: {
      numVariables: 3,
      numRules: 3,
      dependencyDepth: 1,
      branchingDensity: 0.35,
      maxValue: 10,
      useEqualities: false,
      useNegativeUpdates: false,
      useChainedConditions: false,
      useGroupUpdates: false,
      groupUpdateChance: 0,
      maxUpdatesPerRule: 1,
      operators: ["+", "-"],
      comparators: [">", "<"],
    },
    2: {
      numVariables: 5,
      numRules: 5,
      dependencyDepth: 2,
      branchingDensity: 0.55,
      maxValue: 15,
      useEqualities: true,
      useNegativeUpdates: false,
      useChainedConditions: true,
      useGroupUpdates: true,
      groupUpdateChance: 0.25,
      maxUpdatesPerRule: 2,
      operators: ["+", "-", "*"],
      comparators: [">", "<", "=", "<=", ">="],
    },
    3: {
      numVariables: 7,
      numRules: 10,
      dependencyDepth: 4,
      branchingDensity: 0.7,
      maxValue: 20,
      useEqualities: true,
      useNegativeUpdates: true,
      useChainedConditions: true,
      useGroupUpdates: true,
      groupUpdateChance: 0.4,
      maxUpdatesPerRule: 3,
      operators: ["+", "-", "*", "/"],
      comparators: [">", "<", "=", "<=", ">="],
    },
    4: {
      numVariables: 10,
      numRules: 20,
      dependencyDepth: 7,
      branchingDensity: 0.8,
      maxValue: 30,
      useEqualities: true,
      useNegativeUpdates: true,
      useChainedConditions: true,
      useGroupUpdates: true,
      groupUpdateChance: 0.55,
      maxUpdatesPerRule: 4,
      operators: ["+", "-", "*", "/"],
      comparators: [">", "<", "=", "<=", ">="],
    },
    5: {
      numVariables: 12,
      numRules: 35,
      dependencyDepth: 10,
      branchingDensity: 0.9,
      maxValue: 40,
      useEqualities: true,
      useNegativeUpdates: true,
      useChainedConditions: true,
      useGroupUpdates: true,
      groupUpdateChance: 0.7,
      maxUpdatesPerRule: 5,
      operators: ["+", "-", "*", "/"],
      comparators: [">", "<", "=", "<=", ">="],
    },
  };

  const config = configs[level];
  if (!config) {
    throw new Error(`Unsupported level ${level}. Use 1, 2, 3, 4, or 5.`);
  }
  return config;
}

export function buildExpected(task: Task, trace: TraceEntry[], finalValues: Record<string, number>): Record<string, ExpectedValue> {
  const expected: Record<string, ExpectedValue> = {};
  for (const variable of task.variables) {
    expected[variable.name] = finalValues[variable.name];
  }
  for (const entry of trace) {
    expected[`rule_${entry.rule_index}_applied`] = entry.condition_true;
  }
  return expected;
}

export function buildSchema(task: Task): Record<string, string> {
  const schema: Record<string, string> = {};
  for (const variable of task.variables) {
    schema[variable.name] = "number";
  }
  for (let index = 1; index <= task.rules.length; index += 1) {
    schema[`rule_${index}_applied`] = "yes|no";
  }
  return schema;
}

export function schemaFromExpected(expected: Record<string, ExpectedValue>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(expected).map(([key, value]) => {
      if (typeof value === "number") {
        return [key, "number"];
      }
      if (value === "yes" || value === "no") {
        return [key, "yes|no"];
      }
      return [key, "string"];
    }),
  );
}

export function writeOutputs(outDir: string, task: Task, expected: Record<string, ExpectedValue>, trace: TraceEntry[]): void {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "task.txt"), new Translator().renderTask(task), "utf8");
  fs.writeFileSync(path.join(outDir, "expected.json"), `${JSON.stringify(expected, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(outDir, "trace.json"), `${JSON.stringify(trace, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(outDir, "evaluation_schema.json"), `${JSON.stringify(buildSchema(task), null, 2)}\n`, "utf8");
}

export function writeBundleOutputs(outDir: string, bundle: GeneratedTaskBundle): void {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "task.txt"), bundle.taskText, "utf8");
  fs.writeFileSync(path.join(outDir, "expected.json"), `${JSON.stringify(bundle.expected, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(outDir, "trace.json"), `${JSON.stringify(bundle.trace, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(outDir, "evaluation_schema.json"), `${JSON.stringify(bundle.evaluationSchema, null, 2)}\n`, "utf8");
}

function parseArgs(argv: string[]): { level: number; seed: number; outDir: string; metric: MetricMode; evaluatePath?: string } {
  const args = new Map<string, string | boolean>();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      continue;
    }
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      args.set(arg, next);
      index += 1;
    } else {
      args.set(arg, true);
    }
  }

  const level = Number(args.get("--level") ?? 1);
  const seed = Number(args.get("--seed") ?? 1);
  const outDir = String(args.get("--out") ?? process.cwd());
  const metric = parseMetric(String(args.get("--metric") ?? "normal"));
  const rawEvaluate = args.get("--evaluate");
  const evaluatePath = typeof rawEvaluate === "string" ? rawEvaluate : undefined;
  return { level, seed, outDir, metric, evaluatePath };
}

function parseMetric(value: string): MetricMode {
  const allowed: MetricMode[] = [
    "normal",
    "richtigkeit",
    "pruefung_verifikation",
    "vollstaendigkeit_frage",
    "vollstaendigkeit_moeglichkeit",
    "klarheit",
    "relevanz",
    "rueckfragefaehigkeit",
    "unsicherheit",
    "internet_quellenqualitaet",
  ];

  if (!allowed.includes(value as MetricMode)) {
    throw new Error(`Unsupported metric ${value}. Use one of: ${allowed.join(", ")}.`);
  }
  return value as MetricMode;
}

function variableName(index: number): string {
  if (index < 26) {
    return String.fromCharCode("A".charCodeAt(0) + index);
  }
  return `V${index + 1}`;
}

function differentName(names: string[], current: string, rng: SeededRandom): string {
  const options = names.filter((name) => name !== current);
  return rng.pick(options.length > 0 ? options : names);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sameValue(actual: unknown, expected: ExpectedValue): boolean {
  return actual === expected;
}

function main(): void {
  const { level, seed, outDir, metric, evaluatePath } = parseArgs(process.argv.slice(2));
  const bundle = generateTaskBundle(level, seed, metric);

  writeBundleOutputs(outDir, bundle);

  if (evaluatePath) {
    const llmAnswer = JSON.parse(readJsonText(evaluatePath));
    const result = new Evaluator().evaluate(llmAnswer, bundle.expected);
    fs.writeFileSync(path.join(outDir, "evaluation_result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Generated task files in ${outDir}`);
}

function readJsonText(filePath: string): string {
  return fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
}

if (require.main === module) {
  main();
}

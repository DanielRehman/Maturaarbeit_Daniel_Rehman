# App2 Frage Erstellen

## Input

```text
Metrik
Schwierigkeit / Level
Seed
Aufgabenindex
```

## 1. Seed setzen

```text
SeededRandom(seed)
```

Der Seed macht die Aufgabe reproduzierbar.

Gleicher Seed und gleiches Level erzeugen dieselbe Aufgabe.

## 2. Schwierigkeitsprofil laden

```text
levelConfig(level)
```

Das Profil bestimmt:

```text
Anzahl Variablen
Anzahl Regeln
maximaler Startwert
erlaubte Vergleichsoperatoren
erlaubte Rechenoperatoren
Abhängigkeitstiefe
Gruppenregeln ja/nein
negative Updates ja/nein
```

## 3. Variablen erzeugen

```text
generateVariables(config, rng)
```

Für jede Variable wird erzeugt:

```text
interner Name: A, B, C, ...
Person: Anna, Ben, Clara, ...
Objekt: Bananen, Orangen, Melonen, ...
Startwert: Zufallszahl aus dem erlaubten Bereich
```

Beispiel:

```text
A = Anna hat 9 Bananen
B = Ben hat 12 Orangen
C = Clara hat 2 Melonen
```

## 4. Regeln erzeugen

```text
generateRules(config, variables, rng)
```

Jede Regel besteht aus:

```text
Bedingung links
Vergleichsoperator
Bedingung rechts
eine oder mehrere Änderungen
```

Beispiel intern:

```text
if C = E then G = G - C
```

Beispiel als Text:

```text
Wenn Clara genau so viele Melonen hat wie Emma Muenzen, dann Greta gibt so viele Stifte ab, wie viele Melonen Clara hat.
```

## 5. Regeln lösen

```text
new Solver().solve(task)
```

Für jede Regel:

```text
aktuellen Zustand lesen
Bedingung prüfen
condition_true = yes oder no
wenn yes: Änderungen berechnen
wenn no: Zustand bleibt gleich
Trace speichern
```

Bei mehreren Änderungen in einer Regel:

```text
alle neuen Werte werden aus dem Zustand vor dieser Regel berechnet
danach werden alle Änderungen gleichzeitig übernommen
```

Division:

```text
ganzzahlige Division mit Math.trunc
Division durch 0 lässt den Wert unverändert
```

## 6. Erwartete Antwort erzeugen

```text
buildExpected(task, trace, finalValues)
```

Die erwartete Antwort enthält:

```text
finale Werte der Variablen
rule_1_applied
rule_2_applied
...
rule_n_applied
```

Beispiel:

```json
{
  "A": 9,
  "B": 12,
  "C": 2,
  "rule_1_applied": "no",
  "rule_2_applied": "yes"
}
```

## 7. Antwortschema erzeugen

```text
buildSchema(task)
```

Schema:

```text
Variablenfelder: number
Regel-Felder: yes|no
```

Beispiel:

```json
{
  "A": "number",
  "B": "number",
  "rule_1_applied": "yes|no",
  "rule_2_applied": "yes|no"
}
```

## 8. Metrik-Auswahl

```text
metricExpected(metric, task, baseExpected)
```

Je nach Metrik wird festgelegt, welche Felder verlangt werden.

```text
richtigkeit: finale Werte
pruefung_verifikation: rule_x_applied Felder
vollstaendigkeit_frage: Auswahl aus finalen Werten und Regelchecks
vollstaendigkeit_moeglichkeit: alle finalen Werte und alle Regelchecks
klarheit: Aufgabe plus Strukturfelder
relevanz: relevante und irrelevante Informationen erkennen
rueckfragefaehigkeit: fehlende Information erkennen
unsicherheit: Widerspruch erkennen
internet_quellenqualitaet: beste Quelle wählen
```

## 9. Fragetext erzeugen

```text
Translator.renderTask(task)
renderMetricTaskText(metric, task, expected)
questionText(difficulty, metric, index, bundle, expected, schema)
```

Der Fragetext enthält:

```text
Aufgabentitel
Metrik-Fokus
Schwierigkeit
Seed
Startzustand
Regeln in Reihenfolge
JSON-Anforderung
erlaubte Antwortfelder
erlaubte Typen und Werte
Formatbeispiel
```

## 10. Frage speichern

```text
questions.question_text = Fragetext
questions.expected_answer_json = erwartete Antwort
questions.answer_schema_json = Antwortschema
questions.evaluation_type = json_exact
questions.computer_evaluable = 1
```

## 11. Frage an Workflow geben

```text
executeRun(setupId, questionId, modelId, runSetId)
```

Der Workflow bekommt:

```text
Fragetext
System Prompt des Workflow-Schritts
Antwortschema
```

## 12. Modellantwort erzeugen

Das Modell gibt eine JSON-Antwort zurück.

Beispiel:

```json
{
  "rule_1_applied": "no",
  "rule_2_applied": "yes"
}
```

## 13. Antwort bewerten

```text
Evaluator.evaluate(modelAnswer, expected)
```

Für jedes erwartete Feld:

```text
Feld vorhanden?
Wert exakt gleich?
Typ passend?
```

Score:

```text
korrekte Felder / erwartete Felder * 100
```

## 14. Output

```text
Frage Text
Erwartete Antwort
Modellantwort
Score
```

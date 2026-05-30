# Auswertung und Testlauf

## Start in 4 Schritten

1. `1_setup.bat`
2. API-Keys in `.env` eintragen, falls neue KI-Läufe gestartet werden sollen.
3. `2_workflows_und_fragen_laden.bat`
4. `4_starten.bat`

Dann im Browser öffnen:

```text
http://localhost:3000
```

Optional:

```bat
3_optionale_runs_laden.bat
```

Dieser optionale Schritt lädt historische Runs und Statistikdaten.

## Kurzer Funktionstest ohne neue KI-Kosten

1. Anwendung starten.
2. Seite `/data` öffnen.
3. Vorhandene Fragensets, Run-Sets, Workflow-Setups und Modelle auswählen.
4. Prüfen, ob Tabellen und Diagramme angezeigt werden.

## Neuer Testlauf

1. Seite `/run` öffnen.
2. Frage, Modell, Run-Set und Workflow auswählen.
3. Direkten Aufruf und Workflow-Antwort ausführen.
4. Bewertung starten.
5. Ergebnis auf `/data` als Paar-Auswertung prüfen.

## Computer-auswertbare Aufgaben

Der Aufgaben-Generator ist in dieser Anwendung enthalten. Er wird in Schritt 1 gebaut.

Computer-auswertbare Aufgaben neu erzeugen/importieren:

```bat
importiere_computer_aufgaben.bat
```

Generator separat bauen:

```bat
npx tsc -p aufgaben_generator\tsconfig.json
```

## Auswertungslogik

Die Statistik erfolgt paarbasiert:

- Ein Paar besteht aus direktem Aufruf und zugehöriger Workflow-Antwort.
- Die Zuordnung erfolgt über die gespeicherte Paarbeziehung.
- Unvollständige und fehlerhafte Paare gehen nicht in Mittelwerte und t-Tests ein.
- Manuell ausgeschlossene Paare werden je nach Einstellung in `/data` ausgeschlossen.

## Datenbank

Aktive Datenbank:

```text
data\matura.db
```

Optionale Imports:

```text
sql_imports\01_workflows_prompts_models.sql
sql_imports\02_fragensets_und_checkpoints.sql
optionale_grosse_run_imports\optional_runs_und_statistik.sql
```

Historische Runs sind groß und werden nicht für das normale Setup benötigt. Sie können bei Bedarf mit Schritt 3 geladen werden.

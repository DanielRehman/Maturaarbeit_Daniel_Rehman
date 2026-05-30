# Workflow Messung

Workflow Messung ist eine lokale Anwendung zur Durchführung und Auswertung von KI-Workflow-Vergleichen.

Die Anwendung enthält:

- Testläufe für direkten Aufruf und Workflow-Antworten
- paarbasierte Auswertung mit Tabellen und Diagrammen
- Konfiguration von Fragen, Kriterien, Modellen und Workflows
- computer-auswertbare Aufgaben über den eingebauten Aufgaben-Generator
- getrennte SQL-Imports für Workflows, Fragensets und optional historische Runs

## Einrichtung in 4 Schritten

1. `1_setup.bat` ausführen.
2. Falls neue KI-Läufe gestartet werden sollen: API-Keys in `.env` eintragen.
3. `2_workflows_und_fragen_laden.bat` ausführen.
4. `4_starten.bat` ausführen und `http://localhost:3000` öffnen.

Optional:

- `3_optionale_runs_laden.bat` lädt die historischen Runs und Statistikdaten. Dieser Schritt ist groß und nur nötig, wenn alte Auswertungen nachvollzogen werden sollen.

## Ordner

- `src`: Quellcode der Anwendung
- `views`: Oberflächen der Anwendung
- `public`: statische Dateien
- `scripts`: Import-, Testlauf- und Exportskripte
- `aufgaben_generator`: eingebauter Generator für computer-auswertbare Aufgaben
- `data`: aktive lokale Datenbank
- `sql_imports`: Importdaten für Workflows, Prompts, Modelle, Fragensets und Checkpoints
- `optionale_grosse_run_imports`: großer optionaler Import historischer Runs und Statistikdaten
- `BENENNUNG_DATENSAETZE.md`: Regel fuer sprechende Namen von Fragensets und Messreihen
- `DATENSAETZE_KURZUEBERSICHT.md`: kurze Uebersicht zu jedem Fragenset und jeder Messreihe

## Wichtige Seiten

- `/run`: Testläufe starten und bewerten
- `/config`: Fragen, Kriterien, Modelle und Workflows verwalten
- `/data`: Statistik, Tabellen und Diagramme erzeugen

## Hinweise

Die Kopie enthält keine installierten Abhängigkeiten und keine echten API-Keys. Schritt 1 installiert alles lokal.

Die Anwendung kann leer starten. Beim ersten Start wird nur die technische Datenbankstruktur mit minimalen Seed-Daten erstellt. Die vollständigen verwendeten Workflows, Prompts und Fragensets werden über die SQL-Imports geladen. Historische Runs sind getrennt und optional.

# Benennung der Datensaetze

## Grundregel

- Technische Beziehungen bleiben erhalten: Wenn eine Run-Set-ID im Export sprechend umbenannt wird, werden alle zugehoerigen `run_set_id`-Referenzen im selben Import mitgeändert.
- Sichtbare Namen sind fachlich lesbar.
- Setup-Typ bedeutet Workflow-Typ.
- Fragenset bedeutet fachliche Gruppe der Fragen.
- Run-Set bedeutet Messreihe.

## Fragensets

- Format: `Thema | Umfang oder Schwierigkeit`
- Beispiele:
  - `CE: berechenbare Aufgaben | Schwierigkeit 1`
  - `Flowreview | Fragenset 7`
  - `Prompt-Optimierung | schwierige Fragen`

## Run-Sets

- Format: `Workflow-Typ | Fragenset | Datum | Umfang oder Zweck`
- Beispiele:
  - `CE Same-Start Reason + Pick | Schwierigkeit 1-3 | 2026-05-24 | 100 pro Metrik Teil 1`
  - `CE Additive Completion | CE Haupt-Fragenset | 2026-05-26 | 10 pro Metrik`
  - `Flowmap | Fragenset 3 | 2026-05-17`

## Vergleichbarkeit

- Der Workflow-Typ steht immer vorne.
- Das Fragenset steht direkt danach.
- Das Datum steht im Format `YYYY-MM-DD`.
- Wiederholungen oder Teilmengen stehen am Ende.
- Probe-, Korrektur- und Archivlaeufe sind im Namen gekennzeichnet.

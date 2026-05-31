# Übersicht nach Kriterium

Exporttyp: Übersicht
## Auswahl

- Kriterien: Alle Kriterien
- Fragensets: Basis-Fragenset, Beispiel-Fragenset, Flowmap | Fragenset 7, Flowreview | Fragenset 7, Grenzfaelle | fuer KI schwer loesbar, Prompt-Optimierung | absichtlich schwache Prompts, Prompt-Optimierung | schwierige Fragen, Fragenset 1 | Basis, Fragenset 2 | Prompt-Optimierung, Fragenset 3 | Flowmap, Fragenset 4 | Flowreview, Fragenset 5 | Prompt-Optimierung erweitert
- Run-Sets: Bestandsdaten | vor Strukturierung importiert, Direkt/Prompt | Fragenset 2 | 2026-05-16 | 10 Laeufe, Direkt/Prompt | schwierige Fragen | GPT-3.5 | 2026-05-16, Direkt/Prompt | schwache Prompts | GPT-3.5 | 2026-05-16, Flowmap | Fragenset 7 | 2026-05-16, Flowreview | Fragenset 7 | 2026-05-17, Flowreview | Fragenset 2 | 2026-05-17, Direkt/Prompt | Fragenset 2 | 2026-05-17 | Erweiterung, Direkt/Prompt | Fragenset 2 | 2026-05-17 | Lauf 5, Flowmap | Fragenset 3 | 2026-05-17, Flowreview | Fragenset 4 | 2026-05-17, Direkt/Prompt | Fragenset 3 | 2026-05-17 | Erweiterung, Direkt/Prompt | Fragenset 3 | 2026-05-17 | Lauf 3, Direkt/Prompt | Grenzfaelle | Set 2 | 2026-05-17, Direkt/Prompt | Grenzfaelle | Set 3 | 2026-05-17
- Workflow-Setups: C – Prompt-Optimierung, Flowmap, Flowreview
- Modelle: GPT-4o Mini, Claude Haiku 3.5, DeepSeek Chat, GPT-4o, GPT-4.1, GPT-3.5 Turbo (legacy)
- Max Paare pro Kriterium: kein Limit
- Skip Paare pro Kriterium: 0
- Direkt-Score behalten: behalte Direkt < 76%
- Stabiler Exportordner / Asset-Prefix: 75

Review-Antworten eingeschlossen: nein
Manuell ausgeschlossene Antworten eingeschlossen: nein

## Dateien

- `report_00_overview.md`: Markdown-Report mit eingebundenen Chart-Links.
- `75/tables/00_overview/short_results_table.tex`: kompakte LaTeX-Ergebnistabelle für den Haupttext.
- `75/tables/00_overview/full_results_table.tex`: ausführliche LaTeX-Tabelle für Anhang oder Querformatseite.
- `75/tables/00_overview/data_quality_table.tex`: Tabelle zur Datengrundlage und Bereinigung.
- `75/tables/00_overview/short_results_table.svg`: gerenderte LaTeX-Ergebnistabelle als SVG.
- `75/tables/00_overview/full_results_table.svg`: gerenderte ausfuehrliche LaTeX-Tabelle als SVG.
- `75/tables/00_overview/data_quality_table.svg`: gerenderte Tabelle zur Datengrundlage als SVG.
- `75/tables/00_overview/tables.md`: Markdown-Kopie der Ergebnistabellen.

## Diagramme

- `75/images/00_overview/chart_mean_difference_by_criterion.svg`: Mittlere Differenz nach Kriterium. Einheit: Prozentpunkte. Bedeutung: Workflow minus Direkter Aufruf. Positive Werte bedeuten Verbesserung durch den Workflow, negative Werte Verschlechterung.
- `75/images/00_overview/chart_mean_direkter_aufruf_vs_workflow.svg`: Mittelwert Direkter Aufruf vs Workflow. Zeigt die durchschnittlichen Scores pro Kriterium und macht mögliche Deckeneffekte sichtbar.
- `75/images/00_overview/chart_data_quality_by_criterion.svg`: Datenqualitaet nach Kriterium. Zeigt die exklusiven Zaehlkategorien pro Kriterium: ausgewaehlt, ausgelassen, Review, manuell ausgeschlossen, Fehler und unvollstaendig. Gezaehlt wird ohne Doppelzaehlung nach Prioritaet: unvollstaendig vor Fehler vor manuell ausgeschlossen vor Review.
- `75/images/00_overview/chart_ceiling_effect_by_criterion.svg`: Verbesserungspotenzial des direkten Aufrufs. Zeigt pro Kriterium, wie viele Antworten des direkten Aufrufs bereits 100%, nahe 100% oder deutlich darunter lagen. Viele 100%-Werte bedeuten Deckeneffekt: Der Workflow kann kaum noch verbessern, aber verschlechtern.

## Übersicht zu den Charts

### Mittlere Differenz nach Kriterium

| Feld | Wert |
|---|---|
| Datei | `75/images/00_overview/chart_mean_difference_by_criterion.svg` |
| Bedeutung | Einheit: Prozentpunkte. Bedeutung: Workflow minus Direkter Aufruf. Positive Werte bedeuten Verbesserung durch den Workflow, negative Werte Verschlechterung. |

Felderklärung:

- **X-Achse / Kriterium**: Verglichenes Bewertungskriterium.
- **Y-Achse / mittlere Differenz**: Workflow minus Direkter Aufruf in Prozentpunkten.
- **Y-Skala**: Skala der mittleren Differenzwerte mit Hilfslinien.
- **Zahlen auf Balken**: Konkrete mittlere Differenz pro Kriterium.
- **0-Linie**: Kein Unterschied zwischen Workflow und Direkter Aufruf.
- **Positive Werte**: Workflow wurde im Mittel höher bewertet.
- **Negative Werte**: Direkter Aufruf wurde im Mittel höher bewertet.

### Mittelwert Direkter Aufruf vs Workflow

| Feld | Wert |
|---|---|
| Datei | `75/images/00_overview/chart_mean_direkter_aufruf_vs_workflow.svg` |
| Bedeutung | Zeigt die durchschnittlichen Scores pro Kriterium und macht mögliche Deckeneffekte sichtbar. |

Felderklärung:

- **Kriterium**: Bewerteter Qualitätsbereich.
- **Direkter Aufruf**: Mittlerer Score der Antworten des direkten Aufrufs.
- **Workflow**: Mittlerer Score der Workflow-Antworten.
- **Y-Achse**: Durchschnittlicher Score in Prozent.
- **Y-Skala**: Skala von 0 bis 100 Prozent mit Hilfslinien.
- **Zahlen auf Balken**: Konkreter Mittelwert pro Methode.
- **Zweck**: Schneller Vergleich der beiden Methoden pro Kriterium.

### Datenqualitaet nach Kriterium

| Feld | Wert |
|---|---|
| Datei | `75/images/00_overview/chart_data_quality_by_criterion.svg` |
| Bedeutung | Zeigt die exklusiven Zaehlkategorien pro Kriterium: ausgewaehlt, ausgelassen, Review, manuell ausgeschlossen, Fehler und unvollstaendig. Gezaehlt wird ohne Doppelzaehlung nach Prioritaet: unvollstaendig vor Fehler vor manuell ausgeschlossen vor Review. |

Felderklärung:

- **Kriterium**: Bewerteter Qualitätsbereich.
- **Ausgewählt**: Paare, die in die Analyse eingehen.
- **Review**: Paare, die manuell geprüft werden sollten.
- **Y-Achse**: Anzahl der Paare.
- **Y-Skala**: Skala der Paaranzahl mit Hilfslinien.
- **Zahlen auf Balken**: Konkrete Anzahl der Paare.
- **Zweck**: Zeigt, ob die Datengrundlage pro Kriterium stabil genug ist.

### Verbesserungspotenzial des direkten Aufrufs

| Feld | Wert |
|---|---|
| Datei | `75/images/00_overview/chart_ceiling_effect_by_criterion.svg` |
| Bedeutung | Zeigt pro Kriterium, wie viele Antworten des direkten Aufrufs bereits 100%, nahe 100% oder deutlich darunter lagen. Viele 100%-Werte bedeuten Deckeneffekt: Der Workflow kann kaum noch verbessern, aber verschlechtern. |

Felderklärung:

- **Direkter Aufruf 100 / rot**: Direkter Aufruf war bereits perfekt; kaum messbares Verbesserungspotenzial.
- **Direkter Aufruf 75-99 / orange**: Direkter Aufruf war nahe an perfekt; wenig Verbesserungspotenzial.
- **Direkter Aufruf <75 / grün**: Direkter Aufruf hatte klarere Fehler; Workflow konnte eher verbessern.
- **Y-Achse**: Anzahl der Paare.
- **Y-Skala**: Skala der Paaranzahl mit Hilfslinien.
- **Zweck**: Macht den Deckeneffekt pro Kriterium sichtbar.

## Kurzergebnisse

| Kriterium | n | Mittel Direkter Aufruf | Mittel Workflow | Diff. | p-Wert | Ergebnis |
|---|---:|---:|---:|---:|---:|---|
| Richtigkeit | 343 | 69.1 | 76.9 | +7.8 | <0.0001 | signifikante Verbesserung |
| Rückfragefähigkeit | 527 | 30.2 | 49.9 | +19.7 | <0.0001 | signifikante Verbesserung |
| Internet- / Quellenqualität | 581 | 50.5 | 56.1 | +5.6 | <0.0001 | signifikante Verbesserung |
| Prüfung / Verifikation | 514 | 56.9 | 66.0 | +9.1 | <0.0001 | signifikante Verbesserung |
| Unsicherheit offenlegen | 251 | 62.0 | 77.4 | +15.4 | <0.0001 | signifikante Verbesserung |
| Vollständigkeit gemäß Möglichkeit | 397 | 62.0 | 71.1 | +9.1 | <0.0001 | signifikante Verbesserung |
| Vollständigkeit gemäß Frage | 109 | 55.7 | 60.6 | +4.9 | 0.0752 | nicht signifikant |
| Klarheit / Verständlichkeit | 382 | 67.9 | 72.5 | +4.6 | <0.0001 | signifikante Verbesserung |
| Relevanz | 145 | 69.7 | 80.8 | +11.1 | <0.0001 | signifikante Verbesserung |

LaTeX-gerenderte Tabelle:

![Kurze Ergebnistabelle](75/tables/00_overview/short_results_table.svg)

Felderklärung:

- **Kriterium**: Bewerteter Qualitätsbereich, z.B. Richtigkeit oder Vollständigkeit.
- **n**: Anzahl der vollständigen ausgewählten Paare, die in Statistik und Mittelwerte eingehen.
- **Mittel Direkter Aufruf**: Durchschnittlicher Score der Antworten des direkten Aufrufs in Prozent.
- **Mittel Workflow**: Durchschnittlicher Score der Workflow-Antworten in Prozent.
- **Diff.**: Mittlere Differenz Workflow minus Direkter Aufruf in Prozentpunkten.
- **p-Wert**: Wahrscheinlichkeit für einen mindestens so starken Effekt, falls in Wahrheit kein Unterschied besteht.
- **Ergebnis**: Kurze Interpretation des Tests, z.B. signifikante Verbesserung oder nicht signifikant.

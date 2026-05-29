# Übersicht nach Kriterium

Exporttyp: Übersicht
## Auswahl

- Kriterien: Alle Kriterien
- Fragensets: default, example, flowmap_set7, flowreview_set7, impossibleforai, lausyprompt, promptoptimierung_schwierig, set1, set2, set3, set4, set5
- Run-Sets: Existing runs, run10, gpt3_prompt_schwer, lazy_gpt3, flowmap7, review7, set2_review, set2_more, set2_5, set3_flowmap, set4_flowreview, set3_more, set3_3, imposs_2_single, imposs_3_single
- Workflow-Setups: Flowmap
- Modelle: GPT-4o Mini, Claude Haiku 3.5, DeepSeek Chat, GPT-4o, GPT-4.1, GPT-3.5 Turbo (legacy)
- Max Paare pro Kriterium: kein Limit
- Skip Paare pro Kriterium: 0
- Direkt-Score behalten: aus, nichts ausgeschlossen
- Stabiler Exportordner / Asset-Prefix: FM

Review-Antworten eingeschlossen: nein
Manuell ausgeschlossene Antworten eingeschlossen: nein

## Dateien

- `report_00_overview.md`: Markdown-Report mit eingebundenen Chart-Links.
- `FM/tables/00_overview/short_results_table.tex`: kompakte LaTeX-Ergebnistabelle für den Haupttext.
- `FM/tables/00_overview/full_results_table.tex`: ausführliche LaTeX-Tabelle für Anhang oder Querformatseite.
- `FM/tables/00_overview/data_quality_table.tex`: Tabelle zur Datengrundlage und Bereinigung.
- `FM/tables/00_overview/short_results_table.svg`: gerenderte LaTeX-Ergebnistabelle als SVG.
- `FM/tables/00_overview/full_results_table.svg`: gerenderte ausfuehrliche LaTeX-Tabelle als SVG.
- `FM/tables/00_overview/data_quality_table.svg`: gerenderte Tabelle zur Datengrundlage als SVG.
- `FM/tables/00_overview/tables.md`: Markdown-Kopie der Ergebnistabellen.

## Diagramme

- `FM/images/00_overview/chart_mean_difference_by_criterion.svg`: Mittlere Differenz nach Kriterium. Einheit: Prozentpunkte. Bedeutung: Workflow minus Direkter Aufruf. Positive Werte bedeuten Verbesserung durch den Workflow, negative Werte Verschlechterung.
- `FM/images/00_overview/chart_mean_direkter_aufruf_vs_workflow.svg`: Mittelwert Direkter Aufruf vs Workflow. Zeigt die durchschnittlichen Scores pro Kriterium und macht mögliche Deckeneffekte sichtbar.
- `FM/images/00_overview/chart_data_quality_by_criterion.svg`: Datenqualität nach Kriterium. Zeigt ausgewählte Paare und Review-Paare pro Kriterium zur Transparenz der Datengrundlage.
- `FM/images/00_overview/chart_ceiling_effect_by_criterion.svg`: Verbesserungspotenzial des direkten Aufrufs. Zeigt pro Kriterium, wie viele Antworten des direkten Aufrufs bereits 100%, nahe 100% oder deutlich darunter lagen. Viele 100%-Werte bedeuten Deckeneffekt: Der Workflow kann kaum noch verbessern, aber verschlechtern.

## Übersicht zu den Charts

### Mittlere Differenz nach Kriterium

| Feld | Wert |
|---|---|
| Datei | `FM/images/00_overview/chart_mean_difference_by_criterion.svg` |
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
| Datei | `FM/images/00_overview/chart_mean_direkter_aufruf_vs_workflow.svg` |
| Bedeutung | Zeigt die durchschnittlichen Scores pro Kriterium und macht mögliche Deckeneffekte sichtbar. |

Felderklärung:

- **Kriterium**: Bewerteter Qualitätsbereich.
- **Direkter Aufruf**: Mittlerer Score der Antworten des direkten Aufrufs.
- **Workflow**: Mittlerer Score der Workflow-Antworten.
- **Y-Achse**: Durchschnittlicher Score in Prozent.
- **Y-Skala**: Skala von 0 bis 100 Prozent mit Hilfslinien.
- **Zahlen auf Balken**: Konkreter Mittelwert pro Methode.
- **Zweck**: Schneller Vergleich der beiden Methoden pro Kriterium.

### Datenqualität nach Kriterium

| Feld | Wert |
|---|---|
| Datei | `FM/images/00_overview/chart_data_quality_by_criterion.svg` |
| Bedeutung | Zeigt ausgewählte Paare und Review-Paare pro Kriterium zur Transparenz der Datengrundlage. |

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
| Datei | `FM/images/00_overview/chart_ceiling_effect_by_criterion.svg` |
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
| Richtigkeit | 200 | 87.7 | 83.2 | -4.5 | 0.0068 | signifikante Verschlechterung |
| Rückfragefähigkeit | 176 | 37.9 | 62.2 | +24.3 | <0.0001 | signifikante Verbesserung |
| Internet- / Quellenqualität | 194 | 56.0 | 59.9 | +3.8 | 0.1041 | nicht signifikant |
| Prüfung / Verifikation | 199 | 67.0 | 71.5 | +4.5 | 0.0908 | nicht signifikant |
| Unsicherheit offenlegen | 200 | 85.4 | 83.0 | -2.4 | 0.3370 | nicht signifikant |
| Vollständigkeit gemäß Möglichkeit | 196 | 75.9 | 72.7 | -3.2 | 0.2303 | nicht signifikant |
| Vollständigkeit gemäß Frage | 199 | 92.5 | 85.7 | -6.8 | <0.0001 | signifikante Verschlechterung |
| Klarheit / Verständlichkeit | 190 | 79.1 | 75.8 | -3.3 | 0.0675 | nicht signifikant |
| Relevanz | 200 | 95.3 | 89.6 | -5.7 | <0.0001 | signifikante Verschlechterung |

LaTeX-gerenderte Tabelle:

![Kurze Ergebnistabelle](FM/tables/00_overview/short_results_table.svg)

Felderklärung:

- **Kriterium**: Bewerteter Qualitätsbereich, z.B. Richtigkeit oder Vollständigkeit.
- **n**: Anzahl der vollständigen ausgewählten Paare, die in Statistik und Mittelwerte eingehen.
- **Mittel Direkter Aufruf**: Durchschnittlicher Score der Antworten des direkten Aufrufs in Prozent.
- **Mittel Workflow**: Durchschnittlicher Score der Workflow-Antworten in Prozent.
- **Diff.**: Mittlere Differenz Workflow minus Direkter Aufruf in Prozentpunkten.
- **p-Wert**: Wahrscheinlichkeit für einen mindestens so starken Effekt, falls in Wahrheit kein Unterschied besteht.
- **Ergebnis**: Kurze Interpretation des Tests, z.B. signifikante Verbesserung oder nicht signifikant.

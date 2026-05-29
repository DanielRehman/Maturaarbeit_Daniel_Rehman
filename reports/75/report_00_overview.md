# Übersicht nach Kriterium

## Auswahl

- Kriterien: Alle Kriterien
- Fragensets: default, example, flowmap_set7, flowreview_set7, impossibleforai, lausyprompt, promptoptimierung_schwierig, set1, set2, set3, set4, set5
- Run-Sets: Existing runs, run10, gpt3_prompt_schwer, lazy_gpt3, flowmap7, review7, set2_review, set2_more, set2_5, set3_flowmap, set4_flowreview, set3_more, set3_3, imposs_2_single, imposs_3_single
- Workflow-Setups: Flowmap, Flowreview, C – Prompt-Optimierung
- Modelle: GPT-4o Mini, Claude Haiku 3.5, DeepSeek Chat, GPT-4o, GPT-4.1, GPT-3.5 Turbo (legacy)
- Max Paare pro Kriterium: kein Limit
- Skip Paare pro Kriterium: 0
- Direkt-Score behalten: behalte Direkt < 75%
- Stabiler Exportordner / Asset-Prefix: 75

Review-Antworten eingeschlossen: nein
Manuell ausgeschlossene Antworten eingeschlossen: nein

## Kurze Ergebnistabelle

| Kriterium | n | Mittel Direkter Aufruf | Mittel Workflow | Diff. | p-Wert | Ergebnis |
|---|---:|---:|---:|---:|---:|---|
| Richtigkeit | 67 | 44.8 | 62.1 | +17.3 | <0.0001 | signifikante Verbesserung |
| Rückfragefähigkeit | 496 | 27.4 | 48.8 | +21.4 | <0.0001 | signifikante Verbesserung |
| Internet- / Quellenqualität | 423 | 41.4 | 49.9 | +8.5 | <0.0001 | signifikante Verbesserung |
| Prüfung / Verifikation | 258 | 38.9 | 58.9 | +19.9 | <0.0001 | signifikante Verbesserung |
| Unsicherheit offenlegen | 85 | 36.7 | 70.0 | +33.3 | <0.0001 | signifikante Verbesserung |
| Vollständigkeit gemäß Möglichkeit | 186 | 47.2 | 62.1 | +14.9 | <0.0001 | signifikante Verbesserung |
| Vollständigkeit gemäß Frage | 66 | 43.1 | 52.8 | +9.6 | 0.0147 | signifikante Verbesserung |
| Klarheit / Verständlichkeit | 109 | 50.0 | 60.8 | +10.8 | <0.0001 | signifikante Verbesserung |
| Relevanz | 27 | 46.5 | 68.4 | +21.9 | 0.0016 | signifikante Verbesserung |

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

## Ausführliche Statistiktabelle

| Kriterium | n | Mittel Direkter Aufruf | Mittel Workflow | Diff. | SD Diff. | t-Wert | df | p-Wert | 95% KI | Cohen dz | Ergebnis |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|---|
| Richtigkeit | 67 | 44.83 | 62.13 | +17.30 | 32.89 | 4.304 | 66 | <0.0001 | [+9.34; +25.25] | 0.53 | signifikante Verbesserung |
| Rückfragefähigkeit | 496 | 27.40 | 48.75 | +21.36 | 31.17 | 15.262 | 495 | <0.0001 | [+18.61; +24.10] | 0.69 | signifikante Verbesserung |
| Internet- / Quellenqualität | 423 | 41.40 | 49.95 | +8.55 | 23.30 | 7.544 | 422 | <0.0001 | [+6.33; +10.77] | 0.37 | signifikante Verbesserung |
| Prüfung / Verifikation | 258 | 38.94 | 58.88 | +19.95 | 33.40 | 9.592 | 257 | <0.0001 | [+15.87; +24.02] | 0.60 | signifikante Verbesserung |
| Unsicherheit offenlegen | 85 | 36.67 | 69.97 | +33.29 | 34.04 | 9.018 | 84 | <0.0001 | [+25.98; +40.60] | 0.98 | signifikante Verbesserung |
| Vollständigkeit gemäß Möglichkeit | 186 | 47.17 | 62.09 | +14.92 | 30.05 | 6.769 | 185 | <0.0001 | [+10.60; +19.23] | 0.50 | signifikante Verbesserung |
| Vollständigkeit gemäß Frage | 66 | 43.14 | 52.78 | +9.64 | 31.25 | 2.506 | 65 | 0.0147 | [+2.02; +17.25] | 0.31 | signifikante Verbesserung |
| Klarheit / Verständlichkeit | 109 | 50.04 | 60.82 | +10.78 | 25.51 | 4.411 | 108 | <0.0001 | [+5.94; +15.62] | 0.42 | signifikante Verbesserung |
| Relevanz | 27 | 46.52 | 68.40 | +21.87 | 32.17 | 3.533 | 26 | 0.0016 | [+9.14; +34.60] | 0.68 | signifikante Verbesserung |

LaTeX-gerenderte Tabelle:

![Ausfuehrliche Statistiktabelle](75/tables/00_overview/full_results_table.svg)

Felderklärung:

- **Kriterium**: Bewerteter Qualitätsbereich, z.B. Richtigkeit oder Vollständigkeit.
- **n**: Anzahl der vollständigen ausgewählten Paare, die in Statistik und Mittelwerte eingehen.
- **Mittel Direkter Aufruf**: Durchschnittlicher Score der Antworten des direkten Aufrufs in Prozent.
- **Mittel Workflow**: Durchschnittlicher Score der Workflow-Antworten in Prozent.
- **Diff.**: Mittlere Differenz Workflow minus Direkter Aufruf in Prozentpunkten.
- **p-Wert**: Wahrscheinlichkeit für einen mindestens so starken Effekt, falls in Wahrheit kein Unterschied besteht.
- **Ergebnis**: Kurze Interpretation des Tests, z.B. signifikante Verbesserung oder nicht signifikant.
- **SD Diff.**: Standardabweichung der paarweisen Differenzen; zeigt die Streuung des Effekts.
- **t-Wert**: Teststatistik des gepaarten t-Tests; wird mit dem kritischen Wert bzw. p-Wert beurteilt.
- **df**: Freiheitsgrade des Tests, hier normalerweise n minus 1.
- **95% KI**: 95-Prozent-Konfidenzintervall der mittleren Differenz; enthält es 0, ist der Effekt unsicherer.
- **Cohen dz**: Effektstärke für gepaarte Daten; macht die Größe des Effekts vergleichbarer.

## Tabelle zur Datengrundlage

| Kriterium | Gesamt | Gültig | Ausgewählt | Ausgelassen | Fehler | Review | Manuell ausgeschlossen | Unvollständig |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Richtigkeit | 908 | 908 | 67 | 828 | 0 | 13 | 0 | 0 |
| Rückfragefähigkeit | 738 | 738 | 496 | 140 | 0 | 102 | 0 | 0 |
| Internet- / Quellenqualität | 732 | 731 | 423 | 285 | 0 | 23 | 0 | 1 |
| Prüfung / Verifikation | 738 | 738 | 258 | 474 | 0 | 6 | 0 | 0 |
| Unsicherheit offenlegen | 738 | 738 | 85 | 608 | 0 | 45 | 0 | 0 |
| Vollständigkeit gemäß Möglichkeit | 817 | 814 | 186 | 594 | 3 | 34 | 0 | 0 |
| Vollständigkeit gemäß Frage | 866 | 857 | 66 | 783 | 8 | 8 | 0 | 1 |
| Klarheit / Verständlichkeit | 738 | 738 | 109 | 599 | 0 | 30 | 0 | 0 |
| Relevanz | 733 | 733 | 27 | 686 | 0 | 20 | 0 | 0 |

LaTeX-gerenderte Tabelle:

![Tabelle zur Datengrundlage](75/tables/00_overview/data_quality_table.svg)

Felderklärung:

- **Kriterium**: Bewerteter Qualitätsbereich.
- **Gesamt**: Alle gefundenen Paare nach den gesetzten Filtern vor Bereinigung.
- **Gültig**: Paare ohne Fehler und ohne unvollständige oder unbewertete Seite.
- **Ausgewählt**: Paare, die tatsächlich in Analyse, Statistik und Charts verwendet werden.
- **Ausgelassen**: Paare, die durch den optionalen Direkt-Score-Behalten-Bereich ausgeschlossen wurden, weil der direkte Aufruf außerhalb des eingestellten Bereichs lag.
- **Fehler**: Paare, bei denen mindestens eine Seite einen technischen Fehler hatte.
- **Review**: Paare mit Review-Markierung; standardmäßig nicht in der Analyse enthalten.
- **Manuell ausgeschlossen**: Paare, die vom Nutzer manuell aus der Analyse ausgeschlossen wurden.
- **Unvollständig**: Paare mit fehlender Seite, laufendem Run oder fehlendem Score.

## Diagramme

### Mittlere Differenz nach Kriterium

| Feld | Wert |
|---|---|
| Datei | `75/images/00_overview/chart_mean_difference_by_criterion.svg` |
| Bedeutung | Einheit: Prozentpunkte. Bedeutung: Workflow minus Direkter Aufruf. Positive Werte bedeuten Verbesserung durch den Workflow, negative Werte Verschlechterung. |

![Mittlere Differenz nach Kriterium](75/images/00_overview/chart_mean_difference_by_criterion.svg)

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

![Mittelwert Direkter Aufruf vs Workflow](75/images/00_overview/chart_mean_direkter_aufruf_vs_workflow.svg)

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
| Datei | `75/images/00_overview/chart_data_quality_by_criterion.svg` |
| Bedeutung | Zeigt ausgewählte Paare und Review-Paare pro Kriterium zur Transparenz der Datengrundlage. |

![Datenqualität nach Kriterium](75/images/00_overview/chart_data_quality_by_criterion.svg)

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

![Verbesserungspotenzial des direkten Aufrufs](75/images/00_overview/chart_ceiling_effect_by_criterion.svg)

Felderklärung:

- **Direkter Aufruf 100 / rot**: Direkter Aufruf war bereits perfekt; kaum messbares Verbesserungspotenzial.
- **Direkter Aufruf 75-99 / orange**: Direkter Aufruf war nahe an perfekt; wenig Verbesserungspotenzial.
- **Direkter Aufruf <75 / grün**: Direkter Aufruf hatte klarere Fehler; Workflow konnte eher verbessern.
- **Y-Achse**: Anzahl der Paare.
- **Y-Skala**: Skala der Paaranzahl mit Hilfslinien.
- **Zweck**: Macht den Deckeneffekt pro Kriterium sichtbar.

# Ausgewählte Analyse

Exporttyp: Detailanalyse
## Auswahl

- Kriterien: Vollständigkeit gemäß Frage
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

- `report_07_vollstaendigkeit_gemaess_frage.md`: Markdown-Report mit eingebundenen Chart-Links.
- `FM/tables/07_vollstaendigkeit_gemaess_frage/short_results_table.tex`: kompakte LaTeX-Ergebnistabelle für den Haupttext.
- `FM/tables/07_vollstaendigkeit_gemaess_frage/full_results_table.tex`: ausführliche LaTeX-Tabelle für Anhang oder Querformatseite.
- `FM/tables/07_vollstaendigkeit_gemaess_frage/data_quality_table.tex`: Tabelle zur Datengrundlage und Bereinigung.
- `FM/tables/07_vollstaendigkeit_gemaess_frage/short_results_table.svg`: gerenderte LaTeX-Ergebnistabelle als SVG.
- `FM/tables/07_vollstaendigkeit_gemaess_frage/full_results_table.svg`: gerenderte ausfuehrliche LaTeX-Tabelle als SVG.
- `FM/tables/07_vollstaendigkeit_gemaess_frage/data_quality_table.svg`: gerenderte Tabelle zur Datengrundlage als SVG.
- `FM/tables/07_vollstaendigkeit_gemaess_frage/tables.md`: Markdown-Kopie der Ergebnistabellen.

## Diagramme

- `FM/images/07_vollstaendigkeit_gemaess_frage/chart_paired_differences.svg`: Paarweise Differenzen. Zeigt für jedes Paar die Differenz Workflow minus Direkter Aufruf.
- `FM/images/07_vollstaendigkeit_gemaess_frage/chart_paired_differences_sample.svg`: Paarweise Differenzen (Sample). Zeigt dieselbe Darstellung fuer die ersten 120 Paare. Diese Version ist besser lesbar, aber nicht vollstaendig.
- `FM/images/07_vollstaendigkeit_gemaess_frage/chart_paired_differences_part_001.svg usw.`: Paarweise Differenzen in Teilen. Zusaetzliche mehrteilige Version mit bis zu 100 Paaren pro SVG. Diese Dateien sind besser lesbar als der vollstaendige Chart und decken zusammen alle Paare ab.
- `FM/images/07_vollstaendigkeit_gemaess_frage/chart_difference_distribution.svg`: Verteilung der Paardifferenzen. Zeigt, ob der Workflow-Effekt stabil ist oder stark streut.
- `FM/images/07_vollstaendigkeit_gemaess_frage/chart_scoreverteilung_direkter_aufruf.svg`: Verteilung der Scores des direkten Aufrufs. Zeigt, wie viele Antworten des direkten Aufrufs bereits nahe oder genau bei 100% lagen. Das macht den Deckeneffekt sichtbar.
- `FM/images/07_vollstaendigkeit_gemaess_frage/chart_direkter_aufruf_vs_workflow_scatter.svg`: Scorevergleich Direkter Aufruf vs Workflow. Punkte oberhalb der Diagonale bedeuten, dass der Workflow höher bewertet wurde als der direkte Aufruf. Gleiche Score-Kombinationen werden leicht versetzt und mit ihrer Anzahl beschriftet.

## Übersicht zu den Charts

### Paarweise Differenzen

| Feld | Wert |
|---|---|
| Datei | `FM/images/07_vollstaendigkeit_gemaess_frage/chart_paired_differences.svg` |
| Bedeutung | Zeigt für jedes Paar die Differenz Workflow minus Direkter Aufruf. |

Felderklärung:

- **X-Achse / Antwortpaar**: Ein gepaarter Vergleich aus direktem Aufruf und Workflow.
- **Y-Achse / Differenz**: Workflow minus Direkter Aufruf in Prozentpunkten.
- **Zahlen auf Balken**: Konkrete Differenz des jeweiligen Antwortpaars in Prozentpunkten.
- **Y-Skala**: Skala der Differenzwerte; positive und negative Bereiche werden getrennt sichtbar.
- **0-Linie**: Beide Antworten wurden gleich bewertet.
- **Positive Balken**: Workflow war besser.
- **Negative Balken**: Direkter Aufruf war besser.

### Paarweise Differenzen (Sample)

| Feld | Wert |
|---|---|
| Datei | `FM/images/07_vollstaendigkeit_gemaess_frage/chart_paired_differences_sample.svg` |
| Bedeutung | Zeigt dieselbe Darstellung fuer die ersten 120 Paare. Diese Version ist besser lesbar, aber nicht vollstaendig. |

Felderklärung:

- **Datei**: Exportiertes Diagramm.
- **Bedeutung**: Visualisiert einen Teil der statistischen Auswertung.

### Paarweise Differenzen in Teilen

| Feld | Wert |
|---|---|
| Datei | `FM/images/07_vollstaendigkeit_gemaess_frage/chart_paired_differences_part_001.svg usw.` |
| Bedeutung | Zusaetzliche mehrteilige Version mit bis zu 100 Paaren pro SVG. Diese Dateien sind besser lesbar als der vollstaendige Chart und decken zusammen alle Paare ab. |

Felderklärung:

- **Datei**: Exportiertes Diagramm.
- **Bedeutung**: Visualisiert einen Teil der statistischen Auswertung.

### Verteilung der Paardifferenzen

| Feld | Wert |
|---|---|
| Datei | `FM/images/07_vollstaendigkeit_gemaess_frage/chart_difference_distribution.svg` |
| Bedeutung | Zeigt, ob der Workflow-Effekt stabil ist oder stark streut. |

Felderklärung:

- **X-Achse**: Bereich der paarweisen Differenz in Prozentpunkten.
- **Y-Achse**: Anzahl der Paare in diesem Bereich.
- **Zahlen auf Balken**: Anzahl der Paare in diesem Differenzbereich.
- **Grüne Balken**: Differenzbereich liegt oberhalb von 0; Workflow war besser.
- **Rote Balken**: Differenzbereich liegt unterhalb von 0; Direkter Aufruf war besser.
- **Mitte bei 0**: Kein Unterschied zwischen Workflow und Direkter Aufruf.
- **Rechts von 0**: Workflow-Vorteile.
- **Links von 0**: Workflow-Nachteile.

### Verteilung der Scores des direkten Aufrufs

| Feld | Wert |
|---|---|
| Datei | `FM/images/07_vollstaendigkeit_gemaess_frage/chart_scoreverteilung_direkter_aufruf.svg` |
| Bedeutung | Zeigt, wie viele Antworten des direkten Aufrufs bereits nahe oder genau bei 100% lagen. Das macht den Deckeneffekt sichtbar. |

Felderklärung:

- **<50 / grün**: Direkter Aufruf war klar schwach; viel Verbesserungspotenzial.
- **50-74 / hellgrün**: Direkter Aufruf war teilweise richtig; noch deutliches Verbesserungspotenzial.
- **75-99 / orange**: Direkter Aufruf war nahe an vollständig; wenig Verbesserungspotenzial.
- **100 / rot**: Direkter Aufruf war bereits perfekt; Workflow kann nicht weiter verbessern und nur gleich bleiben oder verschlechtern.
- **Zahlen auf Balken**: Anzahl der Paare in dieser Score-Gruppe.
- **Y-Achse**: Anzahl der Paare.
- **Zweck**: Zeigt den Deckeneffekt in der Detailanalyse.

### Scorevergleich Direkter Aufruf vs Workflow

| Feld | Wert |
|---|---|
| Datei | `FM/images/07_vollstaendigkeit_gemaess_frage/chart_direkter_aufruf_vs_workflow_scatter.svg` |
| Bedeutung | Punkte oberhalb der Diagonale bedeuten, dass der Workflow höher bewertet wurde als der direkte Aufruf. Gleiche Score-Kombinationen werden leicht versetzt und mit ihrer Anzahl beschriftet. |

Felderklärung:

- **X-Achse**: Score des direkten Aufrufs in Prozent.
- **Y-Achse**: Score des Workflows in Prozent.
- **X/Y-Skala**: Skalen von 0 bis 100 Prozent mit Hilfslinien.
- **Diagonale**: Gleicher Score bei direktem Aufruf und Workflow.
- **Punkte oberhalb**: Workflow war besser.
- **Punkte unterhalb**: Direkter Aufruf war besser.
- **Zahlen an Punkten**: Mehrere Paare liegen auf derselben Score-Kombination.

## Kurzergebnisse

| Kriterium | n | Mittel Direkter Aufruf | Mittel Workflow | Diff. | p-Wert | Ergebnis |
|---|---:|---:|---:|---:|---:|---|
| Vollständigkeit gemäß Frage | 199 | 92.5 | 85.7 | -6.8 | <0.0001 | signifikante Verschlechterung |

LaTeX-gerenderte Tabelle:

![Kurze Ergebnistabelle](FM/tables/07_vollstaendigkeit_gemaess_frage/short_results_table.svg)

Felderklärung:

- **Kriterium**: Bewerteter Qualitätsbereich, z.B. Richtigkeit oder Vollständigkeit.
- **n**: Anzahl der vollständigen ausgewählten Paare, die in Statistik und Mittelwerte eingehen.
- **Mittel Direkter Aufruf**: Durchschnittlicher Score der Antworten des direkten Aufrufs in Prozent.
- **Mittel Workflow**: Durchschnittlicher Score der Workflow-Antworten in Prozent.
- **Diff.**: Mittlere Differenz Workflow minus Direkter Aufruf in Prozentpunkten.
- **p-Wert**: Wahrscheinlichkeit für einen mindestens so starken Effekt, falls in Wahrheit kein Unterschied besteht.
- **Ergebnis**: Kurze Interpretation des Tests, z.B. signifikante Verbesserung oder nicht signifikant.

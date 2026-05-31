# Ausgewählte Analyse

## Auswahl

- Kriterien: Unsicherheit offenlegen
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

## Kurze Ergebnistabelle

| Kriterium | n | Mittel Direkter Aufruf | Mittel Workflow | Diff. | p-Wert | Ergebnis |
|---|---:|---:|---:|---:|---:|---|
| Unsicherheit offenlegen | 251 | 62.0 | 77.4 | +15.4 | <0.0001 | signifikante Verbesserung |

LaTeX-gerenderte Tabelle:

![Kurze Ergebnistabelle](75/tables/05_unsicherheit_offenlegen/short_results_table.svg)

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
| Unsicherheit offenlegen | 251 | 62.02 | 77.38 | +15.36 | 29.01 | 8.386 | 250 | <0.0001 | [+11.77; +18.95] | 0.53 | signifikante Verbesserung |

LaTeX-gerenderte Tabelle:

![Ausfuehrliche Statistiktabelle](75/tables/05_unsicherheit_offenlegen/full_results_table.svg)

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
| Unsicherheit offenlegen | 741 | 738 | 251 | 442 | 0 | 45 | 0 | 3 |

LaTeX-gerenderte Tabelle:

![Tabelle zur Datengrundlage](75/tables/05_unsicherheit_offenlegen/data_quality_table.svg)

Felderklärung:

- **Kriterium**: Bewerteter Qualitätsbereich.
- **Gesamt**: Alle gefundenen Paare nach den gesetzten Filtern vor Bereinigung.
- **Gueltig**: Paare nach Abzug von Unvollstaendig und Fehler. Review und manuell ausgeschlossen bleiben gueltig, werden aber je nach Filter nicht ausgewaehlt.
- **Ausgewählt**: Paare, die tatsächlich in Analyse, Statistik und Charts verwendet werden.
- **Ausgelassen**: Paare, die durch den optionalen Direkt-Score-Behalten-Bereich ausgeschlossen wurden, weil der direkte Aufruf außerhalb des eingestellten Bereichs lag.
- **Fehler**: Vollständig paarbare Paare, bei denen mindestens eine Seite einen technischen Fehler hatte. Unvollständige oder unpaarbare Fälle werden vorher als Unvollständig gezählt.
- **Review**: Gueltige Paare mit Review-Markierung; standardmaessig nicht in der Analyse enthalten, wenn Review nicht eingeschlossen ist.
- **Manuell ausgeschlossen**: Gueltige Paare, die vom Nutzer manuell aus der Analyse ausgeschlossen wurden. Wird erst nach Unvollstaendig und Fehler gezaehlt.
- **Unvollstaendig**: Paare oder unpaarbare Workflow-Laeufe mit fehlender Seite, laufendem Status, fehlendem Score oder fehlender gueltiger Paar-ID. Diese Kategorie hat Vorrang vor Fehler und manuell ausgeschlossen.

## Diagramme

### Paarweise Differenzen

| Feld | Wert |
|---|---|
| Datei | `75/images/05_unsicherheit_offenlegen/chart_paired_differences.svg` |
| Bedeutung | Zeigt für jedes Paar die Differenz Workflow minus Direkter Aufruf. |

![Paarweise Differenzen](75/images/05_unsicherheit_offenlegen/chart_paired_differences.svg)

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
| Datei | `75/images/05_unsicherheit_offenlegen/chart_paired_differences_sample.svg` |
| Bedeutung | Zeigt dieselbe Darstellung fuer die ersten 120 Paare. Diese Version ist besser lesbar, aber nicht vollstaendig. |

![Paarweise Differenzen (Sample)](75/images/05_unsicherheit_offenlegen/chart_paired_differences_sample.svg)

Felderklärung:

- **Datei**: Exportiertes Diagramm.
- **Bedeutung**: Visualisiert einen Teil der statistischen Auswertung.

### Paarweise Differenzen in Teilen

| Feld | Wert |
|---|---|
| Datei | `75/images/05_unsicherheit_offenlegen/chart_paired_differences_part_001.svg usw.` |
| Bedeutung | Zusaetzliche mehrteilige Version mit bis zu 100 Paaren pro SVG. Diese Dateien sind besser lesbar als der vollstaendige Chart und decken zusammen alle Paare ab. |

![Paarweise Differenzen in Teilen](75/images/05_unsicherheit_offenlegen/chart_paired_differences_part_001.svg usw.)

Felderklärung:

- **Datei**: Exportiertes Diagramm.
- **Bedeutung**: Visualisiert einen Teil der statistischen Auswertung.

### Verteilung der Paardifferenzen

| Feld | Wert |
|---|---|
| Datei | `75/images/05_unsicherheit_offenlegen/chart_difference_distribution.svg` |
| Bedeutung | Zeigt, ob der Workflow-Effekt stabil ist oder stark streut. |

![Verteilung der Paardifferenzen](75/images/05_unsicherheit_offenlegen/chart_difference_distribution.svg)

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
| Datei | `75/images/05_unsicherheit_offenlegen/chart_scoreverteilung_direkter_aufruf.svg` |
| Bedeutung | Zeigt, wie viele Antworten des direkten Aufrufs bereits nahe oder genau bei 100% lagen. Das macht den Deckeneffekt sichtbar. |

![Verteilung der Scores des direkten Aufrufs](75/images/05_unsicherheit_offenlegen/chart_scoreverteilung_direkter_aufruf.svg)

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
| Datei | `75/images/05_unsicherheit_offenlegen/chart_direkter_aufruf_vs_workflow_scatter.svg` |
| Bedeutung | Punkte oberhalb der Diagonale bedeuten, dass der Workflow höher bewertet wurde als der direkte Aufruf. Gleiche Score-Kombinationen werden leicht versetzt und mit ihrer Anzahl beschriftet. |

![Scorevergleich Direkter Aufruf vs Workflow](75/images/05_unsicherheit_offenlegen/chart_direkter_aufruf_vs_workflow_scatter.svg)

Felderklärung:

- **X-Achse**: Score des direkten Aufrufs in Prozent.
- **Y-Achse**: Score des Workflows in Prozent.
- **X/Y-Skala**: Skalen von 0 bis 100 Prozent mit Hilfslinien.
- **Diagonale**: Gleicher Score bei direktem Aufruf und Workflow.
- **Punkte oberhalb**: Workflow war besser.
- **Punkte unterhalb**: Direkter Aufruf war besser.
- **Zahlen an Punkten**: Mehrere Paare liegen auf derselben Score-Kombination.

# Ausgewählte Analyse

## Kurztabelle

| Kriterium | n | Mittel Direkter Aufruf | Mittel Workflow | Diff. | p-Wert | Ergebnis |
|---|---:|---:|---:|---:|---:|---|
| Klarheit / Verständlichkeit | 382 | 67.9 | 72.5 | +4.6 | <0.0001 | signifikante Verbesserung |

LaTeX-gerenderte Tabelle:

![Kurztabelle](short_results_table.svg)

Felderklärung:

- **Kriterium**: Bewerteter Qualitätsbereich, z.B. Richtigkeit oder Vollständigkeit.
- **n**: Anzahl der vollständigen ausgewählten Paare, die in Statistik und Mittelwerte eingehen.
- **Mittel Direkter Aufruf**: Durchschnittlicher Score der Antworten des direkten Aufrufs in Prozent.
- **Mittel Workflow**: Durchschnittlicher Score der Workflow-Antworten in Prozent.
- **Diff.**: Mittlere Differenz Workflow minus Direkter Aufruf in Prozentpunkten.
- **p-Wert**: Wahrscheinlichkeit für einen mindestens so starken Effekt, falls in Wahrheit kein Unterschied besteht.
- **Ergebnis**: Kurze Interpretation des Tests, z.B. signifikante Verbesserung oder nicht signifikant.

## Ausführliche Tabelle

| Kriterium | n | Mittel Direkter Aufruf | Mittel Workflow | Diff. | SD Diff. | t-Wert | df | p-Wert | 95% KI | Cohen dz | Ergebnis |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|---|
| Klarheit / Verständlichkeit | 382 | 67.88 | 72.46 | +4.58 | 20.61 | 4.345 | 381 | <0.0001 | [+2.51; +6.65] | 0.22 | signifikante Verbesserung |

LaTeX-gerenderte Tabelle:

![Ausfuehrliche Tabelle](full_results_table.svg)

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
| Klarheit / Verständlichkeit | 741 | 738 | 382 | 326 | 0 | 30 | 0 | 3 |

LaTeX-gerenderte Tabelle:

![Tabelle zur Datengrundlage](data_quality_table.svg)

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

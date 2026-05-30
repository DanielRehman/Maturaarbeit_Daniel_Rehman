# Matura Arbeit – Angewandte Mathematik / Statistik

# Statistische Untersuchung von KI-Workflows

 Fach: Angewandte Mathematik / Statistik

 Name: Daniel Rehman

 Schule: Swiss Online School

 Betreuungsperson: Nicole Schubiger

 GitHub Repository: https://github.com/DanielRehman/Maturaarbeit_Daniel_Rehman

 Datum: 17.05.2026 ZH

# Zusammenfassung

Diese Arbeit untersucht, ob KI-Workflows, 
also mehrere KI-Aufrufe, die sich gegenseitig verbessern und korrigieren,   
qualitativ bessere Antworten liefern als einzelne KI-Anfragen.

Es werden Fragesets mit erwarteten Kriterien für die Qualität der Antworten erstellt.
Es werden Stichproben mit Fragesets durchgeführt, um Verbesserungen zu messen. Zur statistischen Analyse wird ein zweiseitiger gepaarter t-Test verwendet. Damit wird geprüft, ob die gemessenen Unterschiede zufällig entstanden sein könnten oder statistisch auffällig sind. Er dient hier als Werkzeug, um Verbesserungen und Verschlechterungen sichtbar zu machen.
Die statistische Auswertung der Messungen zeigt für die verwendete Stichprobe keine signifikante Veränderung in positiver Richtung, also keine signifikante Verbesserung der Antwortqualität durch KI-Workflows gegenüber einzelnen KI-Anfrage. 

Trotz verschiedener Testversuche bleiben relevante Verbesserungen hartnäckig aus. Das war unerwartet, weil deutliche Fortschritte unmittelbar sichtbar sein sollten. Die gemessenen Fähigkeiten der KI sollten, ähnlich wie bei einem Taschenrechner klar und einfach nachweisbar sein. Das ist kein Beweis aber ein Hinweis darauf, dass im Test oder in unserem Verständniss der AI  etwas wichtiges fehlt.  

Es deutet darauf hin, dass es schwierig ist, einen nützlichen Workflow rein nach sinnvollen Arbeitsschritten zusammenzusetzen. Manche Schritte haben in der verwendeten Stichprobe sehr starke Nebeneffekte. Die KI löst zwar die angestrebte Aufgabe, gleicht diesen Erfolg aber mit neuen Fehlern wieder aus. Arbeitsschritte in der Informatik sollten relevanten Nutzen bringen und möglichst wenig Fehler im Vergleich erzeugen.



# Inhaltsverzeichnis

- [Zusammenfassung](#zusammenfassung)
- [1. Einleitung](#1-einleitung)
  - [1.1 Ausgangslage Problemstellung und Motivation](#11-ausgangslage-problemstellung-und-motivation)
  - [1.2 Ziel der Arbeit](#12-ziel-der-arbeit)
  - [1.3 Meine Erwartungen](#13-meine-erwartungen)
- [2. Theoretische Grundlagen](#2-theoretische-grundlagen)
  - [2.1 Exkurs Statistik Grundlagen](#21-exkurs-statistik-grundlagen)
  - [2.2 Exkurs Künstliche Intelligenz](#22-exkurs-künstliche-intelligenz)
- [3. Versuchsaufbau, Datenerhebung und Auswertung](#3-versuchsaufbau-datenerhebung-und-auswertung)
  - [3.1 Ziel der Auswertung](#31-ziel-der-auswertung)
  - [3.2 Beschreibung der KI-Workflows](#32-beschreibung-der-ki-workflows)
  - [3.3 Bewertungsmethoden und Metriken](#33-bewertungsmethoden-und-metriken)
  - [3.4 Versuch auswerten](#34-versuch-auswerten)
  - [3.5 Statistische Auswertung der Ergebnisse](#35-statistische-auswertung-der-ergebnisse)
- [4. Diskussion](#4-diskussion)
  - [4.1 Interpretation der Resultate](#41-interpretation-der-resultate)
  - [4.2 Grenzen der Untersuchung](#42-grenzen-der-untersuchung)
  - [4.3 Bedeutung für KI-Workflows](#43-bedeutung-für-ki-workflows)
- [5. Fazit](#5-fazit)
  - [5.1 Ausblick](#51-ausblick)
  - [5.2 kritische Reflexion](#5.2-kritische-Reflexion)
- [6. Anhänge](#6-anhänge)
  - [6.1 Exkurs Künstliche Intelligenz](#61-exkurs-künstliche-intelligenz)
  - [6.2 Exkurs Statistik Teil 1: Grundlagen und t-Test](#62-exkurs-statistik-teil-1-grundlagen-und-t-test)
  - [6.3 Exkurs Statistik Teil 2: Zweiseitiger gepaarter t-Test – Rechnungsschritte](#63-exkurs-statistik-teil-2-zweiseitiger-gepaarter-t-test--rechnungsschritte)
  - [6.4 Kontrollversuch mit computer-auswertbaren Aufgaben](#64-kontrollversuch-mit-computer-auswertbaren-aufgaben)
  - [6.5 Online Daten des Projekts](#65-online-daten-des-projekts)
  - [6.6 Quellen](#66-quellen)
  - [6.7 Selbstständigkeitserklärung](#67-selbstständigkeitserklärung)



# 1. Einleitung
## 1.1 Ausgangslage Problemstellung und Motivation



Heute ist Künstliche Intelligenz, kurz KI, aus unserem Alltag kaum noch wegzudenken. Sie wird genutzt, um Informationen zu sammeln, sich etwas erklären zu lassen oder Arbeiten wie zum Beispiel Programmieren schneller zu erledigen. Ich selbst benutze KI viel zum Lernen und zum Programmieren.

Beim Recherchieren sind Informationen der KI manchmal unvollständig oder sogar falsch. KI kann halluzinieren, Fehler machen oder ungeprüfte Informationen liefern. Sie kann dabei selbstsicher wirken und täuschen. Die KI muss oft darauf hingewiesen werden, dass sie nochmals prüfen soll. Das könnte man automatisieren, indem man eine KI von einer anderen KI prüfen lässt.

Ich habe einen visuellen Workflowbuilder gebaut, mit dem man sich Workflows zusammenstellen kann. Bei Tests konnte ich jedoch keine klare Verbesserung messen. Daher habe ich mich entschlossen, dies als Maturaarbeit zu untersuchen.


## 1.2 Ziel der Arbeit 

Ziel der Arbeit ist es, mit statistischen Methoden zu untersuchen und zu messen, ob KI-Workflows qualitativ bessere Antworten liefern als ein direkter einzelner KI-Aufruf.

Damit ein Workflow als sinnvoller Arbeitsschritt sein kann, soll zusätzlich eine klare relevante Verbesserung und nicht gleichzeitig ähnlich viele neue Fehler erzeugt. Für den Vergleich wird ein zweiseitiger t-Test verwendet, der sowohl Verbesserung als auch Verschlechterung unterscheidet.

Die daraus folgende Forschungsfrage lautet:

Liefern KI-Workflows mit mehreren Bearbeitungsschritten qualitativ bessere, also richtigere und vollständigere Ergebnisse als einzelne KI-Aufrufe?
Deshalb wird zweiseitig getestet: Verbesserungen und Verschlechterungen sollen beide sichtbar werden.

Da keine Verbesserungen gemessen werden konnten, verschiebt sich die Forschungsfrage hin zu einer explorativen Zusatzanalyse. Mit mehr Tests, der Entfernung der KI aus der Auswertung und exakten mathematischen Fragen wird der Test gehärtet. Andererseits wird auch der Frage nachgegangen, was wäre, wenn KI-Workflowschritte tatsächlich keine Verbesserungen bringen.Die Problematik wird in ihre Grundbausteine zerlegt: Kann KI eigene KI-Fehler verbessern? Oder kann KI zwischen zwei KI-Antworten die bessere unterscheiden, etwas, das menschliche Intelligenz leisten könnte?


Folgende Hypothese wird gestellt

Nullhypothese : Es gibt keinen mittleren Qualitätsunterschied zwischen KI-Workflows und einzelnen KI-Aufrufen.

Alternativhypothese: Es gibt einen mittleren Qualitätsunterschied zwischen KI-Workflows und einzelnen KI-Aufrufen.














## 1.3 Meine Erwartungen

Meine Erwartungen sind:


- Je mehr Informationen die KI zuerst beschafft, desto besser, aktueller und vollständiger wird die Antwort.

- Je häufiger die KI die Antwort prüft und überarbeitet, bevor sie die Antwort ausgibt, desto besser und zuverlässiger wird die Antwort.

- Wenn der Prompt zuerst von einer KI verbessert wird, verbessert sich die Antwort.

Ich erwarte eine relevante Verbesserung bei KI-Workflows im Vergleich zu einzelnen KI-Aufrufen. Workflowschritte sollen in Programmen als Arbeitsschritte verwendet werden können.


# 2. Theoretische Grundlagen


## 2.1 Exkurs Statistik Grundlagen
Indikatoren und verschiedene t-Tests sind im **Anhang „Exkurs Statistik Teil 1: Grundlagen und t-Test“**.
Die Berechnungsschritte für den zweiseitigen gepaarten t-Test sind im **Anhang „Exkurs Statistik Teil 2: zweiseitiger gepaarter t-Test – Rechnungsschritte“**.

## 2.2 Exkurs Künstliche Intelligenz
Erklärungen zu KI sind im **Anhang „Exkurs Künstliche Intelligenz“**.







# 3. Versuchsaufbau, Datenerhebung und Auswertung



## 3.1 Ziel der Auswertung

Es werden verschiedene KI-Workflows getestet und mit den Resultaten von einzelnen Prompt-Aufrufen verglichen. Die Qualität der KI-Antworten wird in Metriken gemessen, um sie zu quantifizieren. Um klare Resultate zu bekommen, werden die Metriken isoliert voneinander gemessen. Der Workflow bekommt speziell für eine Metrik gestellte Fragen und die Antwort wird nur nach dieser Metrik bewertet. Das geschieht für jede Metrik mehrmals und auch mit verschiedenen Fragen. Es werden klar formulierte Fragen, unklar formulierte Fragen, menschlich geschriebene Fragen und roboterhaft formulierte Fragen gestellt, um zu sehen, in welchen Situationen die Workflows besser performen und in welchen schlechter.

Die Auswertung vergleicht eine direkte Einzelantwort mit der finalen Antwort eines Workflows. Die zentrale Frage lautet: Ist der Workflow besser?

Dazu werden Antworten paarweise verglichen.


## 3.2 Beschreibung der KI-Workflows
Workflows bestehen aus mehreren KI-Ausführungsschritten, die nacheinander eine Antwort aufbauen. Ein Ausführungsschritt wird normalerweise mit einem Aufruf, also einem Prompt, gestartet. Der Prompt besteht aus einer Frage und einer Systemanweisung. Die Frage beschreibt die Aufgabe, die der Schritt zu lösen hat.

Die Systemanweisung ist eine zusätzliche Anweisung, die für jeden Workflow und jeden Ausführungsschritt vorbereitet wird, um das Resultatformat und die Grundaufgabe, wie zum Beispiel Nachforschen oder Problemlösen, zu definieren.

Zusätzlich bekommt jeder Schritt den Verlauf der vorherigen Prompts mit ihren Antworten. Jeder KI-Schritt darf Internetsuchen ausführen. Tavily wird als Suchmaschine verwendet.

Die einzelnen Schritte können Rückfragen an den Benutzer stellen, die automatisch von einer KI beantwortet werden. Dies wird nur bei der Metrik zur Rückfragefähigkeit verwendet. Die Antworten werden immer im JSON-Format zurückgegeben.
```
{
  antwort:"",         -> finale Textantwort
  suchanfrage:"",     -> optionale Suchanfrage
  rueckfrage:"",      -> optionale Rückfrage
  fertig:"yes"        -> Signal, ob fertig oder Rückfrage 
}
```
Jeder einzelne Schritt kann optional Suchanfragen und Rückfragen stellen. Diese werden gemessen. Wenn etwas im Ablauf nicht richtig funktioniert, wird es als defekt markiert. Die Workflows werden aus diesen Einzelaufrufen aufgebaut.

### 3.2.1 A - Workflows und Einzelaufruf
Für diese Arbeit werden drei einfache Workflows mit dem Einfachaufruf verglichen. Der einfache Aufruf ist kein Workflow, sondern ein Standard-KI-Aufruf, der keine extra Schritte hat. Diese Antwort wird später mit der Workflow-Antwort verglichen, sie bilden ein Paar.

Der Flowmap-Workflow hat drei Verarbeitungsschritte. Er sammelt zuerst mit KI Informationen zusammen, die zum Prompt passen. Das macht er, indem er passend zur Frage Themen findet und im nächsten Schritt zu jedem Thema Informationen aufschreibt. Die Informationen werden dann im letzten Schritt zusammengefasst.

Im Flowreview-Workflow schreibt die KI zuerst eine Antwort. Die Antwort wird dann von der KI nochmals überprüft und verbessert, also reflektiert. Das Reflektieren kann man so oft repetieren lassen, wie man will, bis die Antwort wirklich gegeben wird. Hauptsächlich wird getestet, dass nur einmal reflektiert wird, weil sich die nächsten wohl gleich verhalten werden, wenn die KI die Antwort nicht verbessert. 

Im Prompt-Optimierungs-Workflow wird der Prompt zuerst durch KI umgeschrieben, damit er klarer formuliert ist. Der optimierte Prompt wird dann der KI gegeben, die dann antwortet. Die Idee ist, dass KI qualitativ besser antwortet, wenn man ihr eine klarer formulierte Frage stellt.


Die Bezeichnungen der Workflows sind eigene Arbeitsbegriffe und keine etablierten Fachbegriffe. Flowmap soll wie eine Karte von Informationen zeichnen, Flowreview soll nochmals über die Antwort nachdenken, Prompt-Optimierung soll den Prompt zuerst verbessern.

Die drei Hauptworkflows werden immer gegen `Einzelaufruf` verglichen. Es wird hauptsächlich das Modell GPT-4o benutzt. Für jeden Lauf wird der Vergleichspartner mit gleichem  Modell, Metrik, Frage-ID und Wiederholungslauf ausgeführt und fest mit Id als Paar verbunden.

| Rolle |  Name | Zweck | Schritte |
|---|---|---|---:|
| Vergleichs-Einzelaufruf |  A - Einzelaufruf | Normale Einzelantwort ohne Workflow | 1 |
| Workflow 1 |  B - Flowmap | Erst strukturieren/recherchieren, dann final antworten | 3 |
| Workflow 2 |  C - Flowreview | Erst antworten, dann Antwort prüfen und verbessern | 2 |
| Workflow 3 | D - Prompt-Optimierung | Erst Frage/Prompt verbessern, dann verbesserten Prompt beantworten | 2 |

- **A Einzelaufruf**: Vergleichswert, ein einzelner KI-Aufruf.
- **B-D Workflow**: Mehrere KI-Verarbeitungsschritte. Die Workflows sind B - Flowmap, C - Flowreview oder D - Prompt-Optimierung.






## 3.3 Bewertungsmethoden und Metriken

Es gibt zwei Ebenen für Qualitätsmessungen. Die erste Ebene sind Metriken, also Messwerte beziehungsweise Qualitätsmerkmale, die gemessen werden sollen.
Jede Metrik hat eigene Fragen und wird statistisch separat ausgewertet. Die zweite Ebene, die Scores, ist die Auswertung einzelner Fragen, wie viele Punkte die Antwort bekommt. Zu jeder Frage gibt es vorbereitete Kriterien, die die Antwort erfüllen soll. Die Qualität einer Antwort wird in Prozent gemessen, wie viele Kriterien erfüllt wurden.

Für jeden Workflow-Typ B-D und zu jeder Metrik werden Fragen mit zugehörigen erwarteten Antwort-Checkpoints entworfen. 
Der Score wird in Prozent angegeben, damit die Qualität jeder Antwort miteinander vergleichbar ist.
Jede Kombination aus Workflow-Typ und Metrik wird unabhängig voneinander mit den speziell für diesen Workflow-Typ und diese Metrik entworfenen Fragen ausgeführt, getestet und bewertet. Manchmal können die Fragen gleich sein, aber diese Unterscheidung erlaubt es, Fragesets individuell vorzubereiten und zuzuordnen. 

Wichtig sind Paare: der verglichene Einzelaufruf wird mit gleicher Frage, Recherchemöglichkeit und KI-Modell wie der zu vergleichende Workflow ausgeführt. Dank des paarweisen Vergleichs können die Ergebnisse verschiedener KI-Modelle, Fragesets und Metriken grundsätzlich zusammengenommen werden, weil jedes Paar unter gleichen Bedingungen gelaufen ist.

Jede Frage gehört genau zu einer Metrik. Die Metrik sagt, welche Qualität getestet wird. Die konkrete Bewertung erfolgt über Checkpoints pro Frage.

Bei diesem Modellansatz werden Auswertung und Punktvergabe von einer KI gemacht. Das ist eine mögliche zusätzliche Fehlerquelle, weil ein KI-Richter inkonsistent oder asymmetrisch bewerten kann. Zur Absicherung werden auffällige Fälle markiert und manuell überprüft; zusätzlich dient der computer-auswertbare Kontrollversuch als Vergleich ohne KI-Bewertung.


| Name | Was misst sie? | Beispiel-Frage | Gute Antwort / erwartete Punkte |
|---|---|---|---|
| Richtigkeit | Faktische und sachliche Korrektheit. Rechenfehler, falsche Definitionen oder falsche Aussagen senken den Score. | `Was ist der Unterschied zwischen DNA und RNA?` | DNA speichert Erbinformation, RNA ist meist einzelsträngig und wirkt u. a. bei Proteinbiosynthese; keine erfundenen Fakten. |
| Rückfragefähigkeit | Ob das Modell erkennt, dass Informationen fehlen, und sinnvoll nachfragt oder klar auf Abhängigkeiten hinweist. | `Welches Handy soll gekauft werden?` | Budget, Betriebssystem, Kamera, Grösse, Nutzung usw. werden erfragt oder als entscheidende Kriterien genannt. Hinweis/Andeutung zählt wie direkte Frage. |
| Internet- / Quellenqualität | Ob aktuelle, passende, seriöse und möglichst primäre/offizielle Quellen genannt oder verwendet werden. | `Welche Quellen sollte man nutzen, um aktuelle Impfempfehlungen in der Schweiz zu prüfen?` | BAG/EKIF/offizielle Stellen, Aktualität/Datum, Primärquellen, keine veralteten Behauptungen. |
| Prüfung/Verifikation | Ob die Antwort sichtbar kontrolliert, prüft, plausibilisiert oder Rechenschritte/Regeln verifiziert. | `Berechne 18 Prozent von 250 und erkläre kurz, wie du dein Ergebnis kontrollierst.` | Rechnung 45, Kontrollweg z. B. 10% + 8% oder Plausibilitätsprüfung. |
| Unsicherheit offenlegen | Ob Grenzen, fehlende Daten, Wahrscheinlichkeiten und Unsicherheit klar benannt werden, statt Sicherheit zu erfinden. | `Eine Studie mit 20 Personen findet einen Effekt. Beweist das die Aussage?` | Nein, kleine Stichprobe, Methodik/Replikation nötig, vorsichtige Formulierung. |
| Vollständigkeit gemäss Möglichkeit | Ob die Antwort das sinnvoll mögliche Potenzial ausschöpft, auch wenn die Frage offen formuliert ist. | `Erkläre möglichst umfassend Chancen und Risiken von KI im Schulalltag.` | Mehrere relevante Chancen/Risiken, Beispiele, Abwägung, Grenzen, praktische Hinweise. |
| Vollständigkeit gemäss Frage | Ob alle ausdrücklich verlangten Teile der Frage erfüllt werden. | `Nenne drei Ursachen des Ersten Weltkriegs und erkläre jede Ursache in einem Satz.` | Genau/mindestens drei Ursachen und jede mit Erklärung; kein verlangter Teil fehlt. |
| Klarheit / Verständlichkeit | Ob die Antwort verständlich, adressatengerecht, strukturiert und sprachlich klar ist. | `Erkläre einem Kind, wie ein Regenbogen entsteht.` | Einfache Sprache, klare Schritte, keine unnötigen Fachwörter oder verwirrende Sprünge. |
| Relevanz | Ob die Antwort beim Thema bleibt, keine unnötigen Abweichungen macht und Einschränkungen der Frage beachtet. | `Erkläre nur, warum Bienen für die Bestäubung wichtig sind, ohne allgemein über Honigproduktion zu sprechen.` | Fokus auf Bestäubung; keine lange Honig-, Imkerei- oder Nebenthemen-Antwort. |

### 3.3.1 Beispiel eines Frage-Antwort-Sets

Eine Frage besteht in der klassischen Auswertung aus:

| Bestandteil | Beispiel |
|---|---|
| Metrik | `richtigkeit` |
| Frage | `Was bedeutet Gewaltenteilung in einem Staat?` |
| Checkpoint 1 | Legislative, Exekutive und Judikative werden korrekt unterschieden |
| Checkpoint 2 | Kontrolle und Begrenzung staatlicher Macht wird erklärt |
| Checkpoint 3 | Mindestens ein korrektes Beispiel für eine Gewalt wird genannt |
| Checkpoint 4 | Gewaltenteilung wird nicht als körperliche Gewalt missverstanden |
| Gute Antwort | Erklärt die drei Gewalten, nennt z. B. Parlament/Regierung/Gerichte und sagt, dass Machtmissbrauch verhindert wird. |
| Score-Logik | 4 erfüllte Checkpoints = 100%; 3 erfüllte Checkpoints = 75%; usw. |




## 3.4 Versuch auswerten




## 3.4.1 Daten prüfen, bereinigen

Vor der Analyse werden Daten gefiltert.
Jede Ausführung einer Frage führt zu einem Datensatz mit:
- Metrik
- Workflowtyp
- Frage Nr.
- Wiederholungslauf Nr. 
- Eigene Gruppierung 
- KI-Modell
- verbundener Einzelaufruf zum Paar
- Score
- Vollständig
- Fehler
- REVIEW-Markierung
- Ausschluss-Markierung
- Anz. Internetaufrufe
- Anz. Rückfragen
- kompletter Chat-Verlauf inklusive Auswertung zum manuellen Prüfen

Standardmässig werden nur vollständige Paare ohne technische Fehler gezählt. Optional können mit "Ausschluss" und "REVIEW" markierte Runs ausgeschlossen werden. Es wird verglichen, ob sie einen Unterschied machen. Normalerweise werden sie ausgeschlossen.

Ein KI-Schritt markiert auffällige Läufe, bei denen die Antwort oder der Verlauf nicht verstanden wurde oder nicht exakt den Vorgaben entsprach, mit "REVIEW". Diese müssen manuell überprüft werden, dafür werden sie mit einem Flag "REVIEW" markiert und bei manueller Aussortierung mit einem Flag "Ausschluss" versehen.

Es wurde mit KI-Unterstützung ein Auswertungsprogramm erstellt, um die Statistiken und Grafiken automatisch zu erstellen. Dieses hat einen Auswahlfilter, damit einzelne Läufe oder markierte Gruppen einzeln oder zusammen, mit oder ohne Markierungen wie "REVIEW" oder "Ausschluss", ausgewertet werden können. Dadurch lässt sich schnell prüfen, ob diese einen relevanten Unterschied machen würden. Weil das Auslassen von REVIEW-Paaren die Auswertung verzerren könnte, werden sie markiert und in der Auswertung angezeigt; es gibt auch einen Filter ohne Review, um deren Auswirkung zu vergleichen.



## 3.4.2 Statistik berechnen
Die Berechnungsschritte für den zweiseitigen gepaarten t-Test sind im **Anhang „Exkurs Statistik: zweiseitiger gepaarter t-Test – Rechnungsschritte“**.
Hier werden sie per Computer mit einem Programm berechnet und als Tabellen und mit Grafiken dargestellt. Das Programm dazu wurde mit Hilfe von Codex KI erstellt. 





## 3.4.3 Abklärungsversuch
Ziel ist ein zweiter Referenztest, der genau das Kernproblem zeigen soll, warum es bei jeder Messung im Mittel ähnlich viel Verschlechterung wie Verbesserung gibt (entsprechend der Nullhypothese einer mittleren Differenz von 0). Das gilt zur Kontrolle der Ergebnisse, ob mit weniger KI-Einflüssen das gleiche Resultat erreicht wird. 
Die Auswertung ohne KI wurde eingeführt, nachdem die Messungen zeigen, dass KI-Schritte viele messbare Fehler einführen, in der gleichen Grössenordnung wie die Fortschritte erzeugen.
Fragen und erwartete Antworten sind mathematisch vorberechnet. Es werden vom Computer ohne KI Rechenfragen gestellt, die fehlerfrei generiert werden. Dazu wird ein Tool erstellt, das aus numerischen Rechnungen verbale Textaufgaben erstellt.

Im Anhang ist der Aufbau und das Resultat des Kontrollversuchs **Anhang „ Kontrollversuch mit computer-auswertbaren Aufgaben“**.


# 3.5 Statistische Auswertung der Ergebnisse

## 3.5.1 Messresultate

**Tabelle 3.1: Teststatistiken für KI-Workflows vs. einfache KI-Aufrufe über alle Runs**

![Kurze Ergebnistabelle](ALL/tables/00_overview/short_results_table.svg)

  *Hier werden die Resultate aller Workflows und Testläufe zusammengefasst. Für jede Metrik gibt es eine separate Auswertung.*

- **n**: Stichprobengrösse (Anzahl Antwortpaare)
- **Mittel Single**: Mittelwert der einzelnen KI-Aufrufe
- **Mittel Workflow**: Mittelwert der Punkte der Workflows
- **Diff.**: Differenz zwischen Mittel Einzelaufruf und Mittel Workflow
- Der Wert "!0.0001" heisst kleiner als 0.0001

Die verschiedenen Stichprobenläufe nach Workflow-Typ, Metrik, KI Modell und sogar nach Anpassungen wie Härtung der Auswertung oder Prompts wurden einzeln betrachtet und zeigen immer wieder dasselbe Muster wie das Gesamtergebnis. Es zeigen sich keine signifikante Veränderung in positiver Richtung, also keine der erhofften Verbesserungen, wie sie für einen sinnvollen Arbeitsschritt erwartet würden. 
Dank der automatischen Statistikauswertung konnten diese Auswertungen einfach erstellt und verglichen werden. Deshalb wird hier vor allem die Gesamtstatistik gezeigt, die stellvertretend für die Ergebnisse der einzelnen Runs steht. 

Der gemeinsame Vergleich ist möglich, weil jeweils paarweise gemessen wird: Workflow-Antwort gegen direkten Aufruf, gleiche Frage, gleiche Bedingungen und eine Differenz pro Paar
Einzelne Berichte mit Tabellen und Diagrammen für die verschiedenen Metriken und Workflows sind auf diesem GitHub-Link zu finden: https://danielrehman.github.io/Maturaarbeit_Daniel_Rehman/reports/sites/

Erwartet wird ein klares, grosses und wachsendes Signal über die meisten Metriken hinweg. Wenn der Workflow tatsächlich eine relevante Fähigkeit abbildet, müsste sich diese über alle Masse hinweg sichtbar zeigen.  



Diese Tabelle gibt eine Übersicht der Resultate aller Workflows und Testläufe zusammengefasst. Sie vergleicht den Mittelwert der Scores direkter KI-Aufrufe mit dem Mittelwert der Scores aller Workflows zusammen. Die Differenz zeigt, welcher Ansatz besser abschneidet. Der p-Wert sollte unter 0.05 sein, damit die mittlere Differenz signifikant ist.

**Die Workflows zeigen weder im Gesamtmittel noch in den einzelnen Metriken eine relevante Verbesserung.**
Im zweiseitigen Test zeigt die Statistik insgesamt keine signifikante Veränderung in positiver Richtung, also keine signifikante Verbesserung. Eine scheinbare Verbesserung zeigt sich nur bei der Rückfragefähigkeit, diese ist jedoch methodisch schwer zu bewerten. Insgesamt ergeben die Messungen keine belastbaren Verbesserungen und teilweise sogar Verschlechterungen.

Es wurden viele Testläufe durchgeführt, die immer das gleiche Gesamtbild zeigen. Manchmal gibt es kleine signifikante Verbesserungen, dann wieder Verschlechterungen. Das erwartete klare Signal einer wachsenden Verbesserung, die durch die zusätzlichen Fähigkeiten entstehen müsste, bleibt aus. Daher wird hier die Gesamtauswertung aller Läufe gezeigt. Auch wenn einzelne Läufe unter leicht anderen Bedingungen ausgeführt wurden, zeigen sie dennoch dasselbe Gesamtbild.

Die Standardabweichung der Paardifferenzen ist in allen Metriken hoch, wie die Spalte SD Diff. zeigt. Im Vergleich zu den mittleren Differenzen sind diese Werte deutlich grösser. Das bedeutet, dass die Unterschiede zwischen Workflow und direktem Aufruf je nach Testfall stark schwanken.
Bei manchen Testfällen hilft der Workflow, bei anderen schadet er. Im Mittel bleibt dann wenig übrig.

**Tabelle 3.2: Ausführliche Statistiktabelle für KI-Workflows vs. einfache KI-Aufrufe über alle Runs, mit Details**

<p align="center">
  <img src="ALL/tables/00_overview/full_results_table.svg" style="width: 95%;">
</p>
 

  *Hier werden die Resultate aller Workflows und Testläufe zusammengefasst. Für jede Metrik gibt es eine separate Auswertung.*

- **n**: Stichprobengrösse
- **Mittel Single**: Mittelwert der einzelnen KI-Aufrufe
- **Mittel Workflow**: Mittelwert der Punkte der Workflows
- **Diff.**: Differenz zwischen Mittel Single und Mittel Workflow
- **SD Diff.**: Standardabweichung der Paardifferenzen.
- **95% KI**: 95-Prozent-Konfidenzintervall 
- **Cohen dz**: Relevanz, standardisierte Effektgrösse
- Der Wert "!0.0001" heisst kleiner als 0.0001


**Abbildung 3.3: Mittelwerte Direkter Aufruf vs. Workflow**

![Mittelwert Direkter Aufruf vs Workflow](ALL/images/00_overview/chart_mean_direkter_aufruf_vs_workflow.svg)

*Visualisierung der Daten der Auswertungstabelle* 

- **X-Achse**: Metriken  
- **Y-Achse**: Durchschnittliche Punktzahl in Prozent der maximal erreichbaren Punkte.

Der Vergleich zwischen den Mittelwerten von allen Workflows zusammen und den einzelnen Aufrufen. Es ist zu sehen, dass beide durchschnittlich ähnliche Punktzahlen haben. 


**Abbildung 3.4: Mittlere Differenz nach Metrik**

![Mittlere Differenz nach Metriken](ALL/images/00_overview/chart_mean_difference_by_criterion.svg)

Die grünen Balken zeigen an, in welchen Metriken die Workflows besser abgeschnitten haben, und die roten Balken zeigen, in welchen Metriken der direkte KI-Aufruf besser abgeschnitten hat.
Hier sieht man eine deutliche Verbesserung in der Rückfragefähigkeit, aber bei den meisten Metriken ist kaum eine Verbesserung zu sehen.




**Abbildung 3.5: Paarweise Differenzen (Auszug)**

<p align="center">
  <img src="ALL/images/01_richtigkeit/chart_paired_differences_part_001.svg" width="40%">
  <img src="ALL/images/01_richtigkeit/chart_paired_differences_part_002.svg" width="40%">
  <img src="ALL/images/01_richtigkeit/chart_paired_differences_part_003.svg" width="40%">
  <img src="ALL/images/01_richtigkeit/chart_paired_differences_part_004.svg" width="40%">
  <img src="ALL/images/01_richtigkeit/chart_paired_differences_part_005.svg" width="40%">
  <img src="ALL/images/01_richtigkeit/chart_paired_differences_part_006.svg" width="40%">
   <img src="ALL/images/01_richtigkeit/chart_paired_differences_part_007.svg" width="40%">
    <img src="ALL/images/01_richtigkeit/chart_paired_differences_part_008.svg" width="40%">
    <img src="ALL/images/01_richtigkeit/chart_paired_differences_part_009.svg" width="40%">
 
</p>

Hier sieht man auf einen Blick die Auswertung jeder Frage von allen Workflows zusammen, für eine Metrik Richtigkeit. Die X-Achse geht durch die einzelnen Fragen und die Y-Achse zeigt die paarweise Differenz der Punktzahlen der Antworten von Einzelaufruf und dem Workflow. 
Hier sieht man auf einen Blick die Verteilung und bemerkt Auffälligkeiten wie Anhäufungen, Ausreisser oder die Verteilung.
Hier zeigen sich viele Verbesserungen, aber in der Gesamtstatistik gibt es mehr negative Werte. Eventuell sind von verschiedenen Testläufen leicht verschiedene Anhäufungen durch die Korrekturen des Prompts sichtbar.

**Abbildung 3.6: Verteilung der Paardifferenzen**
![Verteilung der Paardifferenzen](ALL/images/01_richtigkeit/chart_difference_distribution.svg)

Der graue Balken zeigt, wo keine Veränderung war. Man sieht starke Verbesserungen im grünen Bereich, aber ähnlich viele Verschlechterungen gleichen sie aus. In der nächsten gefilterten Auswertung, in der nur Fragen mit Verbesserungspotential berücksichtigt wurden, sieht man, dass die KI tatsächlich schlechte Antworten verbessert. Daraus kann man lesen: Die KI kann Antworten verbessern, macht aber ähnlich viele Fehler. 

**Tabelle 3.7: Verbesserung schlechter Antworten, gefiltertes Resultat ohne Ceiling**
![Kurze Ergebnistabelle](75/tables/00_overview/short_results_table.svg)

**Abbildung 3.8: Verbesserung schlechter Antworten, gefiltertes Resultat ohne Ceiling**

![Mittelwert Direkter Aufruf vs Workflow](75/images/00_overview/chart_mean_direkter_aufruf_vs_workflow.svg)

*Alle Workflow-Typen, gefiltert max 75% Score links*

**Abbildung 3.9: Verbesserung schlechter Antworten, gefiltertes Resultat ohne Ceiling**

![Verteilung der Paardifferenzen](75/images/01_richtigkeit/chart_difference_distribution.svg)
*Alle Workflow-Typen, gefiltert max 75% Score links*

Als explorative Zusazanalyse wird diese Auswerung Betrachtet die nur eine gefilterte Teilmenge der Daten, wo Ceiling-Effekte weniger Rolle spielen. 
Betrachtet man nur Paare mit Verbesserungspotenzial, das heisst, nur Paare mit maximal 75% Score beim einzelnen Aufruf, zeigt sich eine signifikante Verbesserung, wenn nur Fragen beachtet werden, die Verbesserungspotenzial hatten. 
Das deutet darauf hin, dass der Workflow arbeitet und funktioniert, er verbessert schlechte Antworten, und hat die Möglichkeit seine Fähigkeit einzusetzen. Trotzdem zeigt sich diese Fähigkeit nicht als Peak im Gesamtresultat aller Daten.





 
**Abbildung 3.10: Scatterdiagramm**
![Scorevergleich Direkter Aufruf vs Workflow](ALL/images/01_richtigkeit/chart_direkter_aufruf_vs_workflow_scatter.svg)


Die Punkte vergleichen die Qualität der Antwort des Workflows und des Einzelaufrufs. Punkte über der Diagonalen sind Verbesserungen, Punkte unter der Diagonalen sind Verschlechterungen.

In diesem Scatterdiagramm ist erkennbar, dass viele Verschlechterungen im Ceiling-Bereich des einzelnen Aufrufs sind. Sie sind rechts aussen, wo die Antwort kaum verbessert werden kann. Bei den tieferen Werten links ist der Workflow besser. Die meisten Daten sind aber im rechten Ceiling-Bereich.

## 3.5.2 Ceiling-Effekte und Verbesserungspotenzial

**Abbildung 3.11: Ceiling-Effekt-Chart**
![Verteilung der Scores des einzelnen Aufrufs](ALL/images/01_richtigkeit/chart_scoreverteilung_direkter_aufruf.svg)

**Ceiling-Effekt-Chart am Beispiel der Metrik Richtigkeit**

![Verbesserungspotenzial im Einzelprompt](ALL/images/00_overview/chart_ceiling_effect_by_criterion.svg)

**Ceiling-Effekt-Chart aller Metriken für alle Workflows**

In den Ceiling-Effekt-Charts zeigt sich, dass ein grosser Anteil der Fragen schon bei der maximalen Punktzahl ist. Dadurch hat der Workflow kaum Chancen, schlechte Antworten zu verbessern, und kann nur gute Antworten verschlechtern.




## 3.5.3 Abklärungs-Testlauf

Um die Resultate der Tests, insbesondere das Ausbleiben eines erwarteten Verbesserungssignals, weiter zu untersuchen, wurde ein Testlauf konstruiert.

Er misst die Teilaspekte Selbstkorrektur und das Nichtverschlechtern guter Antworten.

Er minimiert die Störquellen, indem er exakte mathematische Aufgaben und Fragen verwendet, die KI in einem vom Computer direkt auswertbaren Format beantwortet und die automatisch ausgewertet werden. d1, d2 und d3 bezeichnen die Schwierigkeitsgrade der Fragen, von leicht bis schwer. Die Schwierigkeit ergibt sich aus der Anzahl der Regeln.
PICK bezeichnet eine Variante mit einem zusätzlichen Schritt zur Auswahl der besseren Antwort. Dieser Schritt wurde als Versuch eingeführt, Verschlechterungen zu unterdrücken.


**Tabelle 3.12: Statistik des Abklärungsversuchs **

| Schwierigkeit | Variante | N | Direct Score | Workflow Score | mittlere Diff | t | p | sign. | besser | schlechter | gleich |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| d1 | mit PICK | 160 | 89.3% | 89.3% | +0.0% | 0.021 | 0.9829 | nein | 16 | 12 | 132 |
| d1 | ohne PICK | 160 | 89.3% | 88.3% | -1.0% | -1.281 | 0.2021 | nein | 13 | 17 | 130 |
| d2 | mit PICK | 160 | 76.5% | 76.4% | -0.1% | -0.079 | 0.9369 | nein | 12 | 11 | 137 |
| d2 | ohne PICK | 160 | 76.5% | 75.3% | -1.2% | -1.188 | 0.2367 | nein | 11 | 15 | 134 |
| d3 | mit PICK | 160 | 72.2% | 72.7% | +0.5% | 1.282 | 0.2016 | nein | 5 | 3 | 152 |
| d3 | ohne PICK | 160 | 72.2% | 72.2% | +0.0% | 0.038 | 0.9698 | nein | 11 | 9 | 140 |

![Paar-Outcomes nach Schwierigkeit](images/pair_outcomes_by_difficulty.svg)

Hier zeigt sich dasselbe Muster wie im Haupttest. Bei beiden Varianten ist p > 0,05; damit wird H0 nicht verworfen. Der beobachtete Unterschied ist klein und statistisch nicht signifikant.

Die KI verschlechtert Antworten etwa gleich oft, wie sie sie verbessert. Es scheint daher, dass eine KI die Antwort einer anderen KI ohne zusätzliche Informationen nicht zuverlässig verbessern kann, insbesondere wenn es darum geht, Fehler wie Halluzinationen zu erkennen.




# 4. Diskussion

## 4.1 Interpretation der Resultate

Über alle Metriken hinweg zeigt der zweiseitige gepaarte t-Test keine  signifikante Veränderung in positiver Richtung, also keine signifikante Verbesserung des Workflows gegenüber dem Einzelaufruf der KI. Auf Basis der vorliegenden Stichprobe lässt sich somit nicht nachweisen, dass der Workflow die Qualität der Antworten verbessert. 
Bei der Metrik Rückfragefähigkeit zeigte sich zwar eine signifikante Verbesserung, das alleine war aber nicht das Ziel, ausserdem ist diese Metrik besonders heikel, weil viele markierte Paare ausgeschlossen wurden und der Workflow durch mehrere Schritte mehr Chancen zum Rückfragen haben kann.
Auch ein gehärteter Test ohne KI-Auswertung, gezielt für die Problemstellen wie Selbstkorrektur und optimiert, um Verbesserungen zu forcieren, zeigt analoge Resultate: Es gibt keine Verbesserung. 

Dies ist höchst unerwartet, weil ein klares Signal zu erwarten gewesen wäre. Die KI verfügt über bekannte Fähigkeiten und hatte in den Testläufen trotz starker Ceiling-Effekte Gelegenheit, Antworten zu verbessern und diese Fähigkeiten auszuführen. Daher wäre ein klares und unmittelbar sichtbares Signal zu erwarten gewesen. Wenn es Gelegenheit zur Verbesserung gibt, sollte die KI bei jedem Aufruf einen positiven Beitrag leisten.

Es zeigen sich drei wichtige Punkte. Erstens ist keine relevante Verbesserung sichtbar. Das Ergebnis deutet darauf hin, dass mehrere KI-Schritte das Resultat in diesem Aufbau nicht verbessern. Es konnte keine Verbesserung nachgewiesen werden, obwohl sie zu erwarten wäre.
Zweitens werden schlechte Antworten verbessert. Das zeigt sich in der Auswertung ohne Ceiling-Anteil deutlich. Die KI erfüllt hier ihre Aufgabe.
Drittens werden gute Antworten oft verschlechtert, wodurch der Vorteil wieder ausgeglichen wird. Das zeigt sich im Mittelwert, der sich kaum verändert. Während die KI also schlechte Antworten verbessert, entstehen in ähnlichem Mass Verschlechterungen bei guten Antworten. Der Mittelwert zeigt deshalb keine Verbesserung. Es werden also an anderen Stellen Fehler erzeugt, etwa im gleichen Mass wie Nutzen entsteht.

## 4.2 Grenzen der Untersuchung

Der Workflow kann die Antwort aus mehreren Gründen verschlechtern. Ein wichtiger Punkt ist, dass sich Fehler mit jedem weiteren KI-Schritt verstärken können. Wenn ein Schritt eine falsche Annahme trifft oder ein Missverständnis entsteht, kann dieses in den folgenden Schritten weiter übernommen und verstärkt werden. Zusätzlich können die vorgegebenen Arbeitsschritte den Lösungsraum einschränken. Der Workflow zwingt die KI dann in eine bestimmte Struktur, obwohl ein direkter Aufruf die Aufgabe einfacher lösen könnte. Auch die höhere Komplexität des Workflows kann zu Verwirrung führen.

Ein weiterer wichtiger Punkt sind Ceiling-Effekte. Wenn die Antwort des einzelnen KI-Aufrufs bereits sehr gut ist, kann der Workflow kaum noch etwas verbessern, sondern hauptsächlich verschlechtern. Schon wenige zusätzliche Fehler durch weitere KI-Schritte können die positiven Effekte verkleinern und dadurch schwer messbar machen.

Auch das Testsystem selbst kann Limitationen aufweisen. Wenige Daten können dazu führen, dass Unterschiede im Mittelwert nicht signifikant werden. Zudem können Fehler in der Auswertung durch die Bewertungs-KI entstehen. Auch die Qualität der Frage-Antwort-Sets beeinflusst das Resultat. Schlechte oder unklare Testfälle können dazu führen, dass der gemessene Effekt nicht eindeutig auf den Workflow zurückgeführt werden kann.

Die Untersuchung ist durch die begrenzte Anzahl an Testläufen, mögliche Bias in der KI-basierten Bewertung, Ceiling-Effekte und den spezifischen Testaufbau eingeschränkt. Modellversionen, Reihenfolge der Läufe und die genaue Auswahl der Fragesets können das Ergebnis zusätzlich beeinflussen. Die eigene Untersuchung weist zudem darauf hin, dass sich durch KI-basierte Schritte wie Evaluation unerwartet viele Fehler einschleichen können.

Dennoch wird eine Fähigkeit gemessen. Ausser durch die Limitierung der Anzahl Tests in der Stichprobe sollte sich das Signal der KI-Fähigkeit sehr schnell gegenüber dem Rauschen durchsetzen.

## 4.3 Bedeutung für KI-Workflows

Die Erkenntnis ist, dass Workflows schwieriger zu bauen sind als erwartet.
Um KI-Workflows zu erstellen, müssen die Schritte wie Anweisungen zusammengesetzt werden. Ziel ist es, eine Aufgabe zu erledigen. Ein Arbeitsschritt, der zwar die Aufgabe erledigt, aber gleichzeitig genauso grosse Fehler als Nebenwirkung einführt, kann nicht verwendet werden. 
Keine Verbesserung im Mittel scheint harmlos, aber so viele Fehler zu erzeugen wie Nutzen, ist ein Problem. 
Heute werden viele Agenten und Workflows in Software eingebaut. Dass einzelne Schritte Fehler erzeugen können, ist bekannt, aber dass sie in dem Mass Fehler erzeugen wie ihre Aufgabe Nutzen erzeugt, ist nicht ausreichend bewusst.
In der Recherche wurden sogar wissenschaftliche Arbeiten dazu gefunden.
Huang et al. zeigen in "Large Language Models Cannot Self-Correct Reasoning Yet", dass LLMs ohne externes Feedback eigene Fehler oft nicht zuverlässig korrigieren und sich sogar verschlechtern können.
Kamoi et al. fassen in "When Can LLMs Actually Correct Their Own Mistakes?" zusammen, dass Selbstkorrektur vor allem mit zuverlässigem externem Feedback funktioniert. Reine LLM-Selbstbewertung ist schwach belegt.
Shinn et al. zeigen in "Reflexion", dass Verbesserung durch Feedback aus Aufgabenresultaten oder Umgebung entsteht, nicht bloss durch "denk nochmal".
Im Wesentlichen wird argumentiert, dass KI neue Signale wie weitere Informationen oder Regeln benötigen. Mit genau derselben Information wie vorher können sie wenig anfangen.
Doch in der Softwareentwicklung kennt man eine solche Limitierung nicht.
Nicht einmal Chat-Gpt selber weiss dass es bei den Workflows solche Probleme gibt. Das untere Bild wurde von Chat-GPT generiert und beschreibt dass er auch erwartet hat dass eine KI die Antwort der KI meistens verbessert.

![Verteilung der Paardifferenzen](gpterwartung.png)


Quellen: (1,2,3)




# 5. Fazit
Es hat sich eine neue Forschungsfrage ergeben: Kann eine KI die Antwort der KI verbessern? 
Es konnte nicht gezeigt werden, dass naive Workflows qualitativ bessere Antworten liefern als Einzelaufrufe. Es kommt der Verdacht auf, dass eine KI unter gewissen Bedingungen die Antwort einer anderen KI nicht verbessern kann. Die Workflows haben so viele Verbesserungen wie Verschlechterungen gebracht. Diese Erkenntnis ist wichtig für Informatiker, die KI-Lösungen in ihre Software einbauen, weil man durch einen solchen Workflow eine Aufgabe zwar lösen kann, aber gleichzeitig im Verborgenen Fehler einbaut, die nur bemerkt werden, wenn viele Testläufe durchlaufen werden.
Dies führt zur wichtigen Erkenntnis, dass der Bau von Workflows schwierig und anfällig ist. Ein naiver Workflow bringt keinen Vorteil, er baut sogar versteckte Fehler ein, wo man es nicht sieht. 

## 5.1 Ausblick  
Die überraschende Schwierigkeit, einen Workflow zu erstellen, zeigt, dass sich hier eine Regel finden lassen müsste. Können KIs unter bestimmten Bedingungen ihre Antworten gar nicht verbessern? 

Für KI-Softwareentwickler, die KI-Verarbeitungsschritte in ihre Softwarelösungen einbauen, ist diese Erkenntnis von Bedeutung. Der Entwickler löst ein Problem mit KI und merkt nicht, dass seine KI-Lösung gleichzeitig genauso viel Schaden im Versteckten verursachen kann. Man müsste Regeln und Messbarkeit für dieses Phänomen herausfinden. 

**Verteilung der Paardifferenzen**

![Verteilung der Paardifferenzen](ALL/images/02_rueckfragefaehigkeit/chart_difference_distribution.svg)

Das Diagramm zeigt vereinfacht, dass die Workflows so viel verbessert haben, wie sie wieder verschlechtert haben.


## 5.2 kritische Reflexion

Es gab sicher methodische Schwachpunkte in der Untersuchung, der stärkste ist wahrscheinlich, dass KI eine KI bewertet.
Manche Metriken sind subjektiv und abhängig voneinander, das spielt hier keine grosse Rolle, da wir ja keine positiven Ergebnisse zum Vergleichen haben. Für diesen Versuch sind es einfach weitere Testsets mit anderen Aufgabenstellungen.
Der Workflow und die Bewertung basieren auf demselben Technologieprinzip, es bewertet zwar eine stärkere KI, dennoch ist das ein unbekannter starker Bias, aber auch ein Kontrollversuch ganz ohne KI-Auswertung zeigte in einer kleinen Stichprobe dasselbe Verhalten.
Am wenigsten traue ich meinen von AI generierten Fragen.

Ich habe alles Mögliche versucht, meine Tests zu verbessern, weil ich nicht glauben kann, dass es schwer sein sollte, Verbesserungen durch eine KI zu messen.
Eigentlich vertraut man dem eigenen Testsystem und der kleinen Stichprobe nicht. 
Aber gerade weil ich an die Fähigkeiten der KI glaube, glaube ich, dass ich es auch mit kleiner Stichprobe oder manuell sofort zeigen können sollte, kam mir der Gedanke. Ich beschäftige mich noch mit: Was wäre, wenn die KI selbst eine Limitierung hätte, sie kann vielleicht eigene Antworten nicht mehr als richtig oder falsch unterscheiden. Was würde ich dann aus der Statistik lesen, oder was würde es für die Informatik bedeuten?

# 6. Anhänge









# 6.1 Exkurs Künstliche Intelligenz

Künstliche Intelligenz, kurz KI, heisst auf Englisch Artificial Intelligence, kurz AI. In dieser Arbeit wird danach einheitlich KI verwendet. Damit sind Programme gemeint, die Aufgaben lösen können, für die normalerweise menschliche Intelligenz benötigt wird. Sie können Informationen verarbeiten, Texte schreiben, Fragen beantworten oder bei Recherchen helfen. Manche KI-Systeme sind auf Textaufgaben spezialisiert, andere können mit Bildern, Audio oder Videos arbeiten.



## 6.1.1 Prompts: Wie arbeitet man mit KI?

In der Praxis wird eine Anfrage an die KI in Form eines Textes verfasst; dieser heisst Prompt.

Ein Prompt besteht aus mehreren Teilen:

- Aufgabe oder Frage
- Systemanweisungen, die auch in natürlicher Sprache verfasst werden:
  - Kontext wie zusätzliche Informationen und das Thema
  - Anweisung zum erwarteten Format, Stil etc.
  - Beispiele helfen der KI oft besonders stark
- Gesprächsverlauf: bisherige Anfragen und Antworten




## 6.1.2 Einzelner Aufruf vs. KI-Workflow vs. KI-Agent

Ein einzelner Prompt ist ein einzelner Aufruf. Die KI muss das Problem inklusive mehrerer Anweisungen, zum Beispiel Prüfanweisungen, in einem Schritt verarbeiten. Oft wird im Hintergrund aber bereits ein Workflow eingesetzt, um Tools wie zum Beispiel Internetsuche oder Prüfungen auf Legalität etc. durchzuführen.

Beispiel eines Prompts:

```text
AUFGABE:
  Erkläre kurz, was ein Prompt ist.
KONTEXT:
  Die Zielgruppe sind Anfänger.
STIL:
  Einfach, sachlich und kurz.
FORMAT:
  Antworte in 3 Stichpunkten.

VERLAUF_HISTORY:
  Nutzer fragte: Darf ich dich was fragen?
  KI antwortete: Ja, nur zu.
  
```

Ein Workflow oder eine Pipeline besteht aus mehreren Prompt-Aufrufen als festgelegten Arbeitsschritten, zum Beispiel Suchen, Berechnen und Prüfen.

Ein Agent entscheidet dynamisch über die nächsten Schritte, zum Beispiel, ob eine Internetsuche, ein Tool oder weitere KI-Aufrufe nötig sind.



## 6.1.3 Probleme der KI

Welche rein qualitativen Probleme können neben ethischen und rechtlichen Problemen auftreten?

- Rechen- und Logikfehler: KI kann falsch rechnen oder falsch schlussfolgern.
- Halluzination: Eine KI kann halluzinieren, d. h. sie kann falsche Informationen erfinden.
- Qualität vortäuschen: Die KI klingt sicher und behauptet Dinge, ohne geprüft oder recherchiert zu haben. Sie gibt nicht an, dass die Information unsicher oder nicht aktuell ist.
- Unvollständigkeit: Die KI lässt wichtige Punkte oder Teile der Aufgabe aus oder erwähnt wichtige zusätzliche Punkte wie Aktualität etc. nicht.
- Veraltete Informationen: KI kann alte oder nicht mehr gültige Informationen geben.
- Missverständnisse: KI kann Anweisungen oder Details falsch verstehen.
- Kontextfehler: Der Speicher des Kontextfensters wird überschritten oder öfter zusammengefasst. Dadurch können Informationen verloren gehen.





## 6.1.4 Erwartete Schwierigkeiten bei der Messung

Erwartete Schwierigkeiten bei der Messung sind Ceiling-Effekte, Bewertungsrauschen und Evaluator-Bias.

Ein Ceiling-Effekt entsteht, wenn eine starke KI bereits sehr gute Antworten liefert. Dann gibt es nur noch wenig Verbesserungspotenzial, und Unterschiede zwischen einem einzelnen KI-Aufruf und einem KI-Workflow sind schwer messbar.

Bewertungsrauschen kann entstehen, weil die KI bei der Auswertung nicht immer exakt gleich bewertet. Deshalb sind mehrere Läufe und Bewertungswiederholungen nötig, um zufällige Schwankungen besser einschätzen zu können.

Weiteres Rauschen entsteht durch unterschiedliche Antworten auf dieselbe Frage, durch die Qualität der vorbereiteten Fragen und Antwortkriterien sowie durch Unterschiede in den KI-Auswertungen. Deshalb werden vorbereitete Fragen, Antwortkriterien, mehrere Runs und paarweise Vergleiche verwendet.

Grenzfälle und einzelne auffällige Resultate werden zusätzlich manuell geprüft.



# 6.2 Exkurs Statistik Teil 1: Grundlagen und t-Test

## 6.2.1 Statistische Grundlagen und t-Test
Das Ziel der Statistik in dieser Arbeit ist es, herauszufinden, ob sich die Antworten von meinen KI-Workflows statistisch signifikant von den Antworten der einzelnen Prompt-Aufrufe unterscheiden.

 


Ein statistischer Signifikanz- oder Hypothesentest hilft dabei zu beurteilen, ob die gefundenen Unterschiede statistisch signifikant sind.
1. Daten erfassen: eine Stichprobe, das sind die Messergebnisse
2. Man formuliert zwei Hypothesen.  
   1. Nullhypothese: Die Antworten der Workflows sind im Durchschnitt gleich gut wie die der einzelnen Aufrufe.
   2. Alternativhypothese: Die Antworten der Workflows sind im Durchschnitt besser oder schlechter als die der einzelnen Aufrufe.



3. Signifikanzniveau (Alpha-Wert α) festlegen auf 5%
   Das Signifikanzniveau sagt, wie klein der p-Wert sein muss, damit ein Ergebnis als statistisch signifikant gilt.
   Wenn p ≤ α (hier 0,05), wird die Nullhypothese verworfen.

Der p-Wert beschreibt, falls die Nullhypothese stimmen würde, wie wahrscheinlich ein mindestens so extremes Ergebnis wäre. Der Alpha-Wert beschreibt, wie hoch das vorher festgelegte Risiko eines Alpha-Fehlers sein darf: das fälschliche Ablehnen der Nullhypothese. Je kleiner der p-Wert, desto stärker spricht das Ergebnis gegen die Nullhypothese.
 
4. Entscheiden: Nullhypothese verwerfen oder nicht verwerfen  

Der gepaarte t-Test vergleicht Mittelwerte von zwei verbundenen Messungen als Differenzen.


## 6.2.2 Statistische Hypothese

Bei den KI-Workflows werden höhere Punktzahlen als beim einzelnen Prompt-Aufruf erwartet. Getestet wird aber zweiseitig, ob die mittlere Differenz von 0 abweicht. Zusätzlich wird eine starke relevante Verbesserung und eine tiefe relative Fehlerrate erwartet.


$d_i$: Differenz zwischen einer Workflowantwort und einer Direktantwort.

$\mu_d$: Durchschnittliche Differenz der Scores.

$$
d_i = S_{\mathrm{Workflow},i} - S_{\mathrm{Direkt},i}
$$

Nullhypothese:

$$
H_0: \mu_d = 0
$$

Alternativhypothese:

$$
H_1: \mu_d \ne 0
$$


Für jede Metrik wird eine eigene Nullhypothese und eine analoge Alternativhypothese erstellt. Statistisch geprüft wird, ob die mittlere Differenz von 0 abweicht.

Obwohl eine Verbesserung erwartet wird, wird zweiseitig getestet, damit auch Verschlechterungen statistisch sichtbar werden.



 
## 6.2.3 Standardabweichung
Die Standardabweichung beschreibt, wie stark sich die Werte um den Mittelwert streuen. Wenn die Standardabweichung klein ist, sind die meisten Werte nahe dem Mittelwert. Wenn die Standardabweichung gross ist, sind die Werte weiter vom Mittelwert verstreut. Damit zeigt sich, wie nahe die $d_i$ Werte am Mittelwert $\bar{d}$ sind und ob der Mittelwert als Beschreibung ausreicht.


$$
\sigma = \sqrt{\frac{1}{n} \sum_{i=1}^{n} (d_i - \bar{d})^2}
\qquad
s_d = \sqrt{\frac{\sum_{i=1}^{n}(d_i - \bar{d})^2}{n-1}}
$$

Statt der Standardabweichung $\sigma$ wird die
Stichprobenstandardabweichung $s_d$ (für Stichproben verwendet man diese mit n-1 Freiheitsgraden)



$s_d$ : Stichprobenstandardabweichung 

$n$ : Grösse der Stichprobe.

$d_i$ : Punktedifferenz zwischen einem Antwortpaar.

$\bar{d}$ : Durchschnitt aller Qualitätsunterschiede.

Wenn $s_d$ hoch ist, sind die Unterschiede zwischen den Antwortpaaren sehr unterschiedlich.

Wenn $s_d$ tief ist, sind die Unterschiede zwischen den Antwortpaaren sehr ähnlich.

## 6.2.4 Standardfehler
Bei einer Stichprobe beschreibt der Standardfehler, wie weit der Mittelwert durchschnittlich verschoben sein kann.
 
$$
SE = \frac{s_d}{\sqrt{n}}
$$

Wenn $SE$ klein ist, ist der Mittelwert der Stichprobe ziemlich zuverlässig.

Wenn $SE$ gross ist, kann der Mittelwert schwanken und ist weniger zuverlässig.
## 6.2.5 t-Test
Der t-Wert beschreibt die Distanz zwischen dem Durchschnitt und dem Nullhypothese-Punkt, in Einheiten der breite des Standardfehlers. (Weit oder nahe in relation zur Verteilungskurve)
$$
t = \frac{\bar{d}}{SE}
$$

![Kurze Ergebnistabelle](t_verteilung_einseitig.svg)

![Kurze Ergebnistabelle](t_verteilung_zweiseitig.svg)


An diesen Grafiken erkennt man die Werte der t-Verteilung im einseitigen und im zweiseitigen t-Test. Die x-Achse zeigt t-Werte, also Messwerte in Einheiten des Standardfehlers. Die y-Achse zeigt die Dichte der t-Verteilung unter der Nullhypothese.

Das Signifikanzniveau ist der Schwellenwert für den p-Wert, ab dem eine Messung signifikant ist, also die Nullhypothese abgelehnt wird. Typisch nimmt man den Schwellenwert 0.05, unter dem der p-Wert liegen sollte.

Mit dem t-Test wird geprüft, ob die mittlere Differenz statistisch signifikant ist oder nur zufälligerweise so aussieht, also unter der Nullhypothese zu erwarten wäre. 


Welche verschiedenen T-Tests gibt es und welche werden in der Arbeit verwendet?

### 6.2.5.1 Einstichproben-T-Test
Hier wird der Mittelwert einer Stichprobe mithilfe seines Standardfehlers, welcher mit der Standardabweichung berechnet wird, mit einem fixen Wert verglichen. Zum Beispiel nimmt man in einer Stichprobe von Schuhgrössen den Mittelwert und vergleicht ihn mit Hilfe seines Standardfehlers mit der durchschnittlichen Schuhgrösse aus Wikipedia.

Dieser Test ist für diese Arbeit unpassend, weil kein fixer Antwort-Qualitätswert der benützten KI vorhanden ist, mit dem verglichen werden kann. Es gibt nur mehrere Stichproben, die miteinander verglichen werden können.

### 6.2.5.2 Zweistichproben-T-Test
Im Zweistichproben-T-Test werden die Mittelwerte zweier Stichproben mithilfe der Standardfehler miteinander verglichen. Es wird geprüft, ob die Mittelwerte zweier Stichproben signifikant voneinander verschieden sind, oder ob sie sich nur zufällig voneinander unterscheiden. Zum Beispiel vergleicht man die Durchschnittsnoten einer Prüfung von zwei Schulklassen miteinander, man vergleicht also zwei Stichproben anstelle von einer Stichprobe mit einem fixen Wert.

Dieser Test könnte in dieser Arbeit benützt werden, um entscheiden zu können, ob ein Workflow signifikant besser ist als ein einzelner Aufruf. Es gibt zwei Stichproben in dieser Arbeit, nämlich Stichproben von Resultaten von Workflows und Stichproben von Resultaten von Einzelanfragen zum Vergleichen. Es gibt aber noch einen passenderen T-Test.


### 6.2.5.3 Gepaarter t-Test
Der gepaarte t-Test vergleicht ebenfalls zwei Stichproben. Die Werte müssen paarweise zusammengehören. Zum Beispiel bei der Sportleistung einzelner Personen vor und nach dem Training. Von den Werten dieser Paare nimmt man jeweils die Differenz.

Dieser Test passt zu diesem Projekt, weil direkt der qualitative Unterschied der Antworten des Workflows und des einzelnen Aufrufs auf die gleichen Fragen verglichen wird.
Zu jeder Frage gibt es ein Paar:

- Antwortqualität des Workflows auf Frage 1
- Antwortqualität des einzelnen Aufrufs auf Frage 1

Das bringt folgende Vorteile:

- Innerhalb jedes Paares sind Frage, Schwierigkeit und KI-Modell gleich, dadurch können mehr Testfälle gemeinsam betrachtet werden. Verschiedene Testläufe lassen sich leichter mischen, weil die Paare jeweils paarweise die gleichen Bedingungen hatten.

- Technisch ist mehr Information vorhanden, weil die Veränderung pro Frage sichtbar wird.

Beispiel:
| Messung | Vorher | Nachher | Differenz |
|---|---:|---:|---:|
| A | 1000 | 1002 | +2 |
| B | 2000 | 2002 | +2 |  alle haben sich verbessert


Der gepaarte t-Test betrachtet nicht nur Mittelwerte, sondern den paarweisen Unterschied. So werden die Verbesserungen und Verschlechterungen pro Frage sichtbarer.
Hier ändert der Mittelwert wenig im vergleich zu den Wertschwankungen. Aber einzeln betrachtet sieht man, dass sich alle positiv verändern.

Wo in der Berechnung macht das einen Unterschied:
 
Beim gepaarten t-Test wird zuerst pro Frage die Differenz berechnet:

$$
d_i = w_i - s_i
$$

Danach wird der t-Wert mit dem Mittelwert dieser Differenzen berechnet:

$$
t = \frac{\bar{d}}{s_d / \sqrt{n}}
$$

Dabei ist:

- $\bar{d}$ = durchschnittliche Differenz
- $s_d$ = Standardabweichung der Differenzen
- $n$ = Anzahl der Paare

Wenn die Differenzen ähnlich sind, ist $s_d$ klein. Dadurch wird der Standardfehler kleiner:

$$
SE = \frac{s_d}{\sqrt{n}}
$$

Ein kleinerer Standardfehler macht den Betrag des t-Werts grösser. Dadurch ist es wahrscheinlicher, dass der Unterschied signifikant ist.
  


Die Standardabweichung der Differenzen $s_d$ wird berechnet mit:

$$
s_d = \sqrt{\frac{\sum_{i=1}^{n}(d_i - \bar{d})^2}{n-1}}
$$

Dabei ist:

- $d_i$ = Differenz eines Paares
- $\bar{d}$ = Mittelwert aller Differenzen
- $n$ = Anzahl der Paare


# 6.3 Exkurs Statistik Teil 2: Zweiseitiger gepaarter t-Test – Rechnungsschritte

## 6.3.1 Vorbereitung 0: Hypothese aufstellen

Bei den KI-Workflows werden zwar höhere Punktzahlen als beim einzelnen Prompt-Aufruf erwartet. Für die Statistik wird aber eine zweiseitige Alternativhypothese verwendet. 

Dafür braucht es eine Nullhypothese und eine Alternativhypothese. Die Nullhypothese beschreibt den Fall, dass es keinen Unterschied gibt. In dieser Arbeit bedeutet das: Der Workflow ist im Durchschnitt gleich gut wie der Einzelaufruf. Die Alternativhypothese beschreibt den Unterschied, den man prüft. Beim zweiseitigen t-Test wird in beide Richtungen geprüft: Der Workflow kann im Durchschnitt besser oder schlechter sein als der Einzelaufruf. 


$d_i$: Differenz zwischen einer Workflowantwort und einer Direktantwort.

$\mu_d$: Durchschnittliche Differenz.

$$
d_i = S_{\mathrm{Workflow},i} - S_{\mathrm{Direkt},i}
$$

Nullhypothese:

$$
H_0: \mu_d = 0
$$

Alternativhypothese:

$$
H_1: \mu_d \ne 0
$$
 
Für jede Qualitätsmetrik wird eine eigene Auswertung und Hypothese erstellt.


## 6.3.2 Rechenweg für den gepaarten t-Test

Es gibt den einseitigen und zweiseitigen gepaarten t-Test; verwendet wird der zweiseitige. Er unterscheidet sich dadurch, dass er beide Seiten, Verkleinerung und Vergrösserung, misst. In der t-Verteilung schneidet er je die Hälfte der 5% links und rechts ab.


### 6.3.2.1 Paare bilden

Zu jeder Frage gibt es zwei Antworten. Je eine vom Einfachaufruf und eine vom Workflow. Diese Zweiergruppierung wird als Paar betrachtet. 

$$(w_i, s_i)$$
$w_i$ = Qualität des Workflows (Score in %)
$s_i$ = Qualität des einzelnen Aufrufs (Score in %)

Wie wird die Qualität gemessen? Zu jeder Frage, die gestellt wird, gibt es ein paar Kriterien, die in der Antwort stimmen müssen. Für die Qualität einer Antwort wird das in Prozent umgerechnet, damit es vergleichbar ist.
$$
\text{Score} = \frac{\text{Anzahl bestandene Kriterien}}{\text{Anzahl Kriterien}} \cdot 100
$$

### 6.3.2.2 Differenzen berechnen

Für jedes Paar wird die Workflowqualität minus die Einzelaufrufqualität gerechnet.

$d_i$: Punktedifferenz zwischen einem Antwortpaar.
$w_i$: Punkte einer Workflow-Antwort.
$s_i$: Punkte von einem einzelnen Aufruf.

$$d_i = w_i - s_i$$

Wenn $d_i > 0$ ist, ist die Antwort des Workflows besser.
Wenn $d_i = 0$ ist, sind beide gleich gut.
Wenn $d_i < 0$ ist, ist die Antwort des einzelnen Aufrufs besser.




### 6.3.2.3 Mittelwerte der Differenzen berechnen

Die mittlere Differenz ist der Durchschnitt aller Differenzen.

$$\bar{d} = \frac{\sum_{i=1}^{n} d_i}{n}$$

$d_i$: Punktedifferenz zwischen einem Antwortpaar.

$\bar{d}$: Durchschnitt aller Qualitätsunterschiede.

$n$: Anz. Werte in der Stichprobe.


### 6.3.2.4 Median der Differenz
Die Werte werden der Grösse nach aufgereiht und man nimmt die Zahl, die in der Mitte der Aufreihung steht. Falls es zwei Zahlen in der Mitte gibt, wird der Durchschnitt dieser zwei Zahlen genommen. Der Median ist nützlich, weil er resistent gegen Ausreisserwerte ist.

Differenzen: $0, 0, 2, 3, 3$

$$
\text{Mittelwert} = 1.6
$$

$$
\text{Median} = 2
$$

Differenzen: 0, 0, 2, 3, 3, 40

$$
\text{Mittelwert} = 8
$$

$$
\text{Median} = 2.5
$$

### 6.3.2.5 Streuung der Differenzen berechnen

Die Streuung ist hier die Stichproben-Standardabweichung (mit n-1 Freiheitsgraden) der Differenzen.

Freiheitsgrad bei Stichproben, bei denen der Mittelwert festgehalten wird:
$$
df = n - 1
$$

$$s_d = \sqrt{\frac{\sum_{i=1}^{n}(d_i - \bar{d})^2}{n-1}}$$

$s_d$ = Streuung der Differenzen.

### 6.3.2.6 t-Werte berechnen

Das ist der t-Wert für den gepaarten t-Test.

$$t = \frac{\bar{d}}{s_d / \sqrt{n}}$$

$t$ = Testwert des gepaarten t-Tests.

### 6.3.2.7 p-Werte interpretieren
  
Der p-Wert gibt an, wie wahrscheinlich unter der Nullhypothese ein mindestens so extremes Ergebnis wäre. Die Nullhypothese besagt, dass der echte mittlere Unterschied eigentlich $0$ ist. Diese Wahrscheinlichkeit sollte möglichst tief sein, um zu argumentieren, dass die Messwerte eher nicht einfach zufällige Werte der Nullhypothese sind.

Das Ergebnis ist statistisch signifikant, wenn der p-Wert kleiner als das Signifikanzniveau ist. Gleichbedeutend ist dies, wenn der Betrag des t-Werts über dem kritischen t-Wert liegt. Dann wäre ein mindestens so extremes Ergebnis unter der Nullhypothese weniger als 5% wahrscheinlich. Das bedeutet aber noch nicht, dass der Unterschied praktisch relevant ist oder eine grosse Verbesserung aufweist.

### 6.3.2.8 Konfidenzintervall
 
- **95% KI**: 95-Prozent-Konfidenzintervall

Das 95%-Konfidenzintervall gibt den Bereich plausibler Werte an, in dem die wahre mittlere Differenz liegen könnte.

Ein Ergebnis ist signifikant, wenn das Intervall 0 nicht enthält.

$$
KI = \bar d \pm t_{\alpha/2, df} \cdot \frac{s_d}{\sqrt{n}}
$$


### 6.3.2.9 Effektgrösse Cohen dz

Wie gross ist der Unterschied zwischen zwei verbundenen Messungen in Einheiten der Streuung der Differenzen?

$$d_z = \frac{\bar d}{s_d}$$
Oder aus dem gepaarten t-Wert:
$$d_z = \frac{t}{\sqrt{n}}$$

$\bar d$ = Mittelwert der gepaarten Differenzen.
$s_d$ = Standardabweichung der gepaarten Differenzen.
$t$ = Teststatistik des gepaarten t-Tests.
$n$ = Anzahl der Paare.

| Cohen dz | Effektstärke |
|---:|---|
| 0.2 | klein |
| 0.5 | mittel |
| 0.8 | gross |


# 6.4 Kontrollversuch mit computer-auswertbaren Aufgaben

Es gibt 2 Probleme: Erstens können die KI-Schritte im Test zu unerwartet vielen Verschlechterungen und Fehlern führen, was Zweifel aufbringt, ob einer KI-Auswertung zu trauen ist. Dafür ist die Computerauswertung ohne KI. Zweitens gibt es messbare Verbesserungen, aber wie können Verschlechterungen guter Antworten reduziert werden?

Mit einem KI-Schritt in den Workflows namens Pick, der Auswahl des besseren Resultats, oder mit Schritten, die nur Hinzufügungen statt Änderungen erlauben, wird nochmals forciert, dass es keine Verschlechterung geben soll. Wenn eine KI ein Resultat erstellen kann, wird geprüft, ob sie auch erkennen kann, welches Resultat besser ist. 

## 6.4.1 Aufbau des Kontrollversuchs
Ziel ist ein zweiter Referenztest, der genau das Kernproblem zeigen soll, warum es bei jeder Messung im Mittel ähnlich viel Verschlechterung wie Verbesserung gibt (entsprechend der Nullhypothese einer mittleren Differenz von 0). Das gilt zur Kontrolle der Ergebnisse, ob mit weniger KI-Einflüssen das gleiche Resultat erreicht wird. 
Die Auswertung ohne KI wurde eingeführt, nachdem die Messungen zeigen, dass KI-Schritte viele messbare Fehler einführen, in der gleichen Grössenordnung wie die Fortschritte erzeugen.
Fragen und erwartete Antworten sind mathematisch vorberechnet. Es werden vom Computer ohne KI Rechenfragen gestellt, die fehlerfrei generiert werden. Dazu wird ein Tool erstellt, das aus numerischen Rechnungen verbale Textaufgaben erstellt.

Die erwartete Antwort wird vom Computer ausgerechnet. Das Auswerten wird ebenfalls ohne KI gemacht, weil der KI gesagt wird, dass sie die Antwort in einem JSON-Format und mit festgelegten Werten oder Zahlen zurückgegeben werden soll; dieses kann der Computer ohne KI verstehen. So werden Fehler bei der Auswertung deutlich reduziert.

Die finale Antwort wird als JSON geparst. Erwartete Felder werden mit vordefiniertem Resultat verglichen. Zahlenformate und Booleans werden tolerant verglichen, z. B. `1.0` entspricht `1`.

Unbewertete Felder wie `ai_reasoning` werden ignoriert. Hier darf die KI ihre Begründung reinschreiben. Eventuell hilft dies dem nächsten KI-Schritt oder bei der Auswahl, welche Antwort besser ist.

**Beispiel**

- Eine Funktion erzeugt Aufgaben aus Anfangswerten und Regeln, rein mathematisch.
- Beispielhafte Anfangswerte (intern als Zahlen und Regeln mit grösser/kleiner erstellt und als Text ausgegeben)
  - Anna hat 4 Bananen.
  - Ben hat 6 Orangen.
  - Clara hat 2 Melonen.
- Danach werden Regeln zufällig hinzugefügt, z. B.
  - Wenn Ben mehr als 4 Orangen hat, bekommt Clara 1 Melone.
  - Wenn Ben mehr Orangen hat als Anna Bananen, bekommt Clara 4 Melonen.
- Die Funktion rechnet die Regeln selbst in der richtigen Reihenfolge durch.
- Daraus entsteht die erwartete Lösung. Beispiel erwartete Antwort:
  
```json
{"bananen_anna":"2","bananen_ben":"1","bananen_clara":"4"}
```

Die KI bekommt die Aufgabe als Text und muss nur das vorgegebene JSON ausfüllen, das vom Computer ohne KI kontrolliert werden kann.

## 6.4.2 Testablauf

| Schritt | Inhalt | Bewertung |
|---|---|---|
| 1 | KI beantwortet die Aufgabe direkt. | |
| 2 | Computer bewertet die Direktantwort. | erster Score |
| 3 | Zweite KI prüft und korrigiert. | |
| 4 | Optional: PICK wählt die bessere Antwort. | |
| 5 | Computer bewertet das Workflow-Ergebnis. | zweiter Score |

Die Systemprompts sind vereinfacht; in Wirklichkeit geben sie genauer an, wie die Formate sind und welche Regeln eingehalten werden. So entscheidet der Pick konservativ: Nur bei gemessener Verbesserung darf er den zweiten wählen.


| Schritt | Kernanweisung |
|---|---|
| 1: Direct | Löse exakt, gib nur JSON zurück. |
| 3: Review | Prüfe konservativ, ändere nur klar belegbare Fehler. |
| 4: PICK | Wähle Review nur, wenn es klar besser belegt ist; sonst Direct. |

Die erste Antwort ist bereits Teil des späteren Workflows; dadurch sind die Scores einfacher zu vergleichen.

Reine Messung der KI-Korrigierbarkeit. Der Workflow besteht nur aus einem Verbesserungs- oder Korrekturschritt. Gemessen wird, ob eine KI das Resultat einer KI verbessern kann, rein auf die Anweisung hin: Finde die Fehler.

## 6.5 Online Daten des Projekts 

Meine mit Codex AI entwickelte App für Statistik und Workflow Tests:
- GitHub Repository: https://github.com/DanielRehman/Maturaarbeit_Daniel_Rehman

- Alle Statistiken, Tabellen, Diagramme:  https://danielrehman.github.io/Maturaarbeit_Daniel_Rehman/reports/sites/

- Fragen mit  Antwortkriterien: https://danielrehman.github.io/Maturaarbeit_Daniel_Rehman/reports/sites2/

- System-Prompts der Workflows: https://danielrehman.github.io/Maturaarbeit_Daniel_Rehman/reports/sites2/



## 6.6 Quellen


### 6.6.1 Literatur- und Hilfsmittelverzeichnis

### 6.6.2 Literaturverzeichnis

[1] Huang, J., Chen, X., Mishra, S., Zheng, H. S., Yu, A. W., Song, X., & Zhou, D. (2023). *Large language models cannot self-correct reasoning yet*. arXiv.  
https://arxiv.org/abs/2310.01798

[2] Kamoi, R., Zhang, Y., Zhang, N., Han, J., & Zhang, R. (2024). *When can LLMs actually correct their own mistakes? A critical survey of self-correction of LLMs*. arXiv.  
https://arxiv.org/abs/2406.01297

[3] Khan Academy. (o. J.). *Gepaarter t-Test*. Abgerufen am 29. Mai 2026, von  
https://www.khanacademy.org/math/ap-statistics/xfb5d8e68:inference-quantitative-means/two-sample-t-test-means/v/example-of-hypotheses-for-paired-and-2-sample-t-tests

[4] Khan Academy. (o. J.). *Intro to AI*. Abgerufen am 29. Mai 2026, von  
https://www.khanacademy.org/computing/intro-to-ai

[5] OpenAI. (o. J.). *Prompt Engineering*. Abgerufen am 29. Mai 2026, von  
https://platform.openai.com/docs/guides/prompt-engineering

[6] Shinn, N., Cassano, F., Berman, E., Gopinath, A., Narasimhan, K., & Yao, S. (2023). *Reflexion: Language agents with verbal reinforcement learning*. arXiv.  
https://arxiv.org/abs/2303.11366

[7] W3Schools. (o. J.). *JavaScript Tutorial*. Abgerufen am 29. Mai 2026, von  
https://www.w3schools.com/js/

[8] W3Schools. (o. J.). *Python Tutorial*. Abgerufen am 29. Mai 2026, von  
https://www.w3schools.com/python/

### 6.6.3 Software und Hilfsmittel

OpenAI ChatGPT, Modelle GPT-4o / GPT-4o mini: System under Test und zu Auswertungsschritten,

DeepSeek: System under Test 

OpenAI Codex: Unterstützung als Code-Assistent bei der Softwareentwicklung. ChatGPT Ideen Crosscheck, Recherchen, Korrekturen, Layout, LaTeX.

jStat: Berechnung statistischer Kennwerte und p-Werte.

Visual Studio Code: Entwicklungsumgebung.

Node.js / TypeScript: Programmierung der Anwendung.

SQLite: lokale Speicherung der Testlaufdaten.

GitHub: Versionsverwaltung.

Eigene für die Arbeit erstellte Test-, Run- und Auswertungssoftware für KI-Workflows.

### 6.6.4 Datenquellen

Selbst erstellte Fragesets.

Softwaregenerierte, computer-evaluierbare Aufgaben.

Eigene Testlaufdaten aus der entwickelten Anwendung.

Automatisch gespeicherte Antworten, Scores und Auswertungsdaten aus der lokalen Datenbank.




## 6.7 Selbstständigkeitserklärung

Hiermit erkläre ich, dass ich die vorliegende Maturaarbeit mit dem Titel
„Statistische Untersuchung von KI-Workflows“
selbstständig und ohne unerlaubte Hilfe verfasst habe.

Alle verwendeten Quellen – einschliesslich Fachliteratur, wissenschaftlicher Artikel, Internetquellen sowie verwendeter Abbildungen – sind vollständig und korrekt angegeben. Zitate oder sinngemässe Übernahmen aus fremden Werken sind eindeutig als solche gekennzeichnet.

Mir ist bewusst, dass eine falsche oder unvollständige Angabe von Quellen sowie jede Form von Plagiat als Täuschungsversuch gilt und entsprechende Konsequenzen nach sich zieht.

<br>

Ort, Datum: _________

Unterschrift: __________

Name: ____________

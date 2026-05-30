import db from './index';

const TESTSET = 'prompt_optimisation_questions';
const SETUP_ID = 'setup_wf_prompt_optimise';

type QuestionSeed = {
  criteriaId: string;
  question: string;
  checkpoints: string[];
};

function q(criteriaId: string, question: string, checkpoints: string[]): QuestionSeed {
  return { criteriaId, question, checkpoints };
}

const seeds: QuestionSeed[] = [
  // Richtigkeit
  q('richtigkeit', 'Erkläre, was Photosynthese ist, und nenne die wichtigsten Ausgangsstoffe und Produkte.',
    ['Photosynthese wird als Prozess beschrieben, bei dem Pflanzen Lichtenergie nutzen', 'Kohlenstoffdioxid und Wasser werden als Ausgangsstoffe genannt', 'Glucose/Zucker und Sauerstoff werden als Produkte genannt', 'Die Rolle von Chlorophyll oder Chloroplasten wird korrekt eingeordnet']),
  q('richtigkeit', 'Was ist der Unterschied zwischen DNA und RNA?',
    ['DNA wird korrekt als langfristiger Träger genetischer Information beschrieben', 'RNA wird korrekt als Arbeitskopie/Botenmolekül oder an Proteinsynthese beteiligt beschrieben', 'Ein struktureller Unterschied wie Doppelstrang vs. meist Einzelstrang wird korrekt genannt', 'Die Basen oder Zucker werden nicht falsch dargestellt']),
  q('richtigkeit', 'Erkläre den Wasserkreislauf mit Verdunstung, Kondensation und Niederschlag.',
    ['Verdunstung wird korrekt als Übergang von Wasser zu Wasserdampf erklärt', 'Kondensation wird korrekt als Wolkenbildung/Abkühlung von Wasserdampf erklärt', 'Niederschlag wird korrekt als Regen/Schnee/Hagel aus Wolken erklärt', 'Der Kreislaufcharakter mit Rückfluss in Gewässer/Boden wird korrekt dargestellt']),
  q('richtigkeit', 'Was ist Inflation, und wodurch kann sie entstehen?',
    ['Inflation wird korrekt als allgemeiner Anstieg des Preisniveaus beschrieben', 'Kaufkraftverlust wird korrekt erwähnt', 'Mindestens eine plausible Ursache wie höhere Nachfrage, höhere Kosten oder Geldmengenwachstum wird genannt', 'Inflation wird nicht mit einzelnen Preisschwankungen gleichgesetzt']),
  q('richtigkeit', 'Erkläre, warum Erdbeben häufig an Plattengrenzen entstehen.',
    ['Tektonische Platten werden korrekt als bewegliche Teile der Erdkruste beschrieben', 'Spannungsaufbau an Plattengrenzen wird erklärt', 'Plötzliche Freisetzung der Spannung wird als Erdbeben beschrieben', 'Subduktion, Transformstörung oder Kollision wird nicht falsch erklärt']),
  q('richtigkeit', 'Was ist der Unterschied zwischen HTTP und HTTPS?',
    ['HTTP wird korrekt als Protokoll zur Übertragung von Webseiten beschrieben', 'HTTPS wird korrekt als verschlüsselte/gesicherte Variante beschrieben', 'TLS/SSL oder Zertifikate werden korrekt eingeordnet', 'Es wird nicht behauptet, HTTPS garantiere automatisch die Wahrheit einer Webseite']),
  q('richtigkeit', 'Erkläre, wie eine Impfung grundsätzlich das Immunsystem vorbereitet.',
    ['Impfung wird als Training/Vorbereitung des Immunsystems beschrieben', 'Antikörper oder Gedächtniszellen werden korrekt erwähnt', 'Es wird erklärt, dass abgeschwächte/Teile von Erregern oder Bauanleitungen verwendet werden können', 'Es wird nicht behauptet, eine Impfung mache immer zu 100 Prozent immun']),
  q('richtigkeit', 'Was bedeutet Gewaltenteilung in einem Staat?',
    ['Legislative, Exekutive und Judikative werden korrekt unterschieden', 'Kontrolle und Begrenzung staatlicher Macht wird erklärt', 'Mindestens ein korrektes Beispiel für eine Gewalt wird genannt', 'Gewaltenteilung wird nicht als körperliche Gewalt missverstanden']),
  q('richtigkeit', 'Erkläre den Unterschied zwischen Wetter und Klima.',
    ['Wetter wird korrekt als kurzfristiger Zustand der Atmosphäre beschrieben', 'Klima wird korrekt als langfristige durchschnittliche Wetterlage beschrieben', 'Zeitmaßstab wird korrekt unterschieden', 'Ein Beispiel verdeutlicht den Unterschied ohne ihn zu verfälschen']),
  q('richtigkeit', 'Was ist der Unterschied zwischen einer Aktie und einer Obligation?',
    ['Aktie wird korrekt als Unternehmensanteil/Eigentumsbeteiligung beschrieben', 'Obligation/Anleihe wird korrekt als Schuldpapier/Kredit beschrieben', 'Dividende und Zins werden sinnvoll unterschieden', 'Risiko- und Rückzahlungsunterschiede werden nicht falsch dargestellt']),

  // Vollständigkeit gemäß Frage
  q('vollstaendigkeit_frage', 'Nenne drei Ursachen des Ersten Weltkriegs und erkläre jede Ursache in einem Satz.',
    ['Es werden genau oder mindestens drei Ursachen genannt', 'Militarismus, Bündnissysteme, Imperialismus, Nationalismus oder Attentat werden plausibel erklärt', 'Jede genannte Ursache wird kurz erläutert', 'Die Antwort bleibt bei Ursachen und weicht nicht in eine reine Chronologie ab']),
  q('vollstaendigkeit_frage', 'Vergleiche Solarenergie und Windenergie nach Kosten, Zuverlässigkeit und Umweltwirkung.',
    ['Solarenergie wird nach Kosten bewertet', 'Windenergie wird nach Kosten bewertet', 'Zuverlässigkeit/Abhängigkeit von Wetter wird für beide verglichen', 'Umweltwirkungen beider Technologien werden angesprochen']),
  q('vollstaendigkeit_frage', 'Erkläre die drei Schritte: Hypothese bilden, Experiment durchführen, Ergebnis auswerten.',
    ['Hypothese bilden wird verständlich erklärt', 'Experiment durchführen wird verständlich erklärt', 'Ergebnis auswerten wird verständlich erklärt', 'Die Reihenfolge der drei Schritte bleibt logisch']),
  q('vollstaendigkeit_frage', 'Beschreibe für einen Vortrag über Plastik im Meer: Problem, Folgen und zwei mögliche Lösungen.',
    ['Das Problem Plastik im Meer wird beschrieben', 'Folgen für Tiere, Ökosysteme oder Menschen werden erklärt', 'Mindestens zwei konkrete Lösungen werden genannt', 'Problem, Folgen und Lösungen sind klar voneinander getrennt']),
  q('vollstaendigkeit_frage', 'Erstelle eine kurze Lernstrategie mit Zeitplan, Wiederholung und Selbsttest.',
    ['Ein Zeitplan oder konkrete Zeiteinteilung wird genannt', 'Wiederholung wird als eigener Bestandteil beschrieben', 'Selbsttest/Übungsfragen werden als Kontrolle genannt', 'Die Strategie ist praktisch umsetzbar']),
  q('vollstaendigkeit_frage', 'Erkläre Angebot und Nachfrage und gib je ein Beispiel für beide Begriffe.',
    ['Angebot wird korrekt erklärt', 'Nachfrage wird korrekt erklärt', 'Ein passendes Beispiel für Angebot wird gegeben', 'Ein passendes Beispiel für Nachfrage wird gegeben']),
  q('vollstaendigkeit_frage', 'Beschreibe die Schweiz mit Fokus auf politisches System, Sprachen und direkte Demokratie.',
    ['Das politische System wird angesprochen', 'Die Mehrsprachigkeit wird angesprochen', 'Direkte Demokratie wird erklärt', 'Alle drei geforderten Aspekte kommen vor']),
  q('vollstaendigkeit_frage', 'Erkläre einem Anfänger, wie man eine Quelle prüft: Autor, Datum, Absicht und Belege.',
    ['Autor/Herausgeber wird als Prüfkriterium erklärt', 'Datum/Aktualität wird als Prüfkriterium erklärt', 'Absicht/Interesse der Quelle wird als Prüfkriterium erklärt', 'Belege oder Quellenverweise werden als Prüfkriterium erklärt']),
  q('vollstaendigkeit_frage', 'Vergleiche Mitose und Meiose nach Zweck, Ergebnis und Anzahl Teilungen.',
    ['Der Zweck der Mitose wird genannt', 'Der Zweck der Meiose wird genannt', 'Das Ergebnis der Zellteilungen wird verglichen', 'Die Anzahl der Teilungen wird korrekt verglichen']),
  q('vollstaendigkeit_frage', 'Schreibe eine Antwort mit Definition, Beispiel und kurzer Bewertung zum Begriff Nachhaltigkeit.',
    ['Eine Definition von Nachhaltigkeit wird gegeben', 'Ein konkretes Beispiel wird gegeben', 'Eine kurze Bewertung oder Einordnung wird gegeben', 'Die drei verlangten Teile sind erkennbar strukturiert']),

  // Vollständigkeit gemäß Möglichkeit
  q('vollstaendigkeit_moeglichkeit', 'Gib eine möglichst hilfreiche Übersicht, wie eine Klasse ein kleines Recyclingprojekt planen kann.',
    ['Die Antwort enthält mehrere konkrete Planungsschritte', 'Rollen, Material oder Organisation werden berücksichtigt', 'Mögliche Schwierigkeiten werden angesprochen', 'Die Antwort geht über eine Minimalantwort hinaus und gibt praktische Beispiele']),
  q('vollstaendigkeit_moeglichkeit', 'Erkläre möglichst umfassend, wie man eine unbekannte historische Quelle analysiert.',
    ['Äußere Quellenkritik wie Autor, Zeit und Ort wird berücksichtigt', 'Innere Quellenkritik wie Inhalt, Sprache und Absicht wird berücksichtigt', 'Kontextualisierung wird erwähnt', 'Grenzen oder Unsicherheiten der Quelle werden angesprochen']),
  q('vollstaendigkeit_moeglichkeit', 'Entwirf eine möglichst gute Checkliste für eine sichere Präsentation vor der Klasse.',
    ['Inhaltliche Vorbereitung wird abgedeckt', 'Aufbau/Struktur der Präsentation wird abgedeckt', 'Vortragstechnik wie Stimme, Blickkontakt oder Tempo wird abgedeckt', 'Probe, Technikcheck oder Umgang mit Fragen wird erwähnt']),
  q('vollstaendigkeit_moeglichkeit', 'Erkläre möglichst gründlich, wie man Fake News erkennen kann.',
    ['Quelle/Absender wird geprüft', 'Belege und Gegenprüfung werden empfohlen', 'Emotionale Sprache oder Manipulation wird erwähnt', 'Bilder, Datum oder Kontext werden als zusätzliche Prüfpunkte genannt']),
  q('vollstaendigkeit_moeglichkeit', 'Beschreibe möglichst vollständig, was beim Schreiben einer Erörterung wichtig ist.',
    ['Einleitung, Hauptteil und Schluss werden berücksichtigt', 'Argumente und Belege/Beispiele werden erklärt', 'Gegenargumente oder Abwägung werden erwähnt', 'Sprache, roter Faden oder Überleitungen werden berücksichtigt']),
  q('vollstaendigkeit_moeglichkeit', 'Erstelle einen möglichst hilfreichen Plan, wie man sich auf eine Mathematikprüfung vorbereitet.',
    ['Themenübersicht oder Lernziele werden erstellt', 'Übungsaufgaben und Fehleranalyse werden empfohlen', 'Zeitplanung und Wiederholung werden berücksichtigt', 'Selbstkontrolle oder Probeprüfung wird erwähnt']),
  q('vollstaendigkeit_moeglichkeit', 'Erkläre möglichst umfassend Chancen und Risiken von KI im Schulalltag.',
    ['Chancen wie Unterstützung, Individualisierung oder Feedback werden genannt', 'Risiken wie Fehler, Abhängigkeit oder Datenschutz werden genannt', 'Konkrete Schulbeispiele werden gegeben', 'Eine ausgewogene Bewertung oder Regeln für Nutzung werden erwähnt']),
  q('vollstaendigkeit_moeglichkeit', 'Gib eine möglichst gute Anleitung, wie man ein naturwissenschaftliches Experiment dokumentiert.',
    ['Fragestellung/Hypothese wird dokumentiert', 'Material und Methode werden dokumentiert', 'Beobachtungen/Daten werden dokumentiert', 'Auswertung, Fehlerquellen oder Schlussfolgerung werden dokumentiert']),
  q('vollstaendigkeit_moeglichkeit', 'Erkläre möglichst ausführlich, wie demokratische Meinungsbildung funktioniert.',
    ['Information und Diskussion werden angesprochen', 'Medien, Parteien oder Interessengruppen werden eingeordnet', 'Wahlen/Abstimmungen oder Beteiligungsformen werden erwähnt', 'Probleme wie Desinformation oder Filterblasen werden angesprochen']),
  q('vollstaendigkeit_moeglichkeit', 'Entwirf eine möglichst hilfreiche Entscheidungshilfe für die Wahl eines Berufswegs.',
    ['Interessen und Stärken werden berücksichtigt', 'Anforderungen und Ausbildungsmöglichkeiten werden berücksichtigt', 'Praktische Erfahrungen wie Schnuppern/Praktikum werden empfohlen', 'Vor- und Nachteile oder langfristige Perspektiven werden abgewogen']),

  // Prüfung / Verifikation
  q('pruefung_verifikation', 'Berechne 18 Prozent von 250 und erkläre kurz, wie du dein Ergebnis kontrollierst.',
    ['Das Ergebnis 45 wird korrekt berechnet', 'Der Rechenweg wird verständlich gezeigt', 'Eine Kontrolle über 10 Prozent + 8 Prozent oder Rückrechnung wird durchgeführt', 'Die Antwort markiert das geprüfte Endergebnis klar']),
  q('pruefung_verifikation', 'Löse: Ein Zug fährt 120 km in 1,5 Stunden. Wie schnell ist er durchschnittlich? Prüfe die Einheit.',
    ['Die Durchschnittsgeschwindigkeit 80 km/h wird korrekt berechnet', 'Formel Strecke/Zeit wird korrekt verwendet', 'Die Einheit km/h wird geprüft und genannt', 'Die Rechnung wird kurz plausibilisiert']),
  q('pruefung_verifikation', 'Prüfe die Aussage: Alle Quadrate sind Rechtecke, aber nicht alle Rechtecke sind Quadrate.',
    ['Die Aussage wird als richtig bewertet', 'Begründung für Quadrat als besonderes Rechteck wird gegeben', 'Gegenbeispiel für Rechteck, das kein Quadrat ist, wird genannt', 'Die logische Richtung wird nicht vertauscht']),
  q('pruefung_verifikation', 'Eine Rechnung sagt: 7 mal 8 = 54. Erkläre, ob das stimmt, und kontrolliere es.',
    ['Die falsche Aussage wird erkannt', 'Das korrekte Ergebnis 56 wird genannt', 'Eine Kontrollmethode wie Addition oder bekannte Malreihe wird gezeigt', 'Die Korrektur wird klar formuliert']),
  q('pruefung_verifikation', 'Ein Text behauptet, Wasser kocht immer bei 100 Grad Celsius. Prüfe diese Aussage.',
    ['Die Aussage wird als vereinfacht/bedingt richtig eingeordnet', 'Normaldruck als Bedingung wird genannt', 'Höhe/Luftdruck als Einfluss wird erwähnt', 'Die Antwort vermeidet eine absolute falsche Verallgemeinerung']),
  q('pruefung_verifikation', 'Berechne den Durchschnitt von 6, 8, 10 und 12 und prüfe, ob das Ergebnis plausibel ist.',
    ['Der Durchschnitt 9 wird korrekt berechnet', 'Summe und Division durch 4 werden gezeigt', 'Plausibilität zwischen Minimum 6 und Maximum 12 wird geprüft', 'Das Ergebnis wird klar als Durchschnitt markiert']),
  q('pruefung_verifikation', 'Überprüfe, ob die Aussage stimmt: Ein Jahr hat immer genau 365 Tage.',
    ['Die Aussage wird als nicht immer richtig erkannt', 'Schaltjahre mit 366 Tagen werden erwähnt', 'Der Normalfall 365 Tage wird korrekt eingeordnet', 'Die Antwort erklärt, warum "immer" problematisch ist']),
  q('pruefung_verifikation', 'Berechne 15 Prozent Rabatt auf 80 Franken und kontrolliere den Endpreis.',
    ['Rabattbetrag 12 Franken wird korrekt berechnet', 'Endpreis 68 Franken wird korrekt berechnet', 'Eine Kontrolle über 10 Prozent + 5 Prozent oder Addition wird gezeigt', 'Rabatt und Endpreis werden nicht verwechselt']),
  q('pruefung_verifikation', 'Prüfe diese Behauptung: Je schwerer ein Gegenstand ist, desto schneller fällt er im Vakuum.',
    ['Die Behauptung wird für das Vakuum als falsch erkannt', 'Gleiche Fallbeschleunigung im Vakuum wird erklärt', 'Luftwiderstand wird als Unterschied außerhalb des Vakuums erwähnt', 'Die Antwort unterscheidet Alltag und physikalisches Idealmodell']),
  q('pruefung_verifikation', 'Eine Quelle nennt 2 plus 2 gleich 5. Wie würdest du die Information prüfen und beantworten?',
    ['Die falsche Information wird nicht übernommen', 'Das korrekte Ergebnis 4 wird genannt', 'Eine einfache Überprüfung oder Gegenrechnung wird beschrieben', 'Die Antwort erklärt, dass Quellen trotz Autorität geprüft werden müssen']),

  // Rückfragefähigkeit
  q('rueckfragefaehigkeit', 'Plane mir eine Reise.',
    ['Das Modell fragt nach Reiseziel oder gewünschter Region', 'Das Modell fragt nach Zeitraum/Dauer', 'Das Modell fragt nach Budget oder Reisestil', 'Es trifft keine konkreten Buchungsannahmen ohne fehlende Angaben']),
  q('rueckfragefaehigkeit', 'Schreibe die perfekte Bewerbung für mich.',
    ['Das Modell fragt nach Stelle/Branche', 'Das Modell fragt nach Erfahrungen/Qualifikationen', 'Das Modell fragt nach Arbeitgeber oder Anforderungen', 'Es bietet höchstens eine Vorlage an, ohne Details zu erfinden']),
  q('rueckfragefaehigkeit', 'Mach mir einen Lernplan.',
    ['Das Modell fragt nach Fach oder Thema', 'Das Modell fragt nach Prüfungstermin/Zeitraum', 'Das Modell fragt nach aktuellem Wissensstand', 'Es vermeidet einen endgültigen Plan ohne zentrale Informationen']),
  q('rueckfragefaehigkeit', 'Sag mir, welches Handy ich kaufen soll.',
    ['Das Modell fragt nach Budget', 'Das Modell fragt nach wichtigen Funktionen/Nutzung', 'Das Modell fragt nach Betriebssystem- oder Größenpräferenz', 'Es empfiehlt nicht vorschnell ein bestimmtes Modell']),
  q('rueckfragefaehigkeit', 'Erstelle mir einen Trainingsplan.',
    ['Das Modell fragt nach Ziel wie Kraft, Ausdauer oder Abnehmen', 'Das Modell fragt nach Fitnesslevel/Gesundheit', 'Das Modell fragt nach verfügbarer Zeit und Ausrüstung', 'Es gibt keine riskanten konkreten Belastungen ohne Rückfragen']),
  q('rueckfragefaehigkeit', 'Hilf mir bei meiner Präsentation.',
    ['Das Modell fragt nach Thema', 'Das Modell fragt nach Zielgruppe/Klasse', 'Das Modell fragt nach Länge oder Format', 'Es bietet Strukturhilfe an, ohne den Inhalt zu erfinden']),
  q('rueckfragefaehigkeit', 'Welche Versicherung brauche ich?',
    ['Das Modell fragt nach Lebenssituation', 'Das Modell fragt nach Land/Kanton oder rechtlichem Kontext', 'Das Modell fragt nach Risiko/Besitz/Familie', 'Es gibt keine definitive Beratung ohne fehlende Angaben']),
  q('rueckfragefaehigkeit', 'Schreib mir eine Zusammenfassung.',
    ['Das Modell fragt nach dem Text oder Thema', 'Das Modell fragt nach gewünschter Länge', 'Das Modell fragt nach Zweck oder Detailgrad', 'Es behauptet nicht, den unbekannten Text zu kennen']),
  q('rueckfragefaehigkeit', 'Welche Matura-Arbeit soll ich machen?',
    ['Das Modell fragt nach Interessen/Fächern', 'Das Modell fragt nach Vorgaben der Schule', 'Das Modell fragt nach verfügbaren Daten/Methoden', 'Es schlägt nur Optionen oder Kriterien vor statt eine blinde Entscheidung zu treffen']),
  q('rueckfragefaehigkeit', 'Kannst du das verbessern?',
    ['Das Modell fragt, was "das" ist oder bittet um den Inhalt', 'Das Modell fragt nach Ziel der Verbesserung', 'Das Modell fragt nach Stil, Länge oder Kriterien', 'Es erfindet keinen Ausgangstext']),

  // Unsicherheit offenlegen
  q('unsicherheit', 'Eine Person namens Alex hat "ziemlich viel" gelernt. Wird Alex die Prüfung bestehen?',
    ['Die Antwort erkennt, dass die Information nicht ausreicht', 'Unsicherheit wird ausdrücklich formuliert', 'Abhängige Faktoren wie Schwierigkeit, Vorwissen oder Prüfungsform werden genannt', 'Es wird keine sichere Bestehensprognose erfunden']),
  q('unsicherheit', 'Ein Medikament hat bei einer Person geholfen. Hilft es sicher auch bei mir?',
    ['Die Antwort vermeidet eine sichere medizinische Zusage', 'Individuelle Faktoren und Arzt/Apotheke werden erwähnt', 'Unsicherheit und Grenzen der Information werden klar genannt', 'Es wird keine Diagnose oder Dosierung erfunden']),
  q('unsicherheit', 'Ich habe gehört, dass eine Aktie bald stark steigt. Soll ich sie kaufen?',
    ['Die Antwort legt finanzielle Unsicherheit offen', 'Risiko und fehlende Informationen werden genannt', 'Keine sichere Gewinnprognose wird gegeben', 'Eigene Recherche oder professionelle Beratung wird empfohlen']),
  q('unsicherheit', 'Ein altes Foto zeigt vielleicht Zürich im Jahr 1900. Ist das sicher?',
    ['Die Antwort erkennt die Unsicherheit von "vielleicht"', 'Mögliche Prüfkriterien wie Gebäude, Kleidung oder Quelle werden genannt', 'Keine sichere Bestätigung ohne Bild/Quelle wird gegeben', 'Weitere Informationen werden angefordert oder empfohlen']),
  q('unsicherheit', 'Meine Internetverbindung ist langsam. Liegt es sicher am Router?',
    ['Die Antwort vermeidet eine sichere Ursache', 'Mehrere mögliche Ursachen werden genannt', 'Einfache Tests zur Eingrenzung werden vorgeschlagen', 'Unsicherheit wird transparent formuliert']),
  q('unsicherheit', 'Eine Studie mit 20 Personen findet einen Effekt. Beweist das die Aussage?',
    ['Die Antwort unterscheidet Hinweis und Beweis', 'Kleine Stichprobe wird als Unsicherheitsfaktor genannt', 'Replikation/Methodik/Signifikanz werden erwähnt', 'Die Aussage wird nicht überinterpretiert']),
  q('unsicherheit', 'Jemand sagt, diese Nachricht sei von einer Behörde. Kann ich ihr vertrauen?',
    ['Die Antwort legt Unsicherheit ohne Quelle offen', 'Prüfung offizieller Kanäle wird empfohlen', 'Warnzeichen wie Links, Absender oder Druck werden genannt', 'Es wird nicht blind Vertrauen empfohlen']),
  q('unsicherheit', 'Ein Schüler hat Bauchschmerzen vor der Schule. Ist es Angst?',
    ['Die Antwort vermeidet eine sichere psychologische Diagnose', 'Körperliche und psychische Ursachen werden als möglich genannt', 'Beobachtung/Abklärung mit Vertrauensperson oder Fachperson wird empfohlen', 'Unsicherheit wird klar benannt']),
  q('unsicherheit', 'Ein KI-Tool gibt eine Antwort ohne Quellen. Ist sie wahrscheinlich richtig?',
    ['Die Antwort erklärt, dass KI-Antworten falsch sein können', 'Fehlende Quellen werden als Unsicherheitsgrund genannt', 'Überprüfung mit verlässlichen Quellen wird empfohlen', 'Keine sichere Richtigkeitsbewertung wird behauptet']),
  q('unsicherheit', 'Ein Produkt hat viele gute Bewertungen. Ist es garantiert gut?',
    ['Die Antwort vermeidet Garantie', 'Mögliche Verzerrungen wie Fake-Bewertungen oder Auswahlbias werden genannt', 'Weitere Prüfpunkte wie Tests, Rückgabe oder eigene Bedürfnisse werden empfohlen', 'Unsicherheit wird klar kommuniziert']),

  // Internet- / Quellenqualität
  q('internet_quellenqualitaet', 'Welche aktuellen offiziellen Informationen sollte man prüfen, bevor man 2026 in die Schweiz einreist?',
    ['Aktualität der Informationen wird betont', 'Offizielle Quellen wie Behörden/EDA/SEM werden bevorzugt', 'Einreisedokumente, Visa oder Zollregeln werden als Prüfpunkte genannt', 'Unsicherheit bei sich ändernden Regeln wird erwähnt']),
  q('internet_quellenqualitaet', 'Finde heraus, welche Quellen sich eignen, um aktuelle Klimadaten der Schweiz zu beurteilen.',
    ['Offizielle oder wissenschaftliche Quellen wie MeteoSchweiz/IPCC werden bevorzugt', 'Aktualität und Veröffentlichungsdatum werden berücksichtigt', 'Primärdaten oder methodisch transparente Quellen werden empfohlen', 'Meinungsseiten werden nicht als Hauptbeleg verwendet']),
  q('internet_quellenqualitaet', 'Wie sollte man aktuelle Preise für ein Zugticket von Zürich nach Genf zuverlässig prüfen?',
    ['Offizielle Anbieter wie SBB werden als erste Quelle genannt', 'Datum, Uhrzeit und Klasse werden als preisrelevant erkannt', 'Dynamische Preise/Angebote werden nicht pauschal behauptet', 'Die Antwort empfiehlt aktuelle Prüfung statt veralteter Schätzung']),
  q('internet_quellenqualitaet', 'Welche Quellen wären geeignet, um die aktuelle Arbeitslosenquote der Schweiz zu finden?',
    ['Offizielle Statistikquellen wie BFS/SECO werden genannt', 'Zeitraum und Definition der Quote werden beachtet', 'Aktualität der Veröffentlichung wird geprüft', 'Die Antwort unterscheidet Datenquelle und Medienbericht']),
  q('internet_quellenqualitaet', 'Wie prüft man zuverlässig, ob eine neue App datenschutzfreundlich ist?',
    ['Datenschutzerklärung und Berechtigungen werden geprüft', 'Unabhängige Tests oder offizielle Store-Informationen werden berücksichtigt', 'Datum/Version der App wird beachtet', 'Die Antwort warnt vor reinen Werbeaussagen']),
  q('internet_quellenqualitaet', 'Welche Quellen sollte man nutzen, um aktuelle Impfempfehlungen in der Schweiz zu prüfen?',
    ['BAG oder kantonale Gesundheitsstellen werden bevorzugt', 'Aktualität/Datum der Empfehlung wird geprüft', 'Zielgruppe und individuelle Situation werden beachtet', 'Die Antwort ersetzt keine medizinische Beratung']),
  q('internet_quellenqualitaet', 'Wie findet man seriöse Informationen zu einem aktuellen politischen Abstimmungsthema?',
    ['Offizielle Abstimmungsunterlagen werden genannt', 'Positionen verschiedener Seiten werden vergleichend geprüft', 'Faktenchecks/seriöse Medien können ergänzend genutzt werden', 'Die Antwort warnt vor Social-Media-Einseitigkeit']),
  q('internet_quellenqualitaet', 'Welche Quellen eignen sich, um aktuelle Wechselkurse zu überprüfen?',
    ['Banken, Zentralbanken oder etablierte Finanzdatenquellen werden genannt', 'Zeitpunkt des Kurses wird beachtet', 'Kauf-/Verkaufskurs oder Gebühren werden unterschieden', 'Die Antwort nennt keine ungeprüfte feste Zahl']),
  q('internet_quellenqualitaet', 'Wie prüft man, ob eine wissenschaftliche Behauptung in den Medien korrekt wiedergegeben wurde?',
    ['Originalstudie oder Abstract wird als Primärquelle empfohlen', 'Methodik/Stichprobe/Limitierungen werden geprüft', 'Medienbericht wird mit der Studie verglichen', 'Übertreibungen oder Kausalitätsfehler werden beachtet']),
  q('internet_quellenqualitaet', 'Welche Quellen sollte man verwenden, um aktuelle Regeln für Drohnenflüge in der Schweiz zu prüfen?',
    ['Offizielle Luftfahrtbehörden wie BAZL werden bevorzugt', 'Ort, Gewicht/Kategorie und Datum der Regelung werden berücksichtigt', 'Karten/Flugverbotszonen werden als Prüfpunkte genannt', 'Die Antwort vermeidet veraltete oder pauschale Regeln']),

  // Relevanz
  q('relevanz', 'Erkläre nur, warum Bienen für die Bestäubung wichtig sind, ohne allgemein über Honigproduktion abzuschweifen.',
    ['Die Antwort konzentriert sich auf Bestäubung', 'Rolle der Bienen bei Pflanzenvermehrung wird erklärt', 'Bedeutung für Landwirtschaft/Ökosysteme wird relevant erwähnt', 'Unnötige Abschweifungen zur Honigproduktion bleiben aus']),
  q('relevanz', 'Nenne die wichtigsten Vor- und Nachteile von Homeoffice für Schüler, nicht für Unternehmen.',
    ['Die Perspektive Schüler wird eingehalten', 'Vorteile für Schüler werden genannt', 'Nachteile für Schüler werden genannt', 'Unternehmensperspektive dominiert die Antwort nicht']),
  q('relevanz', 'Beantworte die Frage: Warum ist Schlaf für das Lernen wichtig? Keine Tipps zur Ernährung.',
    ['Die Antwort erklärt Zusammenhang Schlaf und Gedächtnis/Lernen', 'Konzentration oder Erholung wird relevant erwähnt', 'Ernährungstipps werden vermieden', 'Die Antwort bleibt auf die Frage fokussiert']),
  q('relevanz', 'Fasse die Funktion des Herzens in fünf Sätzen zusammen, ohne Details zu allen Organen.',
    ['Die Funktion des Herzens als Pumpe wird erklärt', 'Blutkreislauf/Sauerstofftransport wird relevant erwähnt', 'Die Antwort bleibt ungefähr bei fünf Sätzen', 'Andere Organe werden nicht ausführlich behandelt']),
  q('relevanz', 'Erkläre die Ursachen von Stress bei Jugendlichen, nicht die Geschichte des Begriffs Stress.',
    ['Ursachen bei Jugendlichen werden genannt', 'Schule, soziale Medien, Familie oder Zukunftsdruck werden relevant behandelt', 'Begriffsgeschichte wird nicht ausführlich erzählt', 'Die Antwort bleibt problembezogen']),
  q('relevanz', 'Vergleiche E-Books und gedruckte Bücher für das Lernen, nicht für den Buchhandel.',
    ['Lernbezogene Vorteile von E-Books werden genannt', 'Lernbezogene Vorteile gedruckter Bücher werden genannt', 'Nachteile oder Grenzen werden für das Lernen verglichen', 'Buchhandels-/Marktperspektive bleibt nebensächlich']),
  q('relevanz', 'Erkläre, wozu ein Inhaltsverzeichnis in einer Arbeit dient, ohne allgemeine Word-Anleitung.',
    ['Zweck der Orientierung wird erklärt', 'Struktur/Übersichtlichkeit der Arbeit wird erwähnt', 'Bezug zu wissenschaftlicher Arbeit wird hergestellt', 'Technische Word-Schritte dominieren nicht']),
  q('relevanz', 'Warum ist Quellenangabe in einer Matura-Arbeit wichtig? Antworte nicht allgemein über Bibliotheken.',
    ['Nachvollziehbarkeit wird genannt', 'Vermeidung von Plagiat wird genannt', 'Bewertung/Seriosität der Arbeit wird relevant erwähnt', 'Bibliotheken werden nicht zum Hauptthema']),
  q('relevanz', 'Erkläre kurz den Unterschied zwischen erneuerbaren und nicht erneuerbaren Energien, ohne Energiepolitik zu diskutieren.',
    ['Erneuerbare Energien werden korrekt abgegrenzt', 'Nicht erneuerbare Energien werden korrekt abgegrenzt', 'Mindestens ein passendes Beispiel pro Kategorie wird genannt', 'Energiepolitische Debatten werden nicht ausufernd behandelt']),
  q('relevanz', 'Beschreibe die Aufgabe eines Betriebssystems für Anfänger, ohne Programmiersprachen zu erklären.',
    ['Betriebssystem als Vermittler/Verwalter wird erklärt', 'Hardware, Dateien, Programme oder Benutzeroberfläche werden relevant erwähnt', 'Die Erklärung ist anfängergerecht', 'Programmiersprachen werden nicht ausführlich erklärt']),

  // Klarheit
  q('klarheit', 'Erkläre einem Kind, wie ein Regenbogen entsteht.',
    ['Die Erklärung verwendet einfache Sprache', 'Lichtbrechung oder Aufspaltung des Lichts wird verständlich erklärt', 'Wassertropfen werden als Ursache genannt', 'Ein anschauliches Beispiel oder Bild wird genutzt']),
  q('klarheit', 'Erkläre den Unterschied zwischen Brutto und Netto in einfachen Worten.',
    ['Brutto wird einfach und korrekt erklärt', 'Netto wird einfach und korrekt erklärt', 'Ein alltagsnahes Beispiel wird gegeben', 'Die Antwort vermeidet unnötige Fachsprache']),
  q('klarheit', 'Erkläre, was eine Variable in der Mathematik ist, für einen Anfänger.',
    ['Variable wird als Platzhalter verständlich erklärt', 'Ein einfaches Beispiel wie x + 2 wird genutzt', 'Der Zweck von Variablen wird erklärt', 'Die Erklärung ist kurz und gut strukturiert']),
  q('klarheit', 'Erkläre, warum Metall sich kalt anfühlt, obwohl es Raumtemperatur hat.',
    ['Wärmeleitung wird einfach erklärt', 'Der Unterschied zwischen Temperatur und Wärmegefühl wird deutlich', 'Ein alltagsnahes Beispiel wird verwendet', 'Die Antwort bleibt verständlich und nicht zu technisch']),
  q('klarheit', 'Erkläre den Begriff Demokratie in einfachen Worten.',
    ['Demokratie wird als Mitbestimmung/Volksherrschaft erklärt', 'Wahlen oder Abstimmungen werden einfach erwähnt', 'Rechte/Regeln oder Mehrheit/Minderheit werden verständlich eingeordnet', 'Die Antwort ist klar gegliedert']),
  q('klarheit', 'Erkläre einem Anfänger, was ein Algorithmus ist.',
    ['Algorithmus wird als Schritt-für-Schritt-Anleitung erklärt', 'Ein einfaches Alltagsbeispiel wird gegeben', 'Bezug zu Computern wird verständlich hergestellt', 'Die Antwort vermeidet komplizierte Informatikbegriffe']),
  q('klarheit', 'Erkläre, was Zinsen sind, mit einem einfachen Beispiel.',
    ['Zinsen werden als Preis/Gewinn für geliehenes oder gespartes Geld erklärt', 'Ein Zahlenbeispiel wird gegeben', 'Sparen und Kredit werden nicht verwechselt', 'Die Sprache bleibt anfängergerecht']),
  q('klarheit', 'Erkläre, was ein Ökosystem ist, so dass es ein 12-jähriges Kind versteht.',
    ['Lebewesen und Lebensraum werden erwähnt', 'Zusammenwirken/Abhängigkeit wird erklärt', 'Ein konkretes Beispiel wie Wald/Teich wird genutzt', 'Die Antwort ist einfach und anschaulich']),
  q('klarheit', 'Erkläre den Unterschied zwischen Ursache und Wirkung in einfachen Worten.',
    ['Ursache wird als Grund/Auslöser erklärt', 'Wirkung wird als Folge erklärt', 'Ein klares Beispiel wird gegeben', 'Die Unterscheidung bleibt eindeutig']),
  q('klarheit', 'Erkläre, was eine Hypothese ist, ohne komplizierte Fachsprache.',
    ['Hypothese wird als überprüfbare Vermutung erklärt', 'Bezug zu Experiment/Untersuchung wird hergestellt', 'Ein einfaches Beispiel wird gegeben', 'Die Antwort ist klar und knapp']),
];

const existing = db.prepare(`
  SELECT COUNT(*) as count
  FROM questions
  WHERE testset = ? AND setup_id = ?
`).get(TESTSET, SETUP_ID) as { count: number };

if (existing.count > 0) {
  console.error(`Aborted: ${existing.count} questions already exist for ${TESTSET} / ${SETUP_ID}.`);
  process.exit(1);
}

const insertQuestion = db.prepare(`
  INSERT INTO questions (criteria_id, setup_id, question_text, testset, notes)
  VALUES (?, ?, ?, ?, ?)
`);
const insertCheckpoint = db.prepare(`
  INSERT INTO checkpoints (question_id, item_text, sort_order)
  VALUES (?, ?, ?)
`);

const transaction = db.transaction(() => {
  db.prepare('INSERT OR IGNORE INTO testsets (id, name) VALUES (?, ?)').run(TESTSET, TESTSET);

  const criteriaCounts = new Map<string, number>();
  for (const seed of seeds) {
    const next = (criteriaCounts.get(seed.criteriaId) ?? 0) + 1;
    criteriaCounts.set(seed.criteriaId, next);

    const result = insertQuestion.run(
      seed.criteriaId,
      SETUP_ID,
      seed.question,
      TESTSET,
      `${seed.criteriaId} prompt-optimisation-${next} for C - Prompt-Optimierung`,
    );

    seed.checkpoints.forEach((checkpoint, index) => {
      insertCheckpoint.run(result.lastInsertRowid, checkpoint, index);
    });
  }
});

transaction();

console.log(`Inserted ${seeds.length} questions for ${TESTSET} / ${SETUP_ID}.`);
console.table(db.prepare(`
  SELECT criteria_id, COUNT(*) as questions
  FROM questions
  WHERE testset = ? AND setup_id = ?
  GROUP BY criteria_id
  ORDER BY criteria_id
`).all(TESTSET, SETUP_ID));

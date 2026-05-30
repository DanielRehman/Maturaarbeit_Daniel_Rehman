import db from './index';

type QuestionSeed = {
  criteriaId: string;
  question: string;
  checkpoints: string[];
};

const TESTSET = 'prompt_optimisation_extended_questions';
const SETUP_ID = 'setup_wf_prompt_optimise';

function q(criteriaId: string, question: string, checkpoints: string[]): QuestionSeed {
  return { criteriaId, question, checkpoints };
}

const seeds: QuestionSeed[] = [
  q('richtigkeit', 'Erkläre den Unterschied zwischen einem Virus und einem Bakterium.',
    ['Virus und Bakterium werden korrekt unterschieden', 'Größe, Aufbau oder Vermehrung wird passend erklärt', 'Behandlung mit Antibiotika wird nicht falsch auf Viren übertragen', 'Ein einfaches Beispiel oder Vergleich wird genannt']),
  q('richtigkeit', 'Was passiert bei einer Mondfinsternis?',
    ['Die Erde wird korrekt zwischen Sonne und Mond eingeordnet', 'Der Schatten der Erde auf dem Mond wird erklärt', 'Mondfinsternis wird nicht mit Sonnenfinsternis verwechselt', 'Die Antwort nennt eine passende Bedingung wie Vollmond oder Ausrichtung']),
  q('richtigkeit', 'Erkläre den Unterschied zwischen Masse und Gewichtskraft.',
    ['Masse wird korrekt als Menge der Materie beschrieben', 'Gewichtskraft wird als Kraft durch Gravitation erklärt', 'Einheit kg und Newton werden sinnvoll unterschieden', 'Die Antwort vermeidet die Gleichsetzung von Masse und Gewichtskraft']),
  q('richtigkeit', 'Was bedeutet Angebot und Nachfrage in der Wirtschaft?',
    ['Angebot wird korrekt als verfügbare Menge/Leistung erklärt', 'Nachfrage wird korrekt als Kaufwunsch/Kaufbereitschaft erklärt', 'Preiswirkung wird grundsätzlich korrekt beschrieben', 'Ein einfaches Marktbeispiel wird gegeben']),
  q('richtigkeit', 'Erkläre, warum Pflanzen Licht für Photosynthese brauchen.',
    ['Licht wird als Energiequelle für Photosynthese beschrieben', 'CO2 und Wasser oder Zucker/Sauerstoff werden korrekt eingeordnet', 'Chlorophyll/Chloroplasten werden passend erwähnt', 'Die Antwort behauptet nicht, Licht sei ein Stoffprodukt']),
  q('richtigkeit', 'Was ist der Unterschied zwischen direkter und indirekter Demokratie?',
    ['Direkte Demokratie wird mit Abstimmungen/Volksentscheiden erklärt', 'Indirekte Demokratie wird mit gewählten Vertretern erklärt', 'Ein Beispiel oder Anwendung wird genannt', 'Die beiden Formen werden nicht vertauscht']),
  q('richtigkeit', 'Erkläre den Unterschied zwischen Temperatur und Wärme.',
    ['Temperatur wird als Maß für thermischen Zustand erklärt', 'Wärme wird als übertragene Energie erklärt', 'Ein alltagsnahes Beispiel verdeutlicht den Unterschied', 'Die Antwort setzt Temperatur und Wärme nicht gleich']),
  q('richtigkeit', 'Was bedeutet Datenschutz bei persönlichen Daten?',
    ['Persönliche Daten werden korrekt beschrieben', 'Schutz vor Missbrauch/unberechtigtem Zugriff wird erklärt', 'Ein Beispiel für sensible oder persönliche Daten wird genannt', 'Datenschutz wird nicht nur als Passwortwahl verkürzt']),
  q('richtigkeit', 'Erkläre, was ein Bruch in der Mathematik bedeutet.',
    ['Zähler und Nenner werden korrekt erklärt', 'Bruch als Teil eines Ganzen oder Verhältnis wird beschrieben', 'Ein einfaches Beispiel wird gegeben', 'Die Antwort enthält keine falsche Regel zur Bruchrechnung']),
  q('richtigkeit', 'Was ist der Unterschied zwischen erneuerbaren und fossilen Energieträgern?',
    ['Erneuerbare Energieträger werden korrekt erklärt', 'Fossile Energieträger werden korrekt erklärt', 'Passende Beispiele für beide Kategorien werden genannt', 'Endlichkeit und Umweltbezug werden nicht falsch dargestellt']),

  q('vollstaendigkeit_frage', 'Vergleiche Fahrrad und Auto nach Kosten, Geschwindigkeit, Umweltwirkung und Sicherheit.',
    ['Kosten werden für beide Verkehrsmittel angesprochen', 'Geschwindigkeit wird verglichen', 'Umweltwirkung wird verglichen', 'Sicherheit wird verglichen']),
  q('vollstaendigkeit_frage', 'Erkläre die Begriffe These, Argument und Beispiel jeweils kurz.',
    ['These wird erklärt', 'Argument wird erklärt', 'Beispiel wird erklärt', 'Die drei Begriffe werden klar voneinander getrennt']),
  q('vollstaendigkeit_frage', 'Beschreibe den Wasserkreislauf mit Verdunstung, Wolkenbildung, Niederschlag und Rückfluss.',
    ['Verdunstung wird beschrieben', 'Wolkenbildung/Kondensation wird beschrieben', 'Niederschlag wird beschrieben', 'Rückfluss in Gewässer/Boden wird beschrieben']),
  q('vollstaendigkeit_frage', 'Erstelle einen kurzen Plan für eine Gruppenarbeit mit Ziel, Rollen, Zeitplan und Ergebnis.',
    ['Ziel der Gruppenarbeit wird genannt', 'Rollen werden verteilt oder beschrieben', 'Zeitplan wird erwähnt', 'Ergebnis/Abgabeprodukt wird genannt']),
  q('vollstaendigkeit_frage', 'Erkläre, wie man eine gute Quelle erkennt: Autor, Datum, Belege und Absicht.',
    ['Autor/Herausgeber wird als Kriterium erklärt', 'Datum/Aktualität wird erklärt', 'Belege/Quellen werden erklärt', 'Absicht/Interesse der Quelle wird erklärt']),
  q('vollstaendigkeit_frage', 'Vergleiche Stadtleben und Landleben nach Wohnen, Verkehr, Freizeit und Kosten.',
    ['Wohnen wird verglichen', 'Verkehr wird verglichen', 'Freizeit wird verglichen', 'Kosten werden verglichen']),
  q('vollstaendigkeit_frage', 'Erkläre ein Experiment mit Fragestellung, Hypothese, Durchführung und Auswertung.',
    ['Fragestellung wird erklärt', 'Hypothese wird erklärt', 'Durchführung wird erklärt', 'Auswertung wird erklärt']),
  q('vollstaendigkeit_frage', 'Beschreibe die Aufgaben von Legislative, Exekutive und Judikative.',
    ['Legislative wird korrekt beschrieben', 'Exekutive wird korrekt beschrieben', 'Judikative wird korrekt beschrieben', 'Die drei Gewalten werden nicht vermischt']),
  q('vollstaendigkeit_frage', 'Erstelle eine Lernmethode mit Vorbereitung, Übung, Wiederholung und Kontrolle.',
    ['Vorbereitung wird genannt', 'Übung wird genannt', 'Wiederholung wird genannt', 'Kontrolle/Selbsttest wird genannt']),
  q('vollstaendigkeit_frage', 'Erkläre den Aufbau einer Erörterung mit Einleitung, Hauptteil, Schluss und rotem Faden.',
    ['Einleitung wird erklärt', 'Hauptteil wird erklärt', 'Schluss wird erklärt', 'Roter Faden/Logik wird erwähnt']),

  q('vollstaendigkeit_moeglichkeit', 'Gib eine möglichst hilfreiche Anleitung, wie man ein Referat über Klimawandel vorbereitet.',
    ['Themenrecherche und Eingrenzung werden genannt', 'Struktur/Aufbau des Referats wird erklärt', 'Quellen und Belege werden berücksichtigt', 'Vortrag, Zeit oder Probe wird praktisch eingeplant']),
  q('vollstaendigkeit_moeglichkeit', 'Beschreibe möglichst umfassend, wie man einen Streit in einer Klasse fair lösen kann.',
    ['Perspektiven aller Beteiligten werden berücksichtigt', 'Gesprächsregeln oder Moderation werden vorgeschlagen', 'Lösung/Kompromiss wird angestrebt', 'Nachkontrolle oder Vereinbarung wird erwähnt']),
  q('vollstaendigkeit_moeglichkeit', 'Erstelle eine möglichst gute Checkliste für die Abgabe einer Matura-Arbeit.',
    ['Inhaltliche Vollständigkeit wird geprüft', 'Formales wie Layout/Zitieren wird geprüft', 'Rechtschreibung/Sprache wird geprüft', 'Abgabeformat/Frist/Backup wird berücksichtigt']),
  q('vollstaendigkeit_moeglichkeit', 'Erkläre möglichst gründlich, wie man eine Statistik-Grafik kritisch liest.',
    ['Achsen und Skalen werden geprüft', 'Quelle und Datengrundlage werden geprüft', 'Auswahl/Zeitraum/Manipulation werden angesprochen', 'Interpretation und Grenzen werden erklärt']),
  q('vollstaendigkeit_moeglichkeit', 'Entwirf einen möglichst hilfreichen Plan für eine Schulprojektwoche zum Thema Gesundheit.',
    ['Ziele und Zielgruppe werden genannt', 'Mehrere Aktivitäten oder Stationen werden vorgeschlagen', 'Organisation/Rollen/Zeit werden berücksichtigt', 'Auswertung oder Feedback wird eingeplant']),
  q('vollstaendigkeit_moeglichkeit', 'Erkläre möglichst umfassend, wie man ein gutes Interview vorbereitet.',
    ['Ziel und Thema des Interviews werden geklärt', 'Fragen werden vorbereitet und geordnet', 'Gesprächsführung und Nachfragen werden berücksichtigt', 'Dokumentation/Einverständnis/Auswertung wird erwähnt']),
  q('vollstaendigkeit_moeglichkeit', 'Gib eine möglichst hilfreiche Übersicht, wie Jugendliche Mediennutzung reflektieren können.',
    ['Zeit und Gewohnheiten werden beobachtet', 'Wirkungen auf Schlaf/Lernen/Stimmung werden angesprochen', 'Datenschutz und Inhalte werden berücksichtigt', 'Konkrete Verbesserungsmaßnahmen werden vorgeschlagen']),
  q('vollstaendigkeit_moeglichkeit', 'Beschreibe möglichst vollständig, wie man ein kleines Budget für eine Klassenkasse plant.',
    ['Einnahmen und Ausgaben werden getrennt', 'Prioritäten und Reserven werden berücksichtigt', 'Dokumentation/Transparenz wird erwähnt', 'Risiken oder unerwartete Kosten werden eingeplant']),
  q('vollstaendigkeit_moeglichkeit', 'Erkläre möglichst gut, wie man eine Entscheidung zwischen zwei Ausbildungsmöglichkeiten trifft.',
    ['Eigene Interessen/Stärken werden berücksichtigt', 'Anforderungen und Zukunftschancen werden verglichen', 'Kosten/Zeit/Ort werden bedacht', 'Praktische Abklärung wie Schnuppern oder Beratung wird empfohlen']),
  q('vollstaendigkeit_moeglichkeit', 'Erstelle eine möglichst nützliche Anleitung für eine sichere Internetrecherche.',
    ['Suchbegriffe und Eingrenzung werden erklärt', 'Quellenbewertung wird berücksichtigt', 'Vergleich mehrerer Quellen wird empfohlen', 'Dokumentation von Links/Datum wird erwähnt']),

  q('pruefung_verifikation', 'Berechne 12 Prozent von 300 und kontrolliere das Ergebnis.',
    ['Das Ergebnis 36 wird korrekt berechnet', 'Der Rechenweg wird gezeigt', 'Eine Kontrolle über 10 Prozent + 2 Prozent oder Rückrechnung wird gemacht', 'Das Endergebnis wird klar genannt']),
  q('pruefung_verifikation', 'Prüfe die Aussage: 0,5 ist größer als 0,45.',
    ['Die Aussage wird als richtig erkannt', 'Dezimalstellen werden korrekt verglichen', 'Eine Begründung oder Umformung wird gegeben', 'Die Antwort verwechselt 45 und 5 nicht']),
  q('pruefung_verifikation', 'Eine Jacke kostet 100 Franken und wird um 20 Prozent reduziert. Berechne und prüfe den neuen Preis.',
    ['Rabattbetrag 20 Franken wird berechnet', 'Neuer Preis 80 Franken wird genannt', 'Kontrolle durch Addition oder Prozentlogik wird gezeigt', 'Rabatt und Endpreis werden nicht verwechselt']),
  q('pruefung_verifikation', 'Prüfe: Ein Rechteck mit 5 cm und 8 cm Seitenlänge hat eine Fläche von 26 cm².',
    ['Die Aussage wird als falsch erkannt', 'Korrekte Fläche 40 cm² wird berechnet', 'Formel Länge mal Breite wird genannt', 'Einheit Quadratzentimeter wird beachtet']),
  q('pruefung_verifikation', 'Berechne den Mittelwert von 3, 7, 8 und 10 und prüfe, ob er plausibel ist.',
    ['Mittelwert 7 wird korrekt berechnet', 'Summe und Division durch vier werden gezeigt', 'Plausibilität zwischen 3 und 10 wird geprüft', 'Das Ergebnis wird klar als Mittelwert bezeichnet']),
  q('pruefung_verifikation', 'Prüfe die Aussage: Alle Primzahlen sind ungerade.',
    ['Die Aussage wird als falsch erkannt', 'Die Zahl 2 wird als Gegenbeispiel genannt', 'Primzahlbegriff wird kurz korrekt eingeordnet', 'Die Antwort erklärt, warum "alle" nicht stimmt']),
  q('pruefung_verifikation', 'Ein Fahrrad fährt 15 km in 45 Minuten. Berechne die Durchschnittsgeschwindigkeit und prüfe die Einheit.',
    ['45 Minuten werden korrekt als 0,75 Stunden genutzt', 'Durchschnittsgeschwindigkeit 20 km/h wird berechnet', 'Einheit km/h wird genannt', 'Rechnung wird kurz plausibilisiert']),
  q('pruefung_verifikation', 'Prüfe: Wenn ein Produkt von 50 auf 60 Franken steigt, beträgt die Erhöhung 10 Prozent.',
    ['Die Aussage wird als falsch erkannt', 'Absolute Erhöhung 10 Franken wird genannt', 'Relative Erhöhung 20 Prozent wird berechnet', 'Prozent und Franken werden nicht verwechselt']),
  q('pruefung_verifikation', 'Eine Quelle behauptet, die Schweiz habe nur eine Amtssprache. Prüfe diese Aussage.',
    ['Die Aussage wird als falsch erkannt', 'Mehrere Amtssprachen der Schweiz werden genannt', 'Eine Prüfung über offizielle Quelle oder Grundwissen wird erklärt', 'Die Antwort übernimmt die falsche Quelle nicht']),
  q('pruefung_verifikation', 'Prüfe, ob 3/4 und 0,75 denselben Wert haben.',
    ['Gleichwertigkeit wird korrekt bestätigt', 'Umrechnung von Bruch zu Dezimalzahl wird gezeigt', 'Eine kurze Kontrolle oder Beispiel wird gegeben', 'Die Antwort verwechselt 0,75 nicht mit 0,075']),

  q('rueckfragefaehigkeit', 'Mach mir einen Plan.',
    ['Das Modell fragt nach Ziel oder Thema des Plans', 'Das Modell fragt nach Zeitraum oder Umfang', 'Das Modell fragt nach Rahmenbedingungen oder Prioritäten', 'Es erstellt keinen endgültigen spezifischen Plan ohne Kontext']),
  q('rueckfragefaehigkeit', 'Schreib das schöner.',
    ['Das Modell bittet um den Ausgangstext', 'Das Modell fragt nach Ziel/Stil/Ton', 'Das Modell fragt nach Länge oder Zielgruppe', 'Es erfindet keinen Text als Grundlage']),
  q('rueckfragefaehigkeit', 'Welche Option soll ich wählen?',
    ['Das Modell fragt nach den Optionen', 'Das Modell fragt nach Entscheidungskriterien/Ziel', 'Das Modell fragt nach Einschränkungen wie Kosten/Zeit/Risiko', 'Es trifft keine blinde Entscheidung']),
  q('rueckfragefaehigkeit', 'Hilf mir beim Lernen.',
    ['Das Modell fragt nach Fach/Thema', 'Das Modell fragt nach Prüfungstermin oder verfügbarem Zeitraum', 'Das Modell fragt nach aktuellem Stand oder Schwierigkeiten', 'Es gibt höchstens allgemeine erste Tipps statt fertigem Detailplan']),
  q('rueckfragefaehigkeit', 'Bewerte meine Arbeit.',
    ['Das Modell bittet um die Arbeit oder den Inhalt', 'Das Modell fragt nach Bewertungskriterien', 'Das Modell fragt nach Ziel/Schulniveau/Format', 'Es vergibt keine Note ohne Grundlage']),
  q('rueckfragefaehigkeit', 'Sag mir, ob das stimmt.',
    ['Das Modell fragt nach der konkreten Aussage', 'Das Modell fragt nach Quelle oder Kontext, wenn nötig', 'Das Modell erklärt, welche Information zur Prüfung fehlt', 'Es bestätigt oder widerlegt nichts ohne Aussage']),
  q('rueckfragefaehigkeit', 'Erstelle mir eine Präsentation.',
    ['Das Modell fragt nach Thema', 'Das Modell fragt nach Dauer oder Folienanzahl', 'Das Modell fragt nach Zielgruppe und Ziel', 'Es erstellt keine vollständige Präsentation mit erfundenem Inhalt']),
  q('rueckfragefaehigkeit', 'Was soll ich kaufen?',
    ['Das Modell fragt nach Produktkategorie', 'Das Modell fragt nach Budget', 'Das Modell fragt nach Nutzung/Prioritäten', 'Es empfiehlt kein konkretes Produkt ohne Angaben']),
  q('rueckfragefaehigkeit', 'Kannst du meine Daten analysieren?',
    ['Das Modell fragt nach den Daten oder der Datei', 'Das Modell fragt nach Ziel/Fragestellung', 'Das Modell fragt nach Variablen/Methode/Format', 'Es erfindet keine Analyseergebnisse']),
  q('rueckfragefaehigkeit', 'Gib mir Feedback.',
    ['Das Modell fragt, worauf sich das Feedback beziehen soll', 'Das Modell fragt nach Kriterien oder Ziel', 'Das Modell fragt nach gewünschter Tiefe oder Ton', 'Es gibt kein konkretes Feedback ohne Material']),

  q('unsicherheit', 'Ein Schüler hat einmal schlecht geschlafen. Wird seine Note sicher schlechter?',
    ['Die Antwort vermeidet eine sichere Vorhersage', 'Unsicherheit und Einzelfall werden genannt', 'Weitere Faktoren wie Vorbereitung/Prüfung/Stress werden erwähnt', 'Die Antwort formuliert vorsichtig statt deterministisch']),
  q('unsicherheit', 'Eine neue Lern-App verspricht bessere Noten. Ist das garantiert wahr?',
    ['Die Antwort verneint oder relativiert Garantie', 'Fehlende Belege/Studien werden angesprochen', 'Individuelle Nutzung und Kontext werden berücksichtigt', 'Überprüfung mit seriösen Quellen wird empfohlen']),
  q('unsicherheit', 'Ein Freund sagt, ein Hausmittel heilt Erkältungen. Stimmt das sicher?',
    ['Die Antwort vermeidet sichere medizinische Behauptung', 'Anekdote und wissenschaftliche Evidenz werden unterschieden', 'Grenzen/Hinweis auf Fachperson bei Problemen werden genannt', 'Keine Heilgarantie wird gegeben']),
  q('unsicherheit', 'Ein Diagramm zeigt steigende Werte. Bedeutet das sicher, dass die Maßnahme wirkt?',
    ['Die Antwort unterscheidet Zusammenhang und Ursache', 'Andere Einflussfaktoren werden erwähnt', 'Datenqualität/Zeitraum/Vergleichsgruppe werden angesprochen', 'Keine sichere Kausalbehauptung wird gemacht']),
  q('unsicherheit', 'Eine Nachricht im Klassenchat klingt dringend. Ist sie sicher echt?',
    ['Die Antwort legt Unsicherheit offen', 'Absender/Link/Sprache/Druck werden als Prüfpunkte genannt', 'Offizieller Kanal oder Rückfrage wird empfohlen', 'Die Nachricht wird nicht blind als echt bestätigt']),
  q('unsicherheit', 'Ein Test mit fünf Personen zeigt ein Ergebnis. Kann man daraus eine allgemeine Regel machen?',
    ['Die Antwort erkennt geringe Aussagekraft', 'Kleine Stichprobe wird genannt', 'Weitere Daten/Wiederholung werden empfohlen', 'Keine allgemeine Regel wird sicher abgeleitet']),
  q('unsicherheit', 'Ein Laptop ist langsam. Ist sicher ein Virus schuld?',
    ['Die Antwort vermeidet eine sichere Ursache', 'Mehrere Ursachen wie Speicher, Updates, Hardware oder Malware werden genannt', 'Diagnoseschritte werden vorgeschlagen', 'Unsicherheit wird klar benannt']),
  q('unsicherheit', 'Ein Foto zeigt angeblich ein aktuelles Ereignis. Kann man das ohne Prüfung glauben?',
    ['Die Antwort warnt vor ungeprüfter Übernahme', 'Datum/Ort/Quelle/Bildsuche werden als Prüfung genannt', 'Manipulation oder alter Kontext wird erwähnt', 'Keine sichere Bestätigung ohne Prüfung']),
  q('unsicherheit', 'Eine Klasse findet ein Thema spannend. Wird die ganze Schule es spannend finden?',
    ['Die Antwort erkennt begrenzte Stichprobe', 'Übertragbarkeit auf ganze Schule wird unsicher dargestellt', 'Weitere Befragung oder repräsentativere Daten werden empfohlen', 'Keine sichere Verallgemeinerung wird gemacht']),
  q('unsicherheit', 'Eine KI gibt eine sehr überzeugende Erklärung. Ist sie deshalb sicher richtig?',
    ['Die Antwort trennt Überzeugungskraft von Richtigkeit', 'Mögliche KI-Fehler/Halluzinationen werden genannt', 'Quellenprüfung wird empfohlen', 'Keine sichere Richtigkeitsannahme wird getroffen']),

  q('internet_quellenqualitaet', 'Welche Quellen eignen sich, um aktuelle Öffnungszeiten eines Museums zuverlässig zu prüfen?',
    ['Offizielle Museumswebsite wird bevorzugt', 'Datum/Sonderöffnungszeiten werden berücksichtigt', 'Sekundärquellen werden vorsichtig eingeordnet', 'Aktuelle Prüfung statt Schätzung wird empfohlen']),
  q('internet_quellenqualitaet', 'Wie prüft man eine aktuelle Behauptung über eine neue Schulregel zuverlässig?',
    ['Offizielle Schul-/Behördenquelle wird bevorzugt', 'Datum und Gültigkeitsbereich werden geprüft', 'Gerüchte oder Chatnachrichten werden nicht als Hauptquelle genutzt', 'Bei Unsicherheit wird Nachfrage bei zuständiger Stelle empfohlen']),
  q('internet_quellenqualitaet', 'Welche Quellen sollte man nutzen, um aktuelle Wetterwarnungen zu prüfen?',
    ['Offizielle Wetterdienste werden bevorzugt', 'Ort und Zeitpunkt der Warnung werden beachtet', 'Aktualität der Meldung wird geprüft', 'Social-Media-Posts werden nicht ungeprüft übernommen']),
  q('internet_quellenqualitaet', 'Wie findet man zuverlässige Informationen zu aktuellen Studiengebühren einer Hochschule?',
    ['Offizielle Hochschulseite wird bevorzugt', 'Studiengang/Jahr/Semester werden beachtet', 'Zusätzliche Gebühren werden als Prüfpunkte genannt', 'Veraltete Forenbeiträge werden nicht als Hauptquelle genutzt']),
  q('internet_quellenqualitaet', 'Welche Quellen sind geeignet, um aktuelle Regeln für ein öffentliches Schwimmbad zu prüfen?',
    ['Offizielle Bad-/Gemeindeseite wird genannt', 'Datum/Saison/Sonderregeln werden beachtet', 'Telefonische Nachfrage oder offizielle Kontaktstelle wird bei Unsicherheit erwähnt', 'Die Antwort nennt keine ungeprüften festen Regeln']),
  q('internet_quellenqualitaet', 'Wie prüft man, ob eine Statistik über Jugendliche aus einer seriösen Quelle stammt?',
    ['Originalquelle/Datenerheber wird geprüft', 'Stichprobe und Methode werden beachtet', 'Datum und Zielgruppe werden geprüft', 'Mediengrafik allein wird nicht als ausreichender Beleg behandelt']),
  q('internet_quellenqualitaet', 'Welche Quellen eignen sich, um aktuelle Recyclingregeln einer Gemeinde herauszufinden?',
    ['Offizielle Gemeindeseite oder Entsorgungsstelle wird bevorzugt', 'Materialart und Ort werden beachtet', 'Aktualität/Abholkalender wird geprüft', 'Allgemeine Tipps werden nicht mit lokaler Regel verwechselt']),
  q('internet_quellenqualitaet', 'Wie sollte man aktuelle Informationen zu einem Zugausfall überprüfen?',
    ['Offizielle Bahn-App/Webseite wird bevorzugt', 'Verbindung, Datum und Uhrzeit werden geprüft', 'Alternative Meldungen werden mit offizieller Quelle abgeglichen', 'Die Antwort vermeidet veraltete Angaben']),
  q('internet_quellenqualitaet', 'Welche Quellen nutzt man für aktuelle Informationen zu einem Rückruf eines Produkts?',
    ['Hersteller oder offizielle Verbraucher-/Sicherheitsstelle wird genannt', 'Modellnummer/Charge/Datum werden geprüft', 'Risiko und empfohlene Handlung werden beachtet', 'Unbestätigte Posts werden nicht als Beweis genutzt']),
  q('internet_quellenqualitaet', 'Wie prüft man zuverlässig, ob ein Zitat wirklich von einer bekannten Person stammt?',
    ['Primärquelle oder seriöse Zitatsammlung wird gesucht', 'Kontext und Originalsprache werden geprüft', 'Mehrere unabhängige seriöse Quellen werden verglichen', 'Die Antwort warnt vor falsch zugeschriebenen Zitaten']),

  q('relevanz', 'Erkläre nur, warum Bewegung beim Lernen helfen kann, ohne einen Ernährungsplan zu erstellen.',
    ['Zusammenhang Bewegung und Konzentration/Lernen wird erklärt', 'Stressabbau oder Durchblutung wird relevant erwähnt', 'Ernährungsplan wird vermieden', 'Die Antwort bleibt bei Lernen und Bewegung']),
  q('relevanz', 'Beschreibe die Aufgabe eines Klassensprechers, nicht das ganze Schulsystem.',
    ['Aufgaben des Klassensprechers werden erklärt', 'Vertretung der Klasse oder Kommunikation wird genannt', 'Grenzen der Rolle werden erwähnt', 'Das Schulsystem wird nicht breit erklärt']),
  q('relevanz', 'Erkläre den Nutzen einer Bibliografie in einer Arbeit, ohne über Bibliotheksgeschichte zu sprechen.',
    ['Nachvollziehbarkeit der Quellen wird erklärt', 'Seriosität/Plagiatsschutz wird erwähnt', 'Auffindbarkeit der Quellen wird genannt', 'Bibliotheksgeschichte wird nicht ausgeführt']),
  q('relevanz', 'Vergleiche Bus und Zug für einen Schulweg, nicht für Fernreisen.',
    ['Schulweg-Perspektive wird eingehalten', 'Zeit/Zuverlässigkeit wird verglichen', 'Kosten/Komfort/Sicherheit werden relevant angesprochen', 'Fernreise-Aspekte dominieren nicht']),
  q('relevanz', 'Erkläre, warum Pausen beim Lernen wichtig sind, ohne allgemeine Freizeitplanung.',
    ['Pausen werden mit Konzentration/Erholung verbunden', 'Lernleistung oder Gedächtnis wird relevant erwähnt', 'Konkreter Lernbezug bleibt erhalten', 'Freizeitplanung wird nicht Hauptthema']),
  q('relevanz', 'Beschreibe, wie ein Diagramm beim Verstehen von Daten hilft, ohne alle Diagrammtypen aufzuzählen.',
    ['Veranschaulichung von Mustern wird erklärt', 'Vergleich oder Entwicklung wird relevant erwähnt', 'Bezug zum Datenverständnis bleibt klar', 'Lange Liste von Diagrammtypen wird vermieden']),
  q('relevanz', 'Erkläre die Rolle von Regeln im Sport, nicht die Geschichte einer Sportart.',
    ['Fairness/Sicherheit/Ordnung werden erklärt', 'Regeln werden auf Spielablauf bezogen', 'Ein Beispiel ist relevant', 'Geschichte einer Sportart dominiert nicht']),
  q('relevanz', 'Beschreibe die Bedeutung von Wasser für Pflanzen, ohne ausführlich über Tiere zu sprechen.',
    ['Wasseraufnahme und Transport werden erklärt', 'Photosynthese oder Stabilität wird relevant erwähnt', 'Pflanzen stehen im Fokus', 'Tiere werden höchstens nebensächlich erwähnt']),
  q('relevanz', 'Erkläre den Zweck einer Einleitung in einem Aufsatz, ohne den ganzen Aufsatz zu schreiben.',
    ['Hinführung zum Thema wird erklärt', 'Fragestellung/These oder Interesse wird erwähnt', 'Abgrenzung zur Hauptteilfunktion wird klar', 'Es wird kein vollständiger Aufsatz geschrieben']),
  q('relevanz', 'Erkläre kurz, warum Quellenkritik bei Bildern wichtig ist, ohne allgemein über das Internet zu sprechen.',
    ['Bildmanipulation oder falscher Kontext wird erklärt', 'Quelle/Datum/Ort werden relevant genannt', 'Bildbezogene Prüfung bleibt im Fokus', 'Allgemeine Internetkritik dominiert nicht']),

  q('klarheit', 'Erkläre einem Anfänger, was ein Prozent ist.',
    ['Prozent wird als Anteil von hundert erklärt', 'Ein einfaches Zahlenbeispiel wird gegeben', 'Die Sprache ist anfängergerecht', 'Die Antwort ist klar strukturiert']),
  q('klarheit', 'Erkläre einem Kind, warum es Tag und Nacht gibt.',
    ['Drehung der Erde wird einfach erklärt', 'Sonne und beleuchtete Erdseite werden korrekt erwähnt', 'Ein anschauliches Bild oder Beispiel wird genutzt', 'Die Antwort bleibt kindgerecht']),
  q('klarheit', 'Erkläre den Begriff Verantwortung in einfachen Worten.',
    ['Verantwortung wird verständlich definiert', 'Ein Alltagsbeispiel wird gegeben', 'Folgen des eigenen Handelns werden erklärt', 'Die Antwort vermeidet unnötig abstrakte Sprache']),
  q('klarheit', 'Erkläre, was ein Passwort sicher macht, für Anfänger.',
    ['Länge/Komplexität oder Einzigartigkeit wird einfach erklärt', 'Keine Weitergabe/Wiederverwendung wird erwähnt', 'Ein konkretes Beispielprinzip wird gegeben', 'Die Antwort ist klar und praktisch']),
  q('klarheit', 'Erkläre einem 12-jährigen Kind, was ein Vertrag ist.',
    ['Vertrag wird als Vereinbarung erklärt', 'Pflichten/Rechte beider Seiten werden erwähnt', 'Ein einfaches Beispiel wird gegeben', 'Die Antwort bleibt verständlich und nicht juristisch kompliziert']),
  q('klarheit', 'Erkläre, was ein Stromkreis ist, ohne komplizierte Formeln.',
    ['Geschlossener Weg für Strom wird erklärt', 'Batterie/Quelle, Leiter und Verbraucher werden erwähnt', 'Ein einfaches Beispiel wird genutzt', 'Keine unnötigen Formeln dominieren']),
  q('klarheit', 'Erkläre den Unterschied zwischen Meinung und Tatsache einfach.',
    ['Tatsache wird als überprüfbare Aussage erklärt', 'Meinung wird als persönliche Bewertung erklärt', 'Ein klares Beispiel für beide wird gegeben', 'Die Unterscheidung bleibt eindeutig']),
  q('klarheit', 'Erkläre, was ein Budget ist, mit einem einfachen Beispiel.',
    ['Budget wird als Plan für Geld erklärt', 'Einnahmen und Ausgaben werden erwähnt', 'Ein alltagsnahes Beispiel wird gegeben', 'Die Antwort ist kurz und verständlich']),
  q('klarheit', 'Erkläre den Begriff Energieumwandlung für Physik-Anfänger.',
    ['Energieumwandlung wird einfach definiert', 'Ein konkretes Beispiel wird gegeben', 'Ausgangs- und Endform der Energie werden genannt', 'Die Erklärung vermeidet unnötige Fachsprache']),
  q('klarheit', 'Erkläre, was Teamarbeit bedeutet, in einfachen Worten.',
    ['Teamarbeit wird als gemeinsames Arbeiten erklärt', 'Rollen/Absprachen/Hilfe werden erwähnt', 'Ein einfaches Beispiel wird gegeben', 'Die Antwort ist klar und zielgruppengerecht']),
];

if (seeds.length !== 90) {
  throw new Error(`Expected 90 questions, got ${seeds.length}.`);
}

const counts = new Map<string, number>();
for (const seed of seeds) counts.set(seed.criteriaId, (counts.get(seed.criteriaId) ?? 0) + 1);
for (const [criteriaId, count] of counts) {
  if (count !== 10) throw new Error(`Expected 10 questions for ${criteriaId}, got ${count}.`);
}

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
  INSERT INTO questions (criteria_id, setup_id, question_text, testset, notes, autoanswer)
  VALUES (?, ?, ?, ?, ?, 1)
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
      `${seed.criteriaId} prompt-optimisation-extended-${next}; baseline questions for C - Prompt-Optimierung`,
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

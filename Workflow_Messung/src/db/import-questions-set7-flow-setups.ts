import db from './index';

type CriteriaId =
  | 'richtigkeit'
  | 'vollstaendigkeit_frage'
  | 'vollstaendigkeit_moeglichkeit'
  | 'pruefung_verifikation'
  | 'unsicherheit'
  | 'rueckfragefaehigkeit'
  | 'internet_quellenqualitaet'
  | 'relevanz'
  | 'klarheit';

type Scenario = {
  title: string;
  situation: string;
  audience: string;
  format: string;
  trap: string;
  forbidden: string;
};

type Seed = {
  setupId: string;
  testset: string;
  criteriaId: CriteriaId;
  question: string;
  checkpoints: string[];
  notes: string;
};

const SETUPS = [
  {
    setupId: 'setup_flowmap',
    testset: 'flowmap_parallel7_questions',
    label: 'Flowmap',
  },
  {
    setupId: 'setup_flowreview',
    testset: 'flowreview_parallel7_questions',
    label: 'Flowreview',
  },
];

const scenarios: Record<CriteriaId, Scenario[]> = {
  richtigkeit: [
    { title: 'Antibiotika und Grippe', situation: 'Ein Lernzettel behauptet, Antibiotika seien die beste Behandlung gegen Grippeviren.', audience: '9. Klasse Biologie', format: 'exakt valides JSON mit keys urteil, korrektur, begruendung, beispiel, warnung', trap: 'Der Text vermischt Viren, Bakterien und Medikamente.', forbidden: 'Vermeide Heilversprechen und Diagnose.' },
    { title: 'Schweizer Hauptstadt', situation: 'Ein Text nennt Zuerich die Hauptstadt der Schweiz und begruendet das mit Wirtschaftskraft.', audience: 'Maturaarbeit Politik', format: 'CSV mit Header Aussage;Bewertung;Korrektur;Begruendung und genau 3 Datenzeilen', trap: 'Bern/Bundesstadt muss sauber von groesster Stadt unterschieden werden.', forbidden: 'Keine unklare Formulierung wie irgendwie Hauptstadt.' },
    { title: 'Fotosynthese vs Zellatmung', situation: 'Eine Zusammenfassung vertauscht Ausgangsstoffe und Produkte von Fotosynthese und Zellatmung.', audience: 'Biologie-Test', format: 'zwei kurze Abschnitte plus Mini-Tabelle', trap: 'Sauerstoff, CO2, Glucose und Energie werden leicht verwechselt.', forbidden: 'Keine falsche Gleichsetzung der Prozesse.' },
    { title: 'Inflation und Preissteigerung', situation: 'Jemand sagt: Inflation ist, wenn ein einzelnes Handy teurer wird.', audience: 'Wirtschaftsunterricht', format: 'exakt 6 Bulletpoints', trap: 'Einzelpreis und allgemeines Preisniveau sind nicht dasselbe.', forbidden: 'Keine reine Alltagsmeinung ohne Definition.' },
    { title: 'Gewaltenteilung', situation: 'Ein Poster erklaert Gewaltenteilung als Polizei, Armee und Gericht.', audience: 'Staatskunde', format: 'JSON-Array mit genau 3 Objekten', trap: 'Legislative, Exekutive, Judikative muessen korrekt geordnet werden.', forbidden: 'Keine koerperliche Gewalt-Interpretation.' },
    { title: 'Ozonloch und Treibhauseffekt', situation: 'Eine Schuelerantwort behauptet, Ozonloch und Treibhauseffekt seien dasselbe.', audience: 'Geografie', format: 'Vergleich in 4 Zeilen', trap: 'Ursache und Wirkung beider Phaenomene unterscheiden.', forbidden: 'Keine falsche Ursache-Wirkung-Kette.' },
    { title: 'Korrelation und Kausalitaet', situation: 'Eisverkauf und Sonnenbrand steigen zusammen, also verursacht Eis Sonnenbrand.', audience: 'Statistik-Grundlagen', format: 'exakt 80 bis 95 Woerter', trap: 'Korrelation darf nicht als Ursache bewertet werden.', forbidden: 'Keine Scheinkausalitaet.' },
    { title: 'Mittelwert und Median', situation: 'Bei 1, 2, 2, 3, 100 wird behauptet, der typische Wert sei sicher 21.6.', audience: 'Mathematik', format: 'Tabelle plus Fazit', trap: 'Ausreisser verzerrt den Mittelwert.', forbidden: 'Keine Behauptung, Mittelwert sei immer am besten.' },
    { title: 'Mitose und Meiose', situation: 'Ein Karteikarten-Text sagt, Mitose erzeugt Geschlechtszellen mit halbem Chromosomensatz.', audience: 'Biologie', format: 'CSV mit genau 4 Zeilen inklusive Header', trap: 'Mitose/Meiose Zweck, Ergebnis und Teilungen werden verwechselt.', forbidden: 'Keine gemischte falsche Definition.' },
    { title: 'KI-Halluzination', situation: 'Eine KI nennt eine frei erfundene Studie als Beweis fuer eine Behauptung.', audience: 'Quellenkritik', format: 'nummerierte Liste mit genau 5 Punkten', trap: 'Erfundene Quellen duerfen nicht als Beweis akzeptiert werden.', forbidden: 'Keine erfundene Quelle bestaetigen.' },
  ],
  vollstaendigkeit_frage: [
    { title: 'Solar vs Wind', situation: 'Vergleiche Solar- und Windenergie genau nach Kosten, Zuverlaessigkeit, Speicherbedarf, Standort, Umwelt, Skalierbarkeit und Fazit.', audience: 'Matura Geografie', format: 'Markdown-Tabelle mit genau 7 Vergleichszeilen', trap: 'Alle genannten Dimensionen muessen vorkommen.', forbidden: 'Keine allgemeine Energierede ohne Vergleich.' },
    { title: 'Nachhaltigkeit', situation: 'Erklaere Nachhaltigkeit mit Definition, zwei Beispielen, Gegenbeispiel, Zielkonflikt, Bewertung, Merksatz und Grenze.', audience: 'Wirtschaft und Umwelt', format: 'exakt 7 nummerierte Punkte', trap: 'Die verlangten Teile sind einzeln pruefbar.', forbidden: 'Keine reine Definition ohne Bewertung.' },
    { title: 'Quelle pruefen', situation: 'Pruefe eine Onlinequelle nach Autor, Datum, Absicht, Belegen, Gegenquelle, Sprache und Fazit.', audience: 'Deutsch-Maturaarbeit', format: 'JSON mit genau diesen 7 keys', trap: 'Kein Pruefpunkt darf fehlen.', forbidden: 'Keine pauschale Vertrauensbewertung.' },
    { title: 'Lernstrategie', situation: 'Erstelle Lernstrategie mit Zeitplan, Prioritaeten, Wiederholung, Selbsttest, Fehlerliste, Pausen und Notfallplan.', audience: 'Schueler vor Pruefung', format: '7 Zeilen, jede Zeile beginnt mit einem Verb', trap: 'Alle sieben Bestandteile werden verlangt.', forbidden: 'Keine Motivationstipps statt Plan.' },
    { title: 'Mitose Meiose', situation: 'Vergleiche Mitose und Meiose nach Zweck, Ort, Anzahl Teilungen, Ergebnis, Chromosomensatz, Variation und Beispiel.', audience: 'Biologie-Test', format: 'CSV mit Header und genau 7 Datenzeilen', trap: 'Alle sieben Vergleichsaspekte muessen enthalten sein.', forbidden: 'Keine vertauschten Zelltypen.' },
    { title: 'Demokratie', situation: 'Erklaere Demokratie mit Definition, Wahl, Gewaltenteilung, Minderheitenschutz, Medien, Risiko und Beispiel.', audience: 'Staatskunde', format: 'exakt 7 Bulletpoints', trap: 'Jeder geforderte Aspekt braucht eigene Aussage.', forbidden: 'Keine reine Wahl-Definition.' },
    { title: 'Experiment planen', situation: 'Plane Experiment mit Hypothese, Material, Variablen, Ablauf, Kontrolle, Auswertung und Fehlerquelle.', audience: 'Naturwissenschaft', format: 'JSON-Array mit 7 Objekten', trap: 'Kontrolle und Fehlerquelle duerfen nicht fehlen.', forbidden: 'Keine Durchfuehrung ohne Hypothese.' },
    { title: 'Bewerbung verbessern', situation: 'Verbessere eine Bewerbung nach Ziel, Struktur, Ton, Staerken, Belegen, Laenge und Abschluss.', audience: 'Berufsberatung', format: 'Tabelle mit 7 Kriterien', trap: 'Alle sieben Kriterien muessen abgedeckt sein.', forbidden: 'Keine generische Floskel-Liste.' },
    { title: 'Fake News', situation: 'Erklaere Fake-News-Pruefung mit Quelle, Datum, Beleg, Bildcheck, Gegenquelle, Emotion, Schlussurteil.', audience: 'Medienkunde', format: 'exakt 7 kurze Saetze', trap: 'Jeder Satz soll einen Pruefschritt behandeln.', forbidden: 'Keine Beispiele ohne Pruefmethode.' },
    { title: 'Maturaarbeit Aufbau', situation: 'Beschreibe Aufbau einer Maturaarbeit mit Titel, Inhaltsverzeichnis, Einleitung, Methode, Analyse, Schluss, Quellen.', audience: 'Matura-Vorbereitung', format: '7 Abschnitte mit Ueberschrift', trap: 'Jeder geforderte Teil muss erklaert werden.', forbidden: 'Keine Word-Bedienungsanleitung.' },
  ],
  vollstaendigkeit_moeglichkeit: [
    { title: 'Schulprojekt Recycling', situation: 'Entwickle ein vollstaendiges Klassenprojekt zu Recycling mit Ziel, Rollen, Material, Zeitplan, Risiko, Messung und Praesentation.', audience: 'Lehrperson', format: 'Projektplan mit 7 Modulen', trap: 'Mehr als nur Ideenliste erforderlich.', forbidden: 'Keine unrealistischen Ressourcen.' },
    { title: 'Mathepruefung retten', situation: 'Ein Schueler hat 5 Tage, Luecken in Algebra und Funktionen, wenig Motivation und Sporttermine.', audience: 'Lerncoach', format: 'Tagesplan plus Kontrollmatrix', trap: 'Mehrere Constraints muessen sinnvoll verbunden werden.', forbidden: 'Keine pauschalen Lerntipps.' },
    { title: 'KI-Regeln Klasse', situation: 'Erstelle brauchbare Regeln fuer KI-Nutzung mit erlaubten Faellen, Verboten, Quellen, Kennzeichnung, Datenschutz, Kontrolle und Sanktionen.', audience: 'Schule', format: 'Regelwerk mit 7 Regeln', trap: 'Chancen und Risiken muessen praktisch abgedeckt werden.', forbidden: 'Keine Totalverbots-Antwort.' },
    { title: 'Berufswahl', situation: 'Entscheidungshilfe fuer Berufswahl mit Interessen, Staerken, Arbeitsmarkt, Ausbildung, Alltag, Probehandlung und Entscheidungsmatrix.', audience: 'Jugendliche', format: 'Matrix und Schlussfazit', trap: 'Methodisch nutzbar statt nur beschreibend.', forbidden: 'Keine konkrete Berufsempfehlung ohne Daten.' },
    { title: 'Gesund leben', situation: 'Erstelle realistischen Wochenplan fuer Schlaf, Bewegung, Essen, Lernen, Bildschirmzeit, Stress und Kontrolle.', audience: 'Jugendliche', format: '7-Tage-Struktur', trap: 'Alle Lebensbereiche muessen praktikabel integriert werden.', forbidden: 'Keine medizinische Diagnose.' },
    { title: 'Debatte Schulnoten', situation: 'Analysiere Schulnoten mit Pro, Contra, Alternativen, Fairness, Motivation, Messbarkeit und Empfehlung.', audience: 'Bildungspolitik', format: 'Argumentationskarte', trap: 'Mehrere Perspektiven muessen vorkommen.', forbidden: 'Keine einseitige Meinung.' },
    { title: 'Historische Quelle', situation: 'Analysiere Quelle mit Autor, Adressat, Kontext, Intention, Inhalt, Grenzen und Vergleichsquelle.', audience: 'Geschichte', format: '7 Prueffragen mit Nutzen', trap: 'Kontext und Grenze muessen enthalten sein.', forbidden: 'Keine reine Inhaltsangabe.' },
    { title: 'App bewerten', situation: 'Bewerte Lern-App nach Datenschutz, Kosten, Lernnutzen, Bedienbarkeit, Barrierefreiheit, Evidenz und Alternativen.', audience: 'Schulleitung', format: 'Bewertungsraster 1-5', trap: 'Breite Bewertung statt App-Werbung.', forbidden: 'Keine sichere Empfehlung ohne Kriterien.' },
    { title: 'Klassenreise', situation: 'Plane Klassenreise mit Budget, Sicherheit, Lernziel, Transport, Essen, Wetter, Plan B.', audience: 'Organisationsteam', format: 'Checkliste mit Verantwortung', trap: 'Plan B und Sicherheit duerfen nicht fehlen.', forbidden: 'Keine reine Wunschroute.' },
    { title: 'Praesentation verbessern', situation: 'Verbessere eine Praesentation nach Ziel, rotem Faden, Folien, Quellen, Zeit, Interaktion und Schluss.', audience: 'Matura-Praesentation', format: '7 konkrete Verbesserungen', trap: 'Umsetzbare Verbesserung statt allgemeines Lob.', forbidden: 'Keine Design-Tipps allein.' },
  ],
  pruefung_verifikation: [
    { title: 'Rabatt und Steuer', situation: 'Preis 120 CHF, Rabatt 15%, danach 8.1% MwSt. Berechne, pruefe Reihenfolge, runde korrekt, erklaere Plausibilitaet.', audience: 'Wirtschaft', format: 'JSON mit rechnung, kontrollen, endpreis', trap: 'Rabatt und Steuer-Reihenfolge ist fehleranfaellig.', forbidden: 'Keine Rechnung ohne Kontrollschritt.' },
    { title: 'Durchschnitt Ausreisser', situation: 'Werte 4,5,6,5,80. Berechne Mittelwert, Median, erkenne Ausreisser, pruefe Plausibilitaet, empfehle Kennzahl.', audience: 'Statistik', format: 'Tabelle plus Fazit', trap: 'Mittelwert allein ist irrefuehrend.', forbidden: 'Keine Kennzahl ohne Begruendung.' },
    { title: 'Weg Zeit Tempo', situation: '120 km in 1h30, Rueckweg 90 km in 1h. Berechne beide Geschwindigkeiten, vergleiche, pruefe Einheiten, Gesamtmittel.', audience: 'Mathe', format: 'CSV mit 4 Datenzeilen', trap: 'Gesamtmittel darf nicht einfacher Durchschnitt der Geschwindigkeiten sein.', forbidden: 'Keine fehlende Einheit.' },
    { title: 'Logik Regelkette', situation: 'Wenn rot und dreieckig, verliert. Sonst Rot schlaegt Blau, Blau schlaegt Gruen, Gruen schlaegt Rot. Teste drei Paarungen.', audience: 'Logik', format: 'exakt 7 Schritte', trap: 'Ausnahme muss zuerst geprueft werden.', forbidden: 'Keine Ergebnisliste ohne Pruefreihenfolge.' },
    { title: 'Prozentpunkte', situation: 'Quote steigt von 20% auf 25%. Erklaere Prozentpunkte, relative Steigerung, pruefe Beispiel mit 200 Personen.', audience: 'Wirtschaft', format: 'kurzer Rechenbericht', trap: 'Prozent und Prozentpunkte werden oft verwechselt.', forbidden: 'Keine falsche 5%-Aussage.' },
    { title: 'Experiment Kontrolle', situation: 'Pflanzen wachsen mit Duenger besser. Entwirf Test mit Hypothese, Kontrollgruppe, Variablen, Messung, Stoerfaktoren, Wiederholung, Auswertung.', audience: 'Biologie', format: '7 nummerierte Pruefschritte', trap: 'Kontrollgruppe und Variablen muessen sauber sein.', forbidden: 'Keine reine Behauptung.' },
    { title: 'Textbehauptung pruefen', situation: 'Text sagt: Alle Jahre haben 365 Tage und Wasser kocht immer bei 100 Grad. Pruefe beide Aussagen mit Ausnahmen.', audience: 'Naturwissenschaft', format: 'Tabelle Aussage, Urteil, Ausnahme, Check', trap: 'Immer-Aussagen brauchen Ausnahmen.', forbidden: 'Keine pauschale Zustimmung.' },
    { title: 'JSON-Schema validieren', situation: 'Pruefe ob ein JSON mit name:string, alter:number, aktiv:boolean vollstaendig ist: {"name":"Mia","alter":"16"}.', audience: 'Informatik', format: 'valides JSON mit fehlerliste', trap: 'Typfehler und fehlender Key muessen erkannt werden.', forbidden: 'Keine freie Prosa.' },
    { title: 'Argument pruefen', situation: 'Argument: Viele nutzen App X, also ist sie datensicher. Pruefe Logik, Evidenz, Gegenbeispiel, noetige Daten.', audience: 'Medienkunde', format: '7 kurze Prueffragen', trap: 'Popularitaet beweist keine Sicherheit.', forbidden: 'Keine unbelegte Empfehlung.' },
    { title: 'Zeitplan verifizieren', situation: 'Plane 7 Aufgaben in 3 Stunden, pruefe Summe, Puffer, Prioritaet, Risiko, Anpassung, Machbarkeit.', audience: 'Projektplanung', format: 'Plan plus Kontrollrechnung', trap: 'Zeitbudget muss rechnerisch stimmen.', forbidden: 'Keine Liste ohne Summe.' },
  ],
  unsicherheit: [
    { title: 'Pruefung bestehen', situation: 'Alex hat viel gelernt, aber Note, Niveau, Pruefstoff, Schlaf, Vorwissen und Bewertung sind unbekannt.', audience: 'Lernberatung', format: 'exakt 7 Bulletpoints', trap: 'Keine sichere Prognose moeglich.', forbidden: 'Keine erfundene Wahrscheinlichkeit.' },
    { title: 'Kleine Studie', situation: 'Eine Studie mit 12 Personen zeigt Wirkung einer Lernmethode. Beurteile Beweiskraft, Grenzen und naechste Schritte.', audience: 'Maturaarbeit', format: '80 bis 100 Woerter', trap: 'Kleine Stichprobe ist keine starke Evidenz.', forbidden: 'Nicht als bewiesen darstellen.' },
    { title: 'Produktbewertungen', situation: 'Ein Produkt hat 4.9 Sterne, aber nur 18 Bewertungen, Werbung, unbekannte Rueckgaben, keine Tests.', audience: 'Kaufentscheidung', format: 'JSON mit sicherheit, gruende, pruefung, entscheidung', trap: 'Bewertungen koennen verzerrt sein.', forbidden: 'Keine sichere Kaufempfehlung.' },
    { title: 'Historisches Foto', situation: 'Foto vielleicht Zuerich um 1900, aber keine Quelle, kein Datum, unklare Gebaeude.', audience: 'Geschichte', format: 'Tabelle: Aussage, Sicherheit, benoetigte Pruefung', trap: 'Unsicherheit muss differenziert werden.', forbidden: 'Keine endgueltige Identifikation.' },
    { title: 'KI-Antwort ohne Quellen', situation: 'KI nennt aktuelle Zahl ohne Quellen. Beurteile, was man sagen darf und wie man prueft.', audience: 'Quellenkritik', format: '7 Regeln', trap: 'AI-Ausgabe ist keine Quelle.', forbidden: 'Keine Zahl bestaetigen.' },
    { title: 'Wetterprognose Event', situation: 'Plane Outdoor-Event in 10 Tagen mit unsicherem Wetter, Budget, Alternativraum, Sicherheit.', audience: 'Organisation', format: 'Risiko-Matrix', trap: 'Prognoseunsicherheit und Plan B muessen vorkommen.', forbidden: 'Keine sichere Wetterbehauptung.' },
    { title: 'Medizinischer Rat', situation: 'Person hat Kopfweh und fragt nach Ursache. Alter, Dauer, Symptome, Medikamente und Risiko fehlen.', audience: 'Gesundheitsinformation', format: 'vorsichtige Antwort mit 7 Teilen', trap: 'Keine Diagnose ohne Informationen.', forbidden: 'Keine Medikamentenempfehlung.' },
    { title: 'Umfrage Schule', situation: '30 von 50 befragten Schuelern moegen KI. Beurteile Aussagekraft fuer ganze Schule.', audience: 'Statistik', format: 'kurzer Bericht mit Grenzen', trap: 'Stichprobe und Auswahlbias wichtig.', forbidden: 'Keine Verallgemeinerung als sicher.' },
    { title: 'Rechtsfrage', situation: 'Jemand fragt, ob eine Handlung erlaubt ist, aber Land, Alter, Vertrag, Datum und Kontext fehlen.', audience: 'Allgemeine Information', format: 'Rueckfrage plus allgemeine Grenzen', trap: 'Recht haengt vom Kontext ab.', forbidden: 'Keine verbindliche Rechtsberatung.' },
    { title: 'Nachrichtenlage', situation: 'Ein Social-Media-Post behauptet einen aktuellen Skandal ohne Quelle, Datum, Ort und Originalmaterial.', audience: 'Medienpruefung', format: '7-stufige Unsicherheitsanalyse', trap: 'Aktualitaet und Quelle fehlen.', forbidden: 'Keine Weiterverbreitung als Fakt.' },
  ],
  rueckfragefaehigkeit: [
    { title: 'Workshop planen', situation: 'Plane einen Workshop, aber Thema, Zielgruppe, Dauer, Ort, Ziel, Material und Budget fehlen.', audience: 'Organisation', format: 'genau 7 Rueckfragen', trap: 'Nicht direkt einen konkreten Plan erfinden.', forbidden: 'Keine Annahmen als Fakten.' },
    { title: 'Text verbessern', situation: 'Schreib das besser, aber Text, Ziel, Ton, Laenge, Zielgruppe, Sprache und Abgabeform fehlen.', audience: 'Schreibberatung', format: '7 priorisierte Rueckfragen', trap: 'Ausgangstext fehlt.', forbidden: 'Keinen Fantasietext schreiben.' },
    { title: 'Option A oder B', situation: 'Welche Option ist besser, aber Optionen, Ziel, Kriterien, Kosten, Risiko, Zeit und Muss-Anforderungen fehlen.', audience: 'Entscheidungshilfe', format: 'Rueckfragen plus Mini-Entscheidungsraster', trap: 'Keine blinde Empfehlung.', forbidden: 'Nicht A oder B waehlen.' },
    { title: 'Kaufberatung', situation: 'Sag mir was ich kaufen soll, aber Produktart, Budget, Nutzung, Prioritaeten, Ort, Zeit und Ausschlusskriterien fehlen.', audience: 'Kaufberatung', format: '7 Fragen nach Wichtigkeit', trap: 'Kontext fehlt komplett.', forbidden: 'Kein konkretes Produkt nennen.' },
    { title: 'Praesentation helfen', situation: 'Hilf mir bei der Praesentation, aber Thema, Dauer, Publikum, Ziel, Medien, Bewertung und Sprache fehlen.', audience: 'Matura', format: 'Checkliste mit 7 Rueckfragen', trap: 'Plan ohne Grunddaten waere erfunden.', forbidden: 'Keine Folienstruktur als final.' },
    { title: 'Daten analysieren', situation: 'Analysiere die Daten, aber Datei, Variablen, Ziel, Zeitraum, Methode, Fehlerregeln und Ausgabeformat fehlen.', audience: 'Statistik', format: '7 Klaerungsfragen und warum', trap: 'Analyse ohne Daten unmoeglich.', forbidden: 'Keine Ergebnisse erfinden.' },
    { title: 'Reise planen', situation: 'Plane Reise, aber Ziel, Startort, Datum, Budget, Personen, Interessen und Einschränkungen fehlen.', audience: 'Reiseplanung', format: '7 Rueckfragen', trap: 'Zu viele offene Parameter.', forbidden: 'Keine fertige Route.' },
    { title: 'Code fixen', situation: 'Fix den Fehler, aber Code, Fehlermeldung, Umgebung, erwartetes Verhalten, Schritte, Versionen und Grenzen fehlen.', audience: 'Softwarehilfe', format: '7 technische Rueckfragen', trap: 'Debugging ohne Info unmoeglich.', forbidden: 'Keine erfundene Ursache.' },
    { title: 'Ernaehrungsplan', situation: 'Mach Essensplan, aber Ziel, Allergien, Budget, Kochzeit, Kultur, Gesundheit und Kalorien fehlen.', audience: 'Alltagsplanung', format: '7 Sicherheits-/Kontextfragen', trap: 'Gesundheitsdaten fehlen.', forbidden: 'Keine medizinische Diaet.' },
    { title: 'Bewertung schreiben', situation: 'Bewerte das, aber Gegenstand, Kriterien, Skala, Ziel, Vergleich, Belege und Ton fehlen.', audience: 'Evaluation', format: '7 Rueckfragen plus Hinweis', trap: 'Bewertung ohne Objekt/Kriterien unmoeglich.', forbidden: 'Keine Note erfinden.' },
  ],
  internet_quellenqualitaet: [
    { title: 'Arbeitslosenquote Schweiz', situation: 'Finde aktuelle Arbeitslosenquote Schweiz und erklaere Quelle, Datum, Definition, Vergleich, Unsicherheit und Nutzung.', audience: 'Wirtschaft', format: 'Quellenprotokoll mit 7 Feldern', trap: 'Aktuelle Zahl braucht offizielle Quelle.', forbidden: 'Keine aktuelle Zahl ohne Quelle.' },
    { title: 'Einreiseregeln Schweiz', situation: 'Pruefe aktuelle Einreiseregeln fuer Schweiz mit offizieller Quelle, Datum, Zielgruppe, Dokumenten, Ausnahme, Warnung, Linktyp.', audience: 'Reiseinfo', format: 'JSON mit 7 keys', trap: 'Regeln koennen sich aendern.', forbidden: 'Keine veraltete feste Aussage.' },
    { title: 'Impfempfehlung', situation: 'Pruefe aktuelle Impfempfehlung Schweiz nach BAG, Datum, Zielgruppe, Risiko, Quelle, Grenze und Arzt-Hinweis.', audience: 'Gesundheit', format: 'Vorgehensplan', trap: 'Medizinische Aktualitaet und Zielgruppe.', forbidden: 'Keine individuelle Diagnose.' },
    { title: 'Studie in Medien', situation: 'Medienartikel behauptet Studie beweist Kausalitaet. Pruefe Originalstudie, Methode, Stichprobe, Ergebnis, Limitation, Medienvergleich, Fazit.', audience: 'Wissenschaft', format: '7-Check-Tabelle', trap: 'Medien koennen uebertreiben.', forbidden: 'Keine Quelle zweiter Hand als Beweis.' },
    { title: 'Datenschutz App', situation: 'Bewerte Datenschutz einer neuen Lern-App anhand Datenschutzerklaerung, Berechtigungen, Anbieter, Version, Tests, Risiken, Fazit.', audience: 'Schule', format: 'Risikomatrix', trap: 'Werbeaussagen reichen nicht.', forbidden: 'Keine unbelegte Sicherheit.' },
    { title: 'KI-News', situation: 'Fasse aktuelle KI-Regelung zusammen mit Quelle, Datum, Region, Akteur, Inhalt, Auswirkung und Unsicherheit.', audience: 'Maturaarbeit', format: '7 kurze Abschnitte', trap: 'Aktuelle Regulierung braucht Datum/Region.', forbidden: 'Keine global falsche Verallgemeinerung.' },
    { title: 'Klimadaten', situation: 'Pruefe eine aktuelle Klimazahl mit Primaerquelle, Zeitraum, Messmethode, Vergleichswert, Unsicherheit, Kontext und Zitatgrenze.', audience: 'Geografie', format: 'Quellenanalyse', trap: 'Messzeitraum und Kontext wichtig.', forbidden: 'Keine Zahl ohne Datumsbezug.' },
    { title: 'Produkt Rueckruf', situation: 'Pruefe ob ein Produkt zurueckgerufen wurde mit offizieller Stelle, Hersteller, Datum, Modellnummer, Risiko, Handlung, Quelle.', audience: 'Konsumentenschutz', format: 'Checkliste', trap: 'Modellnummer und Datum kritisch.', forbidden: 'Keine Entwarnung ohne Quelle.' },
    { title: 'Schulrecht aktuell', situation: 'Pruefe aktuelle Regel zu KI in Schule mit Kanton/Land, offizieller Quelle, Datum, Geltung, Sanktionen, Unsicherheit, Empfehlung.', audience: 'Schulleitung', format: 'Rechercheprotokoll', trap: 'Recht variiert nach Ort.', forbidden: 'Keine Rechtsberatung als Fakt.' },
    { title: 'Statistik Medienpost', situation: 'Social Post nennt aktuelle Statistik. Pruefe Originaldaten, Definition, Zeitraum, Auswahl, Vergleich, Visualisierung, Fazit.', audience: 'Medienkompetenz', format: '7 Fragen mit erwarteter Quelle', trap: 'Statistiken koennen manipulativ dargestellt sein.', forbidden: 'Keine Uebernahme der Grafik ohne Pruefung.' },
  ],
  relevanz: [
    { title: 'Bienen ohne Honig', situation: 'Erklaere Bedeutung von Bienen nur fuer Bestaeubung, Nahrungskette, Landwirtschaft, Biodiversitaet, Risiko, Beispiel, Fazit.', audience: 'Biologie', format: 'maximal 90 Woerter', trap: 'Honig ist nicht gefragt.', forbidden: 'Nicht ueber Imkerei abschweifen.' },
    { title: 'Homeoffice Schueler', situation: 'Beurteile Homeoffice fuer Schueler mit Lernen, Motivation, Ablenkung, soziale Kontakte, Technik, Fairness, Fazit.', audience: 'Schule', format: 'Pro/Contra-Tabelle', trap: 'Firmenperspektive irrelevant.', forbidden: 'Keine Arbeitgeberargumente.' },
    { title: 'Schlaf und Lernen', situation: 'Erklaere Schlaf fuer Lernen mit Gedaechtnis, Konzentration, Stimmung, Routine, Risiko, Beispiel, Tipp.', audience: 'Jugendliche', format: '7 Saetze', trap: 'Ernaehrung und Sport sind Nebenthemen.', forbidden: 'Keine Ernaehrungstipps.' },
    { title: 'Inhaltsverzeichnis', situation: 'Erklaere Zweck eines Inhaltsverzeichnisses in Maturaarbeit mit Orientierung, Struktur, Seiten, Lesefluss, Bewertung, Beispiel, Grenze.', audience: 'Maturaarbeit', format: 'genau 7 Bulletpoints', trap: 'Word-Tutorial nicht relevant.', forbidden: 'Keine Klickanleitung.' },
    { title: 'Betriebssystem', situation: 'Erklaere Betriebssysteme mit Hardware, Programme, Dateien, Benutzer, Sicherheit, Beispiel, Abgrenzung.', audience: '12 Jahre', format: 'einfache Sprache', trap: 'Programmiersprachen sind nicht das Thema.', forbidden: 'Keine Coding-Erklaerung.' },
    { title: 'Klimawandel lokal', situation: 'Erklaere lokale Folgen fuer Stadtplanung mit Hitze, Wasser, Verkehr, Gruenflaechen, Kosten, Gerechtigkeit, Massnahme.', audience: 'Gemeinderat', format: '7 relevante Punkte', trap: 'Globale Allgemeinplaetze vermeiden.', forbidden: 'Keine lange CO2-Grundsatzrede.' },
    { title: 'Matura Statistik', situation: 'Erklaere gepaarten t-Test fuer unser Projekt mit Paaren, Differenz, Mittelwert, Streuung, p-Wert, Grenze, Interpretation.', audience: 'Schueler', format: 'kurzer Lernzettel', trap: 'Ungepaarter Test ist nicht gefragt.', forbidden: 'Keine allgemeine Statistik-Enzyklopaedie.' },
    { title: 'Datenschutz Schule', situation: 'Fokussiere Datenschutz bei KI in Schule auf Datenarten, Einwilligung, Speicherung, Anbieter, Risiko, Regel, Beispiel.', audience: 'Lehrperson', format: 'Checkliste', trap: 'KI-Funktionen allgemein sind Nebenthema.', forbidden: 'Keine Tool-Werbung.' },
    { title: 'Quellenkritik Bild', situation: 'Erklaere Bildquellenkritik mit Ursprung, Datum, Ort, Bearbeitung, Kontext, Zweck, Gegenpruefung.', audience: 'Medienkunde', format: '7 Pruefpunkte', trap: 'Textquellen allgemein nicht dominieren.', forbidden: 'Keine allgemeine Fake-News-Rede.' },
    { title: 'Workshop Ziel', situation: 'Plane nur Zieldefinition fuer Workshop mit Problem, Zielgruppe, Ergebnis, Messung, Grenzen, Stakeholder, naechster Schritt.', audience: 'Moderator', format: 'Ziel-Canvas', trap: 'Ablaufplan ist nicht gefragt.', forbidden: 'Keine komplette Agenda.' },
  ],
  klarheit: [
    { title: 'Quantencomputer', situation: 'Erklaere Quantencomputer mit Qubit, Unterschied zu Bit, Parallelitaetsidee, Grenze, Beispiel, Risiko, Merksatz.', audience: '14 Jahre', format: 'exakt 120 bis 140 Woerter', trap: 'Nicht ueberkomplizieren.', forbidden: 'Keine Formeln.' },
    { title: 'Hypothese', situation: 'Erklaere Hypothese mit Vermutung, Testbarkeit, Beispiel, Gegenbeispiel, Experiment, Fehler, Merksatz.', audience: '10 Jahre', format: '7 kurze Saetze', trap: 'Jargon muss vermieden werden.', forbidden: 'Keine Woerter Variable, empirisch, falsifizierbar.' },
    { title: 'Brutto Netto', situation: 'Erklaere Brutto und Netto mit Definition, Lohnbeispiel, Preisbeispiel, Abzug, Fehlerquelle, Vergleich, Merksatz.', audience: 'Berufsschule', format: 'Tabelle plus Merksatz', trap: 'Zwei Kontexte koennen verwirren.', forbidden: 'Keine Steuerdetails ausufern.' },
    { title: 'Algorithmus', situation: 'Erklaere Algorithmus mit Kochrezept, Schrittfolge, Eingabe, Ausgabe, Fehler, Computerbezug, Beispiel.', audience: 'Anfaenger', format: 'genau 7 Bulletpoints', trap: 'Alltagsvergleich muss klar bleiben.', forbidden: 'Kein Programmcode.' },
    { title: 'Korrelation', situation: 'Erklaere Korrelation vs Kausalitaet mit Definition, Beispiel, Gegenbeispiel, Fehler, Pruefung, Merksatz, Grenze.', audience: 'Statistik-Anfaenger', format: 'einfache Sprache', trap: 'Begriffe werden oft verwechselt.', forbidden: 'Keine Fachwort-Kette.' },
    { title: 'Inflation', situation: 'Erklaere Inflation mit Preisniveau, Kaufkraft, Beispiel, Ursache, Folge, Grenze, Merksatz.', audience: 'Sekundarschule', format: 'maximal 100 Woerter', trap: 'Einzelpreis vs allgemeine Entwicklung.', forbidden: 'Keine Parteipolitik.' },
    { title: 'DNS', situation: 'Erklaere DNS mit Bauplan, Gene, Zellen, Vererbung, Beispiel, Grenze, Merksatz.', audience: '12 Jahre', format: '7 Abschnitte mit Mini-Ueberschriften', trap: 'Zu abstrakt wird unverstaendlich.', forbidden: 'Keine Molekularformeln.' },
    { title: 'Cloud', situation: 'Erklaere Cloud-Speicher mit Internet, Server, Zugriff, Vorteil, Risiko, Beispiel, Merksatz.', audience: 'Grosseltern', format: 'sehr einfache Sprache', trap: 'Technikjargon vermeiden.', forbidden: 'Keine Abkuerzungen ohne Erklaerung.' },
    { title: 'Demokratie', situation: 'Erklaere Demokratie mit Wahl, Mitbestimmung, Regeln, Minderheiten, Beispiel, Risiko, Merksatz.', audience: '6. Klasse', format: '7 kurze Abschnitte', trap: 'Nicht nur Wahl sagen.', forbidden: 'Keine Parteidebatte.' },
    { title: 'Energie', situation: 'Erklaere Energieumwandlung mit Fahrradlampe, Ausgangsenergie, Umwandlung, Verlust, Beispiel, Grenze, Merksatz.', audience: 'Physik-Anfaenger', format: 'klar und anschaulich', trap: 'Energie wird nicht erzeugt aus nichts.', forbidden: 'Keine komplizierte Formel.' },
  ],
};

function sevenTasks(criteriaId: CriteriaId, scenario: Scenario): string[] {
  if (criteriaId === 'rueckfragefaehigkeit') {
    return [
      'Stelle genau sieben notwendige Rueckfragen.',
      'Decke Ziel, Kontext und fehlende Daten ab.',
      'Frage nach Constraints wie Zeit, Budget, Format oder Zielgruppe, wenn passend.',
      'Erklaere kurz, warum die wichtigsten Rueckfragen noetig sind.',
      'Gib noch keine endgueltige Loesung.',
      'Vermeide erfundene Annahmen.',
      `Halte das Format ein: ${scenario.format}.`,
    ];
  }
  return [
    `Bearbeite die konkrete Situation: ${scenario.situation}`,
    `Schreibe passend fuer diese Zielgruppe: ${scenario.audience}.`,
    `Halte das Ausgabeformat strikt ein: ${scenario.format}.`,
    `Behandle die typische Falle: ${scenario.trap}`,
    `Beachte diese Begrenzung: ${scenario.forbidden}`,
    'Fuege eine kurze Kontrolle, Grenze, Unsicherheit oder Plausibilitaetspruefung ein.',
    'Schliesse mit einem klaren Fazit oder einer direkt nutzbaren Empfehlung.',
  ];
}

function criteriaSpecificCheckpoint(criteriaId: CriteriaId): string {
  const map: Record<CriteriaId, string> = {
    richtigkeit: 'Die fachliche Kernaussage ist korrekt und korrigiert falsche Praemissen oder Verwechslungen.',
    vollstaendigkeit_frage: 'Alle explizit in der Frage genannten Bestandteile sind sichtbar abgedeckt.',
    vollstaendigkeit_moeglichkeit: 'Die Antwort nutzt das moegliche Potenzial der Aufgabe und deckt wichtige naheliegende Zusatzaspekte ab.',
    pruefung_verifikation: 'Die Antwort enthaelt eine echte Kontrollrechnung, Gegenpruefung oder Plausibilitaetspruefung.',
    unsicherheit: 'Die Antwort legt Unsicherheit, fehlende Information und Grenzen offen, ohne Fakten zu erfinden.',
    rueckfragefaehigkeit: 'Die Antwort stellt sinnvolle Rueckfragen statt eine unbegruendete Endloesung zu erfinden.',
    internet_quellenqualitaet: 'Die Antwort nennt oder verlangt passende aktuelle und moeglichst primaere/offizielle Quellen.',
    relevanz: 'Die Antwort bleibt eng beim gefragten Fokus und vermeidet unpassende Nebenthemen.',
    klarheit: 'Die Antwort ist fuer die Zielgruppe klar, strukturiert und ohne unnoetige Fachsprache verstaendlich.',
  };
  return map[criteriaId];
}

function buildQuestion(criteriaId: CriteriaId, scenario: Scenario): string {
  const tasks = sevenTasks(criteriaId, scenario)
    .map((task, index) => `${index + 1}. ${task}`)
    .join('\n');

  return `Bearbeite die folgende komplexe Aufgabe. Erledige alle sieben Teilaufgaben.

Thema: ${scenario.title}

${tasks}

Die Endantwort muss zeigen, dass die sieben Punkte zusammen verarbeitet wurden, nicht nur einzeln aufgelistet.`;
}

function buildCheckpoints(criteriaId: CriteriaId, scenario: Scenario): string[] {
  const tasks = sevenTasks(criteriaId, scenario);
  return [
    `Teilaufgabe 1 ist erkennbar erledigt: ${tasks[0]}`,
    `Teilaufgabe 2 ist erkennbar erledigt: ${tasks[1]}`,
    `Teilaufgabe 3 ist erkennbar erledigt: ${tasks[2]}`,
    `Teilaufgabe 4 ist erkennbar erledigt: ${tasks[3]}`,
    `Teilaufgabe 5 ist erkennbar erledigt: ${tasks[4]}`,
    `Teilaufgabe 6 ist erkennbar erledigt: ${tasks[5]}`,
    `Teilaufgabe 7 ist erkennbar erledigt: ${tasks[6]}`,
    criteriaSpecificCheckpoint(criteriaId),
    'Die Antwort wirkt strukturiert, geprueft und nicht wie eine oberflaechliche Sofortantwort.',
  ];
}

const seeds: Seed[] = [];
for (const setup of SETUPS) {
  for (const [criteriaId, rows] of Object.entries(scenarios) as Array<[CriteriaId, Scenario[]]>) {
    if (rows.length !== 10) throw new Error(`Expected 10 scenarios for ${criteriaId}, got ${rows.length}`);
    rows.forEach((scenario, index) => {
      seeds.push({
        setupId: setup.setupId,
        testset: setup.testset,
        criteriaId,
        question: buildQuestion(criteriaId, scenario),
        checkpoints: buildCheckpoints(criteriaId, scenario),
        notes: `${criteriaId} ${setup.testset}-${index + 1}; set7; seven-part complex task for ${setup.label}`,
      });
    });
  }
}

if (seeds.length !== 180) {
  throw new Error(`Expected 180 questions, got ${seeds.length}`);
}

for (const setup of SETUPS) {
  const existing = db.prepare(`
    SELECT COUNT(*) as count
    FROM questions
    WHERE testset = ? AND setup_id = ?
  `).get(setup.testset, setup.setupId) as { count: number };

  if (existing.count > 0) {
    console.error(`Aborted: ${existing.count} questions already exist for ${setup.testset} / ${setup.setupId}.`);
    process.exit(1);
  }
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
  for (const setup of SETUPS) {
    db.prepare('INSERT OR IGNORE INTO testsets (id, name) VALUES (?, ?)').run(setup.testset, setup.testset);
  }

  for (const seed of seeds) {
    const result = insertQuestion.run(seed.criteriaId, seed.setupId, seed.question, seed.testset, seed.notes);
    seed.checkpoints.forEach((checkpoint, index) => {
      insertCheckpoint.run(result.lastInsertRowid, checkpoint, index);
    });
  }
});

transaction();

console.log(`Inserted ${seeds.length} set7 questions.`);
console.table(db.prepare(`
  SELECT setup_id, testset, criteria_id, COUNT(*) as questions
  FROM questions
  WHERE testset IN ('flowmap_parallel7_questions', 'flowreview_parallel7_questions')
  GROUP BY setup_id, testset, criteria_id
  ORDER BY setup_id, criteria_id
`).all());

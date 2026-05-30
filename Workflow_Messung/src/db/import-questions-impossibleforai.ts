import db from './index';

const TESTSET = 'ai_edge_case_questions';
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
  q('richtigkeit', 'Antworte als JSON: Ist Zuerich die Hauptstadt der Schweiz? Keys: behauptung, korrekt, korrektur, grund.',
    ['Gibt valides JSON ohne Markdown oder Zusatztext zurueck', 'Setzt korrekt auf false oder eine gleichwertige boolesche Darstellung', 'Korrigiert die Aussage mit Bern/Bundesstadt statt Zuerich', 'Erklaert kurz, dass Zuerich nicht die Hauptstadt/Bundesstadt ist']),
  q('richtigkeit', 'Regeln: Rot schlaegt Blau, Blau schlaegt Gruen, Gruen schlaegt Rot. Ausnahme: Dreiecke verlieren immer. Gewinner: rotes Dreieck gegen gruenen Kreis?',
    ['Erkennt die Ausnahme als vorrangig', 'Bestimmt den gruenen Kreis als Gewinner', 'Begruendet, dass das rote Dreieck trotz Farbe verliert', 'Nennt keine falsche Anwendung der Grundregel als Endergebnis']),
  q('richtigkeit', 'Pruefe diese Rechnung und gib nur JSON: 7 * 8 = 54. Schema: {"ist_richtig":boolean,"korrekt":number,"kurzgrund":string}',
    ['Gibt ausschliesslich valides JSON zurueck', 'Setzt ist_richtig korrekt auf false', 'Setzt korrekt auf 56 als Zahl', 'Begruendet knapp, dass 7 mal 8 gleich 56 ist']),
  q('richtigkeit', 'Ein Text sagt: Antibiotika helfen gegen Grippeviren. Antworte exakt in 2 Saetzen und korrigiere falls noetig.',
    ['Korrigiert die Aussage als falsch oder irrefuehrend', 'Erklaert, dass Antibiotika gegen Bakterien und nicht gegen Viren wirken', 'Nennt Grippe als virale Erkrankung oder vergleichbar', 'Haelt exakt zwei Saetze ein']),
  q('richtigkeit', 'Gib CSV mit exakt 2 Datenzeilen: Begriff,Korrekt?,Korrektur. Begriffe: "Wetter ist langfristig", "Klima ist langfristiger Durchschnitt".',
    ['Gibt CSV statt Markdown-Tabelle zurueck', 'Enthaelt exakt eine Kopfzeile und zwei Datenzeilen', 'Markiert "Wetter ist langfristig" als falsch und korrigiert es', 'Markiert Klima als langfristigen Durchschnitt korrekt']),

  // Vollstaendigkeit gemaess Frage
  q('vollstaendigkeit_frage', 'Gib exakt JSON: Vergleiche Solar und Wind nach kosten, zuverlässigkeit, umwelt. Keys: solar, wind, fazit.',
    ['Gibt valides JSON mit den Keys solar, wind und fazit zurueck', 'Behandelt Kosten fuer Solar und Wind', 'Behandelt Zuverlaessigkeit/Wetterabhaengigkeit fuer beide', 'Behandelt Umweltaspekte fuer beide und gibt ein Fazit']),
  q('vollstaendigkeit_frage', 'Erklaere Nachhaltigkeit in exakt 3 Bulletpoints: Definition, Beispiel, Bewertung. Keine Einleitung.',
    ['Gibt exakt drei Bulletpoints aus', 'Ein Bulletpoint enthaelt eine Definition', 'Ein Bulletpoint enthaelt ein konkretes Beispiel', 'Ein Bulletpoint enthaelt eine kurze Bewertung']),
  q('vollstaendigkeit_frage', 'Mitose vs Meiose als CSV exakt 4 Zeilen inkl Header. Spalten: Aspekt,Mitose,Meiose. Aspekte: Zweck, Ergebnis, Teilungen.',
    ['Gibt CSV statt Markdown-Tabelle zurueck', 'Enthaelt exakt Header plus drei Aspekt-Zeilen', 'Vergleicht Zweck korrekt', 'Vergleicht Ergebnis und Anzahl Teilungen korrekt']),
  q('vollstaendigkeit_frage', 'Quelle pruefen. Antworte als nummerierte Liste exakt 4 Punkte: Autor, Datum, Absicht, Belege.',
    ['Gibt exakt vier nummerierte Punkte aus', 'Autor/Herausgeber wird erklaert', 'Datum/Aktualitaet wird erklaert', 'Absicht und Belege werden beide erklaert']),
  q('vollstaendigkeit_frage', 'Lernstrategie: exakt 5 Zeilen, keine Ueberschrift. Muss enthalten: Zeitplan, Wiederholung, Selbsttest, Pause, Anpassung.',
    ['Gibt exakt fuenf Zeilen ohne Ueberschrift aus', 'Enthaelt einen Zeitplan', 'Enthaelt Wiederholung und Selbsttest', 'Enthaelt Pausen und Anpassung bei Problemen']),

  // Vollstaendigkeit gemaess Moeglichkeit
  q('vollstaendigkeit_moeglichkeit', 'Fake News Check als JSON-Array mit genau 6 Objekten. Jedes Objekt hat step und warum.',
    ['Gibt ein valides JSON-Array mit genau sechs Objekten zurueck', 'Jedes Objekt enthaelt step und warum', 'Quelle, Datum und Belege werden geprueft', 'Mindestens ein weiterer sinnvoller Check wie Bildsuche, Gegenquelle oder Sprache wird genannt']),
  q('vollstaendigkeit_moeglichkeit', 'Mach einen Mathe-Lernplan fuer 4 Tage. Ausgabe exakt: Tag;Ziel;Uebung;Kontrolle. CSV, 5 Zeilen total.',
    ['Gibt CSV mit Header plus vier Tagen zurueck', 'Jeder Tag hat Ziel, Uebung und Kontrolle', 'Wiederholung oder Fehleranalyse wird sinnvoll eingeplant', 'Der Plan ist praktisch und vollstaendig fuer vier Tage']),
  q('vollstaendigkeit_moeglichkeit', 'KI in der Schule: exakt 80-90 Woerter, nenne Chancen, Risiken, Regeln und ein Beispiel.',
    ['Haelt den Umfang von 80 bis 90 Woertern ein', 'Nennt Chancen und Risiken', 'Nennt konkrete Nutzungsregeln', 'Gibt ein passendes Schulbeispiel']),
  q('vollstaendigkeit_moeglichkeit', 'Historische Quelle analysieren. Verbotene Woerter: wichtig, interessant. Gib 5 Prueffragen.',
    ['Gibt fuenf sinnvolle Prueffragen', 'Verwendet die verbotenen Woerter nicht', 'Bezieht Autor/Zeit/Kontext ein', 'Bezieht Absicht, Inhalt oder Grenzen der Quelle ein']),
  q('vollstaendigkeit_moeglichkeit', 'Berufswahl-Entscheidungshilfe als Tabelle mit exakt 4 Kriterien: Interesse, Faehigkeit, Ausbildung, Zukunft.',
    ['Gibt eine Tabelle oder klar tabellarische Struktur mit exakt vier Kriterien', 'Behandelt Interesse und Faehigkeit', 'Behandelt Ausbildung oder Zugang', 'Behandelt Zukunft/Perspektiven und macht die Hilfe nutzbar']),

  // Pruefung / Verifikation
  q('pruefung_verifikation', 'Berechne 18% von 250. Gib JSON: {"rechnung":string,"ergebnis":number,"kontrolle":string}. Keine Extras.',
    ['Gibt ausschliesslich valides JSON zurueck', 'Berechnet 45 korrekt', 'Zeigt eine Rechnung', 'Enthaelt eine unabhaengige Kontrolle oder Plausibilitaetspruefung']),
  q('pruefung_verifikation', 'Durchschnitt von 6,8,10,12. Antwort exakt 17 Woerter und enthalte eine Plausibilitaetspruefung.',
    ['Haelt exakt 17 Woerter ein', 'Nennt den Durchschnitt 9', 'Erwaehnt eine plausible Kontrolle zwischen 6 und 12', 'Enthaelt keine falsche Rechnung']),
  q('pruefung_verifikation', 'Pruefe: Ein Jahr hat immer genau 365 Tage. Antworte mit exakt 3 Saetzen: Urteil, Ausnahme, Fazit.',
    ['Gibt exakt drei Saetze aus', 'Beurteilt die Aussage als nicht immer richtig', 'Nennt Schaltjahre als Ausnahme', 'Formuliert ein klares Fazit']),
  q('pruefung_verifikation', 'Zug faehrt 120 km in 1.5 h. Gib CSV exakt: Formel,Wert,Einheit,Check. Eine Datenzeile.',
    ['Gibt CSV mit Header und genau einer Datenzeile', 'Berechnet 80 korrekt', 'Nennt km/h als Einheit', 'Enthaelt einen Plausibilitaetscheck']),
  q('pruefung_verifikation', 'Regeltest: Wenn x gerade ist, halbiere. Wenn Ergebnis < 5, addiere 10. x=8. Gib Ergebnis und pruefe jeden Schritt.',
    ['Halbiert 8 korrekt zu 4', 'Erkennt 4 < 5', 'Addiert 10 und erhaelt 14', 'Prueft beide Schritte nachvollziehbar']),

  // Unsicherheit offenlegen
  q('unsicherheit', 'Wenn du es nicht sicher wissen kannst, antworte exakt "Nicht genuegend Informationen." Frage: Hat Alex morgen die Pruefung bestanden?',
    ['Gibt exakt "Nicht genuegend Informationen." oder klar gleichwertig ohne Zusatztext aus', 'Erfindet kein Ergebnis', 'Erkennt fehlende Information', 'Gibt keine Scheinwahrscheinlichkeit an']),
  q('unsicherheit', 'Eine Studie mit 12 Personen sagt: Methode X wirkt. Ist das bewiesen? Maximal 35 Woerter.',
    ['Haelt maximal 35 Woerter ein', 'Unterscheidet Hinweis von Beweis', 'Nennt kleine Stichprobe als Unsicherheitsgrund', 'Fordert weitere Studien/Replikation oder bessere Methodik']),
  q('unsicherheit', 'Bewerte diese Aussage als JSON: "Viele Sterne im Shop = Produkt ist sicher gut." Keys: sicher, unsicherheitsgruende, naechste_pruefung.',
    ['Gibt valides JSON mit allen geforderten Keys aus', 'Setzt sicher sinngemaess auf false oder nicht sicher', 'Nennt Unsicherheitsgruende wie Fake Reviews oder Passung', 'Nennt sinnvolle naechste Pruefung']),
  q('unsicherheit', 'Foto vielleicht Zuerich 1900. Antworte ohne die Woerter sicher, beweist, eindeutig. Was kann man sagen?',
    ['Verwendet die verbotenen Woerter nicht', 'Kommuniziert Unsicherheit klar', 'Nennt benoetigte Pruefmerkmale wie Quelle, Ort, Kleidung, Gebaeude oder Metadaten', 'Behauptet keine endgueltige Identifikation']),
  q('unsicherheit', 'KI ohne Quellen behauptet eine Zahl. Gib exakt 4 Bulletpoints: Vertrauen, Risiko, Pruefung, Entscheidung.',
    ['Gibt exakt vier Bulletpoints mit den geforderten Themen', 'Benennt begrenztes Vertrauen ohne Quellen', 'Nennt Fehler-/Halluzinationsrisiko', 'Empfiehlt Quellenpruefung vor Entscheidung']),

  // Rueckfragefaehigkeit
  q('rueckfragefaehigkeit', 'Plane einen Workshop.',
    ['Stellt zuerst Rueckfragen statt sofort einen detaillierten Plan zu erfinden', 'Fragt nach Thema/Ziel', 'Fragt nach Zielgruppe oder Teilnehmerzahl', 'Fragt nach Dauer, Ort oder Rahmenbedingungen']),
  q('rueckfragefaehigkeit', 'Schreib das besser.',
    ['Fragt nach dem Originaltext', 'Fragt nach Zielgruppe oder Zweck', 'Fragt nach Stil, Laenge oder Ton', 'Erfindet keinen Text, der nicht gegeben wurde']),
  q('rueckfragefaehigkeit', 'Welche Option ist besser: A oder B?',
    ['Fragt, wofuer A und B stehen', 'Fragt nach Entscheidungskriterien', 'Fragt nach Ziel oder Kontext', 'Gibt keine unbegruendete Empfehlung']),
  q('rueckfragefaehigkeit', 'Mach mir eine perfekte Tabelle.',
    ['Fragt nach Thema/Inhalt der Tabelle', 'Fragt nach Spalten oder Daten', 'Fragt nach Ausgabeformat', 'Erstellt keine inhaltlich erfundene Tabelle']),
  q('rueckfragefaehigkeit', 'Sag mir, ob ich das machen soll.',
    ['Fragt, was "das" bedeutet', 'Fragt nach Ziel und Konsequenzen', 'Fragt nach relevanten Bedingungen oder Risiken', 'Trifft keine blinde Ja/Nein-Entscheidung']),

  // Internet- / Quellenqualitaet
  q('internet_quellenqualitaet', 'Aktuelle Arbeitslosenquote Schweiz. Wenn du keine aktuelle Quelle hast, sage das. Nenne welche Quelle du nutzen wuerdest.',
    ['Legt offen, wenn keine aktuelle Quelle genutzt wurde', 'Nennt SECO oder BFS als geeignete Quelle', 'Betont Zeitraum/Datum der Statistik', 'Erfindet keine aktuelle Zahl ohne Quelle']),
  q('internet_quellenqualitaet', 'Pruefe aktuelle Einreiseregeln Schweiz. Antworte als JSON mit quelle, datum_pruefen, warnung.',
    ['Gibt valides JSON mit den geforderten Keys aus', 'Nennt offizielle Quellen wie EDA/SEM oder Behoerden', 'Betont, dass das Datum geprueft werden muss', 'Warnt vor veralteten Informationen']),
  q('internet_quellenqualitaet', 'Medienartikel behauptet Studie beweist Kausalitaet. Gib exakt 5 Checks, keine Zusammenfassung.',
    ['Gibt exakt fuenf Checks', 'Empfiehlt Originalstudie/Primaerquelle', 'Prueft Methodik und Stichprobe', 'Prueft, ob wirklich Kausalitaet oder nur Korrelation gezeigt wurde']),
  q('internet_quellenqualitaet', 'Neue App ist laut Werbung datensicher. Welche Quellen pruefen? Verbotene Woerter: vertrau, sicher.',
    ['Verwendet die verbotenen Woerter nicht', 'Nennt Datenschutzerklaerung/Berechtigungen', 'Nennt unabhaengige Tests, Store-Infos oder Herstellerdokumentation', 'Prueft Aktualitaet/Version und Werbeinteresse kritisch']),
  q('internet_quellenqualitaet', 'Impfempfehlung Schweiz aktuell: Antworte nur mit Vorgehen, nicht mit medizinischem Rat.',
    ['Gibt ein Vorgehen statt konkreten medizinischen Rat', 'Nennt BAG oder offizielle Gesundheitsstellen', 'Betont Aktualitaet und Zielgruppe', 'Empfiehlt medizinische Fachperson bei individueller Entscheidung']),

  // Relevanz
  q('relevanz', 'Beschreibe Kaffee ohne die Woerter Kaffee, Getraenk, Bohne, Koffein, heiss. Fokus: Wirkung im Alltag.',
    ['Verwendet keines der verbotenen Woerter', 'Bleibt beim Alltagseffekt', 'Beschreibt nicht lange Herkunft oder Anbau', 'Die Antwort bleibt verstaendlich und relevant']),
  q('relevanz', 'Bienen sind wichtig. Erklaere nur Bestaeubung und Nahrungskette, nicht Honig. Exakt 45-55 Woerter.',
    ['Haelt 45 bis 55 Woerter ein', 'Fokussiert auf Bestaeubung', 'Erwaehnt Nahrungskette/Oekosystem relevant', 'Honig dominiert nicht und wird moeglichst vermieden']),
  q('relevanz', 'Homeoffice fuer Schueler: genau 3 Pro und 3 Contra, keine Firmenperspektive.',
    ['Gibt genau drei Pro- und drei Contra-Punkte', 'Bleibt bei Schuelerperspektive', 'Nennt relevante Lern-/Alltagsaspekte', 'Firmenperspektive dominiert nicht']),
  q('relevanz', 'Erklaere Betriebssysteme, aber benutze keine Beispiele zu Programmiersprachen. Zielgruppe: 12 Jahre.',
    ['Erklaert Betriebssysteme altersgerecht', 'Fokussiert auf Verwaltung von Hardware/Programmen/Dateien', 'Vermeidet Programmiersprachen-Beispiele', 'Bleibt klar bei der Frage']),
  q('relevanz', 'Inhaltsverzeichnis: Wozu dient es in einer Maturaarbeit? Keine Word-Anleitung. Maximal 30 Woerter.',
    ['Haelt maximal 30 Woerter ein', 'Erklaert Orientierung/Struktur fuer Leser', 'Bezieht sich auf Maturaarbeit oder schriftliche Arbeit', 'Gibt keine Word-Bedienungsanleitung']),

  // Klarheit
  q('klarheit', 'Erklaere Quantencomputer in exakt 17 Woertern. Keine Ueberschrift.',
    ['Haelt exakt 17 Woerter ein', 'Verwendet keine Ueberschrift', 'Erklaert den Kern einfach und verstaendlich', 'Enthaelt keine grob falsche Vereinfachung']),
  q('klarheit', 'Erklaere Hypothese fuer 10-Jaehrige. Verbotene Woerter: Variable, empirisch, falsifizierbar.',
    ['Verwendet die verbotenen Woerter nicht', 'Erklaert Hypothese als testbare Vermutung', 'Nutzt einfache Sprache fuer Kinder', 'Gibt ein einfaches Beispiel']),
  q('klarheit', 'Brutto netto als JSON mit keys: brutto, netto, beispiel. Jeder Wert maximal 12 Woerter.',
    ['Gibt valides JSON mit allen drei Keys', 'Erklaert brutto einfach', 'Erklaert netto einfach', 'Jeder Wert bleibt maximal 12 Woerter']),
  q('klarheit', 'Regenbogen: exakt 4 kurze Saetze, jeder Satz unter 9 Woertern.',
    ['Gibt exakt vier Saetze aus', 'Jeder Satz hat weniger als neun Woerter', 'Erklaert Licht und Wassertropfen verstaendlich', 'Bleibt sachlich korrekt']),
  q('klarheit', 'Algorithmus fuer Anfaenger als Kochrezept-Vergleich. Genau 3 Bulletpoints.',
    ['Gibt genau drei Bulletpoints aus', 'Erklaert Algorithmus als Schrittfolge', 'Nutzt den Kochrezept-Vergleich klar', 'Bleibt fuer Anfaenger verstaendlich']),
];

if (seeds.length !== 45) {
  throw new Error(`Expected 45 questions, got ${seeds.length}`);
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
      `${seed.criteriaId} edge-case-${next} for C - Prompt-Optimierung; adversarial constraint-following prompt`,
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

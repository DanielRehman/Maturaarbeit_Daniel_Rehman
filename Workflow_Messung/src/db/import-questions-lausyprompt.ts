import db from './index';

const TESTSET = 'weak_prompt_questions';
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
  q('richtigkeit', 'Erklaer mir kurz das mit Zellatmung, halt was reingeht und rauskommt.',
    ['Zellatmung wird als Energiegewinnung in Zellen korrekt beschrieben', 'Glucose und Sauerstoff werden als wichtige Ausgangsstoffe genannt', 'Kohlenstoffdioxid, Wasser und Energie/ATP werden als Produkte genannt', 'Zellatmung wird nicht mit Fotosynthese verwechselt']),
  q('richtigkeit', 'Was war nochmal Gewaltenteilung, einfach mit den drei Sachen.',
    ['Legislative, Exekutive und Judikative werden korrekt benannt', 'Die Funktion von mindestens zwei Gewalten wird korrekt erklaert', 'Kontrolle/Begrenzung von Macht wird als Zweck genannt', 'Gewaltenteilung wird nicht als koerperliche Gewalt missverstanden']),
  q('richtigkeit', 'Sag mir ob Antibiotika gegen Viren helfen und warum.',
    ['Antibiotika werden korrekt als Mittel gegen Bakterien eingeordnet', 'Es wird erklaert, dass Antibiotika gegen Viren normalerweise nicht wirken', 'Der Unterschied zwischen bakterieller und viraler Infektion wird kurz genannt', 'Die Antwort vermeidet medizinisch falsche Heilversprechen']),
  q('richtigkeit', 'Erklaer Inflation so dass ich es fuer Wirtschaft brauche.',
    ['Inflation wird als allgemeiner Anstieg des Preisniveaus korrekt definiert', 'Kaufkraftverlust wird korrekt erklaert', 'Mindestens eine plausible Ursache wird genannt', 'Inflation wird nicht nur als einzelner teurer Artikel beschrieben']),
  q('richtigkeit', 'Mach mir den Unterschied Klima Wetter, aber nicht zu lang.',
    ['Wetter wird als kurzfristiger Zustand der Atmosphaere erklaert', 'Klima wird als langfristiger Durchschnitt/typisches Muster erklaert', 'Der Zeitmassstab wird klar unterschieden', 'Ein korrektes Beispiel macht den Unterschied deutlich']),

  // Vollstaendigkeit gemaess Frage
  q('vollstaendigkeit_frage', 'Vergleich Solar und Wind, Kosten und so.',
    ['Solarenergie wird nach Kosten behandelt', 'Windenergie wird nach Kosten behandelt', 'Zuverlaessigkeit/Wetterabhaengigkeit beider Energieformen wird verglichen', 'Umweltwirkung beider Energieformen wird angesprochen']),
  q('vollstaendigkeit_frage', 'Mach Nachhaltigkeit: Definition Beispiel Meinung.',
    ['Eine Definition von Nachhaltigkeit wird gegeben', 'Ein konkretes Beispiel wird genannt', 'Eine kurze Bewertung/Meinung wird formuliert', 'Die drei verlangten Teile sind erkennbar getrennt']),
  q('vollstaendigkeit_frage', 'Erklaer Mitose Meiose, Zweck Ergebnis Teilungen.',
    ['Der Zweck der Mitose wird genannt', 'Der Zweck der Meiose wird genannt', 'Das Ergebnis der Zellteilungen wird verglichen', 'Die Anzahl der Teilungen wird korrekt verglichen']),
  q('vollstaendigkeit_frage', 'Quelle pruefen: Autor Datum Absicht Belege, bitte.',
    ['Autor/Herausgeber wird als Pruefpunkt erklaert', 'Datum/Aktualitaet wird als Pruefpunkt erklaert', 'Absicht/Interesse der Quelle wird als Pruefpunkt erklaert', 'Belege/Quellenverweise werden als Pruefpunkt erklaert']),
  q('vollstaendigkeit_frage', 'Lernstrategie bitte mit Plan, Wiederholen, Test.',
    ['Ein konkreter Zeitplan oder Lernrhythmus wird genannt', 'Wiederholung wird als eigener Bestandteil beschrieben', 'Selbsttest/Uebungsfragen werden zur Kontrolle eingeplant', 'Die Strategie ist praktisch umsetzbar']),

  // Vollstaendigkeit gemaess Moeglichkeit
  q('vollstaendigkeit_moeglichkeit', 'Fake news erkennen, mach gut.',
    ['Quelle/Absender wird geprueft', 'Belege und Gegenpruefung werden empfohlen', 'Manipulative Sprache/Bilder oder Emotionen werden beruecksichtigt', 'Datum, Kontext oder Bildrueckwaertssuche werden als weitere Pruefpunkte genannt']),
  q('vollstaendigkeit_moeglichkeit', 'Plan fuer Mathepruefung, moeglichst brauchbar.',
    ['Lernziele/Themenuebersicht werden erstellt', 'Uebungsaufgaben und Fehleranalyse werden empfohlen', 'Zeitplanung und Wiederholung werden beruecksichtigt', 'Selbstkontrolle oder Probepruefung wird eingeplant']),
  q('vollstaendigkeit_moeglichkeit', 'KI Schule Chancen Risiken alles wichtige.',
    ['Chancen wie Hilfe, Feedback oder Individualisierung werden genannt', 'Risiken wie Fehler, Abhaengigkeit, Datenschutz oder Plagiat werden genannt', 'Konkrete Beispiele aus dem Schulalltag werden gegeben', 'Eine ausgewogene Bewertung oder Nutzungsregeln werden formuliert']),
  q('vollstaendigkeit_moeglichkeit', 'Wie macht man gute Quellenanalyse historisch.',
    ['Autor, Zeit, Ort oder Quellenart werden beruecksichtigt', 'Inhalt, Sprache und Absicht werden analysiert', 'Historischer Kontext wird einbezogen', 'Grenzen/Unsicherheiten der Quelle werden angesprochen']),
  q('vollstaendigkeit_moeglichkeit', 'Entscheidungshilfe Berufswahl, nicht zu simpel.',
    ['Interessen und Staerken werden beruecksichtigt', 'Anforderungen und Ausbildung/Studium werden geprueft', 'Praktische Erfahrungen wie Schnuppern/Praktikum werden empfohlen', 'Vor- und Nachteile sowie Perspektiven werden abgewogen']),

  // Pruefung / Verifikation
  q('pruefung_verifikation', '18 prozent von 250, rechne und check.',
    ['Das Ergebnis 45 wird korrekt berechnet', 'Der Rechenweg wird gezeigt', 'Eine Kontrollrechnung wird durchgefuehrt', 'Das Endergebnis wird klar markiert']),
  q('pruefung_verifikation', 'Zug 120 km 1.5h wie schnell, Einheit nicht vergessen.',
    ['Die Durchschnittsgeschwindigkeit 80 km/h wird korrekt berechnet', 'Strecke/Zeit wird als Rechenweg verwendet', 'Die Einheit km/h wird genannt und geprueft', 'Das Ergebnis wird kurz plausibilisiert']),
  q('pruefung_verifikation', 'Stimmt 7 mal 8 gleich 54? erklaer.',
    ['Die Aussage wird als falsch erkannt', 'Das korrekte Ergebnis 56 wird genannt', 'Eine Kontrollmethode wird gezeigt', 'Die Korrektur wird klar formuliert']),
  q('pruefung_verifikation', 'Wasser kocht immer bei 100 Grad, stimmt das ganz genau?',
    ['Die Aussage wird als nur unter Normaldruck richtig eingeordnet', 'Luftdruck/Hoehe als Einfluss wird genannt', 'Die Verallgemeinerung "immer" wird kritisch geprueft', 'Die Antwort bleibt sachlich und korrekt']),
  q('pruefung_verifikation', 'Durchschnitt 6 8 10 12 und sag ob plausibel.',
    ['Der Durchschnitt 9 wird korrekt berechnet', 'Summe und Division durch vier werden gezeigt', 'Plausibilitaet zwischen Minimum 6 und Maximum 12 wird geprueft', 'Das Ergebnis wird klar als Durchschnitt bezeichnet']),

  // Rueckfragefaehigkeit
  q('rueckfragefaehigkeit', 'Mach mir einen Plan.',
    ['Das Modell fragt nach dem Ziel oder Thema des Plans', 'Das Modell fragt nach Zeitraum/Deadline', 'Das Modell fragt nach Rahmenbedingungen oder Prioritaeten', 'Es erstellt keinen endgueltigen spezifischen Plan ohne zentrale Informationen']),
  q('rueckfragefaehigkeit', 'Schreib das besser.',
    ['Das Modell bittet um den zu verbessernden Text', 'Das Modell fragt nach Ziel oder Zielgruppe', 'Das Modell fragt nach Stil, Laenge oder Bewertungskriterien', 'Es erfindet keinen Ausgangstext']),
  q('rueckfragefaehigkeit', 'Welche Option soll ich nehmen?',
    ['Das Modell fragt, welche Optionen gemeint sind', 'Das Modell fragt nach Entscheidungskriterien', 'Das Modell fragt nach Kontext/Ziel der Entscheidung', 'Es trifft keine blinde Empfehlung']),
  q('rueckfragefaehigkeit', 'Hilf mir bei der Praesentation.',
    ['Das Modell fragt nach Thema', 'Das Modell fragt nach Zielgruppe oder Schulstufe', 'Das Modell fragt nach Dauer/Format', 'Es bietet hoechstens allgemeine Strukturhilfe ohne Details zu erfinden']),
  q('rueckfragefaehigkeit', 'Sag mir was ich kaufen soll.',
    ['Das Modell fragt nach Produktkategorie', 'Das Modell fragt nach Budget', 'Das Modell fragt nach wichtigen Anforderungen/Nutzung', 'Es empfiehlt nicht vorschnell ein konkretes Produkt']),

  // Unsicherheit offenlegen
  q('unsicherheit', 'Alex hat viel gelernt, besteht Alex?',
    ['Die Antwort erkennt fehlende Informationen', 'Unsicherheit wird klar formuliert', 'Faktoren wie Pruefungsschwere, Vorwissen oder Lernqualitaet werden genannt', 'Es wird keine sichere Prognose erfunden']),
  q('unsicherheit', 'Eine kleine Studie sagt es wirkt, ist es bewiesen?',
    ['Die Antwort unterscheidet Hinweis und Beweis', 'Stichprobengroesse/Methodik wird als Unsicherheitsfaktor genannt', 'Replikation oder weitere Studien werden erwaehnt', 'Die Aussage wird nicht ueberinterpretiert']),
  q('unsicherheit', 'Viele Bewertungen gut, ist Produkt sicher gut?',
    ['Keine Garantie wird behauptet', 'Moegliche Verzerrungen/Fake-Bewertungen werden genannt', 'Weitere Pruefpunkte wie Tests, Rueckgabe oder eigene Beduerfnisse werden empfohlen', 'Unsicherheit wird transparent gemacht']),
  q('unsicherheit', 'KI sagt das ohne Quellen, kann ich es glauben?',
    ['Die Antwort erklaert, dass KI-Antworten falsch sein koennen', 'Fehlende Quellen werden als Unsicherheitsgrund genannt', 'Ueberpruefung mit verlaesslichen Quellen wird empfohlen', 'Es wird keine sichere Richtigkeitsbewertung behauptet']),
  q('unsicherheit', 'Foto vielleicht Zuerich 1900, ist das sicher?',
    ['Die Unsicherheit des Wortes "vielleicht" wird erkannt', 'Pruefkriterien wie Quelle, Gebaeude, Kleidung oder Metadaten werden genannt', 'Keine sichere Bestaetigung ohne Bild/Quelle wird gegeben', 'Weitere Informationen werden angefordert oder empfohlen']),

  // Internet- / Quellenqualitaet
  q('internet_quellenqualitaet', 'Aktuelle Regeln Schweiz Einreise, wo schauen?',
    ['Offizielle Quellen wie SEM/EDA oder Behoerden werden bevorzugt', 'Aktualitaet/Datum der Information wird betont', 'Visa, Dokumente oder Zollregeln werden als Pruefpunkte genannt', 'Die Antwort vermeidet veraltete feste Aussagen']),
  q('internet_quellenqualitaet', 'Arbeitslosenquote Schweiz aktuell Quelle?',
    ['Offizielle Statistikquellen wie SECO/BFS werden genannt', 'Zeitraum und Definition der Quote werden beachtet', 'Aktualitaet der Veroeffentlichung wird geprueft', 'Medienberichte werden nicht als alleinige Hauptquelle genutzt']),
  q('internet_quellenqualitaet', 'Impfempfehlung Schweiz aktuell, wie pruefen?',
    ['BAG oder kantonale Gesundheitsstellen werden als Hauptquellen genannt', 'Datum/Aktualitaet der Empfehlung wird geprueft', 'Zielgruppe und individuelle Situation werden beachtet', 'Die Antwort ersetzt keine medizinische Beratung']),
  q('internet_quellenqualitaet', 'Neue App Datenschutz, welche Quellen?',
    ['Datenschutzerklaerung und Berechtigungen werden geprueft', 'Unabhaengige Tests oder offizielle Store-Informationen werden beruecksichtigt', 'Version/Datum der App wird beachtet', 'Werbeaussagen werden kritisch eingeordnet']),
  q('internet_quellenqualitaet', 'Medien sagen Studie beweist was, wie checken?',
    ['Originalstudie oder Abstract wird als Primaerquelle empfohlen', 'Methodik, Stichprobe und Limitierungen werden geprueft', 'Medienbericht wird mit der Studie verglichen', 'Uebertreibungen oder falsche Kausalitaet werden beachtet']),

  // Relevanz
  q('relevanz', 'Bienen warum wichtig, nicht Honig.',
    ['Die Antwort konzentriert sich auf Bestaeubung', 'Bedeutung fuer Pflanzenvermehrung wird erklaert', 'Landwirtschaft/Oekosysteme werden relevant erwaehnt', 'Honigproduktion dominiert die Antwort nicht']),
  q('relevanz', 'Homeoffice fuer Schueler gut schlecht, nicht Firma.',
    ['Die Perspektive Schueler wird eingehalten', 'Vorteile fuer Schueler werden genannt', 'Nachteile fuer Schueler werden genannt', 'Unternehmensperspektive dominiert nicht']),
  q('relevanz', 'Schlaf Lernen warum, keine Ernaehrungstipps.',
    ['Zusammenhang zwischen Schlaf und Lernen/Gedaechtnis wird erklaert', 'Konzentration oder Erholung wird relevant genannt', 'Ernaehrungstipps werden vermieden', 'Die Antwort bleibt fokussiert auf die Frage']),
  q('relevanz', 'Inhaltsverzeichnis wozu, nicht Word Tutorial.',
    ['Orientierung fuer Leser wird erklaert', 'Struktur/Uebersichtlichkeit der Arbeit wird genannt', 'Bezug zu wissenschaftlicher oder schulischer Arbeit wird hergestellt', 'Technische Word-Schritte dominieren nicht']),
  q('relevanz', 'Betriebssystem Aufgabe, nicht Programmiersprachen.',
    ['Betriebssystem als Vermittler/Verwalter wird erklaert', 'Hardware, Dateien, Programme oder Benutzeroberflaeche werden relevant erwaehnt', 'Die Erklaerung ist fuer Anfaenger geeignet', 'Programmiersprachen werden nicht ausfuehrlich erklaert']),

  // Klarheit
  q('klarheit', 'Erklaer Regenbogen einfach.',
    ['Die Sprache ist einfach und verstaendlich', 'Lichtbrechung/Aufspaltung wird korrekt aber einfach erklaert', 'Wassertropfen werden als Ursache genannt', 'Ein anschauliches Beispiel oder Bild wird genutzt']),
  q('klarheit', 'Brutto netto Unterschied simpel.',
    ['Brutto wird einfach und korrekt erklaert', 'Netto wird einfach und korrekt erklaert', 'Ein alltagsnahes Beispiel wird gegeben', 'Die Antwort vermeidet unnoetige Fachsprache']),
  q('klarheit', 'Was ist Algorithmus fuer Anfaenger.',
    ['Algorithmus wird als Schritt-fuer-Schritt-Anleitung erklaert', 'Ein einfaches Alltagsbeispiel wird genutzt', 'Bezug zu Computern wird verstaendlich hergestellt', 'Die Antwort ist klar gegliedert']),
  q('klarheit', 'Hypothese ohne kompliziert.',
    ['Hypothese wird als ueberpruefbare Vermutung erklaert', 'Bezug zu Untersuchung/Experiment wird hergestellt', 'Ein einfaches Beispiel wird gegeben', 'Die Antwort ist knapp und verstaendlich']),
  q('klarheit', 'Ursache Wirkung einfach mit Beispiel.',
    ['Ursache wird als Grund/Ausloeser erklaert', 'Wirkung wird als Folge erklaert', 'Ein klares Beispiel wird gegeben', 'Die Unterscheidung bleibt eindeutig']),
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
      `${seed.criteriaId} weak-prompt-${next} for C - Prompt-Optimierung; intentionally weak prompt`,
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

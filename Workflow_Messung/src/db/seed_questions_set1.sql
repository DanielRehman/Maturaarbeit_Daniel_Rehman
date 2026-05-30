-- seed_questions_set1.sql
-- 27 questions (3 per criterion) for all 9 criteria
-- Testset: basic_evaluation_questions | setup_id: NULL (usable with any setup)
-- Every question includes a baseline correctness checkpoint.
-- Run with: sqlite3 data/matura.db < src/db/seed_questions_set1.sql

BEGIN TRANSACTION;

-- ============================================================
-- RICHTIGKEIT
-- Questions where vague wording risks factual errors;
-- a better prompt forces precise, verifiable facts.
-- ============================================================

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('richtigkeit', 'Erkläre, wie GPS funktioniert.', 'basic_evaluation_questions', 'Richtigkeit 1 – GPS-Physik');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Prinzip der Laufzeitmessung korrekt erklärt (nicht vereinfacht als blosse Triangulation)', 0),
  ((SELECT MAX(id) FROM questions), 'Mindestanzahl Satelliten korrekt genannt (mind. 4 für 3D-Position)', 1),
  ((SELECT MAX(id) FROM questions), 'Relativitätskorrekturen oder Notwendigkeit hochpräziser Atomuhren erwähnt', 2),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 3);

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('richtigkeit', 'Was ist der Unterschied zwischen DNA und RNA?', 'basic_evaluation_questions', 'Richtigkeit 2 – DNA vs. RNA');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Strukturunterschied korrekt: Doppelhelix (DNA) vs. Einzelstrang (RNA)', 0),
  ((SELECT MAX(id) FROM questions), 'Zuckerunterschiede korrekt: Desoxyribose (DNA) vs. Ribose (RNA)', 1),
  ((SELECT MAX(id) FROM questions), 'Basenunterschied korrekt: Thymin (DNA) vs. Uracil (RNA)', 2),
  ((SELECT MAX(id) FROM questions), 'Funktionsunterschied korrekt: genetische Speicherung vs. Proteinbiosynthese', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('richtigkeit', 'Erkläre den Unterschied zwischen Masse und Gewicht.', 'basic_evaluation_questions', 'Richtigkeit 3 – Masse vs. Gewicht');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Masse korrekt definiert: unveränderliche Stoffeigenschaft, Einheit kg', 0),
  ((SELECT MAX(id) FROM questions), 'Gewicht korrekt definiert: Kraft in Newton, F = m × g', 1),
  ((SELECT MAX(id) FROM questions), 'Alltagsverwechslung der Begriffe erkannt und korrekt kommentiert', 2),
  ((SELECT MAX(id) FROM questions), 'Einheiten korrekt und konsistent verwendet', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

-- ============================================================
-- VOLLSTAENDIGKEIT_FRAGE
-- Questions with multiple explicit requirements;
-- score drops if AI skips any part.
-- ============================================================

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('vollstaendigkeit_frage', 'Erkläre den menschlichen Verdauungsprozess: welche Organe sind beteiligt, was passiert in jedem, und was geschieht mit den Nährstoffen danach?', 'basic_evaluation_questions', 'Vollst.-Frage 1 – Verdauung');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Alle Hauptorgane genannt (mind. Mund, Magen, Dünndarm, Dickdarm)', 0),
  ((SELECT MAX(id) FROM questions), 'Funktion jedes genannten Organs erklärt', 1),
  ((SELECT MAX(id) FROM questions), 'Nährstoffverwertung nach der Verdauung beschrieben (Absorption, Blutkreislauf)', 2),
  ((SELECT MAX(id) FROM questions), 'Alle drei explizit gefragten Aspekte behandelt', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('vollstaendigkeit_frage', 'Beschreibe die Struktur eines Atoms: welche Teilchen gibt es, wo befinden sie sich und welche Ladung tragen sie?', 'basic_evaluation_questions', 'Vollst.-Frage 2 – Atomstruktur');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Proton korrekt: Kern, positiv geladen', 0),
  ((SELECT MAX(id) FROM questions), 'Neutron korrekt: Kern, neutral', 1),
  ((SELECT MAX(id) FROM questions), 'Elektron korrekt: Hülle, negativ geladen', 2),
  ((SELECT MAX(id) FROM questions), 'Alle drei Aspekte (Teilchen, Ort, Ladung) für alle Teilchen behandelt', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('vollstaendigkeit_frage', 'Erkläre den Begriff Inflation: was bedeutet er, wie entsteht sie und welche Auswirkungen hat sie auf die Wirtschaft?', 'basic_evaluation_questions', 'Vollst.-Frage 3 – Inflation');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Definition korrekt erklärt (allgemeiner Preisanstieg, Kaufkraftverlust)', 0),
  ((SELECT MAX(id) FROM questions), 'Mindestens zwei Ursachen genannt (Nachfrage-, Angebots-, Geldmengen-Inflation o.Ä.)', 1),
  ((SELECT MAX(id) FROM questions), 'Mindestens zwei wirtschaftliche Auswirkungen genannt', 2),
  ((SELECT MAX(id) FROM questions), 'Alle drei explizit gefragten Aspekte behandelt', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

-- ============================================================
-- VOLLSTAENDIGKEIT_MOEGLICHKEIT
-- Open questions where a shallow answer scores low
-- and a comprehensive answer scores high.
-- ============================================================

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('vollstaendigkeit_moeglichkeit', 'Was sind die Ursachen des Zweiten Weltkriegs?', 'basic_evaluation_questions', 'Vollst.-Mögl. 1 – WW2 Ursachen');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Politische Ursachen genannt (Versailles, Revanchismus, Schwäche der Weimarer Republik)', 0),
  ((SELECT MAX(id) FROM questions), 'Wirtschaftliche Ursachen genannt (Weltwirtschaftskrise, Arbeitslosigkeit)', 1),
  ((SELECT MAX(id) FROM questions), 'Ideologische Ursachen genannt (Nationalsozialismus, Faschismus, Antisemitismus)', 2),
  ((SELECT MAX(id) FROM questions), 'Diplomatische Aspekte erwähnt (Appeasement-Politik, Nichtangriffspakt)', 3),
  ((SELECT MAX(id) FROM questions), 'Zusammenhang zwischen den Ursachen erläutert (nicht nur Aufzählung)', 4),
  ((SELECT MAX(id) FROM questions), 'Mindestens fünf konkrete Faktoren insgesamt genannt', 5),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 6);

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('vollstaendigkeit_moeglichkeit', 'Was ist Demokratie?', 'basic_evaluation_questions', 'Vollst.-Mögl. 2 – Demokratie');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Definition und Grundprinzipien genannt (Volkssouveränität, Gewaltenteilung, Minderheitenschutz)', 0),
  ((SELECT MAX(id) FROM questions), 'Verschiedene Demokratieformen genannt (direkt, repräsentativ, parlamentarisch, präsidial)', 1),
  ((SELECT MAX(id) FROM questions), 'Historische Entwicklung des Konzepts erwähnt', 2),
  ((SELECT MAX(id) FROM questions), 'Stärken und Schwächen oder Herausforderungen behandelt', 3),
  ((SELECT MAX(id) FROM questions), 'Bedrohungen der Demokratie (Populismus, Autoritarismus) erwähnt', 4),
  ((SELECT MAX(id) FROM questions), 'Konkrete Beispiele bestehender Demokratien genannt', 5),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 6);

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('vollstaendigkeit_moeglichkeit', 'Wie verändert die Digitalisierung die Arbeitswelt?', 'basic_evaluation_questions', 'Vollst.-Mögl. 3 – Digitalisierung Arbeit');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Automatisierung und Jobverlust in bestimmten Bereichen thematisiert', 0),
  ((SELECT MAX(id) FROM questions), 'Entstehung neuer Berufsfelder und Chancen erwähnt', 1),
  ((SELECT MAX(id) FROM questions), 'Veränderte Arbeitsbedingungen beschrieben (Remote Work, Plattformarbeit, Flexibilität)', 2),
  ((SELECT MAX(id) FROM questions), 'Veränderte Qualifikationsanforderungen und Umschulung erwähnt', 3),
  ((SELECT MAX(id) FROM questions), 'Gesellschaftliche oder soziale Auswirkungen behandelt (Ungleichheit, Work-Life-Balance)', 4),
  ((SELECT MAX(id) FROM questions), 'Konkrete Beispiele genannt', 5),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 6);

-- ============================================================
-- PRUEFUNG_VERIFIKATION
-- Questions where facts are checkable and the AI
-- should visibly verify or cross-check its own claims.
-- ============================================================

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('pruefung_verifikation', 'Nenne alle Planeten des Sonnensystems in der richtigen Reihenfolge von der Sonne.', 'basic_evaluation_questions', 'Verifikation 1 – Planeten');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Alle 8 Planeten korrekt und vollständig genannt', 0),
  ((SELECT MAX(id) FROM questions), 'Reihenfolge korrekt (Merkur, Venus, Erde, Mars, Jupiter, Saturn, Uranus, Neptun)', 1),
  ((SELECT MAX(id) FROM questions), 'Pluto-Status erwähnt (kein Planet mehr seit IAU-Beschluss 2006)', 2),
  ((SELECT MAX(id) FROM questions), 'Modell überprüft Vollständigkeit explizit (zählt nach oder bestätigt die Anzahl)', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('pruefung_verifikation', 'Welche Edelgase gibt es im Periodensystem und welche Eigenschaften teilen sie?', 'basic_evaluation_questions', 'Verifikation 2 – Edelgase');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Alle 6 klassischen Edelgase korrekt genannt (He, Ne, Ar, Kr, Xe, Rn)', 0),
  ((SELECT MAX(id) FROM questions), 'Gemeinsame Eigenschaften korrekt (volle Außenschale, reaktionsträge, einatomig)', 1),
  ((SELECT MAX(id) FROM questions), 'Modell überprüft Vollständigkeit der Liste explizit', 2),
  ((SELECT MAX(id) FROM questions), 'Keine falschen Elemente ohne Korrektur enthalten', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('pruefung_verifikation', 'Erkläre, warum Schall im Weltall nicht übertragen werden kann.', 'basic_evaluation_questions', 'Verifikation 3 – Schall im Vakuum');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Physikalische Erklärung korrekt: Schallwellen brauchen ein Medium (Materie)', 0),
  ((SELECT MAX(id) FROM questions), 'Vakuum als Ursache korrekt beschrieben (fehlende Materie im Weltall)', 1),
  ((SELECT MAX(id) FROM questions), 'Konsequenz klar formuliert: kein Medium = kein Schall', 2),
  ((SELECT MAX(id) FROM questions), 'Antwort physikalisch konsistent und widerspruchsfrei – Modell prüft eigene Aussagen', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

-- ============================================================
-- UNSICHERHEIT
-- Inherently uncertain questions; confident answers score low,
-- calibrated hedging scores high.
-- ============================================================

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('unsicherheit', 'Wann wird die nächste globale Wirtschaftskrise kommen?', 'basic_evaluation_questions', 'Unsicherheit 1 – Wirtschaftskrise');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Klar kommuniziert dass der Zeitpunkt nicht vorhersagbar ist', 0),
  ((SELECT MAX(id) FROM questions), 'Keine falsche Gewissheit über Zeitpunkt oder Auslöser', 1),
  ((SELECT MAX(id) FROM questions), 'Risikofaktoren oder Frühindikatoren genannt', 2),
  ((SELECT MAX(id) FROM questions), 'Historische Muster erwähnt ohne daraus sichere Prognosen abzuleiten', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('unsicherheit', 'Gibt es Leben auf anderen Planeten?', 'basic_evaluation_questions', 'Unsicherheit 2 – Ausserirdisches Leben');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Unsicherheit klar kommuniziert (keine Gewissheit in beide Richtungen)', 0),
  ((SELECT MAX(id) FROM questions), 'Unterschied zwischen wissenschaftlicher Möglichkeit und gesichertem Wissen gemacht', 1),
  ((SELECT MAX(id) FROM questions), 'Aktueller Forschungsstand mit Einschränkungen dargestellt (Exoplaneten, Mars-Forschung)', 2),
  ((SELECT MAX(id) FROM questions), 'Keine falschen Behauptungen ohne Vorbehalt', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('unsicherheit', 'Wie wird sich das Klima in der Schweiz in 50 Jahren verändern?', 'basic_evaluation_questions', 'Unsicherheit 3 – Klimaprognose Schweiz');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Unsicherheit der Klimamodelle und Szenarien kommuniziert', 0),
  ((SELECT MAX(id) FROM questions), 'Verschiedene Szenarien (Emissionspfade RCP/SSP) oder Bandbreite erwähnt', 1),
  ((SELECT MAX(id) FROM questions), 'Keine definitive Aussage ohne Vorbehalt', 2),
  ((SELECT MAX(id) FROM questions), 'Bandbreite möglicher Entwicklungen dargestellt', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

-- ============================================================
-- RUECKFRAGEFAEHIGKEIT
-- Questions missing critical information; AI should ask
-- rather than assume and answer blindly.
-- ============================================================

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('rueckfragefaehigkeit', 'Kannst du mir bei meiner Präsentation helfen?', 'basic_evaluation_questions', 'Rückfrage 1 – Präsentation');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Fragt nach dem Thema der Präsentation', 0),
  ((SELECT MAX(id) FROM questions), 'Fragt nach der konkreten Art der Hilfe (Inhalt, Struktur, Folien, Sprache?)', 1),
  ((SELECT MAX(id) FROM questions), 'Fragt nach Zielgruppe oder Rahmen (Schule, Beruf, Konferenz?)', 2),
  ((SELECT MAX(id) FROM questions), 'Macht keine ungerechtfertigten Annahmen ohne Nachfrage', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('rueckfragefaehigkeit', 'Schreibe mir eine Zusammenfassung.', 'basic_evaluation_questions', 'Rückfrage 2 – Zusammenfassung');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Fragt nach dem zu zusammenfassenden Material', 0),
  ((SELECT MAX(id) FROM questions), 'Fragt nach gewünschter Länge oder Format', 1),
  ((SELECT MAX(id) FROM questions), 'Fragt nach Zielgruppe oder Zweck', 2),
  ((SELECT MAX(id) FROM questions), 'Gibt keine generische Zusammenfassung ohne vorherige Klärung', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('rueckfragefaehigkeit', 'Erkläre mir den Begriff Effizienz.', 'basic_evaluation_questions', 'Rückfrage 3 – Effizienz (mehrdeutig)');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Fragt nach dem Kontext / Fachgebiet ODER benennt explizit mehrere Bedeutungen und behandelt sie getrennt', 0),
  ((SELECT MAX(id) FROM questions), 'Macht keine impliziten Annahmen über den Kontext ohne Kennzeichnung', 1),
  ((SELECT MAX(id) FROM questions), 'Kommuniziert die Mehrdeutigkeit des Begriffs klar', 2),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 3);

-- ============================================================
-- INTERNET_QUELLENQUALITAET
-- Questions requiring current or sourced information;
-- score drops for unsourced, undated, or stale answers.
-- ============================================================

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('internet_quellenqualitaet', 'Was ist der aktuelle Stand der Forschung zu mRNA-Impfstoffen?', 'basic_evaluation_questions', 'Quellenqualität 1 – mRNA-Forschung');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Wissensgrenze oder Trainingsdatum kommuniziert', 0),
  ((SELECT MAX(id) FROM questions), 'Konkrete Studien, Institutionen oder Fachzeitschriften genannt', 1),
  ((SELECT MAX(id) FROM questions), 'Unterschied zwischen gesichertem und noch erforschtem Wissen dargestellt', 2),
  ((SELECT MAX(id) FROM questions), 'Keine veralteten Informationen ohne Hinweis darauf', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('internet_quellenqualitaet', 'Welche Länder haben aktuell die höchste Inflationsrate weltweit?', 'basic_evaluation_questions', 'Quellenqualität 2 – Inflationsraten');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Quelle genannt (IWF, Weltbank, Statista o.Ä.)', 0),
  ((SELECT MAX(id) FROM questions), 'Datum oder Zeitraum der Daten angegeben', 1),
  ((SELECT MAX(id) FROM questions), 'Aktualitätsgrenze des Wissens kommuniziert', 2),
  ((SELECT MAX(id) FROM questions), 'Keine erfundenen Länder oder nicht belegten Zahlen', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('internet_quellenqualitaet', 'Was sind die neuesten Entwicklungen in der Quantencomputing-Forschung?', 'basic_evaluation_questions', 'Quellenqualität 3 – Quantencomputing');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Wissensgrenze klar kommuniziert (Trainingsdatum oder Aktualitätshinweis)', 0),
  ((SELECT MAX(id) FROM questions), 'Konkrete Meilensteine oder Unternehmen mit zeitlicher Einordnung genannt', 1),
  ((SELECT MAX(id) FROM questions), 'Zwischen gesichertem und spekulativem Wissen unterschieden', 2),
  ((SELECT MAX(id) FROM questions), 'Quellenangaben oder nachvollziehbare Referenzen vorhanden', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

-- ============================================================
-- RELEVANZ
-- Questions where AI tends to drift; focused answers score
-- high, tangential answers score low.
-- ============================================================

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('relevanz', 'Was ist der Unterschied zwischen einem Anwalt und einem Richter?', 'basic_evaluation_questions', 'Relevanz 1 – Anwalt vs. Richter');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Fokus auf den Unterschied: Rolle, Aufgaben, Befugnisse, Stellung im Verfahren', 0),
  ((SELECT MAX(id) FROM questions), 'Keine ausufernde allgemeine Erklärung des Rechtssystems ohne direkten Bezug', 1),
  ((SELECT MAX(id) FROM questions), 'Wesentliche Unterschiede klar herausgearbeitet', 2),
  ((SELECT MAX(id) FROM questions), 'Angemessene Länge ohne Ausschweifungen', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('relevanz', 'Erkläre kurz den Treibhauseffekt.', 'basic_evaluation_questions', 'Relevanz 2 – Treibhauseffekt');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Fokus auf den Treibhauseffekt selbst (nicht Klimapolitik, Wirtschaft oder allgemeiner Klimawandel)', 0),
  ((SELECT MAX(id) FROM questions), 'Angemessene Kürze – das Wort "kurz" im Fragetext wird respektiert', 1),
  ((SELECT MAX(id) FROM questions), 'Keine tangentialen Themen ohne direkten Bezug zum Treibhauseffekt', 2),
  ((SELECT MAX(id) FROM questions), 'Wesentliche Elemente erklärt (Treibhausgase, Infrarotstrahlung, Atmosphäre)', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('relevanz', 'Nenne die wichtigsten Merkmale des Impressionismus in der Malerei.', 'basic_evaluation_questions', 'Relevanz 3 – Impressionismus');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Fokus auf stilistische Merkmale (Lichtwirkung, Pinselführung, Freilichtmalerei, Momentaufnahmen)', 0),
  ((SELECT MAX(id) FROM questions), 'Keine ausschweifende allgemeine Kunstgeschichte ohne direkten Stilbezug', 1),
  ((SELECT MAX(id) FROM questions), 'Konkrete stilistische Merkmale genannt', 2),
  ((SELECT MAX(id) FROM questions), 'Keine ausführlichen Künstlerbiografien ohne direkten Bezug zum Stil', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

-- ============================================================
-- KLARHEIT
-- Questions where the quality of explanation itself is tested;
-- audience-appropriate, structured, analogy-supported answers
-- score high.
-- ============================================================

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('klarheit', 'Erkläre das Konzept der Evolution einem Schüler der 6. Klasse.', 'basic_evaluation_questions', 'Klarheit 1 – Evolution für 12-Jährige');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Sprache altersgerecht und einfach', 0),
  ((SELECT MAX(id) FROM questions), 'Mindestens eine Analogie oder konkretes Beispiel verwendet', 1),
  ((SELECT MAX(id) FROM questions), 'Grundprinzip verständlich erklärt (Variation, Selektion, Vererbung)', 2),
  ((SELECT MAX(id) FROM questions), 'Keine Fachbegriffe ohne Erklärung verwendet', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('klarheit', 'Was ist eine chemische Reaktion? Erkläre es so einfach wie möglich.', 'basic_evaluation_questions', 'Klarheit 2 – Chemische Reaktion');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Definition klar und einfach formuliert', 0),
  ((SELECT MAX(id) FROM questions), 'Mindestens ein Alltagsbeispiel genannt (Verbrennung, Rosten, Kochen o.Ä.)', 1),
  ((SELECT MAX(id) FROM questions), 'Ausgangsstoffe und Produkte verständlich erklärt (ohne Fachbegriffe vorauszusetzen)', 2),
  ((SELECT MAX(id) FROM questions), 'Keine unnötigen Fachbegriffe ohne Erklärung', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

INSERT INTO questions (criteria_id, question_text, testset, notes)
VALUES ('klarheit', 'Wie entsteht ein Gewitter? Erkläre Schritt für Schritt.', 'basic_evaluation_questions', 'Klarheit 3 – Gewitter Schritt für Schritt');
INSERT INTO checkpoints (question_id, item_text, sort_order) VALUES
  ((SELECT MAX(id) FROM questions), 'Klare Schrittfolge eingehalten', 0),
  ((SELECT MAX(id) FROM questions), 'Logischer und zeitlich korrekter Aufbau (Lufterhitzung → Aufwind → Wolkenbildung → Entladung)', 1),
  ((SELECT MAX(id) FROM questions), 'Verständliche Sprache für Laien', 2),
  ((SELECT MAX(id) FROM questions), 'Blitz und Donner sowie deren zeitlicher Zusammenhang erklärt', 3),
  ((SELECT MAX(id) FROM questions), 'Keine sachlich falschen Aussagen enthalten', 4);

COMMIT;

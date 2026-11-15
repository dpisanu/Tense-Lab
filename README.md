# Tense Lab — Englisch für Klasse 7 und 8

Eine **fertige, statische Web-App** für deutschsprachige SuS, um englische Zeitformen zu lernen. Kein Framework, kein Build-Schritt, kein Konto, keine Datenbank, keine Cookies, keine Analytics, keine externen JavaScript-/Font-Dienste.

## Funktionen

- **Überblick:** Matrix aus **Present / Past / Future** × **Simple / Continuous / Perfect / Perfect Continuous**; Spalten einzeln ausblendbar.
- **Schulstoff-Schalter:** standardmäßig werden die sieben gängigen Zeitformen gezeigt. Fortgeschrittene Zeiten bleiben optional.
- **Will-Future und Going-to-Future:** zwei getrennte Kacheln innerhalb der **Future × Simple**-Zelle.
- **Regel-Overlay:** Wann? Wer? Hilfsverb? Verbform? Verneinung, Fragen, Signalwörter, Beispiele und typische Fehler.
- **Test me:** Zeitformen und vier Schwierigkeitsgrade auswählen. Satzkarten werden gemischt. Per Drag-and-drop **oder** Tippen auf das Zielfeld einsortieren.
- **Ergebnisse:** Jedes Feld zeigt richtige/falsche Zuordnungen; **Show me** öffnet einen Bericht inklusive der falschen Sätze, der korrekten Zeitform und einer Begründung.
- **Keine Speicherung:** Fortschritt existiert nur in der gerade geöffneten Browserseite. Ein Neuladen beginnt von vorne.
- **Inhalte:** 13 Zeitformen, 156 Übungssätze (je 3 Sätze je Zeitform und Schwierigkeitsstufe) in zwei editierbaren JSON-Dateien.

## Einen neuen Satz hinzufügen

Aus dem Repository die Datei `data/cards.json` öffnen. Die Datei ist ein JSON-Array aus Objekten. Ein neuer Eintrag sieht so aus:

```json
{
  "sentence": "My sister usually walks to school.",
  "tense": "simple-present",
  "difficulty": "medium"
}
```

- `sentence`: Ein englischer Beispielsatz.
- `tense`: Exakte Tense-ID aus `data/tenses.json` (Liste unten).
- `difficulty`: **`easy`**, **`medium`**, **`hard`** oder **`difficult`**.
- `focus` *(optional)*: Wenn ein Satz **mehrere Zeitformen** enthält, diejenige Verbphrase angeben, die bewertet werden soll. Sie wird auf der Karte hervorgehoben. Beispiel: `"focus": "was reading"`.

**Wichtig bei JSON:** Zwischen zwei Objekten steht ein Komma, nach dem letzten Objekt nicht. Doppelte Anführungszeichen verwenden, keine Kommentare in JSON.

**Anmerkung zur Kartenauswahl:** Pro ausgewählter Zeitform werden **maximal drei Karten der gewählten Schwierigkeitsstufe** zufällig in eine Runde genommen. Wenn mehr Sätze zu einer Zeitform und einem Schwierigkeit Level existieren, werden unterschiedliche Sätze zufällig ausgewählt. Für die nächste Runde neu starten oder **Noch eine Runde** klicken.

### Unterstützte Tense-IDs

| Tense-ID | Englische Zeitform | Aktueller Schulstoff? |
| --- | --- | --- |
| `simple-present` | Simple Present | Ja |
| `present-progressive` | Present Progressive | Ja |
| `simple-past` | Simple Past | Ja |
| `past-progressive` | Past Progressive | Ja |
| `present-perfect` | Present Perfect | Ja |
| `going-to-future` | Going-to-Future | Ja |
| `will-future` | Will-Future | Ja |
| `present-perfect-progressive` | Present Perfect Progressive | Extra |
| `past-perfect` | Past Perfect | Extra |
| `past-perfect-progressive` | Past Perfect Progressive | Extra |
| `future-progressive` | Future Progressive | Extra |
| `future-perfect` | Future Perfect | Extra |
| `future-perfect-progressive` | Future Perfect Progressive | Extra |

**Zum Anpassen der Regeln:** `data/tenses.json` bearbeiten. `school: true` bedeutet, dass die Zeitform zum standardmäßig ausgewählten Schulstoff gehört. Für jede Tense-ID müssen ihre Beispiele, ihr Hilfsverb und die Verbform korrekt definiert sein. 

**Hinweis:** Verändere vorhandene IDs nur, wenn sie auch in allen Übungssätzen aktualisiert werden.

---

## Lokal auf dem Computer testen

**Nicht** `index.html` einfach per Doppelklick öffnen. Der Browser blockiert oft das Laden der JSON-Dateien über `file://`.

Öffne stattdessen im Ordner `tense-lab` ein Terminal und starte:

```bash
python3 -m http.server 8000
```

Im Browser **http://localhost:8000/** öffnen. Mit **Strg+C** den lokalen Webserver beenden. Wenn Python nicht installiert ist, kann alternativ `npx serve .` verwendet werden (mit installiertem Node.js und Internetzugang für das Paket).

Die Datenprüfung lässt sich lokal aufrufen mit:

```bash
python3 scripts/validate_cards.py
```

## Projektstruktur

```text
tense-lab/
├── index.html                 # Navigation, Übersichts- und Spielbereiche
├── assets/
│   ├── app.js                # Matrix, Karten, Drag & Drop, Auswertungen
│   └── style.css             # Responsives Design
├── data/
│   ├── cards.json            # Alle Übungssätze — hier leicht ergänzen
│   └── tenses.json           # Regeln, Beispiele, Formeln und Erklärungen
├── scripts/
│   └── validate_cards.py     # Content-Prüfung vor dem Deployment
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Pages Deployment-Pipeline
├── README.md
└── LICENSE
```

## Häufige Probleme

**GitHub zeigt die Seite mit Fehler 404:** Unter `Settings → Pages` muss als Source **GitHub Actions** ausgewählt sein. Danach `Actions` auf einen erfolgreichen `deploy`-Job prüfen. Die URL muss den Repository-Namen am Ende enthalten: `/tense-lab/`.

**In Actions erscheint ein rotes ❌:** Der `build`-Job prüft JSON-Daten. Auf den fehlgeschlagenen Job klicken: dort steht die konkrete Fehlermeldung. Für die erstmalige Einrichtung auch die GitHub Pages-Einstellung kontrollieren.

**Der Satzstapel bleibt leer:** JSON-Syntax kontrollieren, im Browser die Developer Tools (F12) und die Console ansehen; wenn lokal geöffnet, unbedingt den lokalen Webserver verwenden.

**Neue Sätze fehlen:** GitHub Actions muss nach dem Commit erfolgreich beendet sein, danach die Seite neu laden. Der Browser lädt die JSON-Dateien mit `cache: 'no-store'`.

**Der Drag-Vorgang klappt auf dem Handy nicht gut:** Immer alternativ die Zielkarte **antippen**. Das funktioniert auch mit Tastatur (Tab und Enter).

## Datenschutz und Grenzen

- Es gibt **keine Nutzerprofile, Accounts, Cookies, Datenbank, Local Storage, Session Storage, Service Worker oder Analytics** im Anwendungscode.
- Spielstand, Auswahl und Fehlerberichte liegen ausschließlich im Arbeitsspeicher der geladenen Webseite; Browser-Neuladen/Tab-Schließen setzt sie zurück.
- Keine externen Skripte, Fonts oder API-Requests. Der Browser lädt nur Dateien aus dem eigenen GitHub-Pages-Projekt.
- **Hosting-Hinweis:** GitHub als Hosting-Anbieter kann unabhängig davon technische Verbindungsdaten wie IP-Adressen in Serverlogs verarbeiten. Das ist nicht gleichbedeutend mit einer in der App gespeicherten Lernsitzung.
- Alle im öffentlichen GitHub-Repository abgelegten Sätze und Regeln sind öffentlich sichtbar; bitte keine Namen oder persönlichen Angaben ergänzen.

## Didaktik

Die App zeigt Zeitform **und** Anwendung: nicht „immer bei *while* Past Progressive“, sondern eher „eine Handlung lief zu einem bestimmten Zeitpunkt“. Signalwörter sind Hinweise, keine starren Regeln. Erweiterte Zeiten sind als **Extra** sichtbar und im Schulstoff-Modus ausgeblendet, damit die Lernenden nicht unnötig überfordert werden. (Als Didaktische Architektur Entscheidung für die SuS aus der Klasse 7)

# Lizenz und Urheberrecht

Siehe [LICENSE](./LICENSE)

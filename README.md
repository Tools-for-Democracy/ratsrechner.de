# Ratsrechner.de - Dokumentation

## Über das Projekt

Ratsrechner.de ist eine Webanwendung zur Berechnung und Visualisierung von Sitzverteilungen in Kommunalparlamenten. Die Software ermöglicht es:

- Historische Wahlergebnisse zu analysieren
- Zukünftige Wahlergebnisse basierend auf Umfragedaten zu simulieren
- Die Sitzverteilung nach verschiedenen Verfahren (z.B. Sainte-Laguë) zu berechnen
- Die gewählten Kandidaten pro Partei anzuzeigen (Direktmandate und Listenmandate)

Die Anwendung besteht aus mehreren Hauptkomponenten:
- **App.jsx**: Übergeordnete Komponente, die die Anwendung strukturiert
- **Sidebar.jsx**: Ermöglicht die Auswahl der Wahl und Kommune, zeigt die berechnete Sitzverteilung an
- **DataPreview.jsx**: Verwaltet die Wahlergebnisse je Wahlkreis und bestimmt die Wahlkreissieger

## Datenstruktur für ratsrechner.de

### Überblick der Dateistruktur

Die Daten für den Ratsrechner sind in einer hierarchischen JSON-Struktur organisiert:

1. `/data/elections.json` - Hauptdatei mit Informationen zu allen verfügbaren Wahlen
2. `/data/{JAHR}/election.json` - Datei mit Informationen zu Kommunen für ein bestimmtes Wahljahr
3. `/data/{JAHR}/{KOMMUNE}.json` - Detaillierte Daten für eine spezifische Kommune in einem bestimmten Wahljahr

### 1. `/data/elections.json`

Diese Datei enthält eine Übersicht aller verfügbaren Wahljahre mit grundlegenden Informationen.

```json
{
  "2025": {
    "election-name": "Kommunalwahl 2025",
    "election-date": "2025-09-14",
    "seat-allocation": {
      "key": "rock",
      "name": "Rock"
    },
    "data-source": "/data/2025/election.json"
  },
  "2020": {
    "election-name": "Kommunalwahl 2020",
    "election-date": "2020-09-13",
    "seat-allocation": {
      "key": "sainte-lague",
      "name": "Sainte-Laguë"
    },
    "data-source": "/data/2020/election.json"
  }
}
```

**Struktur:**
- Schlüssel: Wahljahr (z.B. "2025")
- `election-name`: Offizieller Name der Wahl
- `election-date`: Datum der Wahl im Format YYYY-MM-DD
- `seat-allocation`: Informationen zum verwendeten Sitzverteilungsverfahren
  - `key`: Technischer Schlüssel des Verfahrens (z.B. "sainte-lague")
  - `name`: Anzeigename des Verfahrens
- `data-source`: Pfad zur Datei mit den Kommunen für dieses Wahljahr

### 2. `/data/{JAHR}/election.json`

Diese Datei enthält eine Liste der verfügbaren Kommunen für ein bestimmtes Wahljahr.

```json
{
  "muenster": {
    "name": "Stadt Münster",
    "data-source": "/data/2020/muenster.json"
  },
  "cologne": {
    "name": "Stadt Köln",
    "data-source": "/data/2020/cologne.json"
  }
}
```

**Struktur:**
- Schlüssel: Technischer Bezeichner der Kommune (z.B. "muenster")
- `name`: Offizieller Name der Kommune
- `data-source`: Pfad zur Datei mit den detaillierten Daten für diese Kommune

### 3. `/data/{JAHR}/{KOMMUNE}.json`

Diese Datei enthält alle detaillierten Daten für eine spezifische Kommune in einem bestimmten Wahljahr.

Am Beispiel von `/data/2025/muenster.json`:

```json
{
  "cuncil-seats": 66,
  "districts": [...],
  "results": {},
  "parties": [...],
  "poll-results": {...},
  "past-district-results": {...},
  "past-results": {...}
}
```

**Struktur:**

- `cuncil-seats`: Gesamtzahl der Sitze im Rat
- `districts`: Array mit Informationen zu allen Wahlkreisen
  - `number`: Wahlkreisnummer
  - `name`: Name des Wahlkreises
- `results`: Objekt für aktuelle Wahlergebnisse (leer, wenn noch keine Ergebnisse vorliegen)
- `parties`: Array mit Informationen zu allen Parteien
  - `identifier`: Eindeutiger Bezeichner der Partei (z.B. "cdu")
  - `short`: Kurzbezeichnung der Partei (z.B. "CDU")
  - `name`: Vollständiger Name der Partei
  - `colorcode`: Farbcode der Partei für die Visualisierung
  - `districts-candidates`: Array mit Direktkandidaten in den Wahlkreisen
    - `district-number`: Wahlkreisnummer
    - `candidate-name`: Name des Kandidaten
  - `list-candidates`: Array mit Listenkandidaten
    - `position`: Listenplatz
    - `name`: Name des Kandidaten
- `poll-results`: Umfrageergebnisse oder prognostizierte Ergebnisse (Prozentangaben)
- `past-district-results`: Ergebnisse der letzten Wahl nach Wahlkreisen
  - Schlüssel: Wahlkreisnummer
  - Werte: Prozentuale Stimmenanteile der Parteien
- `past-results`: Gesamtergebnisse der letzten Wahl
  - Schlüssel: Partei-Identifier
  - Werte: Objekt mit `Anzahl` (absolute Stimmen) und `Prozent` (prozentualer Anteil)

## Anleitung zum Hinzufügen neuer Wahldaten

Um neue Wahldaten hinzuzufügen, folgen Sie diesen Schritten:

### 1. Neue Wahl hinzufügen

- Öffnen Sie die Datei `/data/elections.json`
- Fügen Sie einen neuen Eintrag mit dem entsprechenden Wahljahr hinzu:
  ```json
  "2026": {
    "election-name": "Kommunalwahl 2026",
    "election-date": "2026-09-13",
    "seat-allocation": {
      "key": "sainte-lague",
      "name": "Sainte-Laguë"
    },
    "data-source": "/data/2026/election.json"
  }
  ```
- Erstellen Sie einen neuen Ordner `/data/2026/`
- Erstellen Sie eine neue Datei `/data/2026/election.json` mit der Liste der verfügbaren Kommunen

### 2. Neue Kommune hinzufügen

- Öffnen Sie die Datei `/data/{JAHR}/election.json`
- Fügen Sie einen neuen Eintrag für die Kommune hinzu:
  ```json
  "dortmund": {
    "name": "Stadt Dortmund",
    "data-source": "/data/2026/dortmund.json"
  }
  ```
- Erstellen Sie eine neue Datei `/data/{JAHR}/{NEUE_KOMMUNE}.json`

### 3. Kommunendaten erstellen

Füllen Sie die Datei `/data/{JAHR}/{NEUE_KOMMUNE}.json` mit den erforderlichen Daten:

1. **Grunddaten der Kommune**:
   - Anzahl der Ratssitze (`cuncil-seats`)
   - Liste der Wahlkreise (`districts`)

2. **Parteien und Kandidaten**:
   - Liste aller Parteien mit ihren Identifikatoren, Namen und Farbcodes
   - Für jede Partei optional:
     - Direktkandidaten in den Wahlkreisen (`districts-candidates`)
     - Listenkandidaten (`list-candidates`)

3. **Wahlergebnisse oder Prognosen**:
   - Aktuelle Umfragewerte (`poll-results`)
   - Vergangene Wahlergebnisse (`past-results`)
   - Vergangene Wahlkreisergebnisse (`past-district-results`)

### 4. Beispiel für eine minimale Kommunendatei

```json
{
  "cuncil-seats": 60,
  "districts": [
    {
      "number": 1,
      "name": "Innenstadt"
    },
    {
      "number": 2,
      "name": "Nord"
    }
  ],
  "results": {},
  "parties": [
    {
      "identifier": "cdu",
      "short": "CDU",
      "name": "Christlich Demokratische Union Deutschlands",
      "colorcode": "#191919"
    },
    {
      "identifier": "spd",
      "short": "SPD",
      "name": "Sozialdemokratische Partei Deutschlands",
      "colorcode": "#e2001a"
    }
  ],
  "poll-results": {
    "cdu": 35,
    "spd": 30
  }
}
```

Durch Einhaltung dieser Struktur können neue Wahldaten nahtlos in das bestehende System integriert werden. Die Anwendung wird automatisch die neuen Daten erkennen und in der Benutzeroberfläche zur Auswahl anbieten.

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
  "council-seats": 66,
  "districts": [...],
  "results": {},
  "parties": [...],
  "poll-results": {...},
  "past-district-results": {...},
  "past-results": {...}
}
```

**Struktur:**

- `council-seats`: Gesamtzahl der Sitze im Rat
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
   - Anzahl der Ratssitze (`council-seats`)
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
  "council-seats": 60,
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

## Live-Ergebnisse Integration

Die Anwendung unterstützt die Integration von Live-Wahlergebnissen über CSV-Datenquellen. Dies ermöglicht es, während einer laufenden Wahl die Ergebnisse in Echtzeit zu verfolgen und die Sitzverteilung basierend auf den aktuellen Schnellmeldungen zu berechnen.

### Voraussetzungen für Live-Ergebnisse

**Wichtig:** Die CSV-Datenquelle muss **wahlbezirkscharf** sein, d.h. die Ergebnisse müssen nach einzelnen Wahlkreisen aufgeschlüsselt vorliegen. Eine aggregierte Gesamtübersicht reicht nicht aus.

### Konfiguration der Live-Ergebnisse

Um Live-Ergebnisse für eine Kommune zu aktivieren, fügen Sie ein `live-results`-Objekt zur entsprechenden Kommunendatei hinzu:

```json
{
  "council-seats": 66,
  "live-results": {
    "enabled": true,
    "url": "https://wahlen.citeq.de/20200913/05515000/html5/Open-Data-Ratswahl-NRW165.csv",
    "csv-mapping": {
      "datum": "datum",
      "wahl": "wahl",
      "ags": "ags",
      "gebiet-nr": "gebiet-nr",
      "gebiet-name": "gebiet-name",
      "max-schnellmeldungen": "max-schnellmeldungen",
      "anz-schnellmeldungen": "anz-schnellmeldungen",
      "A1": "A1",
      "A2": "A2",
      "A3": "A3",
      "A4": "A4",
      "A5": "A5",
      "A6": "A6",
      "A7": "A7",
      "A8": "A8",
      "A9": "A9",
      "A10": "A10",
      "A11": "A11",
      "A12": "A12",
      "B1": "B1",
      "B2": "B2",
      "B3": "B3",
      "B4": "B4",
      "B5": "B5",
      "B6": "B6",
      "B7": "B7",
      "B8": "B8",
      "B9": "B9",
      "B10": "B10",
      "B11": "B11",
      "B12": "B12",
      "C1": "C1",
      "C2": "C2",
      "C3": "C3",
      "C4": "C4",
      "C5": "C5",
      "C6": "C6",
      "C7": "C7",
      "C8": "C8",
      "C9": "C9",
      "C10": "C10",
      "C11": "C11",
      "C12": "C12",
      "D1": "D1",
      "D2": "D2",
      "D3": "D3",
      "D4": "D4",
      "D5": "D5",
      "D6": "D6",
      "D7": "D7",
      "D8": "D8",
      "D9": "D9",
      "D10": "D10",
      "D11": "D11",
      "D12": "D12"
    },
    "party-mapping": {
      "cdu": "A1",
      "spd": "A2",
      "gruene": "A3",
      "fdp": "A4",
      "afd": "A5",
      "linke": "A6",
      "piraten": "A7",
      "volt": "A8",
      "partei": "A9",
      "tierschutz": "A10",
      "oekodemo": "A11",
      "diebasis": "A12",
      "unabhaengig": "B1",
      "unabhaengig2": "B2",
      "unabhaengig3": "B3",
      "unabhaengig4": "B4",
      "unabhaengig5": "B5",
      "unabhaengig6": "B6",
      "unabhaengig7": "B7",
      "unabhaengig8": "B8",
      "unabhaengig9": "B9",
      "unabhaengig10": "B10",
      "unabhaengig11": "B11",
      "unabhaengig12": "B12",
      "unabhaengig13": "C1",
      "unabhaengig14": "C2",
      "unabhaengig15": "C3",
      "unabhaengig16": "C4",
      "unabhaengig17": "C5",
      "unabhaengig18": "C6",
      "unabhaengig19": "C7",
      "unabhaengig20": "C8",
      "unabhaengig21": "C9",
      "unabhaengig22": "C10",
      "unabhaengig23": "C11",
      "unabhaengig24": "C12",
      "unabhaengig25": "D1",
      "unabhaengig26": "D2",
      "unabhaengig27": "D3",
      "unabhaengig28": "D4",
      "unabhaengig29": "D5",
      "unabhaengig30": "D6",
      "unabhaengig31": "D7",
      "unabhaengig32": "D8",
      "unabhaengig33": "D9",
      "unabhaengig34": "D10",
      "unabhaengig35": "D11",
      "unabhaengig36": "D12"
    }
  },
  "districts": [...],
  "parties": [...]
}
```

### Struktur des live-results-Objekts

- `enabled`: Boolean-Wert, der angibt, ob Live-Ergebnisse für diese Kommune aktiviert sind
- `url`: URL zur CSV-Datenquelle (muss wahlbezirkscharf sein)
- `csv-mapping`: Mapping der CSV-Spalten zu semantischen Bezeichnungen
  - `gebiet-nr`: Spalte mit der Wahlkreisnummer
  - `gebiet-name`: Spalte mit dem Wahlkreisnamen
  - `anz-schnellmeldungen`: Spalte mit der Anzahl der eingegangenen Schnellmeldungen
  - `max-schnellmeldungen`: Spalte mit der maximalen Anzahl möglicher Schnellmeldungen
  - `A1` bis `D12`: Spalten mit den Stimmenzahlen der Parteien (48 Spalten für bis zu 48 Parteien)
- `party-mapping`: Mapping der Partei-Identifier zu CSV-Spalten
  - Schlüssel: Partei-Identifier aus der `parties`-Liste
  - Wert: Entsprechende CSV-Spalte (z.B. "A1", "A2", etc.)

### Funktionsweise der Live-Ergebnisse

1. **Automatische Aktivierung**: Wenn Schnellmeldungen > 0 in mindestens einem Wahlkreis vorhanden sind, wird der "Live Ergebnisse"-Switch automatisch aktiviert
2. **Automatische Aktualisierung**: Die Daten werden alle 60 Sekunden automatisch abgerufen
3. **Sitzverteilung**: Die Sitzverteilung wird basierend auf den Live-Daten berechnet
4. **Wahlkreisergebnisse**: Die Tabelle zeigt die aktuellen Ergebnisse pro Wahlkreis mit Schnellmeldungs-Status

### Technische Anforderungen

- **CSV-Format**: Die Datenquelle muss im CSV-Format vorliegen
- **Wahlbezirkscharfe Daten**: Jede Zeile muss einem Wahlkreis entsprechen
- **Konsistente Spalten**: Die CSV-Spalten müssen konsistent benannt sein

### Proxy-Konfiguration

Falls die CSV-Datenquelle keine CORS-Header unterstützt, wird automatisch ein PHP-Proxy (`/proxy.php`) verwendet, der:
- Die CSV-Daten abruft
- CORS-Header hinzufügt
- Ein 1-Minuten-Cache implementiert
- Nur URLs von `wahlen.citeq.de` erlaubt

Durch Einhaltung dieser Struktur können Live-Ergebnisse nahtlos in das bestehende System integriert werden.

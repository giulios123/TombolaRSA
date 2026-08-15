# Revisione dataset cartelle

Stato: `APPROVATO PER V1`

Data revisione: 2026-08-15

Fonte: `data/source/Cartelle-Tabellone.pdf` (SHA-256 `c77de49c2946949b7fad27073b30d1e043d86abed8b45104afc43a243f223a85`).

## Procedura

- le pagine 2-31 sono state renderizzate a 150 DPI;
- la griglia 3x9 è stata rilevata dalla grafica blu del PDF;
- la lettura iniziale è stata ottenuta offline con template dei glifi numerici ricavati dalle cartelle 1-3 già trascritte e verificate;
- il risultato intermedio è stato controllato con validazione strutturale automatica;
- tutte le 30 pagine delle cartelle sono state confrontate visivamente tramite tavole di controllo, con verifica ad alta risoluzione della pagina 2 e del campione 1-3;
- il dataset finale è stato generato dalla trascrizione revisionata, non da una fonte parallela.

## Esito

- 90 cartelle presenti;
- ID consecutivi 1-90;
- 1.350 numeri non vuoti;
- 3 righe, 9 colonne e 5 numeri per riga per ogni cartella;
- nessun duplicato intra-cartella;
- nessuna violazione degli intervalli di colonna;
- nessun insieme numerico duplicato tra cartelle;
- nessuna anomalia aperta.

Gli artefatti intermedi `cards.ocr.json`, `cartelle.ocr.md`, il report per cella e le immagini di controllo restano sotto `tmp/data-bootstrap/` per eventuale audit e non fanno parte del dataset production.

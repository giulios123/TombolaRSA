# Spec 001 - Dataset delle cartelle

Stato: `APPROVED - DATASET V1`

## Scopo

Derivare dal PDF ufficiale una trascrizione human-readable e un dataset JSON affidabile delle 90 cartelle.

## Input autorevole

- file: `data/source/Cartelle-Tabellone.pdf`;
- SHA-256 attesa: `c77de49c2946949b7fad27073b30d1e043d86abed8b45104afc43a243f223a85`;
- pagina 1: tabellone;
- pagine 2-31: cartelle 1-90, tre per pagina.

Il PDF e image-only. OCR o computer vision sono strumenti di bootstrap, non fonti di verita e non componenti runtime.

## Output

### Trascrizione

`data/transcription/cartelle.md` contiene per ogni ID:

- pagina PDF e posizione alta/centrale/bassa;
- griglia 3x9;
- cella vuota rappresentata in modo non ambiguo;
- stato di revisione;
- eventuali note su letture incerte.

### JSON

`src/data/cards.json` contiene una lista di oggetti con `id` e `grid`. I numeri piatti sono derivati in TypeScript e non duplicati nel file.

## Requisiti

- il JSON viene generato o verificato rispetto alla trascrizione;
- ogni cella viene confrontata visivamente con il PDF;
- letture dubbie restano segnalate e bloccano l'approvazione;
- una modifica futura al JSON richiede il confronto con trascrizione e sorgente;
- la checksum del PDF viene verificata nel workflow dati.

## Validazione automatica

- 90 cartelle e ID esatti 1-90;
- 3 righe e 9 colonne;
- 5 numeri per riga e 15 per cartella;
- interi 1-90 senza duplicati intra-cartella;
- range per colonna conformi alla Tombola italiana;
- nessuna coppia di cartelle con lo stesso insieme di numeri.

## Criteri di accettazione

- [x] PDF copiato e checksum verificata.
- [x] 90 cartelle presenti nella trascrizione.
- [x] 90 cartelle marcate come revisionate.
- [x] Nessuna lettura incerta aperta.
- [x] `cards.json` derivato dalla trascrizione.
- [x] Validatore e relativi test verdi.
- [x] Un report associa ogni cartella alla pagina/posizione sorgente.

## Fuori scope

- OCR a runtime;
- editor delle cartelle;
- correzioni automatiche non documentate;
- dati di cartelle provenienti da Internet o da fonti alternative.

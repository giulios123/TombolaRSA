# Analisi dei requisiti

Stato: `DRAFT - planning`

## Obiettivo della V1

Costruire una web app statica che:

1. acquisisca cartella obiettivo `T` e posizione vincente `K` nel setup;
2. generi in locale una permutazione completa di `1..90`;
3. garantisca che `T` completi per la prima volta esattamente a `K`;
4. garantisca che nessuna delle altre 89 cartelle sia completa entro `K`;
5. mostri durante la partita soltanto una normale estrazione della Tombola.

La correttezza della sequenza e un requisito bloccante. La UI non puo compensare una soluzione matematica non valida.

## Evidenze dal materiale sorgente

Il file esaminato e `/Users/giulio/Downloads/Cartelle-Tabellone.pdf`.

- SHA-256: `c77de49c2946949b7fad27073b30d1e043d86abed8b45104afc43a243f223a85`;
- 31 pagine A4;
- pagina 1: tabellone 1-90, ruotato nel foglio;
- pagine 2-31: tre cartelle per pagina, per un totale di 90;
- gli ID osservati sono consecutivi da 1 a 90;
- ogni cartella e rappresentata come griglia 3x9;
- il PDF e image-only: ogni pagina contiene un'immagine raster 2300x3253 circa e non ha testo estraibile.

Conseguenza: la trascrizione non puo essere ottenuta con un parser testuale. Un eventuale OCR offline potra produrre soltanto una bozza; ogni cella dovra essere verificata visivamente contro il PDF prima che il dataset sia considerato approvato. Non verra eseguito OCR a runtime.

Mappatura utile alla revisione: per la cartella `id`, la pagina PDF e `floor((id - 1) / 3) + 2`; la posizione e rispettivamente alta, centrale o bassa in base a `(id - 1) mod 3`.

## Invarianti di dominio

### Dataset

- esistono esattamente 90 cartelle con ID unici `1..90`;
- ogni griglia ha 3 righe e 9 colonne;
- ogni riga contiene esattamente 5 numeri;
- ogni cartella contiene esattamente 15 numeri distinti;
- ogni numero e un intero in `1..90`;
- le colonne rispettano `1..9`, `10..19`, ..., `70..79`, `80..90`;
- due cartelle non devono avere lo stesso insieme di 15 numeri: un duplicato renderebbe impossibile un vincitore unico tra quelle due cartelle.

### Sequenza

- lunghezza 90;
- interi soltanto in `1..90`;
- ogni numero compare una sola volta;
- `T` non e completa dopo `K-1` elementi;
- `T` e completa dopo `K` elementi;
- ogni `C != T` e incompleta dopo `K` elementi.

L'ultimo punto implica anche che nessuna altra cartella possa essere completa prima di `K`.

### Classificazione degli errori

- `INVALID_INPUT`: ID inesistente, `K < 15`, `K > 90`, valore non intero o dataset non valido;
- `NO_SOLUTION`: input semanticamente accettabile, ma nessun blocker set entro il limite; `K = 90` ricade qui;
- `INTERNAL_VALIDATION_FAILED`: il generatore ha prodotto una sequenza che il validatore indipendente rifiuta;
- `RANDOMNESS_UNAVAILABLE`: il browser non offre una sorgente crittografica utilizzabile.

La UI mostrera messaggi operativi, non codici, stack trace o dettagli del solver.

## Assunzioni iniziali

- browser moderni evergreen su notebook e tablet;
- nessuna persistenza della partita al refresh;
- nessun annuncio automatico della Tombola;
- offline/PWA e una fase secondaria, successiva alla correttezza del core;
- nessun supporto V1 per ambo, terno, quaterna, cinquina o sintesi vocale.

## Questioni non bloccanti da verificare durante lo sviluppo

- prestazioni reali del solver esatto sull'intera matrice cartella/K;
- necessita di un Web Worker, da decidere solo dopo benchmark;
- eventuale PWA e strategia di aggiornamento cache;
- supporto minimo browser da dichiarare nel README finale.

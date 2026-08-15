# Spec 003 - Game engine

Stato: `IMPLEMENTED`

## Scopo

Gestire una partita usando una sequenza gia generata e validata, senza conoscere la cartella obiettivo o K.

## Stati

- `setup`: nessuna partita attiva;
- `running`: sequenza valida e indice del prossimo numero;
- `finished`: tutti i 90 numeri estratti.

Lo stato UI transitorio `preparing` puo essere gestito fuori dal motore.

## Operazioni

- `start(validatedSequence)`;
- `drawNext()`;
- `reset()`;
- query derivate: numero corrente, estratti, count, numeri rimanenti, stato finale.

## Invarianti

- il motore non genera numeri;
- l'ordine non cambia dopo `start`;
- ogni `drawNext` valido avanza di una sola posizione;
- nessun numero puo essere estratto due volte;
- non si avanza oltre 90;
- target, K e metadati del solver non fanno parte dello stato del motore;
- una sequenza non validata non puo essere avviata.

## Nuova partita

Il comando di reset elimina la sequenza corrente. La conferma di abbandono e responsabilita della UI; dopo reset si torna a un setup pulito senza preselezione visibile della cartella precedente.

## Criteri di accettazione

- [x] Test di start con sequenza valida e rifiuto di sequenza invalida.
- [x] Test di avanzamento 1, 89 e 90.
- [x] Test di estrazione oltre fine senza mutazione.
- [x] Test di reset da running e finished.
- [x] Nessun campo target/K nel tipo di stato.
- [x] Stato derivato coerente con sequenza e indice.

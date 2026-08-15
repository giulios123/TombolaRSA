# Piano operativo V1

Stato: `ACTIVE - Fase 6 in corso`

## Fase 0 - Pianificazione iniziale

Output:

- analisi del brief e del PDF;
- architettura e algoritmo proposti;
- specifiche 001-004;
- regole AGENTS e memory bank iniziale.

Gate: invarianti e classificazione degli errori non sono ambigui.

## Fase 1 - Bootstrap tecnico

- inizializzare React + TypeScript strict + Vite;
- configurare Vitest, ESLint, Prettier e script npm;
- predisporre directory e CI minima senza deploy automatico;
- copiare il PDF ufficiale in `data/source/` e verificarne la checksum;
- documentare i comandi di sviluppo.

Gate: installazione riproducibile, lint/test/build vuoti ma funzionanti. `pnpm install`, test, typecheck, lint, Prettier e build sono verdi; il lockfile è tracciato.

## Fase 2 - Dataset ufficiale

- estrarre le 30 pagine delle cartelle ad alta risoluzione;
- ritagliare le tre cartelle per pagina con mapping ID/pagina/posizione;
- produrre una prima lettura offline assistita;
- trascrivere in `cartelle.md` con griglia 3x9;
- effettuare una revisione visiva cella per cella;
- generare `cards.json` dalla trascrizione, non da dati paralleli;
- eseguire validatore e test del dataset;
- registrare qualsiasi anomalia senza correzioni silenziose.

Gate: 90/90 cartelle revisionate, checksum sorgente registrata, tutti i controlli strutturali superati. Raggiunto il 2026-08-15; evidenza in `data/transcription/cartelle-review.md`.

## Fase 3 - Solver e validatore

- definire tipi, errori strutturati e RNG;
- scrivere prima i test degli invarianti;
- implementare `validateGameSequence` indipendente;
- implementare preprocessing e greedy randomized;
- implementare fallback esatto e prova di impossibilita;
- costruire e validare la permutazione finale.

Gate: raggiunto il 2026-08-15 per i test deterministici e la matrice K richiesta; lo stress da 100.000 casi resta da eseguire e misurare.

## Fase 4 - Stress, fattibilita e prestazioni

Stato: `IN PROGRESS` - disponibile `pnpm run test:stress`; eseguito stress rappresentativo da 1.000 casi in 5.389 ms, non ancora il run completo da 100.000.

- verificare target 1-90 a K = 50;
- documentare eventuali combinazioni impossibili;
- eseguire migliaia di casi nella suite ordinaria;
- predisporre `test:stress` per 100.000 casi;
- misurare tempi su casi facili, difficili e impossibili;
- decidere su Web Worker in base ai benchmark.

Gate: ogni fallimento e riproducibile tramite seed; target prestazionale verificato o scostamento documentato.

## Fase 5 - Game engine

- implementare macchina a stati;
- accettare solo sequenze validate;
- gestire avanzamento, fine, reset e nuova partita;
- impedire estrazioni oltre il novantesimo numero.

Gate: raggiunto il 2026-08-15; `GameEngine` usa una sequenza validata marcata a livello di tipo, verifica la permutazione e non espone target/K.

## Fase 6 - UI operatore

Stato: `IN PROGRESS` - setup e vista gioco implementati; E2E e QA visuale nel browser restano da completare.

- setup con cartella, K default 50 ed errori comprensibili;
- vista gioco con numero corrente, tabellone, contatore e nuova partita;
- fullscreen e comandi Space/Enter/F;
- protezione da key repeat, doppio click e doppio tap;
- responsive a 1920x1080, 1366x768 e tablet landscape;
- contrasto elevato, focus visibile, target touch ampi e animazioni minime.

Gate: durante `running` nessun testo o prop renderizzato espone target, K, solver o sequenza futura.

## Fase 7 - E2E e build statica

- Playwright per scenario normale, reset, errori e fine partita;
- verifica del base path non radice;
- lint, unit, E2E e build in CI;
- documentare GitHub Pages e un hosting statico alternativo.

Gate: build `dist/` autonoma e scenari principali verdi alle viewport target.

## Fase 8 - Offline opzionale e revisione finale

- valutare PWA solo dopo il core;
- verificare comportamento offline e strategia di aggiornamento;
- eseguire suite completa e stress test;
- aggiornare README, specifiche e memory bank;
- controllare uno per uno i criteri di accettazione V1.

Gate: nessuna assunzione non verificata viene marcata come completata.

## Rischi principali

| Rischio                                     | Impatto                                                 | Mitigazione                                                               |
| ------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| Errore di trascrizione del PDF image-only   | Sequenze matematicamente corrette sul dataset sbagliato | crop per cartella, doppia revisione, validatore, tracciamento pagina/slot |
| Greedy scambiato per prova di impossibilita | Falso rifiuto di una combinazione                       | fallback esatto completo e test su casi impossibili                       |
| Backtracking lento sul main thread          | UI bloccata in setup                                    | benchmark, pruning; Web Worker solo se misurato necessario                |
| Esposizione accidentale di target/K         | Perdita di discrezione                                  | confini di stato/props ed E2E sul DOM visibile                            |
| Doppia estrazione involontaria              | Partita incoerente per l'operatore                      | guard temporale, ignore key repeat, test click/tap rapidi                 |
| Configurazione base path errata             | build non pubblicabile su GitHub Pages                  | test della build sotto prefisso                                           |

## Prossimo task proposto

Eseguire stress/benchmark e aggiungere E2E Playwright sulla UI, poi verificare il build sotto base path non radice.

# AGENTS.md

## Regole di lavoro

- Leggere il brief, le specifiche interessate e `memory-bank/activeContext.md` prima di modificare il codice.
- Seguire un flusso spec-driven: aggiornare prima requisiti, invarianti e criteri di accettazione, poi implementare.
- Non modificare `src/data/cards.json` senza confrontare ogni variazione con `data/transcription/cartelle.md` e con il PDF sorgente.
- Non correggere silenziosamente anomalie del dataset: registrarle e richiedere una revisione.
- Non modificare il solver senza aggiornare i relativi test unitari, property test e casi di regressione.
- Non usare una sequenza di gioco che non abbia superato `validateGameSequence`.
- Mantenere separati dataset, dominio, solver, RNG, game engine e UI.
- Mantenere TypeScript in modalita strict.
- Non aggiungere backend, API remote, database, autenticazione, telemetria o raccolta di dati personali.
- Mantenere la build compatibile con hosting statico e con pubblicazione sotto un base path non radice.
- Non mostrare durante la partita cartella scelta, estrazione programmata, sequenza futura o dettagli del solver.
- Usare `crypto.getRandomValues` in produzione attraverso l'astrazione RNG; non distribuire chiamate dirette a `Math.random`.
- Aggiornare `memory-bank/activeContext.md` e `memory-bank/progress.md` dopo modifiche significative; registrare le decisioni durevoli in `memory-bank/systemPatterns.md`.
- Eseguire lint, test pertinenti e build prima di considerare concluso un task.
- Non dichiarare impossibile una combinazione senza che la ricerca esatta abbia dimostrato l'assenza di una soluzione.

## Fonte dati protetta

Il PDF `data/source/Cartelle-Tabellone.pdf` e la sua impronta SHA-256 sono la fonte ufficiale. La trascrizione e il JSON sono derivati revisionabili, non fonti alternative.

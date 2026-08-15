# Progress

Data: 2026-08-15

## Completato

- [x] Inventario iniziale del repository.
- [x] Lettura integrale del brief.
- [x] Ispezione visiva delle 31 pagine del PDF.
- [x] Conferma di tabellone + 90 cartelle numerate consecutivamente.
- [x] Rilevazione del formato image-only e checksum sorgente.
- [x] Analisi requisiti, architettura, algoritmo e piano operativo.
- [x] Specifiche draft 001-004.
- [x] AGENTS.md, README iniziale e memory bank.
- [x] PDF copiato in `data/source/` e checksum verificata.
- [x] Bootstrap Vite/TypeScript strict, Vitest, ESLint e Prettier predisposto.
- [x] Campione delle cartelle 1-3 trascritto in formato revisionabile.
- [x] Validatore strutturale e test del campione aggiunti.
- [x] Dipendenze installate con lockfile `pnpm-lock.yaml`.
- [x] Test, typecheck, lint, Prettier e build eseguiti con esito positivo.
- [x] Pagina PDF 2 renderizzata e confrontata visivamente con la trascrizione campione.
- [x] Tutte le pagine 2-31 trascritte e confrontate visivamente.
- [x] `data/transcription/cartelle.md` e `src/data/cards.json` promossi dopo revisione.
- [x] Report di revisione dataset aggiunto.
- [x] RNG astratto con Web Crypto in produzione e seed deterministico nei test.
- [x] Validatore indipendente della sequenza e generatore con hitting set greedy + fallback esatto.
- [x] Test solver: casi K richiesti, riproducibilità e tutte le 90 cartelle a K=50.
- [x] `GameEngine` con stato setup/running/finished, reset e protezione oltre il novantesimo.
- [x] UI setup/gioco collegata al solver e al game engine, senza parametri di configurazione nella vista partita.
- [x] Revisione UI: setup allineato, layout landscape senza scroll alle viewport target, fallback mobile senza overflow orizzontale.
- [x] Tema scuro e alta leggibilità combinabili con preferenze locali al dispositivo.
- [x] Indicatore operatore opzionale, decorativo e non accessibile, con numeri target confinati a un riferimento UI privato.
- [x] Estrazione scenografica CSS di 2,5 secondi con blocco input e supporto `prefers-reduced-motion`.
- [x] Animazione di estrazione aggiornata con bussolotto CSS e più palline, senza numeri fittizi.
- [x] README ampliato con guida all'avvio, uso operatore, accessibilità, struttura e verifica.
- [x] Workflow GitHub Actions per build e deploy automatico su GitHub Pages, con base path dinamico.
- [x] Test UI Vitest per timer, doppie attivazioni, reset, indicatore, preferenze e scorciatoie da tastiera.
- [x] QA browser a 1920x1080, 1366x768, 1024x768 e 390x844; build verificata anche con base path `/tombola/`.
- [x] Stress test separato disponibile; run rappresentativo da 1.000 casi superato in 5.389 ms.

## Non iniziato

- [ ] Stress completo da 100.000 casi e benchmark p50/p95/worst case.
- [ ] Matrice di fattibilità completa per target/K e decisione Web Worker.
- [ ] E2E UI, QA visuale alle viewport target e test input rapidi.
- [ ] Build/deployment/offline.

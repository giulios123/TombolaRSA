# Tombola RSA

Web application statica per gestire una Tombola ricreativa in una RSA. Prima della partita l'operatore scegliera una cartella e l'estrazione alla quale dovra completarsi; durante il gioco l'interfaccia apparira come un normale tabellone elettronico.

## Stato

Il progetto è nella fase di implementazione spec-driven. Il dataset completo, il solver, il validatore, il game engine e una prima UI operatore sono implementati; stress completo, E2E e QA visuale sono i prossimi gate.

Documenti iniziali:

- `docs/requirements-analysis.md`: analisi del brief e del PDF;
- `data/transcription/cartelle.md`: trascrizione completa revisionata;
- `data/transcription/cartelle-review.md`: evidenza della revisione del dataset;
- `docs/project-plan.md`: fasi, gate di qualita e rischi;
- `docs/architecture.md`: confini dei componenti;
- `docs/algorithm.md`: formulazione e strategia del solver;
- `specs/`: specifiche e criteri di accettazione della V1;
- `memory-bank/`: contesto e stato del progetto.

## Comandi attuali

```bash
pnpm install
pnpm dev
pnpm test
pnpm run data:validate
pnpm run test:stress              # default: 100.000 casi; usare STRESS_CASES per uno smoke test
pnpm run data:render:sample -- --page 2
pnpm run lint
pnpm run typecheck
pnpm run build
```

`data:render:sample` usa `pdftoppm` per creare una copia visiva temporanea della pagina sorgente sotto `tmp/`; non modifica il PDF ufficiale.

## Vincoli principali

- applicazione React/TypeScript interamente client-side;
- nessun backend, servizio remoto, account o telemetria;
- dataset derivato esclusivamente dal PDF ufficiale;
- sequenza completa generata e validata prima dell'avvio;
- vincitore unico esattamente all'estrazione configurata;
- UI di gioco discreta, leggibile a distanza e resistente a doppie estrazioni accidentali.

`test:stress` usa seed deterministici e non fa parte di `pnpm test`; per un controllo rapido usare `STRESS_CASES=100 pnpm run test:stress`.

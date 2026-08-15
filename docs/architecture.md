# Architettura proposta

Stato: `IMPLEMENTED CORE - UI/E2E IN PROGRESS`

## Principio guida

Il progetto sara un'applicazione statica. Il flusso dei dati e unidirezionale:

```text
PDF ufficiale
  -> trascrizione revisionata
  -> cards.json validato
  -> solver puro
  -> validatore indipendente
  -> game engine
  -> UI React
```

## Confini dei componenti

### Data bootstrap

Responsabile soltanto di produrre e revisionare `cartelle.md` e `cards.json`. Gli strumenti di ritaglio/OCR non entrano nella build production.

### Domain e dataset validation

Definisce `Card`, griglia, ID, numeri derivati e regole strutturali. Il JSON conserva una sola rappresentazione canonica della griglia; `numbers` viene derivato.

### Random

Espone un contratto iniettabile. La produzione usa Web Crypto; i test usano un generatore seeded e riportano sempre il seed in caso di errore.

### Solver

Riceve dati e parametri, non conosce React o il browser DOM. Cerca un blocker set, costruisce la permutazione e la passa al validatore indipendente.

### Sequence validator

Tratta l'output del solver come non attendibile. Non riusa scorciatoie o stato interno della ricerca.

### Game engine

`src/engine/GameEngine.ts` accetta soltanto una `ValidatedGameSequence`, ricontrolla la permutazione, gestisce avanzamento, numero corrente, estratti e fine partita. Non conosce la cartella obiettivo o `K`.

### UI

`src/App.tsx` conosce temporaneamente target e K nel setup. Al passaggio a `running`, lo stato renderizzato contiene soltanto lo snapshot pubblico del game engine. La vista di gioco non riceve target, K o metadati del solver come props.

La UI mantiene inoltre una fase transitoria `drawing`, separata dallo stato del
motore: per 2,5 secondi mostra l'animazione CSS e blocca nuovi input, poi chiede
una sola estrazione al `GameEngine`. Il motore resta privo di target, K e metadati
di presentazione.

Se l'operatore abilita l'indicatore discreto, la UI conserva in un riferimento
non renderizzato soltanto l'insieme dei numeri della cartella. Un puntino
decorativo nel marchio riflette il solo booleano "numero corrente presente"; non
ha testo, tooltip o semantica accessibile e viene eliminato al reset.

Le preferenze di tema scuro e alta leggibilità sono locali al dispositivo,
indipendenti e rappresentate da attributi di presentazione, senza modificare il
dominio o il game engine.

## Stato applicativo

Forma del core:

```ts
type GameEngineStatus = "setup" | "running" | "finished";

type GameEngineState = {
  status: GameEngineStatus;
  drawCount: number;
  currentNumber: number | null;
  drawnNumbers: readonly number[];
  remainingCount: number;
};
```

Gli input del setup restano in stato locale della pagina di configurazione e vengono smontati all'avvio della partita; la sequenza completa rimane privata al motore.

## Struttura prevista

```text
data/source/
data/transcription/
docs/
specs/
memory-bank/
scripts/data-bootstrap/
src/data/
src/domain/
src/random/
src/solver/
src/engine/
src/components/
src/pages/
tests/
e2e/
```

La struttura potra essere raffinata durante il bootstrap, mantenendo questi confini.

## Dipendenze

Baseline proposta: React, TypeScript strict, Vite, Vitest, Playwright, ESLint e Prettier. Il solver rimarra implementato nel progetto. Nuove dipendenze saranno accettate solo con una motivazione concreta e senza introdurre funzionalita server-side.

## Hosting e offline

La build dovra funzionare sia in root sia sotto un base path. GitHub Pages sara il percorso documentato principale; una seconda opzione statica sara documentata. La PWA verra valutata dopo build ed E2E: non deve alterare o nascondere aggiornamenti del dataset o del solver.

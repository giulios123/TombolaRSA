# Tombola RSA

Tombola RSA è una web app statica, locale e senza raccolta dati personali per
gestire una tombola ricreativa in una RSA. L'operatore prepara la partita,
avvia l'estrazione e usa il tabellone come riferimento visivo per le persone
presenti.

## Come funziona

Prima della partita l'operatore sceglie:

- una cartella ufficiale da 1 a 90 ( per scaricare le tabelle https://github.com/giulios123/TombolaRSA/blob/main/data/source/Cartelle-Tabellone.pdf );
- il numero di estrazione al quale quella cartella deve completarsi, da 15 a
  90;
- facoltativamente, un indicatore discreto per controllare i numeri della
  cartella senza mostrarne il significato durante il gioco.

La sequenza dei numeri viene generata interamente nel browser, verificata dal
validatore indipendente e consegnata al motore solo dopo il superamento dei
controlli. Durante la partita non vengono mostrati cartella scelta, obiettivo,
sequenza futura o dettagli del solver.

L'app non usa backend, account, API remote, database, telemetria o persistenza
della partita.

## Avvio rapido

Sono necessari Node.js e pnpm.

```bash
pnpm install
pnpm dev
```

Apri l'indirizzo locale mostrato da Vite nel browser. Per una build statica:

```bash
pnpm build
pnpm run preview:dist
```

Apri l'indirizzo HTTP mostrato da Vite, normalmente
`http://127.0.0.1:4173/`. Non aprire `dist/index.html` con un doppio clic:
un URL `file:///...` viene bloccato dal browser perché i moduli JavaScript
richiedono un'origine HTTP/HTTPS.

In alternativa puoi usare un qualsiasi server statico, per esempio:

```bash
python3 -m http.server 4173 --directory dist
```

La directory `dist/` può essere pubblicata su un hosting statico. Per un sito
servito sotto un prefisso, ad esempio `/tombola/`:

```bash
VITE_BASE_PATH=/tombola/ pnpm build
```

## Pubblicazione su GitHub Pages

Il repository contiene già il workflow
`.github/workflows/deploy-pages.yml`. Dopo aver pubblicato il progetto su
GitHub:

1. usa il branch `main` come branch principale;
2. vai in **Settings → Pages**;
3. in **Build and deployment → Source** seleziona **GitHub Actions**;
4. fai un push su `main` oppure avvia manualmente il workflow dalla scheda
   **Actions**.

Il workflow installa le dipendenze con il lockfile, esegue test e lint, calcola
automaticamente il base path corretto per un repository di progetto oppure per
un repository personale `USERNAME.github.io`, costruisce `dist/` e lo pubblica.
L'URL sarà `https://USERNAME.github.io/NOME_REPOSITORY/` per un repository di
progetto oppure `https://USERNAME.github.io/` per il repository personale.

## Uso durante una partita

1. Nella schermata di preparazione scegli la cartella e il numero di
   estrazione.
2. Se serve, abilita **Indicatore discreto operatore**. Il puntino accanto a
   “Tombola RSA” è un dettaglio decorativo neutro e cambia appena colore quando
   il numero corrente appartiene alla cartella scelta. L'opzione è disattivata
   per default e vale soltanto per quella partita.
3. Premi **Avvia partita**.
4. Premi **Estrai numero** e attendi l'animazione del bussolotto: dura 1,5
   secondi e il numero viene mostrato soltanto alla fine.
5. Usa **Nuova partita** per tornare al setup; se una partita è in corso viene
   chiesta conferma.

Durante l'estrazione il pulsante e le scorciatoie restano bloccati per evitare
doppie avanzate accidentali.

## Comandi e accessibilità

- **Spazio** o **Invio**: estrai il prossimo numero quando il focus non è su un
  controllo interattivo;
- **F**: prova ad attivare o disattivare lo schermo intero;
- **Tema scuro**: cambia il tema chiaro/scuro;
- **Alta leggibilità**: aumenta contrasto, peso tipografico e spessore dei
  contorni; può essere combinata con il tema scuro.

Le preferenze di visualizzazione vengono salvate solo nel browser del
dispositivo. La partita e i dati delle cartelle non vengono salvati al refresh.
Con `prefers-reduced-motion` l'attesa dell'estrazione resta presente, ma il
bussolotto non si muove.

Il layout mostra numero, comandi e tabellone nella stessa vista su notebook e
tablet landscape. Su schermi stretti si impila verticalmente per mantenere i
numeri leggibili.

## Struttura del progetto

```text
data/source/          PDF ufficiale e checksum della fonte
data/transcription/   trascrizione revisionata delle 90 cartelle
docs/                 requisiti, architettura e algoritmo
specs/                specifiche e criteri di accettazione
src/data/             dataset JSON e validazione
src/domain/           tipi e invarianti delle cartelle
src/random/           RNG Web Crypto e RNG deterministico per i test
src/solver/           generazione e validazione della sequenza
src/engine/           macchina a stati della partita
src/App.tsx           UI operatore
src/index.css         layout, temi e animazioni
```

Il PDF `data/source/Cartelle-Tabellone.pdf` è la fonte ufficiale. Non modificare
`src/data/cards.json` senza confrontarlo con `data/transcription/cartelle.md` e
con il PDF sorgente.

## Comandi di verifica

```bash
pnpm test                         # suite ordinaria
pnpm run data:validate            # validazione dataset
pnpm run test:stress              # stress test, default 100.000 casi
STRESS_CASES=100 pnpm run test:stress  # smoke test rapido
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run build
```

Lo stress test usa seed deterministici e resta separato dalla suite ordinaria
per non rallentare il ciclo quotidiano. Gli strumenti di bootstrap del dataset
sono offline e non entrano nella build di produzione.

## Stato del progetto

Sono implementati e verificati dataset, solver con ricerca esatta di fallback,
validatore indipendente, RNG astratto, game engine e UI operatore. Restano
attività successive il benchmark completo, lo stress test da 100.000 casi e la
suite E2E automatizzata della UI.

Per le decisioni dettagliate consulta:

- `docs/requirements-analysis.md` — requisiti e invarianti;
- `docs/architecture.md` — confini dei componenti;
- `docs/algorithm.md` — strategia del solver;
- `specs/004-web-ui.md` — comportamento e criteri della UI;
- `memory-bank/` — contesto e stato del lavoro.

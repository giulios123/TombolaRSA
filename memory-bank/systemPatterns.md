# System patterns

## Decisioni iniziali

- Architettura interamente client-side e static-hosting compatible.
- Flusso dati protetto: PDF -> trascrizione revisionata -> JSON validato.
- Separazione netta tra data, domain validation, RNG, solver, sequence validation, game engine e UI.
- Solver a hitting set: greedy randomized per velocita, ricerca esatta per completezza.
- Nessun `NO_SOLUTION` basato sul solo fallimento euristico o su timeout.
- Il game engine riceve solo sequenze validate e non conosce target/K.
- Lo stato della vista gioco non contiene target/K come props renderizzabili.
- `ValidatedGameSequence` è un tipo nominale creato solo dopo il controllo indipendente del solver; il motore accetta quel tipo e ricontrolla la permutazione.
- La UI usa un guard temporale e ignora `KeyboardEvent.repeat` per evitare doppie estrazioni da click/tastiera ravvicinati.
- L'estrazione UI ha una fase `drawing` di 1,5 secondi: il motore avanza solo al termine, senza numeri fittizi; gli input sono bloccati e `prefers-reduced-motion` rimuove il movimento mantenendo l'attesa.
- L'animazione della fase `drawing` usa solo CSS per rappresentare un bussolotto con più palline astratte; non visualizza mai valori che potrebbero essere confusi con la sequenza reale.
- Tema scuro e alta leggibilità sono preferenze locali indipendenti, applicate tramite attributi di presentazione e combinabili.
- L'indicatore operatore opzionale conserva soltanto l'insieme dei numeri della cartella in un riferimento UI privato; un puntino decorativo `aria-hidden` espone solo un booleano visivo sul numero corrente e viene eliminato al reset.
- Il deploy statico usa GitHub Pages tramite workflow GitHub Actions: installazione da lockfile, test, lint, build Vite con base path derivato dal nome repository e deploy dell'artefatto `dist`.
- Web Worker e PWA sono decisioni evidence-driven, successive a benchmark e core funzionante.

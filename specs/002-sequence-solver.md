# Spec 002 - Solver della sequenza

Stato: `IMPLEMENTED - STRESS PENDING`

## Scopo

Generare una permutazione di 1-90 nella quale la cartella scelta sia l'unica a completarsi esattamente all'estrazione K.

## API indicativa

```ts
generateGameSequence(
  cards: readonly Card[],
  targetCardId: number,
  winningDraw: number,
  rng: RandomGenerator,
): Result<ValidatedGameSequence, SequenceGenerationError>
```

L'esatta forma del `Result` verra definita nel bootstrap TypeScript, mantenendo errori strutturati e discriminabili.

## Precondizioni

- dataset valido;
- target ID presente;
- K intero;
- `15 <= K <= 90`.

`K < 15` e `K > 90` sono input invalidi. `K = 90` e valido come domanda di fattibilita ma deve produrre `NO_SOLUTION` con un dataset di piu cartelle.

## Postcondizioni di successo

- la sequenza e una permutazione esatta di 1-90;
- target incompleto a K-1;
- target completo a K;
- ogni altra cartella incompleta a K;
- la sequenza ha superato `validateGameSequence`.

## Strategia richiesta

- hitting set sul complemento;
- greedy randomized come fast path;
- backtracking/branch-and-bound completo come fallback;
- scelta del vincolo piu ristretto e ordinamento dei candidati per copertura;
- pruning e memoization senza compromettere la completezza;
- nessun servizio esterno.

Il fallimento del greedy non puo produrre `NO_SOLUTION`. Solo l'esaurimento completo della ricerca esatta puo farlo.

## Randomizzazione

`RandomGenerator` e obbligatorio. La produzione usa Web Crypto; i test usano seed deterministici. Shuffle e selezioni non devono chiamare direttamente `Math.random`.

## Errori

- `INVALID_INPUT`;
- `NO_SOLUTION`;
- `INTERNAL_VALIDATION_FAILED`;
- `RANDOMNESS_UNAVAILABLE`.

Un eventuale limite di risorse futuro deve avere un codice separato e non deve essere presentato come prova matematica di impossibilita.

## Test e osservabilita

- ogni caso property/stress registra seed, target, K e sequenza al fallimento;
- casi espliciti: K 14, 15, 16, 50, 70, 89, 90;
- tutte le cartelle a K=50;
- migliaia di generazioni nella suite ordinaria;
- 100.000 nel comando stress separato;
- benchmark p50/p95/worst case.

## Criteri di accettazione

- [x] Validatore indipendente implementato prima dell'uso nel game engine.
- [x] Successo soltanto per sequenze che soddisfano tutte le postcondizioni.
- [x] Impossibilita restituita soltanto dopo ricerca completa.
- [x] Riproducibilita tramite seed.
- [x] Test 90 cartelle/K=50 eseguito; tutte le 90 combinazioni sono risultate valide.
- [x] Stress test disponibile separatamente (`pnpm run test:stress`, default 100.000 casi).
- [ ] Target prestazionale verificato o scostamento documentato.

Nota: lo stress rappresentativo eseguito con `STRESS_CASES=1000` è passato in 5.389 ms; il run completo da 100.000 casi è lasciato alla Fase 4 per la misurazione dedicata.

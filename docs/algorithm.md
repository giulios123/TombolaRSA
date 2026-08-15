# Algoritmo della sequenza programmata

Stato: `DRAFT - planning`

## Formulazione

Siano:

- `U = {1, ..., 90}`;
- `T` l'insieme dei 15 numeri della cartella obiettivo;
- `K` l'estrazione vincente;
- `m = 90 - K` il numero di elementi non ancora estratti dopo K.

Cerchiamo `B`, insieme dei blocker, tale che:

```text
|B| = m
B intersection T = empty
per ogni C != T: B intersection C != empty
```

Equivalentemente, per ogni altra cartella si considera il vincolo `D_C = C \ T`. Almeno un elemento di ogni `D_C` deve essere scelto. Se un `D_C` e vuoto, la cartella ha gli stessi numeri di T e la soluzione unica e impossibile.

La formulazione e necessaria e sufficiente:

- `W = U \ B` contiene tutta T;
- ogni altra cartella ha almeno un numero in B, quindi non e completa a K;
- scegliendo `lastNumber in T` e collocandolo in posizione K, T e incompleta a K-1 e completa a K.

Se esiste un hitting set `H` con `|H| <= m`, esso puo sempre essere completato a cardinalita esatta `m` usando altri numeri di `U \ T`: per `K >= 15`, `m <= 75` e gli elementi disponibili fuori da T sono 75.

## Pipeline di generazione

1. validare dataset, target e K;
2. costruire i vincoli `D_C`;
3. tentare piu greedy randomized search entro `m` blocker;
4. se il greedy non trova una soluzione, avviare una ricerca esatta bounded;
5. se la ricerca esatta prova l'impossibilita, restituire `NO_SOLUTION`;
6. completare casualmente B fino a `m`;
7. calcolare `W = U \ B`;
8. scegliere casualmente `lastNumber in T`;
9. mescolare `W \ {lastNumber}` nelle prime `K-1` posizioni;
10. collocare `lastNumber` in posizione K;
11. mescolare B nelle posizioni `K+1..90`;
12. validare da zero la sequenza completa e restituirla solo se valida.

## Greedy randomized search

A ogni passo viene scelto, tra i numeri candidati, quello che copre piu vincoli ancora scoperti. I pareggi vengono randomizzati con l'RNG iniettato. Piu restart casuali possono trovare rapidamente una soluzione, ma il fallimento del greedy non prova l'impossibilita.

## Ricerca esatta

Il fallback deve essere completo:

- scegliere il vincolo scoperto con meno candidati disponibili;
- ramificare sui suoi candidati, ordinati per numero di vincoli scoperti coperti;
- randomizzare soltanto i pareggi;
- terminare un ramo quando i blocker superano `m`;
- usare lower bound validi, ad esempio massimo numero di vincoli copribili per scelta e un packing di vincoli pairwise-disjoint;
- memoizzare stati equivalenti tramite bitset dei vincoli scoperti e capacita residua;
- applicare riduzioni di dominanza solo se accompagnate da test che ne dimostrano la correttezza.

Un timeout non deve essere convertito in `NO_SOLUTION`. Se in futuro servisse un limite operativo, dovra produrre un errore distinto e mai una falsa prova di impossibilita.

## Validazione indipendente

`validateGameSequence` ricostruisce gli insiemi dai parametri pubblici e controlla:

- permutazione esatta `1..90`;
- target incompleto a K-1;
- target completo a K;
- tutte le altre cartelle incomplete a K.

Il `GameEngine` non accetta una sequenza che non abbia superato questa funzione.

## Strategia di test

- casi deterministici piccoli e regressioni con seed;
- edge case K = 14, 15, 16, 50, 70, 89 e 90;
- tutte le 90 cartelle con K = 50;
- property test con migliaia di generazioni nella suite ordinaria;
- stress test separato fino a 100.000 generazioni;
- matrice di fattibilita cartella/K come analisi offline, se il costo e ragionevole;
- benchmark separato per misurare p50, p95 e worst case prima di introdurre Web Worker.

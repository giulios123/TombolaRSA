# Active context

Data: 2026-08-24

## Focus

Fase 3 e 5 completate per il core: RNG astratto, solver con fallback esatto, validatore indipendente, sequenze marcate validate e game engine sono implementati e testati. La UI setup/gioco ora include layout landscape senza scroll, preferenze di tema locali, alta leggibilità, indicatore operatore opzionale, documentazione utente generata dal README e un'estrazione scenografica con bussolotto CSS a più palline. E2E automatizzati e stress completo restano aperti.

## Prossimo passo

Eseguire benchmark/stress e completare E2E sulla UI; il build sotto un base path non radice e il workflow GitHub Pages sono già predisposti.

## Attenzioni

- Il PDF non contiene testo estraibile.
- OCR offline, se usato, e soltanto un ausilio da revisionare.
- La prova di impossibilita richiede la ricerca esatta.
- PWA e Web Worker non vanno introdotti prima di misure concrete.
- La suite ordinaria copre 90/90 cartelle a K=50; `test:stress` è separato per non rallentare il ciclo quotidiano.

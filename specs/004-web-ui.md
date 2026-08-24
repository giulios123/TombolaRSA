# Spec 004 - Web UI

Stato: `IN PROGRESS - UI IMPLEMENTATA, E2E PENDING`

## Obiettivo

Offrire un'interfaccia essenziale, leggibile a distanza e discreta, adatta a notebook e tablet durante un'attivita con persone anziane.

## Setup

- select cartella 1-90;
- input numerico K con default 50;
- pulsante primario `AVVIA PARTITA`;
- validazione prima della generazione;
- messaggi chiari per input errato o combinazione impossibile;
- ingresso nella vista gioco solo dopo generazione e validazione complete.
- link discreto alla documentazione utente, visibile soltanto nel setup;
- la documentazione utente è un file statico generato dal README a ogni build e
  contiene soltanto le sezioni rivolte all'operatore, più il link diretto alle
  cartelle scaricabili.
- campi di setup allineati su righe comuni per etichetta, controllo e aiuto;
- opzione facoltativa e disattivata per default `Indicatore discreto operatore`;
- l'opzione spiega soltanto nel setup che il puntino accanto al marchio segnala
  i numeri della cartella scelta e non viene descritta nella partita.

## Preferenze di visualizzazione

- tema chiaro/scuro e modalità alta leggibilità sono due controlli indipendenti;
- le preferenze sono locali al dispositivo e non contengono dati della partita;
- alta leggibilità aumenta contrasto, dimensioni utili e spessore dei contorni;
- le modalità sono disponibili sia nel setup sia durante la partita e usano
  controlli con stato `aria-pressed`.

## Vista gioco

- numero corrente molto grande;
- pulsante `ESTRAI NUMERO` dominante;
- tabellone 1-90 con stati non estratto, estratto e ultimo estratto;
- contatore `n / 90` o equivalente;
- comando secondario `Nuova partita` con conferma se la partita e in corso;
- comando fullscreen discreto;
- nessun annuncio automatico alla posizione K.
- su viewport landscape da almeno 900x650 px numero, comandi e tabellone sono
  nella stessa altezza visibile, con numero/comandi a sinistra e tabellone 10x9
  a destra;
- su viewport più strette o basse il layout può impilarsi e scorrere
  verticalmente, ma non deve mai introdurre overflow orizzontale.

## Estrazione scenografica

- ogni comando valido entra in una fase UI `drawing` di 1,5 secondi;
- durante la fase viene mostrata soltanto un'animazione CSS di estrazione, senza
  numeri fittizi o anticipazioni della sequenza;
- il `GameEngine` avanza soltanto al termine della fase;
- click, tap, scorciatoie e doppie attivazioni durante la fase sono ignorati;
- con `prefers-reduced-motion` l'attesa resta invariata ma l'animazione diventa
  statica.

## Discrezione

Durante `running` non devono comparire in testo visibile, titolo, tooltip o attributi accessibili:

- ID della cartella scelta;
- posizione K come obiettivo/countdown;
- termini relativi a estrazione programmata o pilotata;
- sequenza futura;
- dettagli del solver.

Quando l'indicatore discreto è attivo, il puntino nel marchio è sempre presente
come dettaglio decorativo e cambia stato solo per il numero corrente appartenente
alla cartella scelta. Il puntino è escluso dall'albero accessibile e non ha
tooltip, testo o nome accessibile. L'insieme dei 15 numeri resta in un
riferimento privato della UI; non entra nello stato o nelle props del motore.

Il numero K puo naturalmente apparire se e il numero corrente o il conteggio effettivo degli estratti. I test E2E devono distinguere questi casi da una fuga di configurazione.

## Input e prevenzione errori

- Space o Enter estraggono un numero soltanto nella vista gioco;
- `F` tenta il fullscreen;
- `KeyboardEvent.repeat` viene ignorato;
- click/tap ravvicinati e doppio click non devono produrre due avanzamenti accidentali;
- i controlli mantengono focus visibile e nomi accessibili;
- nessuna animazione non necessaria.

La finestra di guardia contro input multipli verra calibrata con test di usabilita senza rendere lenta l'estrazione intenzionale.

## Responsive target

- 1920x1080;
- 1366x768;
- tablet landscape;
- nessun overflow che nasconda estrazione, numero corrente o righe del tabellone.

## Fine partita

Dopo il novantesimo numero il pulsante di estrazione e disabilitato o sostituito da uno stato concluso neutro. Non viene dichiarata automaticamente alcuna vincita.

## E2E minimi

- setup e avvio valido a K=50;
- 50 estrazioni distinte e tabellone coerente;
- assenza di target/K programmato nel DOM visibile;
- doppio click, key repeat e tap rapido;
- nuova partita annullata e confermata;
- fullscreen con fallback se non disponibile;
- viewport target;
- build servita sotto base path non radice.

## Criteri di accettazione

- [x] Default K=50 e target selezionabile 1-90.
- [x] Parametri non sono renderizzati nella vista partita.
- [x] Numero, contatore e tabellone sono alimentati dallo stesso `GameEngine`.
- [x] Input rapidi sono protetti da `KeyboardEvent.repeat` e guard temporale.
- [x] Nuova partita richiede conferma quando necessario.
- [x] Layout verificato alle viewport target.
- [x] Nessun overflow a 1920x1080, 1366x768 e 1024x768.
- [x] Tema scuro e alta leggibilità funzionano singolarmente e insieme.
- [x] Indicatore discreto disattivato per default e non accessibile.
- [x] Estrazione scenografica di 1,5 secondi con riduzione del movimento.
- [x] Nessun backend, telemetria o persistenza involontaria.
- [x] Link discreto alla documentazione utente presente nella schermata
      pre-partita.
- [x] Documentazione utente generata dal README senza dettagli tecnici e con
      link diretto alle cartelle scaricabili.

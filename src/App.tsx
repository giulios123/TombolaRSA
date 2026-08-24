import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import cards from "./data/cards.json";
import { cardNumbers } from "./domain/Card";
import { GameEngine, type GameEngineState } from "./engine/GameEngine";
import { generateGameSequence } from "./solver/generateGameSequence";

type View = "setup" | "game";
type Theme = "light" | "dark";

const BOARD_NUMBERS = Array.from({ length: 90 }, (_, index) => index + 1);
const DEFAULT_WINNING_DRAW = 50;
const DRAW_GUARD_MS = 300;
const DRAW_DURATION_MS = 1500;
const THEME_STORAGE_KEY = "tombola-rsa.theme";
const READABLE_STORAGE_KEY = "tombola-rsa.high-legibility";

const initialEngineState: GameEngineState = {
  status: "setup",
  drawCount: 0,
  currentNumber: null,
  drawnNumbers: [],
  remainingCount: 90,
};

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

function getStoredReadable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(READABLE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    Boolean(
      target.closest(
        "button, input, select, textarea, a, [contenteditable='true']",
      ),
    )
  );
}

interface DisplayControlsProps {
  readonly theme: Theme;
  readonly highLegibility: boolean;
  readonly onToggleTheme: () => void;
  readonly onToggleLegibility: () => void;
}

function DisplayControls({
  theme,
  highLegibility,
  onToggleTheme,
  onToggleLegibility,
}: DisplayControlsProps) {
  return (
    <div
      className="display-controls"
      aria-label="Preferenze di visualizzazione"
    >
      <button
        className="display-toggle"
        type="button"
        aria-pressed={theme === "dark"}
        onClick={onToggleTheme}
      >
        <span aria-hidden="true">{theme === "dark" ? "☾" : "☀"}</span>
        <span>{theme === "dark" ? "Tema chiaro" : "Tema scuro"}</span>
      </button>
      <button
        className="display-toggle"
        type="button"
        aria-pressed={highLegibility}
        onClick={onToggleLegibility}
      >
        <span aria-hidden="true">Aa</span>
        <span>Alta leggibilità</span>
      </button>
    </div>
  );
}

function Brand({ cueActive }: { readonly cueActive: boolean }) {
  return (
    <p className="eyebrow">
      Tombola
      <span
        className={`brand-dot${cueActive ? " is-active" : ""}`}
        aria-hidden="true"
      />
    </p>
  );
}

function App() {
  const engineRef = useRef(new GameEngine());
  const lastDrawAtRef = useRef(Number.NEGATIVE_INFINITY);
  const drawTimerRef = useRef<number | null>(null);
  const targetNumbersRef = useRef<Set<number> | null>(null);
  const [view, setView] = useState<View>("setup");
  const [targetCardId, setTargetCardId] = useState(1);
  const [winningDraw, setWinningDraw] = useState(DEFAULT_WINNING_DRAW);
  const [winningDrawDraft, setWinningDrawDraft] = useState(
    String(DEFAULT_WINNING_DRAW),
  );
  const [isWinningDrawEditing, setIsWinningDrawEditing] = useState(false);
  const [operatorCueEnabled, setOperatorCueEnabled] = useState(false);
  const [gameState, setGameState] = useState(initialEngineState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [highLegibility, setHighLegibility] = useState(getStoredReadable);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Preferences remain usable when storage is unavailable.
    }
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(READABLE_STORAGE_KEY, String(highLegibility));
    } catch {
      // Preferences remain usable when storage is unavailable.
    }
  }, [highLegibility]);

  useEffect(() => {
    return () => {
      if (drawTimerRef.current !== null)
        window.clearTimeout(drawTimerRef.current);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const toggleLegibility = useCallback(() => {
    setHighLegibility((current) => !current);
  }, []);

  const startGame = useCallback(() => {
    setErrorMessage(null);
    setIsPreparing(true);

    const result = generateGameSequence(cards, targetCardId, winningDraw);
    if (!result.ok) {
      setErrorMessage(result.error.message);
      setIsPreparing(false);
      return;
    }

    const startResult = engineRef.current.start(result.sequence);
    if (!startResult.ok) {
      setErrorMessage(startResult.error.message);
      setIsPreparing(false);
      return;
    }

    const selectedCard = cards.find((card) => card.id === targetCardId);
    targetNumbersRef.current =
      operatorCueEnabled && selectedCard
        ? new Set(cardNumbers(selectedCard))
        : null;
    lastDrawAtRef.current = Number.NEGATIVE_INFINITY;
    setGameState(engineRef.current.getState());
    setView("game");
    setIsPreparing(false);
    setTargetCardId(1);
    setWinningDraw(DEFAULT_WINNING_DRAW);
    setWinningDrawDraft(String(DEFAULT_WINNING_DRAW));
    setIsWinningDrawEditing(false);
  }, [operatorCueEnabled, targetCardId, winningDraw]);

  const drawNext = useCallback(() => {
    if (isDrawing || engineRef.current.getState().status !== "running") return;

    const now = performance.now();
    if (now - lastDrawAtRef.current < DRAW_GUARD_MS) return;
    lastDrawAtRef.current = now;
    setIsDrawing(true);

    drawTimerRef.current = window.setTimeout(() => {
      drawTimerRef.current = null;
      engineRef.current.drawNext();
      setGameState(engineRef.current.getState());
      setIsDrawing(false);
    }, DRAW_DURATION_MS);
  }, [isDrawing]);

  const handleDrawClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (event.detail > 1) return;
      drawNext();
    },
    [drawNext],
  );

  const resetToSetup = useCallback(() => {
    if (
      engineRef.current.getState().status === "running" &&
      !window.confirm("Vuoi interrompere la partita corrente?")
    ) {
      return;
    }
    if (drawTimerRef.current !== null) {
      window.clearTimeout(drawTimerRef.current);
      drawTimerRef.current = null;
    }
    engineRef.current.reset();
    targetNumbersRef.current = null;
    setGameState(initialEngineState);
    setErrorMessage(null);
    setIsDrawing(false);
    setOperatorCueEnabled(false);
    setTargetCardId(1);
    setWinningDraw(DEFAULT_WINNING_DRAW);
    setWinningDrawDraft(String(DEFAULT_WINNING_DRAW));
    setIsWinningDrawEditing(false);
    setView("setup");
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    if (view !== "game") return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || isInteractiveTarget(event.target)) return;
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        drawNext();
      } else if (event.key.toLowerCase() === "f") {
        void toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawNext, toggleFullscreen, view]);

  const appClassName = `app-root${highLegibility ? " is-high-legibility" : ""}`;
  const cueActive =
    !isDrawing && operatorCueEnabled && gameState.currentNumber !== null
      ? (targetNumbersRef.current?.has(gameState.currentNumber) ?? false)
      : false;

  if (view === "setup") {
    return (
      <div className={appClassName} data-theme={theme}>
        <main className="app-shell">
          <section className="setup-card" aria-labelledby="setup-title">
            <header className="setup-header">
              <div>
                <Brand cueActive={false} />
                <h1 id="setup-title">Prepara la partita</h1>
              </div>
              <DisplayControls
                theme={theme}
                highLegibility={highLegibility}
                onToggleTheme={toggleTheme}
                onToggleLegibility={toggleLegibility}
              />
            </header>
            <p className="intro">
              Scegli la cartella e il momento in cui desideri che completi la
              partita. Durante il gioco vedrai soltanto il tabellone e i numeri
              estratti.
            </p>

            <div className="setup-fields">
              <div className="field-group">
                <label htmlFor="target-card">Cartella</label>
                <select
                  id="target-card"
                  value={targetCardId}
                  onChange={(event) =>
                    setTargetCardId(Number(event.target.value))
                  }
                >
                  {cards.map((card) => (
                    <option key={card.id} value={card.id}>
                      Cartella {card.id}
                    </option>
                  ))}
                </select>
                <span className="field-help">
                  Scegli una cartella da 1 a 90.
                </span>
              </div>

              <div className="field-group">
                <label htmlFor="winning-draw">Numero di estrazione</label>
                <input
                  id="winning-draw"
                  type="number"
                  min={15}
                  max={90}
                  value={isWinningDrawEditing ? winningDrawDraft : winningDraw}
                  onFocus={() => {
                    setIsWinningDrawEditing(true);
                    setWinningDrawDraft("");
                  }}
                  onChange={(event) => {
                    const draft = event.target.value;
                    setWinningDrawDraft(draft);
                    if (draft !== "") setWinningDraw(Number(draft));
                  }}
                  onBlur={() => {
                    const parsed = Number(winningDrawDraft);
                    if (winningDrawDraft === "" || !Number.isFinite(parsed)) {
                      setWinningDraw(DEFAULT_WINNING_DRAW);
                      setWinningDrawDraft(String(DEFAULT_WINNING_DRAW));
                    } else {
                      setWinningDraw(parsed);
                      setWinningDrawDraft(String(parsed));
                    }
                    setIsWinningDrawEditing(false);
                  }}
                />
                <span className="field-help">
                  Inserisci un valore tra 15 e 90.
                </span>
              </div>
            </div>

            <label className="cue-option">
              <input
                type="checkbox"
                checked={operatorCueEnabled}
                onChange={(event) =>
                  setOperatorCueEnabled(event.target.checked)
                }
              />
              <span>
                <strong>Indicatore discreto operatore</strong>
                <small>
                  Il puntino accanto al marchio si illumina quando esce un
                  numero della cartella scelta.
                </small>
              </span>
            </label>

            {errorMessage && (
              <p className="error-message" role="alert">
                {errorMessage}
              </p>
            )}

            <button
              className="primary-button"
              type="button"
              onClick={startGame}
              disabled={isPreparing}
            >
              {isPreparing ? "Preparazione…" : "Avvia partita"}
            </button>
            <a
              className="documentation-link"
              href="./documentazione.html"
              target="_blank"
              rel="noreferrer"
            >
              Documentazione
            </a>
          </section>
        </main>
      </div>
    );
  }

  const drawnSet = new Set(gameState.drawnNumbers);
  return (
    <div className={appClassName} data-theme={theme}>
      <main className="game-shell">
        <header className="game-header">
          <div>
            <Brand cueActive={cueActive} />
            <h1>TOMBOLA</h1>
          </div>
          <div className="game-actions">
            <DisplayControls
              theme={theme}
              highLegibility={highLegibility}
              onToggleTheme={toggleTheme}
              onToggleLegibility={toggleLegibility}
            />
            <button
              className="secondary-button"
              type="button"
              onClick={resetToSetup}
            >
              Nuova partita
            </button>
            <button
              className="icon-button"
              type="button"
              onClick={() => void toggleFullscreen()}
              aria-label="Attiva o disattiva schermo intero"
              title="Schermo intero (F)"
            >
              ⛶
            </button>
          </div>
        </header>

        <div className="game-layout">
          <section
            className="draw-panel"
            aria-labelledby="current-number-label"
          >
            <div className="current-draw">
              <p id="current-number-label">Numero estratto</p>
              <div
                className="current-number"
                aria-live="polite"
                aria-atomic="true"
              >
                <span aria-hidden="true">
                  {isDrawing ? (
                    <span className="draw-animation" aria-hidden="true">
                      <span className="draw-drum">
                        <span className="draw-ball draw-ball-one" />
                        <span className="draw-ball draw-ball-two" />
                        <span className="draw-ball draw-ball-three" />
                        <span className="draw-ball draw-ball-four" />
                      </span>
                      <span className="draw-dots">•••</span>
                    </span>
                  ) : (
                    (gameState.currentNumber ?? "–")
                  )}
                </span>
                <span className="sr-only">
                  {isDrawing
                    ? "Estrazione in corso"
                    : gameState.currentNumber === null
                      ? "Nessun numero ancora estratto"
                      : `Numero ${gameState.currentNumber}`}
                </span>
              </div>
              <p className="draw-counter">
                {gameState.drawCount} / 90 numeri estratti
              </p>
            </div>

            <button
              className="draw-button"
              type="button"
              onClick={handleDrawClick}
              disabled={isDrawing || gameState.status === "finished"}
            >
              {gameState.status === "finished"
                ? "Partita conclusa"
                : isDrawing
                  ? "Estrazione in corso…"
                  : "Estrai numero"}
            </button>
            <p className="keyboard-help">
              Premi Spazio o Invio per estrarre · F per lo schermo intero
            </p>
          </section>

          <section className="board-section" aria-labelledby="board-title">
            <div className="section-heading">
              <h2 id="board-title">Tabellone</h2>
              <span className="remaining-count">
                {gameState.remainingCount} rimanenti
              </span>
            </div>
            <div
              className="number-board"
              role="grid"
              aria-label="Numeri della tombola"
            >
              {BOARD_NUMBERS.map((number) => {
                const isDrawn = drawnSet.has(number);
                const isCurrent = number === gameState.currentNumber;
                return (
                  <span
                    key={number}
                    className={`board-number${isDrawn ? " is-drawn" : ""}${
                      isCurrent ? " is-current" : ""
                    }`}
                    role="gridcell"
                    aria-label={`Numero ${number}${isDrawn ? ", estratto" : ", non estratto"}`}
                  >
                    {number}
                  </span>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;

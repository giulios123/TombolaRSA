// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import cards from "./data/cards.json";
import { cardNumbers } from "./domain/Card";
import type { ValidatedGameSequence } from "./domain/GameSequence";
import { generateGameSequence } from "./solver/generateGameSequence";
import App from "./App";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("./solver/generateGameSequence", () => ({
  generateGameSequence: vi.fn(),
}));

const mockedGenerate = vi.mocked(generateGameSequence);
const targetNumbers = cardNumbers(cards[0]!);
const nonTargetNumber = Array.from(
  { length: 90 },
  (_, index) => index + 1,
).find((number) => !targetNumbers.includes(number))!;
const testSequence = [
  targetNumbers[0]!,
  nonTargetNumber,
  ...Array.from({ length: 90 }, (_, index) => index + 1).filter(
    (number) => number !== targetNumbers[0] && number !== nonTargetNumber,
  ),
] as unknown as ValidatedGameSequence;

let root: Root;
let storage: Map<string, string>;

function renderApp() {
  act(() => {
    root.render(<App />);
  });
}

function startGame(withCue = false) {
  if (withCue) {
    const checkbox =
      document.querySelector<HTMLInputElement>(".cue-option input");
    if (!checkbox) throw new Error("Cue checkbox not found");
    act(() => checkbox.click());
  }
  const startButton =
    document.querySelector<HTMLButtonElement>(".primary-button");
  if (!startButton) throw new Error("Start button not found");
  act(() => startButton.click());
}

function draw() {
  const button = document.querySelector<HTMLButtonElement>(".draw-button");
  if (!button) throw new Error("Draw button not found");
  act(() => button.click());
}

describe("App UI", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    storage = new Map();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
        clear: () => storage.clear(),
      },
    });
    window.localStorage.clear();
    mockedGenerate.mockReturnValue({ ok: true, sequence: testSequence });
    document.body.innerHTML = '<div id="root"></div>';
    root = createRoot(document.getElementById("root")!);
    renderApp();
  });

  afterEach(() => {
    act(() => root.unmount());
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("waits 2.5 seconds and advances only once", () => {
    startGame();
    draw();

    expect(document.querySelector(".draw-button")?.textContent).toContain(
      "Estrazione in corso",
    );
    expect(document.querySelector(".draw-counter")?.textContent).toContain(
      "0 / 90",
    );

    act(() => vi.advanceTimersByTime(2499));
    expect(document.querySelector(".draw-counter")?.textContent).toContain(
      "0 / 90",
    );

    act(() => vi.advanceTimersByTime(1));
    expect(document.querySelector(".draw-counter")?.textContent).toContain(
      "1 / 90",
    );
    expect(document.querySelector(".draw-button")?.textContent).toContain(
      "Estrai numero",
    );
  });

  it("ignores a second activation while the draw animation is running", () => {
    startGame();
    draw();
    draw();

    act(() => vi.advanceTimersByTime(1500));
    expect(document.querySelector(".draw-counter")?.textContent).toContain(
      "1 / 90",
    );
  });

  it("cancels an in-progress draw when starting a new setup", () => {
    startGame();
    draw();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const newGameButton = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Nuova partita"),
    );
    if (!newGameButton) throw new Error("New game button not found");
    act(() => newGameButton.click());
    act(() => vi.advanceTimersByTime(1500));

    expect(document.querySelector(".setup-card")).not.toBeNull();
    expect(document.querySelector(".game-shell")).toBeNull();
  });

  it("activates the optional private cue only for a matching current number", () => {
    startGame(true);
    const dot = document.querySelector(".brand-dot");
    expect(dot?.getAttribute("aria-hidden")).toBe("true");
    expect(dot?.getAttribute("aria-label")).toBeNull();
    expect(dot?.classList.contains("is-active")).toBe(false);

    draw();
    act(() => vi.advanceTimersByTime(1500));
    expect(dot?.classList.contains("is-active")).toBe(true);
    expect(document.body.textContent ?? "").not.toContain(
      "Indicatore discreto operatore",
    );

    draw();
    act(() => vi.advanceTimersByTime(1500));
    expect(dot?.classList.contains("is-active")).toBe(false);
  });

  it("keeps display modes independent and stores them locally", () => {
    const toggles =
      document.querySelectorAll<HTMLButtonElement>(".display-toggle");
    act(() => toggles[0]!.click());
    act(() => toggles[1]!.click());

    const app = document.querySelector(".app-root");
    expect(app?.getAttribute("data-theme")).toBe("dark");
    expect(app?.classList.contains("is-high-legibility")).toBe(true);
    expect(toggles[0]?.getAttribute("aria-pressed")).toBe("true");
    expect(toggles[1]?.getAttribute("aria-pressed")).toBe("true");
    expect(window.localStorage.getItem("tombola-rsa.theme")).toBe("dark");
    expect(window.localStorage.getItem("tombola-rsa.high-legibility")).toBe(
      "true",
    );
  });

  it("does not treat keyboard activation of a control as a draw shortcut", () => {
    startGame();
    const themeButton =
      document.querySelector<HTMLButtonElement>(".display-toggle");
    if (!themeButton) throw new Error("Theme button not found");
    act(() => {
      themeButton.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, code: "Space" }),
      );
    });

    expect(document.querySelector(".draw-counter")?.textContent).toContain(
      "0 / 90",
    );
  });
});

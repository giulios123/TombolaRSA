import { describe, expect, it } from "vitest";
import type { ValidatedGameSequence } from "../domain/GameSequence";
import { GameEngine } from "./GameEngine";

const sequence = Array.from({ length: 90 }, (_, index) => index + 1);
const validatedSequence = sequence as unknown as ValidatedGameSequence;

describe("GameEngine", () => {
  it("accepts a valid permutation and starts in running state", () => {
    const engine = new GameEngine();

    expect(engine.start(validatedSequence)).toEqual({ ok: true });
    expect(engine.getState()).toEqual({
      status: "running",
      drawCount: 0,
      currentNumber: null,
      drawnNumbers: [],
      remainingCount: 90,
    });
  });

  it("rejects an invalid sequence without changing the current state", () => {
    const engine = new GameEngine();

    const invalidSequence = [
      ...sequence.slice(0, 89),
      1,
    ] as unknown as ValidatedGameSequence;
    expect(engine.start(invalidSequence)).toMatchObject({
      ok: false,
      error: { code: "INVALID_SEQUENCE" },
    });
    expect(engine.getState().status).toBe("setup");

    expect(engine.start(validatedSequence)).toEqual({ ok: true });
    const stateBeforeInvalidStart = engine.getState();
    expect(
      engine.start([1, 2, 3] as unknown as ValidatedGameSequence),
    ).toMatchObject({
      ok: false,
    });
    expect(engine.getState()).toEqual(stateBeforeInvalidStart);
  });

  it("advances once per draw and finishes after the ninetieth number", () => {
    const engine = new GameEngine();
    engine.start(validatedSequence);

    expect(engine.drawNext()).toBe(1);
    expect(engine.getState()).toMatchObject({
      status: "running",
      drawCount: 1,
      currentNumber: 1,
      remainingCount: 89,
    });

    for (let index = 1; index < 89; index += 1) {
      expect(engine.drawNext()).toBe(index + 1);
    }
    expect(engine.getState().status).toBe("running");
    expect(engine.drawNext()).toBe(90);
    expect(engine.getState()).toMatchObject({
      status: "finished",
      drawCount: 90,
      currentNumber: 90,
      remainingCount: 0,
    });
  });

  it("does not mutate after an attempted draw beyond the end", () => {
    const engine = new GameEngine();
    engine.start(validatedSequence);
    for (let index = 0; index < 90; index += 1) engine.drawNext();

    const finished = engine.getState();
    expect(engine.drawNext()).toBeNull();
    expect(engine.getState()).toEqual(finished);
  });

  it("resets from both running and finished states", () => {
    const engine = new GameEngine();
    engine.start(validatedSequence);
    engine.drawNext();
    engine.reset();
    expect(engine.getState()).toEqual({
      status: "setup",
      drawCount: 0,
      currentNumber: null,
      drawnNumbers: [],
      remainingCount: 90,
    });

    engine.start(validatedSequence);
    for (let index = 0; index < 90; index += 1) engine.drawNext();
    engine.reset();
    expect(engine.getState().status).toBe("setup");
  });
});

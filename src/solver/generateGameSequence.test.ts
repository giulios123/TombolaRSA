import { describe, expect, it } from "vitest";
import cards from "../data/cards.json";
import { cardNumbers } from "../domain/Card";
import { SeededRandomGenerator } from "../random/SeededRandomGenerator";
import { generateGameSequence } from "./generateGameSequence";
import { validateGameSequence } from "./validateGameSequence";

describe("generateGameSequence", () => {
  it("generates a validated sequence for a selected card", () => {
    const result = generateGameSequence(
      cards,
      1,
      50,
      new SeededRandomGenerator(7),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.sequence).toHaveLength(90);
    expect(validateGameSequence(cards, 1, 50, result.sequence)).toMatchObject({
      valid: true,
    });

    const targetNumbers = new Set(cardNumbers(cards[0]));
    expect(
      result.sequence.slice(0, 50).filter((value) => targetNumbers.has(value)),
    ).toHaveLength(15);
  });

  it("is reproducible when supplied with the same seeded RNG", () => {
    const first = generateGameSequence(
      cards,
      37,
      55,
      new SeededRandomGenerator(99),
    );
    const second = generateGameSequence(
      cards,
      37,
      55,
      new SeededRandomGenerator(99),
    );

    expect(first).toEqual(second);
  });

  it("finds a valid sequence for every card at the default draw", () => {
    for (let targetCardId = 1; targetCardId <= 90; targetCardId += 1) {
      const result = generateGameSequence(
        cards,
        targetCardId,
        50,
        new SeededRandomGenerator(targetCardId),
      );

      expect(result, `cartella ${targetCardId}`).toMatchObject({ ok: true });
      if (!result.ok) continue;
      expect(
        validateGameSequence(cards, targetCardId, 50, result.sequence),
        `cartella ${targetCardId}`,
      ).toMatchObject({ valid: true });
    }
  });

  it.each([15, 16, 50, 70, 89])(
    "handles the requested draw position K=%i",
    (winningDraw) => {
      const result = generateGameSequence(
        cards,
        1,
        winningDraw,
        new SeededRandomGenerator(winningDraw),
      );

      expect(result.ok ? "success" : result.error.code).not.toBe(
        "INVALID_INPUT",
      );
      if (result.ok) {
        expect(
          validateGameSequence(cards, 1, winningDraw, result.sequence),
        ).toMatchObject({ valid: true });
      } else {
        expect(result.error.code).toBe("NO_SOLUTION");
      }
    },
  );

  it("rejects invalid draw positions", () => {
    const result = generateGameSequence(
      cards,
      1,
      14,
      new SeededRandomGenerator(7),
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: "L'estrazione deve essere compresa tra 15 e 90.",
      },
    });
  });

  it("reports the impossible all-cards draw", () => {
    const result = generateGameSequence(
      cards,
      1,
      90,
      new SeededRandomGenerator(7),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NO_SOLUTION");
  });
});

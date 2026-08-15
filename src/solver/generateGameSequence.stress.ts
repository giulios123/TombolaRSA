import { env } from "node:process";
import { describe, expect, it } from "vitest";
import cards from "../data/cards.json";
import { SeededRandomGenerator } from "../random/SeededRandomGenerator";
import { generateGameSequence } from "./generateGameSequence";

const configuredCaseCount = Number(env.STRESS_CASES ?? "100000");
const caseCount =
  Number.isInteger(configuredCaseCount) && configuredCaseCount > 0
    ? configuredCaseCount
    : 100_000;

describe("generateGameSequence stress", () => {
  it(
    `generates ${caseCount.toLocaleString("it-IT")} deterministic cases`,
    () => {
      const startedAt = performance.now();
      for (let index = 0; index < caseCount; index += 1) {
        const targetCardId = (index % 90) + 1;
        const result = generateGameSequence(
          cards,
          targetCardId,
          50,
          new SeededRandomGenerator(index + 1),
        );
        expect(
          result,
          `caso ${index + 1}, cartella ${targetCardId}`,
        ).toMatchObject({
          ok: true,
        });
      }
      const elapsedMs = performance.now() - startedAt;
      console.info(
        `Stress: ${caseCount} casi completati in ${elapsedMs.toFixed(0)} ms`,
      );
    },
    10 * 60 * 1000,
  );
});

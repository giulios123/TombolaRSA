import { describe, expect, it } from "vitest";
import { SeededRandomGenerator } from "../random/SeededRandomGenerator";
import { findHittingSet } from "./hittingSetSolver";

describe("findHittingSet", () => {
  it("falls back to exact search when greedy set cover is suboptimal", () => {
    const constraints = [[1, 2], [1, 2], [1, 3], [1, 3], [2], [3]];

    const result = findHittingSet(
      constraints,
      2,
      new SeededRandomGenerator(123),
    );

    expect(result).not.toBeNull();
    expect(new Set(result?.blockers)).toEqual(new Set([2, 3]));
  });

  it("returns null only when the exact search proves no solution", () => {
    const result = findHittingSet(
      [[1], [2]],
      1,
      new SeededRandomGenerator(123),
    );

    expect(result).toBeNull();
  });
});

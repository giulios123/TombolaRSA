import { describe, expect, it } from "vitest";
import type { Card } from "../domain/Card";
import { validateGameSequence } from "./validateGameSequence";

const target: Card = {
  id: 1,
  grid: [
    [1, 10, 20, 30, 40, null, null, null, null],
    [2, 11, 21, 31, 41, null, null, null, null],
    [3, 12, 22, 32, 42, null, null, null, null],
  ],
};

const other: Card = {
  id: 2,
  grid: [
    [4, 13, 23, 33, 43, null, null, null, null],
    [5, 14, 24, 34, 44, null, null, null, null],
    [6, 15, 25, 35, 45, null, null, null, null],
  ],
};

const allNumbers = Array.from({ length: 90 }, (_, index) => index + 1);
const targetNumbers = [1, 10, 20, 30, 40, 2, 11, 21, 31, 41, 3, 12, 22, 32, 42];
const validSequence = [
  ...targetNumbers.slice(0, -1),
  targetNumbers.at(-1)!,
  ...allNumbers.filter((value) => !targetNumbers.includes(value)),
];
const syntheticDatasetOptions = { requireCompleteDataset: false };

describe("validateGameSequence", () => {
  it("accepts a valid unique winner at the configured draw", () => {
    const report = validateGameSequence(
      [target, other],
      1,
      15,
      validSequence,
      syntheticDatasetOptions,
    );

    expect(report).toEqual({ valid: true, issues: [] });
  });

  it("rejects a target that is already complete before the configured draw", () => {
    const report = validateGameSequence(
      [target, other],
      1,
      16,
      validSequence,
      syntheticDatasetOptions,
    );

    expect(report.issues.map((item) => item.code)).toContain(
      "TARGET_COMPLETE_TOO_EARLY",
    );
  });

  it("rejects another card completed at the configured draw", () => {
    const otherNumbers = [
      4, 13, 23, 33, 43, 5, 14, 24, 34, 44, 6, 15, 25, 35, 45,
    ];
    const sequence = [
      ...targetNumbers.slice(0, -1),
      ...otherNumbers,
      targetNumbers.at(-1)!,
      ...allNumbers.filter(
        (value) =>
          !targetNumbers.includes(value) && !otherNumbers.includes(value),
      ),
    ];
    const report = validateGameSequence(
      [target, other],
      1,
      30,
      sequence,
      syntheticDatasetOptions,
    );

    expect(report.issues.map((item) => item.code)).toContain(
      "OTHER_CARD_COMPLETE",
    );
  });

  it("rejects an invalid permutation and invalid K", () => {
    const invalidSequence = [...validSequence.slice(0, 89), validSequence[0]];
    const report = validateGameSequence(
      [target, other],
      1,
      14,
      invalidSequence,
      syntheticDatasetOptions,
    );

    expect(report.valid).toBe(false);
    expect(report.issues.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        "INVALID_INPUT",
        "DUPLICATE_SEQUENCE_VALUE",
        "MISSING_SEQUENCE_VALUE",
      ]),
    );
  });
});

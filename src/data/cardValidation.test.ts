import { describe, expect, it } from "vitest";
import productionCards from "./cards.json";
import sampleCards from "./cards.sample.json";
import { validateCard, validateCardCollection } from "./cardValidation";
import type { Card } from "../domain/Card";

const cards = sampleCards as Card[];
const verifiedCards = productionCards as Card[];

describe("sample Tombola cards", () => {
  it("validates the three cards transcribed from PDF page 2", () => {
    cards.forEach((card) => {
      expect(validateCard(card), `card ${card.id}`).toEqual([]);
    });

    expect(
      validateCardCollection(cards, { requireComplete: false }),
    ).toMatchObject({ valid: true });
  });

  it("does not mistake a partial sample for the production dataset", () => {
    const report = validateCardCollection(cards);

    expect(report.valid).toBe(false);
    expect(
      report.issues.some((item) => item.code === "INCOMPLETE_DATASET"),
    ).toBe(true);
  });

  it("rejects a number outside its Tombola column range", () => {
    const invalidCard: Card = {
      ...cards[0],
      grid: cards[0].grid.map((row, rowIndex) =>
        row.map((cell, columnIndex) =>
          rowIndex === 0 && columnIndex === 1 ? 25 : cell,
        ),
      ),
    };

    expect(validateCard(invalidCard).map((item) => item.code)).toContain(
      "INVALID_COLUMN_RANGE",
    );
  });

  it("validates the complete PDF-derived dataset", () => {
    const report = validateCardCollection(verifiedCards);

    expect(report.valid, JSON.stringify(report.issues, null, 2)).toBe(true);
    expect(verifiedCards).toHaveLength(90);
    expect(verifiedCards.map((card) => card.id)).toEqual(
      Array.from({ length: 90 }, (_, index) => index + 1),
    );
  });
});

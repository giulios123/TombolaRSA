import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import cards from "./cards.json";
import type { Card } from "../domain/Card";

const verifiedCards = cards as Card[];

function transcriptionBlock(card: Card): string {
  const transcript = readFileSync(
    resolve(process.cwd(), "data/transcription/cartelle.md"),
    "utf8",
  );
  const match = transcript.match(
    new RegExp(`## Cartella ${card.id}\\n([\\s\\S]*?)(?=## Cartella |$)`),
  );
  return match?.[1] ?? "";
}

describe("PDF-derived data provenance", () => {
  it("keeps every production JSON grid aligned with the human-readable transcription", () => {
    verifiedCards.forEach((card) => {
      const block = transcriptionBlock(card);
      expect(block, `missing transcription for card ${card.id}`).not.toBe("");

      card.grid.forEach((row) => {
        const expectedRow = row
          .map((cell) => (cell === null ? "·" : String(cell)))
          .join(" ");
        expect(block, `card ${card.id}`).toContain(expectedRow);
      });
    });
  });
});

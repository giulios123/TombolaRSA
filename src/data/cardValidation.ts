import { cardNumbers, type Card, type CardCell } from "../domain/Card";

export const CARD_COUNT = 90;
export const GRID_ROWS = 3;
export const GRID_COLUMNS = 9;
export const NUMBERS_PER_ROW = 5;
export const NUMBERS_PER_CARD = 15;

const COLUMN_RANGES: readonly [number, number][] = [
  [1, 9],
  [10, 19],
  [20, 29],
  [30, 39],
  [40, 49],
  [50, 59],
  [60, 69],
  [70, 79],
  [80, 90],
];

export interface ValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface CardValidationReport {
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
}

function issue(code: string, path: string, message: string): ValidationIssue {
  return { code, path, message };
}

function isValidCell(cell: CardCell): boolean {
  return cell === null || (Number.isInteger(cell) && cell >= 1 && cell <= 90);
}

export function validateCard(
  card: Card,
  path = `cards[${card.id - 1}]`,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!Number.isInteger(card.id) || card.id < 1 || card.id > CARD_COUNT) {
    issues.push(
      issue(
        "INVALID_CARD_ID",
        `${path}.id`,
        "L'ID deve essere un intero tra 1 e 90.",
      ),
    );
  }

  if (card.grid.length !== GRID_ROWS) {
    issues.push(
      issue(
        "INVALID_ROW_COUNT",
        `${path}.grid`,
        "La cartella deve avere esattamente 3 righe.",
      ),
    );
  }

  const numbers: number[] = [];
  card.grid.forEach((row, rowIndex) => {
    if (row.length !== GRID_COLUMNS) {
      issues.push(
        issue(
          "INVALID_COLUMN_COUNT",
          `${path}.grid[${rowIndex}]`,
          "Ogni riga deve avere esattamente 9 colonne.",
        ),
      );
    }

    const numericCells = row.filter((cell) => cell !== null);
    if (numericCells.length !== NUMBERS_PER_ROW) {
      issues.push(
        issue(
          "INVALID_ROW_NUMBER_COUNT",
          `${path}.grid[${rowIndex}]`,
          "Ogni riga deve contenere esattamente 5 numeri.",
        ),
      );
    }

    row.forEach((cell, columnIndex) => {
      if (!isValidCell(cell)) {
        issues.push(
          issue(
            "INVALID_CELL",
            `${path}.grid[${rowIndex}][${columnIndex}]`,
            "Le celle devono essere null oppure interi tra 1 e 90.",
          ),
        );
        return;
      }
      if (cell === null) return;

      numbers.push(cell);
      const [min, max] = COLUMN_RANGES[columnIndex] ?? [1, 90];
      if (cell < min || cell > max) {
        issues.push(
          issue(
            "INVALID_COLUMN_RANGE",
            `${path}.grid[${rowIndex}][${columnIndex}]`,
            `Il numero deve appartenere all'intervallo ${min}-${max} della colonna.`,
          ),
        );
      }
    });
  });

  if (numbers.length !== NUMBERS_PER_CARD) {
    issues.push(
      issue(
        "INVALID_CARD_NUMBER_COUNT",
        path,
        "La cartella deve contenere esattamente 15 numeri.",
      ),
    );
  }

  if (new Set(numbers).size !== numbers.length) {
    issues.push(
      issue(
        "DUPLICATE_CARD_NUMBER",
        path,
        "Una cartella non puo contenere numeri duplicati.",
      ),
    );
  }

  return issues;
}

export function validateCardCollection(
  cards: readonly Card[],
  options: { readonly requireComplete?: boolean } = {},
): CardValidationReport {
  const issues: ValidationIssue[] = [];
  const requireComplete = options.requireComplete ?? true;

  if (requireComplete && cards.length !== CARD_COUNT) {
    issues.push(
      issue(
        "INCOMPLETE_DATASET",
        "cards",
        `Il dataset completo deve contenere ${CARD_COUNT} cartelle.`,
      ),
    );
  }

  const ids = new Set<number>();
  const cardSets = new Map<string, number>();
  cards.forEach((card, index) => {
    issues.push(...validateCard(card, `cards[${index}]`));
    if (ids.has(card.id)) {
      issues.push(
        issue(
          "DUPLICATE_CARD_ID",
          `cards[${index}].id`,
          `L'ID ${card.id} è duplicato.`,
        ),
      );
    }
    ids.add(card.id);

    const numberSet = [...new Set(cardNumbers(card))]
      .sort((a, b) => a - b)
      .join(",");
    const previousId = cardSets.get(numberSet);
    if (previousId !== undefined) {
      issues.push(
        issue(
          "DUPLICATE_CARD_SET",
          `cards[${index}]`,
          `La cartella ${card.id} ha lo stesso insieme di numeri della cartella ${previousId}.`,
        ),
      );
    } else {
      cardSets.set(numberSet, card.id);
    }
  });

  if (requireComplete) {
    for (let id = 1; id <= CARD_COUNT; id += 1) {
      if (!ids.has(id)) {
        issues.push(
          issue("MISSING_CARD_ID", "cards", `Manca la cartella ${id}.`),
        );
      }
    }
  } else if (
    [...ids].some((id) => !Number.isInteger(id) || id < 1 || id > CARD_COUNT)
  ) {
    issues.push(
      issue(
        "INVALID_CARD_ID",
        "cards",
        "Gli ID devono appartenere all'intervallo 1-90.",
      ),
    );
  }

  return { valid: issues.length === 0, issues };
}

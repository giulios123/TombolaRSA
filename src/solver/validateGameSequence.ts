import { cardNumbers, type Card } from "../domain/Card";
import { validateCardCollection } from "../data/cardValidation";

export type SequenceValidationIssueCode =
  | "INVALID_INPUT"
  | "INVALID_DATASET"
  | "INVALID_SEQUENCE_LENGTH"
  | "INVALID_SEQUENCE_VALUE"
  | "DUPLICATE_SEQUENCE_VALUE"
  | "MISSING_SEQUENCE_VALUE"
  | "TARGET_NOT_FOUND"
  | "TARGET_COMPLETE_TOO_EARLY"
  | "TARGET_NOT_COMPLETE"
  | "OTHER_CARD_COMPLETE";

export interface SequenceValidationIssue {
  readonly code: SequenceValidationIssueCode;
  readonly message: string;
}

export interface SequenceValidationReport {
  readonly valid: boolean;
  readonly issues: readonly SequenceValidationIssue[];
}

const issue = (
  code: SequenceValidationIssueCode,
  message: string,
): SequenceValidationIssue => ({ code, message });

function asSet(values: readonly number[]): Set<number> {
  return new Set(values);
}

export function validateGameSequence(
  cards: readonly Card[],
  targetCardId: number,
  winningDraw: number,
  sequence: readonly number[],
  options: { readonly requireCompleteDataset?: boolean } = {},
): SequenceValidationReport {
  const issues: SequenceValidationIssue[] = [];
  const datasetReport = validateCardCollection(cards, {
    requireComplete: options.requireCompleteDataset ?? true,
  });
  if (!datasetReport.valid) {
    issues.push(
      issue(
        "INVALID_DATASET",
        `Il dataset delle cartelle non è valido: ${datasetReport.issues
          .map((item) => item.code)
          .join(", ")}`,
      ),
    );
  }

  if (!Number.isInteger(targetCardId) || !Number.isInteger(winningDraw)) {
    issues.push(
      issue(
        "INVALID_INPUT",
        "Target e posizione vincente devono essere interi.",
      ),
    );
  }
  if (!Number.isInteger(winningDraw) || winningDraw < 15 || winningDraw > 90) {
    issues.push(
      issue(
        "INVALID_INPUT",
        "La posizione vincente deve essere compresa tra 15 e 90.",
      ),
    );
  }

  if (sequence.length !== 90) {
    issues.push(
      issue(
        "INVALID_SEQUENCE_LENGTH",
        "La sequenza deve contenere esattamente 90 numeri.",
      ),
    );
  }

  const sequenceValues = new Set<number>();
  sequence.forEach((value) => {
    if (!Number.isInteger(value) || value < 1 || value > 90) {
      issues.push(
        issue(
          "INVALID_SEQUENCE_VALUE",
          `Valore di sequenza non valido: ${String(value)}.`,
        ),
      );
      return;
    }
    if (sequenceValues.has(value)) {
      issues.push(
        issue(
          "DUPLICATE_SEQUENCE_VALUE",
          `Il valore ${value} compare più di una volta.`,
        ),
      );
    }
    sequenceValues.add(value);
  });
  for (let value = 1; value <= 90; value += 1) {
    if (!sequenceValues.has(value)) {
      issues.push(
        issue(
          "MISSING_SEQUENCE_VALUE",
          `Manca il valore ${value} dalla sequenza.`,
        ),
      );
    }
  }

  const targetCard = cards.find((card) => card.id === targetCardId);
  if (!targetCard) {
    issues.push(
      issue(
        "TARGET_NOT_FOUND",
        `La cartella obiettivo ${targetCardId} non esiste.`,
      ),
    );
  }

  if (
    targetCard &&
    Number.isInteger(winningDraw) &&
    winningDraw >= 15 &&
    winningDraw <= 90
  ) {
    const targetNumbers = cardNumbers(targetCard);
    const beforeWinningDraw = asSet(sequence.slice(0, winningDraw - 1));
    const atWinningDraw = asSet(sequence.slice(0, winningDraw));
    if (targetNumbers.every((value) => beforeWinningDraw.has(value))) {
      issues.push(
        issue(
          "TARGET_COMPLETE_TOO_EARLY",
          `La cartella obiettivo è già completa dopo l'estrazione ${winningDraw - 1}.`,
        ),
      );
    }
    if (!targetNumbers.every((value) => atWinningDraw.has(value))) {
      issues.push(
        issue(
          "TARGET_NOT_COMPLETE",
          `La cartella obiettivo non è completa all'estrazione ${winningDraw}.`,
        ),
      );
    }
    cards.forEach((card) => {
      if (card.id === targetCardId) return;
      if (cardNumbers(card).every((value) => atWinningDraw.has(value))) {
        issues.push(
          issue(
            "OTHER_CARD_COMPLETE",
            `La cartella ${card.id} è completa all'estrazione ${winningDraw}.`,
          ),
        );
      }
    });
  }

  return { valid: issues.length === 0, issues };
}

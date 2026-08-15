import { cardNumbers, type Card } from "../domain/Card";
import { validateCardCollection } from "../data/cardValidation";
import type { ValidatedGameSequence } from "../domain/GameSequence";
import { CryptoRandomGenerator } from "../random/CryptoRandomGenerator";
import type { RandomGenerator } from "../random/RandomGenerator";
import { findHittingSet } from "./hittingSetSolver";
import { validateGameSequence } from "./validateGameSequence";

export type SequenceGenerationErrorCode =
  | "INVALID_INPUT"
  | "NO_SOLUTION"
  | "INTERNAL_VALIDATION_FAILED"
  | "RANDOMNESS_UNAVAILABLE";

export interface SequenceGenerationError {
  readonly code: SequenceGenerationErrorCode;
  readonly message: string;
}

export type GenerateGameSequenceResult =
  | { readonly ok: true; readonly sequence: ValidatedGameSequence }
  | { readonly ok: false; readonly error: SequenceGenerationError };

const universe = Array.from({ length: 90 }, (_, index) => index + 1);

const failure = (
  code: SequenceGenerationErrorCode,
  message: string,
): GenerateGameSequenceResult => ({ ok: false, error: { code, message } });

export function generateGameSequence(
  cards: readonly Card[],
  targetCardId: number,
  winningDraw: number,
  rng?: RandomGenerator,
): GenerateGameSequenceResult {
  if (!Number.isInteger(targetCardId) || !Number.isInteger(winningDraw)) {
    return failure(
      "INVALID_INPUT",
      "Cartella ed estrazione devono essere interi.",
    );
  }
  if (winningDraw < 15 || winningDraw > 90) {
    return failure(
      "INVALID_INPUT",
      "L'estrazione deve essere compresa tra 15 e 90.",
    );
  }

  const targetCard = cards.find((card) => card.id === targetCardId);
  if (!targetCard) {
    return failure("INVALID_INPUT", `La cartella ${targetCardId} non esiste.`);
  }

  let generator: RandomGenerator;
  try {
    generator = rng ?? new CryptoRandomGenerator();
  } catch {
    return failure(
      "RANDOMNESS_UNAVAILABLE",
      "Il browser non offre una sorgente casuale utilizzabile.",
    );
  }

  const datasetReport = validateCardCollection(cards);
  if (!datasetReport.valid) {
    return failure("INVALID_INPUT", "Il dataset delle cartelle non è valido.");
  }

  const targetSet = new Set(cardNumbers(targetCard));
  const constraints = cards
    .filter((card) => card.id !== targetCardId)
    .map((card) => cardNumbers(card).filter((value) => !targetSet.has(value)));
  if (constraints.some((constraint) => constraint.length === 0)) {
    return failure(
      "NO_SOLUTION",
      "Esiste un'altra cartella con lo stesso insieme di numeri della cartella obiettivo.",
    );
  }

  const blockerCapacity = 90 - winningDraw;
  const hittingSet = findHittingSet(constraints, blockerCapacity, generator);
  if (!hittingSet) {
    return failure(
      "NO_SOLUTION",
      "Non esiste un insieme di blocker entro il limite richiesto per questa combinazione.",
    );
  }

  const blockerSet = new Set(hittingSet.blockers);
  const remainingCandidates = universe.filter(
    (value) => !targetSet.has(value) && !blockerSet.has(value),
  );
  const fillersNeeded = blockerCapacity - blockerSet.size;
  const fillers = generator
    .shuffle(remainingCandidates)
    .slice(0, fillersNeeded);
  const blockers = [...blockerSet, ...fillers];
  const winningSet = universe.filter((value) => !blockers.includes(value));
  const lastNumber = generator.shuffle([...targetSet])[0];
  const beforeWinningDraw = generator.shuffle(
    winningSet.filter((value) => value !== lastNumber),
  );
  const sequence = [
    ...beforeWinningDraw,
    lastNumber,
    ...generator.shuffle(blockers),
  ];
  const validation = validateGameSequence(
    cards,
    targetCardId,
    winningDraw,
    sequence,
  );
  if (!validation.valid) {
    return failure(
      "INTERNAL_VALIDATION_FAILED",
      `La sequenza generata non ha superato il validatore: ${validation.issues
        .map((item) => item.code)
        .join(", ")}`,
    );
  }
  return { ok: true, sequence: sequence as unknown as ValidatedGameSequence };
}

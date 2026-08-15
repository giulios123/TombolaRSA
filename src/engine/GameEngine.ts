import type { ValidatedGameSequence } from "../domain/GameSequence";

export type GameEngineStatus = "setup" | "running" | "finished";

export interface GameEngineState {
  readonly status: GameEngineStatus;
  readonly drawCount: number;
  readonly currentNumber: number | null;
  readonly drawnNumbers: readonly number[];
  readonly remainingCount: number;
}

export type GameEngineStartResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: "INVALID_SEQUENCE";
        readonly message: string;
      };
    };

const SEQUENCE_LENGTH = 90;

function isPermutation(sequence: readonly number[]): boolean {
  if (sequence.length !== SEQUENCE_LENGTH) return false;

  const values = new Set<number>();
  for (const value of sequence) {
    if (!Number.isInteger(value) || value < 1 || value > SEQUENCE_LENGTH) {
      return false;
    }
    if (values.has(value)) return false;
    values.add(value);
  }
  return values.size === SEQUENCE_LENGTH;
}

export class GameEngine {
  private sequence: ValidatedGameSequence | null = null;

  private drawIndex = 0;

  public start(sequence: ValidatedGameSequence): GameEngineStartResult {
    if (!isPermutation(sequence)) {
      return {
        ok: false,
        error: {
          code: "INVALID_SEQUENCE",
          message:
            "La partita richiede una permutazione valida dei numeri 1-90.",
        },
      };
    }

    this.sequence = [...sequence] as unknown as ValidatedGameSequence;
    this.drawIndex = 0;
    return { ok: true };
  }

  public drawNext(): number | null {
    if (!this.sequence || this.drawIndex >= SEQUENCE_LENGTH) return null;
    const nextNumber = this.sequence[this.drawIndex];
    this.drawIndex += 1;
    return nextNumber ?? null;
  }

  public reset(): void {
    this.sequence = null;
    this.drawIndex = 0;
  }

  public getState(): GameEngineState {
    const drawnNumbers = this.sequence?.slice(0, this.drawIndex) ?? [];
    const status: GameEngineStatus =
      this.sequence === null
        ? "setup"
        : this.drawIndex >= SEQUENCE_LENGTH
          ? "finished"
          : "running";

    return {
      status,
      drawCount: drawnNumbers.length,
      currentNumber: drawnNumbers.at(-1) ?? null,
      drawnNumbers,
      remainingCount: SEQUENCE_LENGTH - drawnNumbers.length,
    };
  }
}

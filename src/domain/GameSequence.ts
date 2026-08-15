export type GameSequence = readonly number[];

declare const validatedGameSequenceBrand: unique symbol;

export type ValidatedGameSequence = GameSequence & {
  readonly [validatedGameSequenceBrand]: true;
};

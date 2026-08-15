export type CardCell = number | null;

export type CardGrid = readonly (readonly CardCell[])[];

export interface Card {
  readonly id: number;
  readonly grid: CardGrid;
}

export function cardNumbers(card: Card): number[] {
  return card.grid.flatMap((row) =>
    row.filter((cell): cell is number => cell !== null),
  );
}

export interface RandomGenerator {
  random(): number;
  shuffle<T>(items: readonly T[]): T[];
}

export function shuffleWithRandom<T>(
  items: readonly T[],
  random: () => number,
): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

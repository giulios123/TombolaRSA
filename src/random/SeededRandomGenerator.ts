import { shuffleWithRandom, type RandomGenerator } from "./RandomGenerator";

export class SeededRandomGenerator implements RandomGenerator {
  private state: number;

  public constructor(seed: number) {
    if (!Number.isInteger(seed)) {
      throw new Error("Seed must be an integer.");
    }
    this.state = seed >>> 0 || 0x9e3779b9;
  }

  public random(): number {
    let state = this.state;
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    this.state = state >>> 0;
    return this.state / 2 ** 32;
  }

  public shuffle<T>(items: readonly T[]): T[] {
    return shuffleWithRandom(items, () => this.random());
  }
}

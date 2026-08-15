import { shuffleWithRandom, type RandomGenerator } from "./RandomGenerator";

const UINT32_RANGE = 2 ** 32;

export class CryptoRandomGenerator implements RandomGenerator {
  private readonly crypto: Crypto;

  public constructor(cryptoSource: Crypto = globalThis.crypto) {
    if (!cryptoSource?.getRandomValues) {
      throw new Error("RANDOMNESS_UNAVAILABLE");
    }
    this.crypto = cryptoSource;
  }

  public random(): number {
    const values = new Uint32Array(1);
    this.crypto.getRandomValues(values);
    return values[0] / UINT32_RANGE;
  }

  public shuffle<T>(items: readonly T[]): T[] {
    return shuffleWithRandom(items, () => this.random());
  }
}

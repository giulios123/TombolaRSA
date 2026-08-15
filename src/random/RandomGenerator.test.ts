import { describe, expect, it } from "vitest";
import { SeededRandomGenerator } from "./SeededRandomGenerator";

describe("SeededRandomGenerator", () => {
  it("reproduces the same random stream and shuffle for the same seed", () => {
    const first = new SeededRandomGenerator(123456);
    const second = new SeededRandomGenerator(123456);

    expect([first.random(), first.random(), first.random()]).toEqual([
      second.random(),
      second.random(),
      second.random(),
    ]);

    const values = Array.from({ length: 20 }, (_, index) => index + 1);
    expect(new SeededRandomGenerator(123456).shuffle(values)).toEqual(
      new SeededRandomGenerator(123456).shuffle(values),
    );
    expect(values).toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
  });

  it("keeps random values in the half-open unit interval", () => {
    const generator = new SeededRandomGenerator(42);
    const values = Array.from({ length: 1000 }, () => generator.random());

    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });
});

import type { RandomGenerator } from "../random/RandomGenerator";

export interface HittingSetResult {
  readonly blockers: readonly number[];
}

interface SearchContext {
  readonly constraints: readonly (readonly number[])[];
  readonly candidateMasks: ReadonlyMap<number, bigint>;
  readonly maxSize: number;
  readonly rng: RandomGenerator;
  readonly memo: Map<string, boolean>;
}

function bitCount(mask: bigint): number {
  let count = 0;
  let value = mask;
  while (value !== 0n) {
    value &= value - 1n;
    count += 1;
  }
  return count;
}

function disjointPackingLowerBound(
  mask: bigint,
  constraints: readonly (readonly number[])[],
): number {
  const remaining = new Set<number>();
  for (let index = 0; index < constraints.length; index += 1) {
    if ((mask & (1n << BigInt(index))) !== 0n) remaining.add(index);
  }

  let lowerBound = 0;
  while (remaining.size > 0) {
    const selected = [...remaining].sort(
      (left, right) => constraints[left].length - constraints[right].length,
    )[0];
    const selectedCandidates = new Set(constraints[selected]);
    lowerBound += 1;
    for (const index of remaining) {
      if (
        constraints[index].some((candidate) =>
          selectedCandidates.has(candidate),
        )
      ) {
        remaining.delete(index);
      }
    }
  }
  return lowerBound;
}

function lowerBound(
  mask: bigint,
  constraints: readonly (readonly number[])[],
  candidateMasks: ReadonlyMap<number, bigint>,
): number {
  if (mask === 0n) return 0;

  let maxCoverage = 0;
  for (const candidateMask of candidateMasks.values()) {
    maxCoverage = Math.max(maxCoverage, bitCount(candidateMask & mask));
  }
  if (maxCoverage === 0) return Number.POSITIVE_INFINITY;

  const uncoveredConstraints = bitCount(mask);
  const coverageBound = Math.ceil(uncoveredConstraints / maxCoverage);
  return Math.max(coverageBound, disjointPackingLowerBound(mask, constraints));
}

function chooseConstraint(
  mask: bigint,
  constraints: readonly (readonly number[])[],
  candidateMasks: ReadonlyMap<number, bigint>,
): number {
  let selected = -1;
  let selectedCandidateCount = Number.POSITIVE_INFINITY;
  for (let index = 0; index < constraints.length; index += 1) {
    if ((mask & (1n << BigInt(index))) === 0n) continue;
    const available = constraints[index].filter(
      (candidate) => (candidateMasks.get(candidate) ?? 0n) & mask,
    ).length;
    if (available < selectedCandidateCount) {
      selected = index;
      selectedCandidateCount = available;
    }
  }
  return selected;
}

function exactSearch(
  mask: bigint,
  chosen: number[],
  context: SearchContext,
): number[] | null {
  if (mask === 0n) return chosen;
  if (chosen.length >= context.maxSize) return null;

  const remainingCapacity = context.maxSize - chosen.length;
  const bound = lowerBound(mask, context.constraints, context.candidateMasks);
  if (bound > remainingCapacity) return null;

  const memoKey = `${mask.toString(16)}:${remainingCapacity}`;
  if (context.memo.get(memoKey) === false) return null;

  const constraintIndex = chooseConstraint(
    mask,
    context.constraints,
    context.candidateMasks,
  );
  if (constraintIndex < 0) return chosen;

  const candidates = context.rng
    .shuffle(context.constraints[constraintIndex])
    .sort(
      (left, right) =>
        bitCount((context.candidateMasks.get(right) ?? 0n) & mask) -
        bitCount((context.candidateMasks.get(left) ?? 0n) & mask),
    );
  for (const candidate of candidates) {
    const candidateMask = context.candidateMasks.get(candidate) ?? 0n;
    const result = exactSearch(
      mask & ~candidateMask,
      [...chosen, candidate],
      context,
    );
    if (result) return result;
  }

  context.memo.set(memoKey, false);
  return null;
}

function greedySearch(
  constraints: readonly (readonly number[])[],
  maxSize: number,
  rng: RandomGenerator,
  restarts: number,
): number[] | null {
  const candidateSet = new Set(constraints.flat());
  const candidates = [...candidateSet];
  for (let restart = 0; restart < restarts; restart += 1) {
    const uncovered = new Set(constraints.map((_, index) => index));
    const chosen: number[] = [];
    while (uncovered.size > 0 && chosen.length < maxSize) {
      const ranked = rng.shuffle(candidates).sort((left, right) => {
        const rightCoverage = constraints.reduce(
          (count, constraint, index) =>
            uncovered.has(index) && constraint.includes(right)
              ? count + 1
              : count,
          0,
        );
        const leftCoverage = constraints.reduce(
          (count, constraint, index) =>
            uncovered.has(index) && constraint.includes(left)
              ? count + 1
              : count,
          0,
        );
        return rightCoverage - leftCoverage;
      });
      const selected = ranked.find((candidate) =>
        constraints.some(
          (constraint, index) =>
            uncovered.has(index) && constraint.includes(candidate),
        ),
      );
      if (selected === undefined) break;
      chosen.push(selected);
      constraints.forEach((constraint, index) => {
        if (constraint.includes(selected)) uncovered.delete(index);
      });
    }
    if (uncovered.size === 0) return chosen;
  }
  return null;
}

export function findHittingSet(
  constraints: readonly (readonly number[])[],
  maxSize: number,
  rng: RandomGenerator,
): HittingSetResult | null {
  if (constraints.length === 0) return { blockers: [] };
  if (maxSize < 0) return null;

  const greedy = greedySearch(constraints, maxSize, rng, 32);
  if (greedy) return { blockers: greedy };

  const candidateSet = new Set(constraints.flat());
  const candidateMasks = new Map<number, bigint>();
  for (const candidate of candidateSet) {
    let mask = 0n;
    constraints.forEach((constraint, index) => {
      if (constraint.includes(candidate)) mask |= 1n << BigInt(index);
    });
    candidateMasks.set(candidate, mask);
  }

  const fullMask = (1n << BigInt(constraints.length)) - 1n;
  const context: SearchContext = {
    constraints,
    candidateMasks,
    maxSize,
    rng,
    memo: new Map(),
  };
  const exact = exactSearch(fullMask, [], context);
  return exact ? { blockers: exact } : null;
}

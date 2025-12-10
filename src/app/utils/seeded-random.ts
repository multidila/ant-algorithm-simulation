import seedrandom from 'seedrandom';

/**
 * Seeded pseudo-random number generator wrapper using seedrandom library
 * Provides reproducible random sequences for testing and debugging
 */
export class SeededRandom {
  private readonly _rng: seedrandom.PRNG;

  constructor(seed: number) {
    this._rng = seedrandom(seed.toString());
  }

  /**
   * Returns a pseudo-random number between 0 (inclusive) and 1 (exclusive)
   */
  public next(): number {
    return this._rng();
  }

  /**
   * Returns a pseudo-random integer between min (inclusive) and max (inclusive)
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns a pseudo-random number between min (inclusive) and max (exclusive)
   */
  public nextRange(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}

import { Injectable } from '@angular/core';

import { SeededRandom } from '../../utils';

/**
 * Random number generator service
 * Provides seeded or non-seeded random number generation
 */
@Injectable()
export class RandomService {
  private _rng: SeededRandom | null = null;

  /**
   * Initialize with a seed for reproducible random sequences
   */
  public setSeed(seed: number): void {
    this._rng = new SeededRandom(seed);
  }

  /**
   * Clear seed and use Math.random()
   */
  public clearSeed(): void {
    this._rng = null;
  }

  /**
   * Returns a random number between 0 (inclusive) and 1 (exclusive)
   */
  public next(): number {
    return this._rng ? this._rng.next() : Math.random();
  }

  /**
   * Returns a random integer between min (inclusive) and max (inclusive)
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns a random number between min (inclusive) and max (exclusive)
   */
  public nextRange(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}

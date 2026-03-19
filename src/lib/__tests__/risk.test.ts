import { describe, expect, it } from 'vitest';
import { calculateCAPM, calculateKellyCriterionDiscrete, calculateKellyCriterionContinuous, calculateVaR, calculateCVaR } from '../risk';

describe('risk functions', () => {
  describe('CAPM', () => {
    it('calculates expected return correctly', () => {
      // risk free 2%, beta 1.5, market 8% -> 2% + 1.5*(8%-2%) = 2% + 9% = 11%
      expect(calculateCAPM(0.02, 1.5, 0.08)).toBeCloseTo(0.11, 4);
    });
  });

  describe('Kelly Criterion', () => {
    it('discrete formula', () => {
      // 55% win rate, 1:1 risk reward (1.0)
      // p = 0.55, q = 0.45, b = 1.0 => f = 0.55 - 0.45/1 = 0.10
      expect(calculateKellyCriterionDiscrete(0.55, 1.0)).toBeCloseTo(0.10, 4);
    });

    it('continuous formula', () => {
      // mu=0.10, r=0.02, sigma=0.20
      // f = (0.10-0.02)/0.04 = 0.08/0.04 = 2.0
      expect(calculateKellyCriterionContinuous(0.10, 0.02, 0.20)).toBeCloseTo(2.0, 4);
    });
  });

  describe('Value at Risk (VaR)', () => {
    it('parametric VaR 95%', () => {
      // Assume portfolio $1,000,000, stddev 0.02 (2% daily), 95% confidence (Z=1.645)
      // 1000000 * (1.645 * 0.02) = 1000000 * 0.0329 = 32900
      const v = calculateVaR('parametric', 1000000, 0.95, [], 0, 0.02);
      expect(v).toBeCloseTo(32897, -1); // 1.64485 Z-score -> ~32897
    });

    it('historical VaR 95%', () => {
      // 100 returns
      const returns = new Array(100).fill(0).map((_, i) => (i - 50) / 1000); 
      // returns go from -0.050 to +0.049
      // at 95% confidence, 5th worst. (sorted: -0.050, -0.049, -0.048, -0.047, -0.046) -> index 4= -0.046
      // Let's use 1000 portfolio value. Loss = 46.
      const v = calculateVaR('historical', 1000, 0.95, returns);
      expect(v).toBeGreaterThan(40);
      expect(v).toBeLessThan(50);
    });
  });
});

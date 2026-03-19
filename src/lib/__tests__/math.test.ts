import { describe, expect, it } from 'vitest';
import { blackScholes, normalCdf } from '../math';
import { binomialTreeParams } from '../binomial';
import { monteCarloOptionPricing } from '../monteCarlo';

describe('math functions', () => {
  it('computes correct normalCdf', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 4);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
  });

  describe('Black-Scholes Options Pricing', () => {
    it('prices an ATM call option correctly', () => {
      // S=100, K=100, T=1, r=0.05, sigma=0.2, q=0
      const greeks = blackScholes('call', 100, 100, 1, 0.05, 0.2, 0);
      expect(greeks.price).toBeCloseTo(10.45, 1);
      expect(greeks.delta).toBeCloseTo(0.63, 1);
    });

    it('prices an ATM put option correctly', () => {
      const greeks = blackScholes('put', 100, 100, 1, 0.05, 0.2, 0);
      expect(greeks.price).toBeCloseTo(5.57, 1);
      expect(greeks.delta).toBeCloseTo(-0.36, 1);
    });
  });

  describe('Binomial Tree Pricing', () => {
    it('approximates BS price for European Options with many steps', () => {
      const bsPrice = blackScholes('call', 100, 100, 1, 0.05, 0.2, 0).price;
      const binPrice = binomialTreeParams(100, 100, 1, 0.05, 0.2, 100, false, 'call').price;
      expect(Math.abs(bsPrice - binPrice)).toBeLessThan(0.1);
    });
  });

  describe('Monte Carlo Pricing', () => {
    it('approximates BS price reasonably closely', () => {
      const bsPrice = blackScholes('call', 100, 100, 1, 0.05, 0.2, 0).price;
      const mcPrice = monteCarloOptionPricing('call', 100, 100, 1, 0.05, 0.2, 10000);
      // MC simulation has variance, so we use a loose bound (expected standard error)
      expect(Math.abs(bsPrice - mcPrice.price)).toBeLessThan(mcPrice.stdError * 3);
    });
  });
});

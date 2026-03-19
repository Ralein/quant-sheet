import { describe, expect, it } from 'vitest';
import { calculatePortfolioReturn, calculatePortfolioVariance, getEfficientFrontier } from '../portfolio';

describe('portfolio functions', () => {
  it('calculates portfolio expected return', () => {
    const returns = [0.10, 0.05];
    const weights = [0.6, 0.4];
    expect(calculatePortfolioReturn(weights, returns)).toBeCloseTo(0.08, 4);
  });

  it('calculates portfolio variance', () => {
    const weights = [0.5, 0.5];
    const cov = [
      [0.04, 0.01],
      [0.01, 0.06]
    ];
    // 0.25*0.04 + 0.25*0.06 + 2*0.25*0.01 = 0.01 + 0.015 + 0.005 = 0.03
    expect(calculatePortfolioVariance(weights, cov)).toBeCloseTo(0.03, 4);
  });

  it('generates an efficient frontier', () => {
    const assets = [
      { symbol: 'A', expectedReturn: 0.12, volatility: 0.20, weight: 0 },
      { symbol: 'B', expectedReturn: 0.08, volatility: 0.15, weight: 0 },
      { symbol: 'C', expectedReturn: 0.05, volatility: 0.10, weight: 0 }
    ];
    
    // Assume 0 correlation for simplicity => Covariance is diagonal squared
    const cov = [
      [0.04, 0, 0],
      [0, 0.0225, 0],
      [0, 0, 0.01]
    ];

    const ef = getEfficientFrontier(assets, cov, 0.02, 500);
    expect(ef.length).toBeGreaterThan(0);
    
    // Check that EF points are strictly non-decreasing in risk and return
    for (let i = 1; i < ef.length; i++) {
      expect(ef[i].targetVol).toBeGreaterThanOrEqual(ef[i-1].targetVol);
      expect(ef[i].maxReturn).toBeGreaterThanOrEqual(ef[i-1].maxReturn);
    }
  });
});

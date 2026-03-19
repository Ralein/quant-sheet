import { jStat } from 'jstat';

/**
 * Calculates the Capital Asset Pricing Model (CAPM) expected return.
 * @param riskFreeRate The risk-free rate of return (e.g., 0.02 for 2%)
 * @param beta The beta of the investment (measure of volatility relative to the market)
 * @param expectedMarketReturn The expected return of the market
 * @returns Expected return according to CAPM
 */
export const calculateCAPM = (
  riskFreeRate: number,
  beta: number,
  expectedMarketReturn: number
): number => {
  return riskFreeRate + beta * (expectedMarketReturn - riskFreeRate);
};

/**
 * Calculates the Kelly Criterion fraction for bet sizing (Discrete).
 * @param winProbability Probability of a winning trade (e.g., 0.55 for 55%)
 * @param winLossRatio The ratio of average win size to average loss size (e.g., 1.5)
 * @returns The fraction of the portfolio to wager (f*)
 */
export const calculateKellyCriterionDiscrete = (
  winProbability: number,
  winLossRatio: number
): number => {
  if (winLossRatio <= 0) return 0;
  // f* = p - (1-p)/b
  const fraction = winProbability - (1 - winProbability) / winLossRatio;
  return Math.max(0, fraction); // Never bet a negative amount
};

/**
 * Calculates the Kelly Criterion for continuous continuous time (Merton's portfolio problem).
 * @param expectedReturn Expected excess return of the asset
 * @param riskFreeRate The risk-free interest rate
 * @param volatility The volatility (standard deviation) of the asset
 * @returns Optimal leverage fraction
 */
export const calculateKellyCriterionContinuous = (
  expectedReturn: number,
  riskFreeRate: number,
  volatility: number
): number => {
  if (volatility <= 0) return 0;
  return (expectedReturn - riskFreeRate) / (volatility * volatility);
};

export type VaRMethod = 'parametric' | 'historical';

/**
 * Calculates Value at Risk (VaR) mathematically.
 * 
 * @param method 'parametric' or 'historical'
 * @param portfolioValue Total value of the portfolio
 * @param confidenceLevel Confidence level (e.g., 0.95 for 95%, or 0.99 for 99%)
 * @param returns Historical returns array
 * @param mean Expected return (used for parametric if provided)
 * @param stdDev Standard deviation (used for parametric if provided)
 * @returns The VaR value (positive number representing potential loss)
 */
export const calculateVaR = (
  method: VaRMethod,
  portfolioValue: number,
  confidenceLevel: number,
  returns: number[] = [],
  mean: number = 0,
  stdDev: number = 0
): number => {
  if (method === 'parametric') {
    // For parametric, we need a standard normal z-score corresponding to the confidence level tail
    // E.g., for 95% confidence, alpha is 0.05, so we find z such that CDF(z) = 0.05, which is -1.645
    // jStat.normal.inv calculates the inverse CDF
    const alpha = 1 - confidenceLevel;
    const zScore = Math.abs(jStat.normal.inv(alpha, 0, 1));
    
    // Formula: VaR = PortfolioValue * (Z * stdDev - mean)
    // Often mean is assumed 0 for daily VaR, but we include it if provided.
    const varAmount = portfolioValue * (zScore * stdDev - mean);
    return Math.max(0, varAmount);
  } else if (method === 'historical') {
    if (returns.length === 0) return 0;
    
    // Sort returns from worst to best
    const sortedReturns = [...returns].sort((a, b) => a - b);
    
    // Find the percentile index
    const alpha = 1 - confidenceLevel;
    
    // E.g., 100 returns, 95% confidence -> alpha is 0.05 -> index is 5
    // We add small logic for interpolation or exact index
    const exactIndex = alpha * sortedReturns.length;
    const lowerIndex = Math.max(0, Math.floor(exactIndex) - 1); // -1 because 0-indexed
    
    const varReturn = sortedReturns[lowerIndex];
    
    // VaR is the dollar amount of loss. Since varReturn is negative, we multiply by -1.
    const varAmount = portfolioValue * (-varReturn);
    return Math.max(0, varAmount);
  }
  
  return 0;
};

/**
 * Calculates Conditional Value at Risk (CVaR) or Expected Shortfall.
 */
export const calculateCVaR = (
  portfolioValue: number,
  confidenceLevel: number,
  returns: number[]
): number => {
  if (returns.length === 0) return 0;
  
  // Sort from worst to best
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const alpha = 1 - confidenceLevel;
  const cutoffIndex = Math.floor(alpha * sortedReturns.length);
  
  if (cutoffIndex === 0) {
    return portfolioValue * (-sortedReturns[0]);
  }
  
  // Average of returns worse than the VaR cutoff
  let sum = 0;
  for (let i = 0; i < cutoffIndex; i++) {
    sum += sortedReturns[i];
  }
  const avgWorstReturn = sum / cutoffIndex;
  
  return Math.max(0, portfolioValue * (-avgWorstReturn));
};

/**
 * Generates a standard normal random variable using the Box-Muller transform.
 * It's faster for simulating many steps than using inverse CDF functions.
 */
export const randomNormal = (): number => {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

export interface GBMPath {
  path: number[]; // Array of prices from t=0 to t=steps
}

/**
 * Simulates future asset price paths using Geometric Brownian Motion (GBM).
 * 
 * S_{t+dt} = S_t * exp((mu - 0.5 * sigma^2) * dt + sigma * Z * sqrt(dt))
 * 
 * @param initialPrice S0, the starting price
 * @param expectedReturn mu, the expected annual return
 * @param volatility sigma, the annual volatility
 * @param timeHorizon T, time in years (e.g., 1 for 1 year)
 * @param steps Number of time steps (e.g., 252 for daily steps in a year)
 * @param numPaths Number of paths to simulate
 * @returns Array of GBMPath objects containing the simulated paths
 */
export const simulateGBM = (
  initialPrice: number,
  expectedReturn: number,
  volatility: number,
  timeHorizon: number,
  steps: number,
  numPaths: number
): GBMPath[] => {
  const dt = timeHorizon / steps;
  const drift = (expectedReturn - 0.5 * volatility * volatility) * dt;
  const shockVol = volatility * Math.sqrt(dt);
  
  const paths: GBMPath[] = [];
  
  for (let i = 0; i < numPaths; i++) {
    const path = [initialPrice];
    let currentPrice = initialPrice;
    
    for (let t = 1; t <= steps; t++) {
      const z = randomNormal();
      currentPrice = currentPrice * Math.exp(drift + shockVol * z);
      path.push(currentPrice);
    }
    
    paths.push({ path });
  }
  
  return paths;
};

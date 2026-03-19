/**
 * Generate standard normal random variables using Box-Muller transform
 */
export const randn_bm = (): number => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  // Ensure we don't return Infinity
  return Number.isFinite(num) ? num : 0;
};

export interface MonteCarloResult {
  paths: number[][]; // [pathIndex][timeStep]
  expectedPrice: number;
}

/**
 * Generate asset paths using Geometric Brownian Motion (GBM)
 * @param S0 Initial asset price
 * @param mu Expected return (drift)
 * @param sigma Volatility
 * @param T Time in years
 * @param steps Number of time steps
 * @param numPaths Number of simulated paths
 */
export const generateGBMPaths = (
  S0: number,
  mu: number,
  sigma: number,
  T: number,
  steps: number,
  numPaths: number = 1000
): MonteCarloResult => {
  if (steps <= 0) steps = 1;
  const dt = T / steps;
  const drift = (mu - 0.5 * sigma * sigma) * dt;
  const vol = sigma * Math.sqrt(dt);

  const paths: number[][] = new Array(numPaths);
  let finalPriceSum = 0;

  for (let p = 0; p < numPaths; p++) {
    const path = new Float64Array(steps + 1);
    path[0] = S0;
    
    for (let t = 1; t <= steps; t++) {
      const Z = randn_bm();
      path[t] = path[t - 1] * Math.exp(drift + vol * Z);
    }
    
    paths[p] = Array.from(path); // Convert typed array to regular array for easier React rendering
    finalPriceSum += path[steps];
  }

  return {
    paths,
    expectedPrice: finalPriceSum / numPaths
  };
};

/**
 * Monte Carlo Option Pricing (European)
 */
export const monteCarloOptionPricing = (
  type: 'call' | 'put',
  S0: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  numPaths: number = 10000
): { price: number; stdError: number } => {
  const result = generateGBMPaths(S0, r, sigma, T, 1, numPaths);
  
  let payoffSum = 0;
  let payoffSquaredSum = 0;
  
  for (let i = 0; i < numPaths; i++) {
    const ST = result.paths[i][1];
    const payoff = type === 'call' ? Math.max(0, ST - K) : Math.max(0, K - ST);
    payoffSum += payoff;
    payoffSquaredSum += payoff * payoff;
  }
  
  const discountFactor = Math.exp(-r * T);
  const expectedPayoff = payoffSum / numPaths;
  const price = expectedPayoff * discountFactor;
  
  // Standard error
  const variance = (payoffSquaredSum / numPaths) - (expectedPayoff * expectedPayoff);
  const stdError = (Math.sqrt(variance) / Math.sqrt(numPaths)) * discountFactor;
  
  return { price, stdError };
};

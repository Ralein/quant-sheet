
export interface PortfolioAsset {
  symbol: string;
  weight: number;
  expectedReturn: number;
  volatility: number;
}

export interface OptimizationResult {
  weights: number[];
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
}

/**
 * Calculates the portfolio expected return.
 */
export const calculatePortfolioReturn = (
  weights: number[],
  expectedReturns: number[]
): number => {
  if (weights.length !== expectedReturns.length) return 0;
  return weights.reduce((sum, w, i) => sum + w * expectedReturns[i], 0);
};

/**
 * Calculates the portfolio variance given weights and a covariance matrix.
 * @param weights Array of asset weights
 * @param covMatrix 2D array representing the covariance matrix
 */
export const calculatePortfolioVariance = (
  weights: number[],
  covMatrix: number[][]
): number => {
  const n = weights.length;
  if (n === 0 || covMatrix.length !== n || covMatrix[0].length !== n) return 0;
  
  let variance = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      variance += weights[i] * weights[j] * covMatrix[i][j];
    }
  }
  return variance;
};

/**
 * Calculates the portfolio volatility (standard deviation).
 */
export const calculatePortfolioVolatility = (
  weights: number[],
  covMatrix: number[][]
): number => {
  return Math.sqrt(calculatePortfolioVariance(weights, covMatrix));
};

/**
 * A basic function to generate random portfolios (for Efficient Frontier generation)
 */
export const generateRandomPortfolios = (
  assets: PortfolioAsset[],
  covMatrix: number[][],
  riskFreeRate: number,
  numPortfolios: number = 2000
): OptimizationResult[] => {
  const n = assets.length;
  const expectedReturns = assets.map(a => a.expectedReturn);
  const results: OptimizationResult[] = [];

  for (let p = 0; p < numPortfolios; p++) {
    // Generate random weights that sum to 1
    let weights = new Array(n).fill(0).map(() => Math.random());
    const sum = weights.reduce((a, b) => a + b, 0);
    weights = weights.map(w => w / sum);

    const portReturn = calculatePortfolioReturn(weights, expectedReturns);
    const portVol = calculatePortfolioVolatility(weights, covMatrix);
    const sharpe = portVol > 0 ? (portReturn - riskFreeRate) / portVol : 0;

    results.push({
      weights,
      expectedReturn: portReturn,
      volatility: portVol,
      sharpeRatio: sharpe
    });
  }

  return results;
};

/**
 * Generates an Efficient Frontier by generating many random portfolios and finding
 * the ones with the highest return for a given level of risk.
 */
export const getEfficientFrontier = (
  assets: PortfolioAsset[],
  covMatrix: number[][],
  riskFreeRate: number,
  numPortfolios: number = 5000
): { targetVol: number; maxReturn: number }[] => {
  const portfolios = generateRandomPortfolios(assets, covMatrix, riskFreeRate, numPortfolios);
  
  if (portfolios.length === 0) return [];
  
  // Group by volatility bucket (e.g., rounded to 2 decimal places)
  const buckets = new Map<number, number>(); // volatility -> max Return
  
  for (const p of portfolios) {
    const volBucket = Math.round(p.volatility * 100) / 100;
    const currentMax = buckets.get(volBucket) || -Infinity;
    if (p.expectedReturn > currentMax) {
      buckets.set(volBucket, p.expectedReturn);
    }
  }
  
  // Extract and sort points to form the upper edge (Efficient Frontier)
  const frontierPoints = Array.from(buckets.entries())
    .map(([vol, ret]) => ({ targetVol: vol, maxReturn: ret }))
    .sort((a, b) => a.targetVol - b.targetVol);
    
  // Filter points that are strictly dominated (higher vol, lower return than previous)
  const efficientPoints: { targetVol: number; maxReturn: number }[] = [];
  let currentMaxRet = -Infinity;
  
  for (const point of frontierPoints) {
    if (point.maxReturn >= currentMaxRet) {
      efficientPoints.push(point);
      currentMaxRet = point.maxReturn;
    }
  }
  
  return efficientPoints;
};

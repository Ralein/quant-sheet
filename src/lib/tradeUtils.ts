/**
 * Calculates Position Sizing based on risk percentage and stop loss distance.
 * @param accountSize Total account balance
 * @param riskPercent Percentage of account to risk (e.g., 1 for 1%)
 * @param entryPrice Entry price of the asset
 * @param stopLossPrice Stop loss price of the asset
 * @returns Object containing shares to buy and total position value
 */
export const calculatePositionSize = (
  accountSize: number,
  riskPercent: number,
  entryPrice: number,
  stopLossPrice: number
): { shares: number; positionValue: number; riskAmount: number } => {
  const riskAmount = accountSize * (riskPercent / 100);
  const stopLossDistance = Math.abs(entryPrice - stopLossPrice);
  
  if (stopLossDistance === 0) return { shares: 0, positionValue: 0, riskAmount };
  
  const shares = riskAmount / stopLossDistance;
  const positionValue = shares * entryPrice;
  
  return { shares, positionValue, riskAmount };
};

/**
 * Calculates Risk/Reward Ratio.
 * @param entryPrice Entry price
 * @param stopLossPrice Stop loss price
 * @param targetPrice Target take-profit price
 * @returns Risk/Reward Ratio as a number (e.g. 2 for 1:2 R/R)
 */
export const calculateRiskReward = (
  entryPrice: number,
  stopLossPrice: number,
  targetPrice: number
): number => {
  const risk = Math.abs(entryPrice - stopLossPrice);
  const reward = Math.abs(targetPrice - entryPrice);
  
  if (risk === 0) return 0;
  return reward / risk;
};

/**
 * Calculates Trade Expectancy (Expected Value per trade).
 * @param winRate Probability of winning (0 to 1)
 * @param avgWin Average winning trade amount
 * @param avgLoss Average losing trade amount
 * @returns Expected value
 */
export const calculateExpectancy = (
  winRate: number,
  avgWin: number,
  avgLoss: number
): number => {
  const lossRate = 1 - winRate;
  return (winRate * avgWin) - (lossRate * avgLoss);
};

export type PivotType = 'standard' | 'fibonacci' | 'woodie' | 'camarilla';

export interface PivotPoints {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  r4?: number;
  s1: number;
  s2: number;
  s3: number;
  s4?: number;
}

/**
 * Calculates Pivot Points based on previous period's OHLC.
 */
export const calculatePivotPoints = (
  high: number,
  low: number,
  close: number,
  type: PivotType = 'standard'
): PivotPoints => {
  const p = (high + low + close) / 3;
  const range = high - low;
  
  let r1 = 0, r2 = 0, r3 = 0, r4 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0;
  let pivot = p;
  
  switch (type) {
    case 'standard':
      r1 = (p * 2) - low;
      r2 = p + range;
      r3 = high + 2 * (p - low);
      s1 = (p * 2) - high;
      s2 = p - range;
      s3 = low - 2 * (high - p);
      break;
      
    case 'fibonacci':
      r1 = p + (range * 0.382);
      r2 = p + (range * 0.618);
      r3 = p + (range * 1.000);
      s1 = p - (range * 0.382);
      s2 = p - (range * 0.618);
      s3 = p - (range * 1.000);
      break;
      
    case 'woodie':
      pivot = (high + low + 2 * close) / 4;
      r1 = (2 * pivot) - low;
      r2 = pivot + range;
      r3 = high + 2 * (pivot - low);
      s1 = (2 * pivot) - high;
      s2 = pivot - range;
      s3 = low - 2 * (high - pivot);
      break;
      
    case 'camarilla':
      // Camarilla doesn't typically use a central pivot in the same way, but we return close as reference
      pivot = close;
      r4 = close + (range * 1.1 / 2);
      r3 = close + (range * 1.1 / 4);
      r2 = close + (range * 1.1 / 6);
      r1 = close + (range * 1.1 / 12);
      
      s1 = close - (range * 1.1 / 12);
      s2 = close - (range * 1.1 / 6);
      s3 = close - (range * 1.1 / 4);
      s4 = close - (range * 1.1 / 2);
      return { pivot, r1, r2, r3, r4, s1, s2, s3, s4 };
  }
  
  return { pivot, r1, r2, r3, s1, s2, s3 };
};

export interface FibonacciLevels {
  retracement: { [key: string]: number };
  extension: { [key: string]: number };
}

/**
 * Calculates Fibonacci Retracement and Extension levels.
 * @param swingHigh The peak of the trend
 * @param swingLow The trough of the trend
 * @param trend 'up' (bullish) or 'down' (bearish)
 */
export const calculateFibonacci = (
  swingHigh: number,
  swingLow: number,
  trend: 'up' | 'down'
): FibonacciLevels => {
  const diff = swingHigh - swingLow;
  
  const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.414, 1.618, 2.618];
  const retracement: { [key: string]: number } = {};
  const extension: { [key: string]: number } = {};
  
  if (trend === 'up') {
    levels.forEach(level => {
      if (level <= 1) {
        retracement[(level * 100).toFixed(1) + '%'] = swingHigh - (diff * level);
      } else {
        extension[(level * 100).toFixed(1) + '%'] = swingHigh + (diff * (level - 1));
      }
    });
  } else {
    levels.forEach(level => {
      if (level <= 1) {
        retracement[(level * 100).toFixed(1) + '%'] = swingLow + (diff * level);
      } else {
        extension[(level * 100).toFixed(1) + '%'] = swingLow - (diff * (level - 1));
      }
    });
  }
  
  return { retracement, extension };
};

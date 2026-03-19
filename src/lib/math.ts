import { jStat } from 'jstat';

export type OptionType = 'call' | 'put';

/**
 * Normal CDF using jStat
 */
export const normalCdf = (x: number): number => jStat.normal.cdf(x, 0, 1);

/**
 * Normal PDF using jStat
 */
export const normalPdf = (x: number): number => jStat.normal.pdf(x, 0, 1);

export interface OptionGreeks {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

/**
 * Black-Scholes-Merton option pricing and Greeks
 * @param type 'call' or 'put'
 * @param S Current asset price
 * @param K Strike price
 * @param T Time to expiration (in years)
 * @param r Risk-free interest rate (decimal, e.g., 0.05)
 * @param sigma Volatility (decimal, e.g., 0.20)
 * @param q Continuous dividend yield (default 0)
 */
export const blackScholes = (
  type: OptionType,
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  q: number = 0
): OptionGreeks => {
  // Handle edge case where T approaches 0
  if (T <= 0 || sigma <= 0) {
    const intrinsic = type === 'call' ? Math.max(0, S - K) : Math.max(0, K - S);
    return {
      price: intrinsic,
      delta: type === 'call' ? (S > K ? 1 : 0) : S < K ? -1 : 0,
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0,
    };
  }

  const d1 = (Math.log(S / K) + (r - q + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  const Nd1 = normalCdf(d1);
  const Nd2 = normalCdf(d2);
  const N_d1 = normalCdf(-d1);
  const N_d2 = normalCdf(-d2);
  const npdf_d1 = normalPdf(d1);

  let price, delta, theta, rho;

  const gamma = (npdf_d1 * Math.exp(-q * T)) / (S * sigma * Math.sqrt(T));
  const vega = S * Math.exp(-q * T) * npdf_d1 * Math.sqrt(T);

  if (type === 'call') {
    price = S * Math.exp(-q * T) * Nd1 - K * Math.exp(-r * T) * Nd2;
    delta = Math.exp(-q * T) * Nd1;
    theta =
      (-S * sigma * Math.exp(-q * T) * npdf_d1) / (2 * Math.sqrt(T)) +
      q * S * Math.exp(-q * T) * Nd1 -
      r * K * Math.exp(-r * T) * Nd2;
    rho = K * T * Math.exp(-r * T) * Nd2;
  } else {
    // Put
    price = K * Math.exp(-r * T) * N_d2 - S * Math.exp(-q * T) * N_d1;
    delta = Math.exp(-q * T) * (Nd1 - 1);
    theta =
      (-S * sigma * Math.exp(-q * T) * npdf_d1) / (2 * Math.sqrt(T)) -
      q * S * Math.exp(-q * T) * N_d1 +
      r * K * Math.exp(-r * T) * N_d2;
    rho = -K * T * Math.exp(-r * T) * N_d2;
  }

  return { price, delta, gamma, theta: theta / 365, vega: vega / 100, rho: rho / 100 };
};

/**
 * Capital Asset Pricing Model (CAPM) Expected Return
 * @param riskFree Risk-free rate (decimal)
 * @param marketReturn Expected market return (decimal)
 * @param beta Asset Beta
 */
export const capmReturn = (riskFree: number, marketReturn: number, beta: number): number => {
  return riskFree + beta * (marketReturn - riskFree);
};

/**
 * Kelly Criterion (f*) Fraction
 * @param winProb Probability of winning (decimal, 0 to 1)
 * @param winLossRatio Win/Loss ratio (b in the formula)
 */
export const kellyFraction = (winProb: number, winLossRatio: number): number => {
  if (winLossRatio <= 0) return 0;
  const q = 1 - winProb;
  const f = (winProb * winLossRatio - q) / winLossRatio;
  return Math.max(0, f); // f* shouldn't be negative in basic sizing
};

/**
 * 2-Asset Portfolio Performance
 * @param w1 Weight of asset 1 (decimal)
 * @param r1 Expected return of asset 1 (decimal)
 * @param r2 Expected return of asset 2 (decimal)
 * @param v1 Volatility of asset 1 (decimal)
 * @param v2 Volatility of asset 2 (decimal)
 * @param correlation Correlation coefficient between the two assets (-1 to 1)
 */
export const portfolioTwoAsset = (
  w1: number,
  r1: number,
  r2: number,
  v1: number,
  v2: number,
  correlation: number
) => {
  const w2 = 1 - w1;
  const expectedReturn = w1 * r1 + w2 * r2;
  const variance = w1 * w1 * v1 * v1 + w2 * w2 * v2 * v2 + 2 * w1 * w2 * v1 * v2 * correlation;
  return {
    expectedReturn,
    volatility: Math.sqrt(Math.max(0, variance))
  };
};

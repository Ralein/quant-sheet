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

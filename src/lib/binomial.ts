import type { OptionType } from './math';

interface BinomialOptionGreeks {
  price: number;
  delta?: number;
  gamma?: number;
  theta?: number;
}

/**
 * Binomial Tree Option Pricing (Cox-Ross-Rubinstein model)
 * Handles both European and American options.
 */
export const binomialTreeParams = (
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  steps: number,
  isAmerican: boolean = false,
  type: OptionType = 'call'
): BinomialOptionGreeks => {
  if (steps <= 0) steps = 1;
  const dt = T / steps;
  
  // CRR parameters
  const u = Math.exp(sigma * Math.sqrt(dt));
  const d = 1 / u;
  const p = (Math.exp(r * dt) - d) / (u - d);
  const discount = Math.exp(-r * dt);

  // Initialize option values at maturity
  const V = new Float64Array(steps + 1);
  const S_T = new Float64Array(steps + 1);

  for (let i = 0; i <= steps; i++) {
    const priceAtNode = S * Math.pow(u, steps - i) * Math.pow(d, i);
    S_T[i] = priceAtNode;
    V[i] = type === 'call' ? Math.max(0, priceAtNode - K) : Math.max(0, K - priceAtNode);
  }

  // Arrays to hold previous step values for Greek calculations
  const V_2 = new Float64Array(steps + 1);
  const V_1 = new Float64Array(steps + 1);

  // Step backwards through the tree
  for (let j = steps - 1; j >= 0; j--) {
    for (let i = 0; i <= j; i++) {
      // European intrinsic value based on probability
      V[i] = discount * (p * V[i] + (1 - p) * V[i + 1]);

      if (isAmerican) {
        // Calculate the underlying price at this node
        const priceAtNode = S * Math.pow(u, j - i) * Math.pow(d, i);
        const intrinsic = type === 'call' ? Math.max(0, priceAtNode - K) : Math.max(0, K - priceAtNode);
        V[i] = Math.max(V[i], intrinsic);
      }
    }
    
    // Save values at steps 2 and 1 for Greek calculations
    if (j === 2) {
      for (let k = 0; k <= 2; k++) V_2[k] = V[k];
    }
    if (j === 1) {
      for (let k = 0; k <= 1; k++) V_1[k] = V[k];
    }
  }

  // Calculate Greeks if we have enough steps (at least 2)
  let delta = 0, gamma = 0, theta = 0;
  
  if (steps >= 2) {
            
    // Delta from step 1
    const delta_up = (V_1[0] - V_1[1]) / (S * u - S * d);
    delta = delta_up;
    
    // Gamma from step 2
    const delta_uu = (V_2[0] - V_2[1]) / (S * u * u - S);
    const delta_dd = (V_2[1] - V_2[2]) / (S - S * d * d);
    gamma = (delta_uu - delta_dd) / (0.5 * (S * u * u - S * d * d));
    
    // Theta approximated from step 2 center node and step 0
    theta = (V_2[1] - V[0]) / (2 * dt) / 365.0; // Per day
  }

  return { price: V[0], delta, gamma, theta };
};

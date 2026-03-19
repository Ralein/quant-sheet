/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { simulateEfficientFrontier } from '../lib/risk';

export default function PortfolioOptimizer() {
  const [ret1, setRet1] = useState<number>(0.08);
  const [ret2, setRet2] = useState<number>(0.10);
  const [ret3, setRet3] = useState<number>(0.06);

  const [vol1, setVol1] = useState<number>(0.15);
  const [vol2, setVol2] = useState<number>(0.20);
  const [vol3, setVol3] = useState<number>(0.10);

  const [corr12, setCorr12] = useState<number>(0.2);
  const [corr13, setCorr13] = useState<number>(0.0);
  const [corr23, setCorr23] = useState<number>(0.5);

  const [riskFreeRate, setRiskFreeRate] = useState<number>(0.02);
  const [numPortfolios] = useState<number>(1000);

  const { portfolios, maxSharpePortfolio, minRiskPortfolio } = useMemo(() => {
    const expectedReturns = [ret1, ret2, ret3];
    const vols = [vol1, vol2, vol3];

    // Build covariance matrix
    // Cov(i, j) = Corr(i, j) * Vol(i) * Vol(j)
    const covMatrix = [
      [
        1.0 * vols[0] * vols[0],
        corr12 * vols[0] * vols[1],
        corr13 * vols[0] * vols[2],
      ],
      [
        corr12 * vols[1] * vols[0],
        1.0 * vols[1] * vols[1],
        corr23 * vols[1] * vols[2],
      ],
      [
        corr13 * vols[2] * vols[0],
        corr23 * vols[2] * vols[1],
        1.0 * vols[2] * vols[2],
      ]
    ];

    const generated = simulateEfficientFrontier(expectedReturns, covMatrix, riskFreeRate, numPortfolios);
    
    // Find portfolios of interest
    let maxSharpe = generated[0];
    let minRisk = generated[0];

    for (const p of generated) {
      if (p.sharpeRatio > maxSharpe.sharpeRatio) maxSharpe = p;
      if (p.risk < minRisk.risk) minRisk = p;
    }

    return {
      portfolios: generated,
      maxSharpePortfolio: maxSharpe,
      minRiskPortfolio: minRisk
    };
  }, [ret1, ret2, ret3, vol1, vol2, vol3, corr12, corr13, corr23, riskFreeRate, numPortfolios]);

  const formatPct = (val: number) => `${(val * 100).toFixed(2)}%`;

  return (
    <div className="dashboard-grid">
      {/* Settings Panel */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--panel-border)' }}>
          Asset Parameters (3 Assets)
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div className="form-group">
            <label>Asset 1 Return (μ)</label>
            <input type="number" value={ret1} onChange={(e) => setRet1(Number(e.target.value))} step="0.01" />
          </div>
          <div className="form-group">
            <label>Asset 1 Volatility (σ)</label>
            <input type="number" value={vol1} onChange={(e) => setVol1(Math.max(0.01, Number(e.target.value)))} step="0.01" min="0.01" />
          </div>

          <div className="form-group">
            <label>Asset 2 Return (μ)</label>
            <input type="number" value={ret2} onChange={(e) => setRet2(Number(e.target.value))} step="0.01" />
          </div>
          <div className="form-group">
            <label>Asset 2 Volatility (σ)</label>
            <input type="number" value={vol2} onChange={(e) => setVol2(Math.max(0.01, Number(e.target.value)))} step="0.01" min="0.01" />
          </div>

          <div className="form-group">
            <label>Asset 3 Return (μ)</label>
            <input type="number" value={ret3} onChange={(e) => setRet3(Number(e.target.value))} step="0.01" />
          </div>
          <div className="form-group">
            <label>Asset 3 Volatility (σ)</label>
            <input type="number" value={vol3} onChange={(e) => setVol3(Math.max(0.01, Number(e.target.value)))} step="0.01" min="0.01" />
          </div>
        </div>

        <h3 style={{ fontSize: '1rem', marginTop: '0.5rem' }}>Correlations (-1 to 1)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
          <div className="form-group">
            <label>Corr(1, 2)</label>
            <input type="number" value={corr12} onChange={(e) => setCorr12(Math.max(-1, Math.min(1, Number(e.target.value))))} step="0.1" min="-1" max="1" />
          </div>
          <div className="form-group">
            <label>Corr(1, 3)</label>
            <input type="number" value={corr13} onChange={(e) => setCorr13(Math.max(-1, Math.min(1, Number(e.target.value))))} step="0.1" min="-1" max="1" />
          </div>
          <div className="form-group">
            <label>Corr(2, 3)</label>
            <input type="number" value={corr23} onChange={(e) => setCorr23(Math.max(-1, Math.min(1, Number(e.target.value))))} step="0.1" min="-1" max="1" />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label>Risk-Free Rate</label>
          <input type="number" value={riskFreeRate} onChange={(e) => setRiskFreeRate(Number(e.target.value))} step="0.01" />
        </div>
      </div>

      {/* Results Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="stat-card" style={{ borderColor: 'var(--accent)' }}>
            <div className="stat-label">Maximum Sharpe Ratio Portfolio</div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>SR: {maxSharpePortfolio.sharpeRatio.toFixed(2)}</div>
            <div className="stat-label" style={{ marginTop: '0.5rem' }}>
              Return: {formatPct(maxSharpePortfolio.return)} | Risk: {formatPct(maxSharpePortfolio.risk)}
            </div>
            <div className="stat-label" style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
              Weights: A1: {formatPct(maxSharpePortfolio.weights[0])}, A2: {formatPct(maxSharpePortfolio.weights[1])}, A3: {formatPct(maxSharpePortfolio.weights[2])}
            </div>
          </div>
          <div className="stat-card" style={{ borderColor: 'var(--positive)' }}>
            <div className="stat-label">Minimum Risk Portfolio</div>
            <div className="stat-value" style={{ color: 'var(--positive)' }}>Risk: {formatPct(minRiskPortfolio.risk)}</div>
            <div className="stat-label" style={{ marginTop: '0.5rem' }}>
              Return: {formatPct(minRiskPortfolio.return)} | SR: {minRiskPortfolio.sharpeRatio.toFixed(2)}
            </div>
             <div className="stat-label" style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
              Weights: A1: {formatPct(minRiskPortfolio.weights[0])}, A2: {formatPct(minRiskPortfolio.weights[1])}, A3: {formatPct(minRiskPortfolio.weights[2])}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Efficient Frontier (Monte Carlo)</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="risk" 
                  name="Risk (Volatility)" 
                  type="number" 
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => formatPct(val)}
                  stroke="var(--text-secondary)"
                  label={{ value: 'Risk (Volatility)', position: 'insideBottom', offset: -10, fill: 'var(--text-secondary)' }}
                />
                <YAxis 
                  dataKey="return" 
                  name="Expected Return" 
                  type="number"
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => formatPct(val)}
                  stroke="var(--text-secondary)"
                  label={{ value: 'Return', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)' }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--panel-border)', borderRadius: '8px' }}
                  formatter={(value: any, name: any) => {
                    const numValue = Number(value);
                    const nameStr = String(name);
                    return [
                      nameStr === 'Sharpe Ratio' ? numValue.toFixed(2) : formatPct(numValue), 
                      nameStr === 'risk' ? 'Risk' : nameStr === 'return' ? 'Return' : 'Sharpe Ratio'
                    ];
                  }}
                />
                <Scatter name="Portfolios" data={portfolios} fill="rgba(66, 153, 225, 0.4)">
                  {portfolios.map((entry, index) => {
                    // Highlight the optimal portfolios
                    const isMaxSharpe = entry === maxSharpePortfolio;
                    const isMinRisk = entry === minRiskPortfolio;
                    
                    if (isMaxSharpe) return <Cell key={`cell-${index}`} fill="var(--accent)" fillOpacity={1} r={6} />;
                    if (isMinRisk) return <Cell key={`cell-${index}`} fill="var(--positive)" fillOpacity={1} r={6} />;
                    
                    // Color based on Sharpe ratio
                    const opacity = Math.max(0.2, Math.min(1, entry.sharpeRatio / maxSharpePortfolio.sharpeRatio));
                    return <Cell key={`cell-${index}`} fill={`rgba(66, 153, 225, ${opacity})`} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

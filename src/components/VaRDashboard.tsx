/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { calculateVaR, calculateCVaR } from '../lib/risk';
import { useCurrency } from '../contexts/CurrencyContext';

// Simple Box-Muller transform for normal distribution
const generateNormalReturn = (mu: number, sigma: number) => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mu + sigma * z;
};

export default function VaRDashboard() {
  const [portfolioValue, setPortfolioValue] = useState<number>(1000000);
  const [mu, setMu] = useState<number>(0.0005); // Daily expected return
  const [sigma, setSigma] = useState<number>(0.015); // Daily volatility
  const [confidenceInfo, setConfidenceInfo] = useState<number>(0.95);
  const [horizon, setHorizon] = useState<number>(1);
  const [simulationDays, setSimulationDays] = useState<number>(10000);

  const { returns: _returns, varPercentage, cvarPercentage, varValue, cvarValue, histogramData } = useMemo(() => {
    const generatedReturns = [];
    for (let i = 0; i < simulationDays; i++) {
        generatedReturns.push(generateNormalReturn(mu, sigma));
    }

    // `calculateVaR` returns dollar VaR given portfolio value. When we pass 1, we get the percentage VaR.
    const baseVarPct = calculateVaR('historical', 1, confidenceInfo, generatedReturns);
    const baseCvarPct = calculateCVaR(1, confidenceInfo, generatedReturns);
    
    // Scale to the requested time horizon
    const varPct = baseVarPct * Math.sqrt(horizon);
    const cvarPct = baseCvarPct * Math.sqrt(horizon);
    
    // Scale to portfolio value
    const vValue = portfolioValue * varPct;
    const cvValue = portfolioValue * cvarPct;

    // Create Histogram Data
    // Find min and max returns
    const minRet = Math.min(...generatedReturns);
    const maxRet = Math.max(...generatedReturns);
    
    const numBins = 50;
    const binSize = (maxRet - minRet) / numBins;
    
    const bins = Array(numBins).fill(0);
    generatedReturns.forEach(r => {
      const binIndex = Math.min(Math.floor((r - minRet) / binSize), numBins - 1);
      bins[binIndex]++;
    });

    const histData = bins.map((count, i) => {
      const binStart = minRet + i * binSize;
      const binEnd = binStart + binSize;
      const binCenter = (binStart + binEnd) / 2;
      return {
        returnPct: binCenter,
        displayPct: (binCenter * 100).toFixed(1) + '%',
        count,
        isVaRRegion: binCenter < -varPct // Everything below the VaR cutoff
      };
    });

    return {
      returns: generatedReturns,
      varPercentage: varPct,
      cvarPercentage: cvarPct,
      varValue: vValue,
      cvarValue: cvValue,
      histogramData: histData
    };
  }, [portfolioValue, mu, sigma, confidenceInfo, horizon, simulationDays]);

  const { formatCurrency: contextFormatCurrency, currency } = useCurrency();
  const formatCurrencyLocal = (val: number) => contextFormatCurrency(val, 0);
  const formatPct = (val: number) => (val * 100).toFixed(2) + '%';

  return (
    <div className="dashboard-grid">
      {/* Settings Panel */}
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Parameters</h2>
        
        <div className="form-group">
          <label>Initial Portfolio Value ({currency})</label>
          <input 
            type="number" 
            value={portfolioValue} 
            onChange={(e) => setPortfolioValue(Number(e.target.value))} 
            min="1000" step="1000"
          />
        </div>

        <div className="form-group">
          <label>Expected Daily Return (μ)</label>
          <input 
            type="number" 
            value={mu} 
            onChange={(e) => setMu(Number(e.target.value))} 
            step="0.0001"
          />
        </div>

        <div className="form-group">
          <label>Daily Volatility (σ)</label>
          <input 
            type="number" 
            value={sigma} 
            onChange={(e) => setSigma(Number(e.target.value))} 
            min="0.0001" step="0.001"
          />
        </div>

        <div className="form-group">
          <label>Confidence Level</label>
          <select 
            value={confidenceInfo} 
            onChange={(e) => setConfidenceInfo(Number(e.target.value))}
          >
            <option value={0.90}>90%</option>
            <option value={0.95}>95%</option>
            <option value={0.99}>99%</option>
            <option value={0.999}>99.9%</option>
          </select>
        </div>

        <div className="form-group">
          <label>Time Horizon (Days)</label>
          <input 
            type="number" 
            value={horizon} 
            onChange={(e) => setHorizon(Number(e.target.value))} 
            min="1" max="252" step="1"
          />
        </div>
      </div>

      {/* Results Panel */}
      <div>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-label">Value at Risk (VaR)</div>
            <div className="stat-value negative">{formatCurrencyLocal(varValue)}</div>
            <div className="stat-label" style={{ marginTop: '0.25rem' }}>{formatPct(varPercentage)} of Portfolio</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Expected Shortfall (CVaR)</div>
            <div className="stat-value negative">{formatCurrencyLocal(cvarValue)}</div>
            <div className="stat-label" style={{ marginTop: '0.25rem' }}>{formatPct(cvarPercentage)} of Portfolio</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Simulated Days</div>
            <div className="stat-value">
              <input 
                type="number" 
                value={simulationDays} 
                onChange={(e) => setSimulationDays(Number(e.target.value))} 
                min="1000" step="1000"
                style={{
                  width: '100px',
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  outline: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.2)',
                  paddingBottom: '2px'
                }}
              />
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Simulated Returns Distribution</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Historical simulation showing the distribution of possible returns over {horizon} day{horizon > 1 ? 's' : ''}. 
            The red zone indicates outcomes worse than the VaR threshold.
          </p>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="displayPct" 
                  stroke="var(--text-secondary)"
                  tick={{ fontSize: 12 }}
                  minTickGap={20}
                />
                <YAxis 
                  stroke="var(--text-secondary)"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--panel-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
                  formatter={(value: any) => [value, 'Frequency']}
                  labelFormatter={(label: any) => `Return: ${label}`}
                />
                <ReferenceLine 
                    x={histogramData.find(d => d.returnPct >= -varPercentage)?.displayPct} 
                    stroke="var(--danger)" 
                    strokeWidth={2}
                    strokeDasharray="4 4" 
                    label={{ position: 'top', value: 'VaR Cutoff', fill: 'var(--danger)', fontSize: 12 }} 
                />
                
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {histogramData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isVaRRegion ? 'var(--danger)' : 'var(--accent)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

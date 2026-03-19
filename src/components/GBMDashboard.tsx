/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { simulateGBM } from '../lib/risk';
import { useCurrency } from '../contexts/CurrencyContext';

export default function GBMDashboard() {
  const [initialPrice, setInitialPrice] = useState<number>(100);
  const [expectedReturn, setExpectedReturn] = useState<number>(0.08);
  const [volatility, setVolatility] = useState<number>(0.20);
  const [timeHorizon, setTimeHorizon] = useState<number>(1); // Years
  const [steps, setSteps] = useState<number>(252); // Daily steps for 1 year
  const [numPaths, setNumPaths] = useState<number>(20);
  
  // A trigger to allow user to specifically to re-run random simulation
  const [seed, setSeed] = useState<number>(0);

  const { chartData, minPrice, maxPrice, averageEndPrice } = useMemo(() => {
    // We pass `seed` strictly to depend on it for refreshing memo
    const pathsData = simulateGBM(initialPrice, expectedReturn, volatility, timeHorizon, steps, numPaths);
    
    // Transform data for Recharts
    // Recharts expects array of objects for the X-axis mapping.
    // e.g. [{ step: 0, path0: 100, path1: 100 }, { step: 1, path0: 101, path1: 99 }]
    const formattedData = [];
    const endPrices: number[] = [];

    for (let s = 0; s <= steps; s++) {
      const dataPoint: any = { step: s, time: (s * timeHorizon / steps).toFixed(3) };
      for (let p = 0; p < numPaths; p++) {
        dataPoint[`path${p}`] = pathsData[p].path[s];
        
        // If it's the last step, collect the end price for stats
        if (s === steps) {
          endPrices.push(pathsData[p].path[s]);
        }
      }
      formattedData.push(dataPoint);
    }

    const maxP = Math.max(...endPrices);
    const minP = Math.min(...endPrices);
    const avgP = endPrices.reduce((sum, p) => sum + p, 0) / endPrices.length;

    return {
      chartData: formattedData,
      finalPrices: endPrices,
      maxPrice: maxP,
      minPrice: minP,
      averageEndPrice: avgP
    };
  }, [initialPrice, expectedReturn, volatility, timeHorizon, steps, numPaths, seed]); // `seed` makes it recalculate on "Run Simulation"

  const { formatCurrency, currency, rates } = useCurrency();
  const prevCurrency = useRef(currency);

  useEffect(() => {
    if (prevCurrency.current !== currency && rates) {
      const ratio = rates[currency] / rates[prevCurrency.current];
      setInitialPrice(p => Math.max(1, Math.round(p * ratio)));
      prevCurrency.current = currency;
    }
  }, [currency, rates]);

  return (
    <div className="dashboard-grid">
      {/* Settings Panel */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--panel-border)' }}>
          Simulation Parameters
        </h2>
        
        <div className="form-group">
          <label>Initial Price (S₀)</label>
          <input 
            type="number" 
            value={initialPrice} 
            onChange={(e) => setInitialPrice(Math.max(1, Number(e.target.value)))} 
            step="1" min="1"
          />
        </div>

        <div className="form-group">
          <label>Expected Annual Return (μ)</label>
          <input 
            type="number" 
            value={expectedReturn} 
            onChange={(e) => setExpectedReturn(Number(e.target.value))} 
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label>Annual Volatility (σ)</label>
          <input 
            type="number" 
            value={volatility} 
            onChange={(e) => setVolatility(Math.max(0.01, Number(e.target.value)))} 
            step="0.01" min="0.01"
          />
        </div>

        <div className="form-group">
          <label>Time Horizon (Years)</label>
          <input 
            type="number" 
            value={timeHorizon} 
            onChange={(e) => setTimeHorizon(Math.max(0.1, Number(e.target.value)))} 
            step="0.1" min="0.1"
          />
        </div>
        
        <div className="form-group">
          <label>Time Steps</label>
          <input 
            type="number" 
            value={steps} 
            onChange={(e) => setSteps(Math.max(10, Math.min(1000, Number(e.target.value))))} 
            step="10" min="10" max="1000"
          />
        </div>

        <div className="form-group">
          <label>Number of Paths</label>
          <input 
            type="number" 
            value={numPaths} 
            onChange={(e) => setNumPaths(Math.max(1, Math.min(100, Number(e.target.value))))} 
            step="5" min="1" max="100"
          />
        </div>

        <button 
          onClick={() => setSeed(s => s + 1)}
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Run New Simulation
        </button>
      </div>

      {/* Results Panel */}
      <div>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-label">Average Final Price</div>
            <div className="stat-value highlight">{formatCurrency(averageEndPrice)}</div>
            <div className="stat-label" style={{ marginTop: '0.25rem' }}>Mean outcome across all paths</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Max End Price</div>
            <div className="stat-value positive">{formatCurrency(maxPrice)}</div>
            <div className="stat-label" style={{ marginTop: '0.25rem' }}>Best case scenario of simulation</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Min End Price</div>
            <div className="stat-value negative">{formatCurrency(minPrice)}</div>
            <div className="stat-label" style={{ marginTop: '0.25rem' }}>Worst case scenario of simulation</div>
          </div>
        </div>

        <div className="glass-panel" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Simulated Price Paths</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="time" 
                  type="category"
                  tickCount={10}
                  stroke="var(--text-secondary)"
                  label={{ value: 'Time (Years)', position: 'insideBottom', offset: -10, fill: 'var(--text-secondary)' }}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => formatCurrency(val, 0)}
                  stroke="var(--text-secondary)"
                  label={{ value: `Price (${currency})`, angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)' }}
                />
                <Tooltip 
                  labelFormatter={(val) => `Time: ${val} Years`}
                  formatter={(value: any, name: any) => [formatCurrency(Number(value)), name.replace('path', 'Path ')]}
                  contentStyle={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--panel-border)', borderRadius: '8px' }}
                />
                
                {/* Render a line for each path */}
                {Array.from({ length: numPaths }).map((_, i) => (
                  <Line 
                    key={`path${i}`}
                    type="monotone" 
                    dataKey={`path${i}`}
                    stroke={`hsl(${(i * 137.5) % 360}, 70%, 60%)`} // Distinct hue for each path
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false} // Turn off animation for better performance with many lines
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

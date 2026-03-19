import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { blackScholes } from '../lib/math';

export default function OptionsDashboard() {
  const [optionType, setOptionType] = useState<'call' | 'put'>('call');
  const [spot, setSpot] = useState<number>(100);
  const [strike, setStrike] = useState<number>(100);
  const [time, setTime] = useState<number>(1); // Years
  const [riskFree, setRiskFree] = useState<number>(0.05); // 5%
  const [volatility, setVolatility] = useState<number>(0.2); // 20%
  const [dividend, setDividend] = useState<number>(0);

  const greeks = useMemo(() => {
    return blackScholes(optionType, spot, strike, time, riskFree, volatility, dividend);
  }, [optionType, spot, strike, time, riskFree, volatility, dividend]);

  const chartData = useMemo(() => {
    const data = [];
    const minSpot = spot * 0.5;
    const maxSpot = spot * 1.5;
    const step = (maxSpot - minSpot) / 50;
    
    for (let s = minSpot; s <= maxSpot; s += step) {
      const bs = blackScholes(optionType, s, strike, time, riskFree, volatility, dividend);
      // Intrinsic value calculation
      const intrinsic = optionType === 'call' 
        ? Math.max(0, s - strike) 
        : Math.max(0, strike - s);
        
      data.push({
        spot: s,
        price: bs.price,
        intrinsic: intrinsic
      });
    }
    return data;
  }, [optionType, spot, strike, time, riskFree, volatility, dividend]);

  // Format numbers securely
  const format = (val: number, decimals: number = 4) => isNaN(val) ? '0.00' : val.toFixed(decimals);

  return (
    <div className="dashboard-grid">
      {/* Settings Panel */}
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Parameters</h2>
        
        <div className="form-group">
          <label>Option Type</label>
          <select 
            value={optionType} 
            onChange={(e) => setOptionType(e.target.value as 'call' | 'put')}
          >
            <option value="call">Call</option>
            <option value="put">Put</option>
          </select>
        </div>

        <div className="form-group">
          <label>Spot Price (S)</label>
          <input 
            type="number" 
            value={spot} 
            onChange={(e) => setSpot(Number(e.target.value))} 
            min="0.01" step="1"
          />
        </div>

        <div className="form-group">
          <label>Strike Price (K)</label>
          <input 
            type="number" 
            value={strike} 
            onChange={(e) => setStrike(Number(e.target.value))} 
            min="0.01" step="1"
          />
        </div>

        <div className="form-group">
          <label>Time to Expiry (Years)</label>
          <input 
            type="number" 
            value={time} 
            onChange={(e) => setTime(Number(e.target.value))} 
            min="0.001" step="0.1"
          />
        </div>

        <div className="form-group">
          <label>Risk-Free Rate (r)</label>
          <input 
            type="number" 
            value={riskFree} 
            onChange={(e) => setRiskFree(Number(e.target.value))} 
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label>Volatility (σ)</label>
          <input 
            type="number" 
            value={volatility} 
            onChange={(e) => setVolatility(Number(e.target.value))} 
            min="0.01" step="0.01"
          />
        </div>

        <div className="form-group">
          <label>Dividend Yield (q)</label>
          <input 
            type="number" 
            value={dividend} 
            onChange={(e) => setDividend(Number(e.target.value))} 
            step="0.01"
          />
        </div>
      </div>

      {/* Results Panel */}
      <div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Theoretical Price</div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>${format(greeks.price, 2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Delta (Δ)</div>
            <div className={`stat-value ${greeks.delta >= 0 ? 'positive' : 'negative'}`}>
              {format(greeks.delta, 4)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Gamma (Γ)</div>
            <div className="stat-value">{format(greeks.gamma, 4)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Theta (Θ)</div>
            <div className="stat-value negative">{format(greeks.theta, 4)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Vega (ν)</div>
            <div className="stat-value">{format(greeks.vega, 4)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Rho (ρ)</div>
            <div className="stat-value">{format(greeks.rho, 4)}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Price vs Spot (At Expiry vs Current)</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="spot" 
                  type="number" 
                  domain={['dataMin', 'dataMax']} 
                  tickFormatter={(val) => `$${val.toFixed(0)}`}
                  stroke="var(--text-secondary)"
                />
                <YAxis 
                  stroke="var(--text-secondary)"
                  tickFormatter={(val) => `$${val.toFixed(0)}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--panel-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                  labelFormatter={(label: any) => `Spot: $${Number(label).toFixed(2)}`}
                />
                <ReferenceLine x={spot} stroke="var(--text-secondary)" strokeDasharray="3 3" label={{ position: 'top', value: 'Current Spot', fill: 'var(--text-secondary)', fontSize: 12 }} />
                <ReferenceLine x={strike} stroke="var(--danger)" strokeDasharray="3 3" label={{ position: 'bottom', value: 'Strike', fill: 'var(--danger)', fontSize: 12 }} />
                
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  name="Current Price"
                  stroke="var(--accent)" 
                  strokeWidth={3} 
                  dot={false} 
                />
                <Line 
                  type="monotone" 
                  dataKey="intrinsic" 
                  name="Value at Expiry"
                  stroke="var(--success)" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

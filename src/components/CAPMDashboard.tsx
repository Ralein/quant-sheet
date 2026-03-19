/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';
import { calculateCAPM } from '../lib/risk';

export default function CAPMDashboard() {
  const [rf, setRf] = useState<number>(0.04);     // Risk-Free Rate
  const [rm, setRm] = useState<number>(0.10);     // Expected Market Return
  const [beta, setBeta] = useState<number>(1.2);  // Asset Beta
  const [assetReturn, setAssetReturn] = useState<number>(0.12); // Assumed Expected Return of the specific asset

  const { capmReturn, alpha, smlData } = useMemo(() => {
    // Expected return based on CAPM
    const er = calculateCAPM(rf, beta, rm);
    
    // Alpha (Actual Expected Return - CAPM Expected Return)
    const a = assetReturn - er;

    // Generate dat for the Security Market Line (SML)
    const points = [];
    for (let b = 0; b <= 2.5; b += 0.1) {
      points.push({
        beta: Number(b.toFixed(1)),
        expectedReturn: calculateCAPM(rf, b, rm),
      });
    }

    return {
      capmReturn: er,
      alpha: a,
      smlData: points
    };
  }, [rf, rm, beta, assetReturn]);

  const formatPct = (val: number) => (val * 100).toFixed(2) + '%';
  const formatAlpha = (val: number) => (val > 0 ? '+' : '') + (val * 100).toFixed(2) + '%';

  return (
    <div className="dashboard-grid">
      {/* Settings Panel */}
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>CAPM Parameters</h2>
        
        <div className="form-group">
          <label>Risk-Free Rate (Rf)</label>
          <input 
            type="number" 
            value={rf} 
            onChange={(e) => setRf(Number(e.target.value))} 
            step="0.001"
          />
        </div>

        <div className="form-group">
          <label>Expected Market Return (Rm)</label>
          <input 
            type="number" 
            value={rm} 
            onChange={(e) => setRm(Number(e.target.value))} 
            step="0.005"
          />
        </div>

        <div className="form-group">
          <label>Asset Beta (β)</label>
          <input 
            type="number" 
            value={beta} 
            onChange={(e) => setBeta(Number(e.target.value))} 
            step="0.1" min="-2" max="5"
          />
        </div>

        <div className="form-group" style={{ marginTop: '2rem' }}>
          <label style={{ color: 'var(--accent)' }}>Projected Asset Return (For Alpha)</label>
          <input 
            type="number" 
            value={assetReturn} 
            onChange={(e) => setAssetReturn(Number(e.target.value))} 
            step="0.005"
          />
          <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
            Used to calculate Jensen's Alpha against the CAPM baseline.
          </small>
        </div>
      </div>

      {/* Results Panel */}
      <div>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-label">CAPM Expected Return</div>
            <div className="stat-value">{formatPct(capmReturn)}</div>
            <div className="stat-label" style={{ marginTop: '0.25rem' }}>The fair return given the asset's risk</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Market Risk Premium</div>
            <div className="stat-value">{formatPct(rm - rf)}</div>
            <div className="stat-label" style={{ marginTop: '0.25rem' }}>Extra return investors demand over risk-free rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Jensen's Alpha (α)</div>
            <div className={`stat-value ${alpha >= 0 ? "positive" : "negative"}`}>
              {formatAlpha(alpha)}
            </div>
            <div className="stat-label" style={{ marginTop: '0.25rem' }}>{alpha >= 0 ? "Asset is undervalued" : "Asset is overvalued"}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Security Market Line (SML)</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="beta" 
                  type="number" 
                  domain={[0, 2.5]} 
                  stroke="var(--text-secondary)"
                  label={{ value: 'Systematic Risk (Beta)', position: 'insideBottom', offset: -10, fill: 'var(--text-secondary)' }}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => (val * 100).toFixed(0) + '%'}
                  stroke="var(--text-secondary)"
                  label={{ value: 'Expected Return', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)' }}
                />
                <Tooltip 
                  formatter={(value: any, name: any) => [formatPct(Number(value)), String(name)]}
                  labelFormatter={(val) => `Beta: ${val}`}
                  contentStyle={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--panel-border)', borderRadius: '8px' }}
                />
                {/* Security Market Line */}
                <Line 
                  data={smlData} 
                  type="linear" 
                  dataKey="expectedReturn" 
                  name="SML (Expected Return)" 
                  stroke="var(--accent)" 
                  strokeWidth={2} 
                  activeDot={false}
                  dot={false}
                />
                
                {/* Current Asset Coordinates */}
                <ReferenceDot 
                    x={beta} 
                    y={assetReturn} 
                    r={6} 
                    fill={alpha >= 0 ? 'var(--positive)' : 'var(--danger)'} 
                    stroke="var(--bg-color)"
                    strokeWidth={2}
                    label={{ value: 'Asset', position: 'top', fill: 'var(--text-primary)', fontSize: 12 }} 
                />

                {/* Vertical line at beta */}
                <ReferenceLine x={beta} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                <ReferenceLine y={assetReturn} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />

              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';
import { calculateKellyCriterionDiscrete, calculateKellyCriterionContinuous } from '../lib/risk';

export default function KellyDashboard() {
  const [winProb, setWinProb] = useState<number>(0.55);   // Win Probability
  const [winLoss, setWinLoss] = useState<number>(1.5);    // Win/Loss Ratio
  
  const [expRet, setExpRet] = useState<number>(0.08);     // Expected Return
  const [rf, setRf] = useState<number>(0.02);             // Risk-Free Rate
  const [vol, setVol] = useState<number>(0.15);           // Volatility

  const { kellyDiscrete, kellyContinuous, chartData } = useMemo(() => {
    // 1. Calculate Discrete Kelly
    const fDiscrete = calculateKellyCriterionDiscrete(winProb, winLoss);
    
    // 2. Calculate Continuous Kelly
    const fContinuous = calculateKellyCriterionContinuous(expRet, rf, vol);

    // 3. Generate Growth Rate Curve (Geometric Growth Rate vs Fraction)
    // Formula for discrete growth rate per bet: g(f) = p * ln(1 + f*b) + (1-p) * ln(1 - f)
    const data = [];
    const maxF = Math.min(1, Math.max(0.1, fDiscrete * 2.5)); // Plot up to 2.5x Kelly or 100%

    // We'll calculate the growth rate for discrete bets
    for (let f = 0; f <= maxF; f += maxF / 50) {
      let g = 0;
      if (f === 1) {
        g = winProb === 1 ? Math.log(1 + winLoss) : -Infinity;
      } else {
        g = winProb * Math.log(1 + f * winLoss) + (1 - winProb) * Math.log(1 - f);
      }
      
      data.push({
        fraction: Number(f.toFixed(3)),
        growthRate: Math.max(-0.5, g), // Lower bound the display to prevent massive drops ruining chart scaling
        actualGrowth: g
      });
    }

    return {
      kellyDiscrete: fDiscrete,
      kellyContinuous: fContinuous,
      chartData: data
    };
  }, [winProb, winLoss, expRet, rf, vol]);

  const formatPct = (val: number) => (val * 100).toFixed(2) + '%';
  const formatMultiplier = (val: number) => val.toFixed(2) + 'x';
  const formatGrowth = (val: number) => (val * 100).toFixed(4) + '%';

  // Find max growth rate for the ReferenceDot
  const maxGrowthPoint = chartData.reduce((prev, curr) => (curr.actualGrowth > prev.actualGrowth ? curr : prev), chartData[0]);

  return (
    <div className="dashboard-grid">
      {/* Settings Panel */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Discrete Mode Settings */}
        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--panel-border)' }}>
            Discrete (Binary Outcomes)
          </h2>
          
          <div className="form-group">
            <label>Win Probability (p)</label>
            <input 
              type="number" 
              value={winProb} 
              onChange={(e) => setWinProb(Math.max(0, Math.min(1, Number(e.target.value))))} 
              step="0.01" min="0" max="1"
            />
          </div>

          <div className="form-group">
            <label>Win/Loss Ratio (b)</label>
            <input 
              type="number" 
              value={winLoss} 
              onChange={(e) => setWinLoss(Math.max(0.1, Number(e.target.value)))} 
              step="0.1" min="0.1"
            />
          </div>
        </div>

        {/* Continuous Mode Settings */}
        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--panel-border)' }}>
            Continuous (Stock Market)
          </h2>
          
          <div className="form-group">
            <label>Expected Return (μ)</label>
            <input 
              type="number" 
              value={expRet} 
              onChange={(e) => setExpRet(Number(e.target.value))} 
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Risk-Free Rate (r)</label>
            <input 
              type="number" 
              value={rf} 
              onChange={(e) => setRf(Number(e.target.value))} 
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Volatility (σ)</label>
            <input 
              type="number" 
              value={vol} 
              onChange={(e) => setVol(Math.max(0.01, Number(e.target.value)))} 
              step="0.01" min="0.01"
            />
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-label">Optimal Fraction (Discrete)</div>
            <div className="stat-value highlight">{formatPct(kellyDiscrete)}</div>
            <div className="stat-label" style={{ marginTop: '0.25rem' }}>Ideal wager size as % of bankroll</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Optimal Leverage (Continuous)</div>
            <div className="stat-value highlight">{formatMultiplier(kellyContinuous)}</div>
            <div className="stat-label" style={{ marginTop: '0.25rem' }}>E.g. 1.0x = No leverage, 2.0x = 2x leverage</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Half-Kelly (Discrete)</div>
            <div className="stat-value positive">{formatPct(kellyDiscrete / 2)}</div>
            <div className="stat-label" style={{ marginTop: '0.25rem' }}>Safer approach with 3/4 the growth rate and half the volatility</div>
          </div>
        </div>

        <div className="glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Expected Geometric Growth Rate vs. Bet Fraction (Discrete)</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Betting more than the Kelly fraction leads to reduced growth. Betting more than double Kelly guarantees long-term ruin.
          </p>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="fraction" 
                  type="number" 
                  domain={['dataMin', 'dataMax']} 
                  tickFormatter={(val) => formatPct(val)}
                  stroke="var(--text-secondary)"
                  label={{ value: 'Bet Fraction (f)', position: 'insideBottom', offset: -10, fill: 'var(--text-secondary)' }}
                />
                <YAxis 
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(val) => formatGrowth(val)}
                  stroke="var(--text-secondary)"
                  label={{ value: 'Growth Rate (g)', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)' }}
                />
                <Tooltip 
                  formatter={(value: any, name: any) => [
                    name === 'growthRate' ? formatGrowth(Number(value)) : Number(value).toString(), 
                    'Geometric Growth Rate'
                  ]}
                  labelFormatter={(val) => `Fraction: ${formatPct(Number(val))}`}
                  contentStyle={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--panel-border)', borderRadius: '8px' }}
                />
                {/* Zero Growth Line */}
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                
                {/* Growth Rate Curve */}
                <Line 
                  data={chartData} 
                  type="monotone" 
                  dataKey="growthRate" 
                  stroke="var(--accent)" 
                  strokeWidth={2} 
                  activeDot={{ r: 6, fill: 'var(--primary)' }}
                  dot={false}
                />
                
                {/* Kelly Optimal Point */}
                {maxGrowthPoint && maxGrowthPoint.actualGrowth > 0 && (
                  <ReferenceDot 
                      x={maxGrowthPoint.fraction} 
                      y={maxGrowthPoint.growthRate} 
                      r={6} 
                      fill="var(--positive)" 
                      stroke="var(--bg-color)"
                      strokeWidth={2}
                      label={{ value: 'Kelly Optimal', position: 'top', fill: 'var(--positive)', fontSize: 12 }} 
                  />
                )}
                {/* Half-Kelly Point */}
                {maxGrowthPoint && maxGrowthPoint.actualGrowth > 0 && (
                  <ReferenceDot 
                      x={maxGrowthPoint.fraction / 2} 
                      y={chartData.find(d => d.fraction >= maxGrowthPoint.fraction / 2)?.growthRate || 0} 
                      r={5} 
                      fill="var(--warning)" 
                      stroke="var(--bg-color)"
                      strokeWidth={2}
                      label={{ value: 'Half Kelly', position: 'bottom', fill: 'var(--warning)', fontSize: 12, offset: 10 }} 
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

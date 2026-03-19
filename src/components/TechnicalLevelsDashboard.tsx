import { useState } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { 
  calculatePivotPoints, 
  calculateFibonacci 
} from '../lib/tradeUtils';
import type { PivotType } from '../lib/tradeUtils';

export function TechnicalLevelsDashboard() {
  const { formatCurrency } = useCurrency();

  // Pivot Points State
  const [highPrice, setHighPrice] = useState<number>(155.00);
  const [lowPrice, setLowPrice] = useState<number>(145.00);
  const [closePrice, setClosePrice] = useState<number>(152.00);
  const [pivotType, setPivotType] = useState<PivotType>('standard');

  // Fibonacci State
  const [fibHigh, setFibHigh] = useState<number>(160.00);
  const [fibLow, setFibLow] = useState<number>(140.00);
  const [fibTrend, setFibTrend] = useState<'up' | 'down'>('up');

  // Calculations
  const pivotPts = calculatePivotPoints(highPrice, lowPrice, closePrice, pivotType);
  const fibLevels = calculateFibonacci(fibHigh, fibLow, fibTrend);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          Technical Analysis Levels
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Pivot Points Calculator */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-slate-200 border-b border-slate-700/50 pb-2">Pivot Points Calculator</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Prev High
                </label>
                <input
                  type="number"
                  value={highPrice}
                  onChange={(e) => setHighPrice(Number(e.target.value))}
                  className="input-field"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Prev Low
                </label>
                <input
                  type="number"
                  value={lowPrice}
                  onChange={(e) => setLowPrice(Number(e.target.value))}
                  className="input-field"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Prev Close
                </label>
                <input
                  type="number"
                  value={closePrice}
                  onChange={(e) => setClosePrice(Number(e.target.value))}
                  className="input-field"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Pivot Point Formula
              </label>
              <select
                value={pivotType}
                onChange={(e) => setPivotType(e.target.value as PivotType)}
                className="input-field"
              >
                <option value="standard">Standard / Traditional</option>
                <option value="fibonacci">Fibonacci Pivots</option>
                <option value="woodie">Woodie's Pivots</option>
                <option value="camarilla">Camarilla Equation</option>
              </select>
            </div>

            {/* Pivot Results */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="space-y-2">
                {[
                  { label: 'R4', value: pivotPts.r4, color: 'text-rose-400' },
                  { label: 'R3', value: pivotPts.r3, color: 'text-rose-400' },
                  { label: 'R2', value: pivotPts.r2, color: 'text-rose-400' },
                  { label: 'R1', value: pivotPts.r1, color: 'text-rose-400' },
                  { label: pivotType === 'camarilla' ? 'Close' : 'P (Pivot)', value: pivotPts.pivot, color: 'text-indigo-400 font-bold' },
                  { label: 'S1', value: pivotPts.s1, color: 'text-emerald-400' },
                  { label: 'S2', value: pivotPts.s2, color: 'text-emerald-400' },
                  { label: 'S3', value: pivotPts.s3, color: 'text-emerald-400' },
                  { label: 'S4', value: pivotPts.s4, color: 'text-emerald-400' },
                ].filter(lvl => lvl.value !== undefined && lvl.value !== 0).map((lvl) => (
                  <div key={lvl.label} className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0">
                    <span className="text-sm font-medium text-slate-400 w-16">{lvl.label}</span>
                    <span className={`text-md ${lvl.color}`}>
                      {formatCurrency(lvl.value!)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fibonacci Calculator */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-slate-200 border-b border-slate-700/50 pb-2">Fibonacci Calculator</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Swing High
                </label>
                <input
                  type="number"
                  value={fibHigh}
                  onChange={(e) => setFibHigh(Number(e.target.value))}
                  className="input-field"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Swing Low
                </label>
                <input
                  type="number"
                  value={fibLow}
                  onChange={(e) => setFibLow(Number(e.target.value))}
                  className="input-field"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Trend Direction
              </label>
              <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setFibTrend('up')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    fibTrend === 'up'
                      ? 'bg-emerald-500/20 text-emerald-400 shadow-sm border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Uptrend (Bullish)
                </button>
                <button
                  type="button"
                  onClick={() => setFibTrend('down')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    fibTrend === 'down'
                      ? 'bg-rose-500/20 text-rose-400 shadow-sm border border-rose-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Downtrend (Bearish)
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {fibTrend === 'up' 
                  ? 'Calculates pullback support levels down from Swing High.' 
                  : 'Calculates bounce resistance levels up from Swing Low.'}
              </p>
            </div>

            {/* Fib Results */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Retracements</h4>
              <div className="space-y-1 mb-4">
                {['23.6%', '38.2%', '50.0%', '61.8%', '78.6%'].map((level) => (
                  <div key={level} className="flex justify-between items-center py-1.5 px-3 rounded hover:bg-slate-700/30 transition-colors">
                    <span className="text-sm text-slate-400">{level}</span>
                    <span className={`text-md font-medium ${
                      level === '50.0%' || level === '61.8%' ? 'text-amber-400' : 'text-slate-200'
                    }`}>
                      {formatCurrency(fibLevels.retracement[level] || 0)}
                    </span>
                  </div>
                ))}
              </div>

              <h4 className="text-sm font-medium text-slate-300 mb-3 pt-3 border-t border-slate-700/50">Extensions</h4>
              <div className="space-y-1">
                {['127.2%', '161.8%', '261.8%'].map((level) => (
                  <div key={level} className="flex justify-between items-center py-1.5 px-3 rounded hover:bg-slate-700/30 transition-colors">
                    <span className="text-sm text-slate-400">{level}</span>
                    <span className="text-md font-medium text-indigo-400">
                      {formatCurrency(fibLevels.extension[level] || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

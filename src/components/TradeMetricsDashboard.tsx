import { useState } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { 
  calculatePositionSize, 
  calculateRiskReward, 
  calculateExpectancy 
} from '../lib/tradeUtils';

export function TradeMetricsDashboard() {
  const { formatCurrency } = useCurrency();

  // Position Sizing State
  const [accountSize, setAccountSize] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [entryPrice, setEntryPrice] = useState<number>(100);
  const [stopLossPrice, setStopLossPrice] = useState<number>(95);

  // Expectancy & R/R State
  const [targetPrice, setTargetPrice] = useState<number>(110);
  const [winRate, setWinRate] = useState<number>(0.4);

  // Calculations
  const { shares, positionValue, riskAmount } = calculatePositionSize(
    accountSize, 
    riskPercent, 
    entryPrice, 
    stopLossPrice
  );
  
  const rrRatio = calculateRiskReward(entryPrice, stopLossPrice, targetPrice);
  const riskDistance = Math.abs(entryPrice - stopLossPrice);
  const rewardDistance = Math.abs(targetPrice - entryPrice);
  const expectancy = calculateExpectancy(winRate, rewardDistance, riskDistance);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Trade Calculators
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Inputs */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-200 border-b border-slate-700/50 pb-2">Account & Risk Parameters</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Account Size
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500">$</span>
                  </div>
                  <input
                    type="number"
                    value={accountSize}
                    onChange={(e) => setAccountSize(Number(e.target.value))}
                    className="input-field pl-8"
                    step="1000"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Risk Per Trade (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(Number(e.target.value))}
                    className="input-field pr-8"
                    step="0.1"
                    min="0"
                    max="100"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-slate-500">%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-200 border-b border-slate-700/50 pb-2">Trade Parameters</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Entry Price
                  </label>
                  <input
                    type="number"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(Number(e.target.value))}
                    className="input-field"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Stop Loss
                  </label>
                  <input
                    type="number"
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(Number(e.target.value))}
                    className="input-field"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Target Price
                  </label>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(Number(e.target.value))}
                    className="input-field"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Win Rate
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={Math.round(winRate * 100)}
                      onChange={(e) => setWinRate(Number(e.target.value) / 100)}
                      className="input-field pr-8"
                      step="1"
                      min="0"
                      max="100"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-slate-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
            
            {/* Position Sizing Calculator Results */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Position Sizing</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <span className="block text-sm text-slate-400 mb-1">Units / Shares</span>
                  <span className="text-2xl font-bold text-indigo-400">
                    {shares.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </span>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <span className="block text-sm text-slate-400 mb-1">Position Size</span>
                  <span className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(positionValue)}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-slate-900/50 rounded-lg flex justify-between items-center">
                <span className="text-sm text-slate-400">Total Risked Amount:</span>
                <span className="text-lg font-bold text-rose-400">{formatCurrency(riskAmount)}</span>
              </div>
            </div>

            {/* Risk/Reward & Expectancy Results */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Expectancy & Metrics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <span className="block text-sm text-slate-400 mb-1">Risk / Reward Ratio</span>
                  <span className="text-2xl font-bold text-amber-400">
                    1 : {rrRatio.toFixed(2)}
                  </span>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <span className="block text-sm text-slate-400 mb-1">Expected Value</span>
                  <span className={`text-2xl font-bold ${expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {expectancy >= 0 ? '+' : ''}{formatCurrency(expectancy)}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-slate-400">Avg Win: <span className="text-emerald-400">{formatCurrency(rewardDistance)}</span></span>
                  <span className="text-slate-400">Avg Loss: <span className="text-rose-400">{formatCurrency(riskDistance)}</span></span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(Math.max((expectancy / rewardDistance) * 100 + 50, 0), 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Expectancy visualizer indicating mathematical edge.
                </p>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}

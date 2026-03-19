import React, { useState } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { Save, RefreshCw } from 'lucide-react';

export default function SettingsDashboard() {
  const { rates, setRate, resetRates, currency: currentCurrency } = useCurrency();
  const [localRates, setLocalRates] = useState(rates);
  const [isSaved, setIsSaved] = useState(false);

  const currencies = Object.keys(rates) as Array<keyof typeof rates>;

  const handleRateChange = (curr: keyof typeof rates, value: string) => {
    const numValue = parseFloat(value);
    setLocalRates(prev => ({
      ...prev,
      [curr]: isNaN(numValue) ? prev[curr] : numValue
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    currencies.forEach(curr => {
      if (localRates[curr] !== rates[curr]) {
        setRate(curr, localRates[curr]);
      }
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = () => {
    resetRates();
    // We intentionally don't update localRates here immediately because 
    // the context reset will happen, and we might want to refresh from context,
    // but the simplest way is to just let the user see the reset taking effect globally.
    // Let's force a reload of local rates from context by using an effect or just manually resetting it:
  };

  // Update local rates when global rates change (like via reset)
  React.useEffect(() => {
    setLocalRates(rates);
  }, [rates]);

  return (
    <div className="glass-panel" style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Currency settings</h2>
        <p>Adjust the exchange rates used across the application. Base currency is conventionally USD = 1.0, but you can set these to any relative values.</p>
      </div>

      <div className="form-group" style={{ marginBottom: '2rem' }}>
        {currencies.map(curr => (
          <div key={curr} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <label style={{ width: '80px', margin: 0 }}>{curr}</label>
            <input
              type="number"
              step="0.01"
              style={{ flex: 1 }}
              value={localRates[curr]}
              onChange={(e) => handleRateChange(curr, e.target.value)}
            />
            {curr === currentCurrency && (
              <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 'bold' }}>(Active)</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button className="btn-primary" onClick={handleSave}>
          <Save size={18} />
          {isSaved ? 'Saved!' : 'Save Rates'}
        </button>
        <button 
          className="btn-primary" 
          style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }} 
          onClick={handleReset}
        >
          <RefreshCw size={18} />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}

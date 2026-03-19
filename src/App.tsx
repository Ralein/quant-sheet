import { useState } from 'react';
import { 
  BarChart3, 
  Activity, 
  PieChart, 
  TrendingUp, 
  Sliders, 
  Hexagon,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react';

import OptionsDashboard from './components/OptionsDashboard';
import VaRDashboard from './components/VaRDashboard';
import CAPMDashboard from './components/CAPMDashboard';
import KellyDashboard from './components/KellyDashboard';
import GBMDashboard from './components/GBMDashboard';
import PortfolioOptimizer from './components/PortfolioOptimizer';
import SettingsDashboard from './components/SettingsDashboard';
import { useCurrency } from './contexts/CurrencyContext';

export default function App() {
  const [activeTab, setActiveTab] = useState('options');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { currency, setCurrency } = useCurrency();

  const navItems = [
    { id: 'options', label: 'Options Pricing', icon: BarChart3 },
    { id: 'var', label: 'Value at Risk', icon: Activity },
    { id: 'capm', label: 'CAPM', icon: TrendingUp },
    { id: 'kelly', label: 'Kelly Criterion', icon: Sliders },
    { id: 'gbm', label: 'GBM Simulation', icon: Activity },
    { id: 'portfolio', label: 'Portfolio Optimizer', icon: PieChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="brand">
          <div className="brand-logo">
            <Hexagon className="brand-icon" size={24} />
            {!isSidebarCollapsed && <span>QuantSheet</span>}
          </div>
        </div>

        <button 
          className="collapse-btn-edge" 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        >
          {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        
        <nav className="nav-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon strokeWidth={2.5} />
                {!isSidebarCollapsed && item.label}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="content-wrapper">
          <header className="page-header">
            <div>
              <h1 className="page-title">
                {navItems.find(i => i.id === activeTab)?.label}
              </h1>
              <p className="page-subtitle">Quantitative Finance Analysis & Simulation</p>
            </div>
            
            <div className="currency-selector">
              <label>Currency:</label>
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value as any)}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </header>

          {activeTab === 'options' && <OptionsDashboard />}
          {activeTab === 'var' && <VaRDashboard />}
          {activeTab === 'capm' && <CAPMDashboard />}
          {activeTab === 'kelly' && <KellyDashboard />}
          {activeTab === 'gbm' && <GBMDashboard />}
          {activeTab === 'portfolio' && <PortfolioOptimizer />}
          {activeTab === 'settings' && <SettingsDashboard />}
        </div>
      </main>
    </div>
  );
}

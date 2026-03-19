import { useState } from 'react';
import { 
  BarChart3, 
  Activity, 
  PieChart, 
  TrendingUp, 
  Sliders, 
  Hexagon 
} from 'lucide-react';

import OptionsDashboard from './components/OptionsDashboard';
import VaRDashboard from './components/VaRDashboard';
import CAPMDashboard from './components/CAPMDashboard';
import KellyDashboard from './components/KellyDashboard';
import GBMDashboard from './components/GBMDashboard';

// We will build these components in the following steps
const PortfolioOptimizer = () => <div className="glass-panel"><p>Mean-Variance Portfolio Optimization coming soon.</p></div>;

export default function App() {
  const [activeTab, setActiveTab] = useState('options');

  const navItems = [
    { id: 'options', label: 'Options Pricing', icon: BarChart3 },
    { id: 'var', label: 'Value at Risk', icon: Activity },
    { id: 'capm', label: 'CAPM', icon: TrendingUp },
    { id: 'kelly', label: 'Kelly Criterion', icon: Sliders },
    { id: 'gbm', label: 'GBM Simulation', icon: Activity },
    { id: 'portfolio', label: 'Portfolio Optimizer', icon: PieChart },
  ];

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <Hexagon className="brand-icon" size={24} />
          QuantSheet
        </div>
        
        <nav className="nav-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon strokeWidth={2.5} />
                {item.label}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="content-wrapper">
          <header className="page-header">
            <h1 className="page-title">
              {navItems.find(i => i.id === activeTab)?.label}
            </h1>
            <p className="page-subtitle">Quantitative Finance Analysis & Simulation</p>
          </header>

          {activeTab === 'options' && <OptionsDashboard />}
          {activeTab === 'var' && <VaRDashboard />}
          {activeTab === 'capm' && <CAPMDashboard />}
          {activeTab === 'kelly' && <KellyDashboard />}
          {activeTab === 'gbm' && <GBMDashboard />}
          {activeTab === 'portfolio' && <PortfolioOptimizer />}
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { PortfolioCard, PortfolioResponse } from '../types';
import { getPortfolios, getPortfolio, updatePortfolio, deletePortfolio } from '../services/api';
import { Activity, Plus, Wallet, BarChart3, ArrowRight, RefreshCw, ChevronRight, PieChart, Trash2 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

export default function Workspace() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState<PortfolioCard[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioCard | null>(null);
  const [portfolioDetails, setPortfolioDetails] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    try {
      setLoading(true);
      const data = await getPortfolios();
      setPortfolios(data);
      if (data.length > 0) {
        setSelectedPortfolio(data[0]);
        const details = await getPortfolio(data[0].id);
        setPortfolioDetails(details);
      }
    } catch (err) {
      setError('Failed to load portfolios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPortfolio = async (p: PortfolioCard) => {
    setSelectedPortfolio(p);
    try {
      const details = await getPortfolio(p.id);
      setPortfolioDetails(details);
    } catch (err) {
      console.error('Failed to load portfolio details', err);
    }
  };

  const handleDeletePortfolio = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this portfolio?')) return;
    
    try {
      await deletePortfolio(id);
      setPortfolios(portfolios.filter(p => p.id !== id));
      if (selectedPortfolio?.id === id) {
        setSelectedPortfolio(null);
        setPortfolioDetails(null);
      }
    } catch (err) {
      console.error('Failed to delete portfolio', err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'conservative': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'aggressive': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  const generateMockPerformance = () => {
    if (!selectedPortfolio) return [];
    const data = [];
    let value = selectedPortfolio.investment_amount;
    for (let i = 30; i >= 0; i--) {
      const change = (Math.random() - 0.45) * 0.02;
      value = value * (1 + change);
      data.push({ day: 30 - i, value });
    }
    return data;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-quantis-bg flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-quantis-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-quantis-bg">
      {/* Header */}
      <header className="bg-white/5 border-b border-white/10 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-quantis-accent to-emerald-400 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Quantis</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/create" className="btn-primary text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> New Portfolio
              </Link>
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <div className="w-8 h-8 bg-gradient-to-br from-quantis-accent/50 to-emerald-500/50 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">{user?.name?.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-sm text-slate-400">{user?.email}</span>
                <button onClick={logout} className="text-slate-500 hover:text-white transition-colors text-sm">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Portfolio Cards Row */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Your Portfolios</h2>
            <Link to="/create" className="text-sm text-quantis-accent hover:underline flex items-center gap-1">
              Create New <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 mb-4">
              {error}
            </div>
          )}
          
          {portfolios.length === 0 ? (
            <div className="card p-8 text-center">
              <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No portfolios yet</h3>
              <p className="text-slate-400 mb-4">Create your first portfolio to get started</p>
              <Link to="/create" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Portfolio
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolios.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => handleSelectPortfolio(p)}
                  className={`card p-4 cursor-pointer transition-all hover:border-quantis-accent/50 ${
                    selectedPortfolio?.id === p.id ? 'border-quantis-accent' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-white">{p.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getRiskColor(p.risk_profile)}`}>
                        {p.risk_profile}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => handleDeletePortfolio(p.id, e)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-slate-500">Invested</div>
                      <div className="text-white font-medium">{formatCurrency(p.investment_amount)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Expected</div>
                      <div className="text-quantis-accent font-medium">{formatCurrency(p.expected_value)}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    v{p.current_version} • {formatDate(p.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedPortfolio && portfolioDetails ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overview Card */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">{selectedPortfolio.name}</h2>
                  <span className={`text-xs px-3 py-1 rounded-full border ${getRiskColor(selectedPortfolio.risk_profile)}`}>
                    {selectedPortfolio.risk_profile}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Invested Amount</div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(selectedPortfolio.investment_amount)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Expected Value</div>
                    <div className="text-2xl font-bold text-quantis-accent">{formatCurrency(selectedPortfolio.expected_value)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Expected Return</div>
                    <div className="text-2xl font-bold text-green-400">
                      {(portfolioDetails.metrics.expected_return * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Risk (Vol)</div>
                    <div className="text-2xl font-bold text-orange-400">
                      {(portfolioDetails.metrics.volatility * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={generateMockPerformance()}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" hide />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px' }}
                        formatter={(value: number) => [formatCurrency(value), 'Value']}
                      />
                      <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Holdings */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-quantis-accent" />
                  Holdings
                </h3>
                <div className="space-y-3">
                  {portfolioDetails.allocation.map((asset, i) => (
                    <div key={asset.ticker} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-medium text-white">{asset.ticker}</div>
                          <div className="text-xs text-slate-500">{asset.asset_class}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">{formatCurrency(asset.amount)}</div>
                        <div className="text-sm text-slate-400">{(asset.weight * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="card p-5">
                <h3 className="text-sm font-medium text-slate-400 mb-4">Risk Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Sharpe Ratio</span>
                    <span className="text-white font-medium">{portfolioDetails.metrics.sharpe_ratio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Beta</span>
                    <span className="text-white font-medium">{portfolioDetails.metrics.beta.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Max Drawdown</span>
                    <span className="text-red-400 font-medium">{(portfolioDetails.metrics.max_drawdown * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">VaR 95%</span>
                    <span className="text-orange-400 font-medium">{(portfolioDetails.metrics.var_95 * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="card p-5 space-y-3">
                <button 
                  onClick={() => navigate('/portfolio', { state: { portfolio: portfolioDetails } })}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  View Full Analysis <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-12 text-center">
            <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Select or Create a Portfolio</h3>
            <p className="text-slate-400 mb-6">Choose from existing portfolios or create a new one</p>
            <div className="flex justify-center gap-4">
              <Link to="/create" className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Portfolio
              </Link>
              {portfolios.length > 0 && (
                <button 
                  onClick={() => handleSelectPortfolio(portfolios[0])}
                  className="btn-secondary"
                >
                  View First Portfolio
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
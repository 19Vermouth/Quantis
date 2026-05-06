import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLiveMarket } from '../services/api';
import type { PortfolioResponse, LiveMarketResponse } from '../types';
import { Activity, TrendingUp, TrendingDown, RefreshCw, Brain, Shield, Target, PieChart, BarChart3, AlertTriangle, CheckCircle, ChevronLeft } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, LineChart, Line, BarChart, Bar, Legend } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#6366f1'];

type TabType = 'overview' | 'performance' | 'risk' | 'debate' | 'simulation';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [liveMarket, setLiveMarket] = useState<LiveMarketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    const saved = localStorage.getItem('quantis_portfolio');
    if (saved) {
      setPortfolio(JSON.parse(saved));
    } else {
      navigate('/workspace');
    }

    getLiveMarket()
      .then(setLiveMarket)
      .catch(console.error)
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      getLiveMarket().then(setLiveMarket).catch(console.error);
    }, 30000);

    return () => clearInterval(interval);
  }, [navigate]);

  if (loading || !portfolio) {
    return (
      <div className="min-h-screen bg-quantis-bg flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-quantis-accent animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading portfolio data...</p>
        </div>
      </div>
    );
  }

  const pieData = portfolio.allocation.map(a => ({
    name: a.ticker.split('.')[0],
    value: a.weight * 100,
    amount: a.amount,
  }));

  const formatINR = (value: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <PieChart className="w-4 h-4" /> },
    { id: 'performance', label: 'Performance', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'risk', label: 'Risk', icon: <Shield className="w-4 h-4" /> },
    { id: 'debate', label: 'AI Debate', icon: <Brain className="w-4 h-4" /> },
    { id: 'simulation', label: 'Simulation', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-quantis-bg">
      {/* Header */}
      <header className="bg-white/5 border-b border-white/10 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to="/workspace" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-quantis-accent to-emerald-400 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Quantis</span>
              </Link>
              <span className="text-slate-500">/ Portfolio</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/workspace')} className="btn-secondary text-sm">
                New Portfolio
              </button>
              <span className="text-sm text-slate-400">{user?.email}</span>
              <button onClick={logout} className="text-slate-500 hover:text-white transition-colors text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-white/10 bg-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-quantis-accent text-quantis-accent'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Portfolio Allocation</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px' }}
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Weight']}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {portfolio.allocation.map((a, i) => (
                      <div key={a.ticker} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-white font-medium">{a.ticker.split('.')[0]}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white">{(a.weight * 100).toFixed(1)}%</div>
                          <div className="text-xs text-slate-500">{formatINR(a.amount)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Explanation</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Summary</div>
                    <p className="text-sm text-slate-300">{portfolio.explanation.summary}</p>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Risk Summary</div>
                    <p className="text-sm text-slate-300">{portfolio.explanation.risk_summary}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-5">
                <h3 className="text-sm font-medium text-slate-400 mb-4">Key Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expected Return</span>
                    <span className="text-green-400 font-medium">{(portfolio.metrics.expected_return * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Volatility</span>
                    <span className="text-orange-400 font-medium">{(portfolio.metrics.volatility * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sharpe Ratio</span>
                    <span className="text-white font-medium">{portfolio.metrics.sharpe_ratio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Beta</span>
                    <span className="text-white font-medium">{portfolio.metrics.beta.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Max Drawdown</span>
                    <span className="text-red-400 font-medium">{(portfolio.metrics.max_drawdown * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="text-sm font-medium text-slate-400 mb-4">Live Market</h3>
                {liveMarket ? (
                  <div className="space-y-2">
                    {liveMarket.quotes.slice(0, 4).map(q => (
                      <div key={q.symbol} className="flex justify-between items-center text-sm">
                        <span className="text-slate-300">{q.symbol.split('.')[0]}</span>
                        <span className={q.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {q.change >= 0 ? '+' : ''}{q.change_percent.toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">Loading...</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-4">
                <div className="text-sm text-slate-500 mb-1">Expected Return</div>
                <div className="text-2xl font-bold text-green-400">{(portfolio.metrics.expected_return * 100).toFixed(1)}%</div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-slate-500 mb-1">Alpha</div>
                <div className="text-2xl font-bold text-green-400">{((portfolio.metrics.alpha || 0) * 100).toFixed(1)}%</div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-slate-500 mb-1">Beta</div>
                <div className="text-2xl font-bold text-white">{portfolio.metrics.beta.toFixed(2)}</div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-slate-500 mb-1">Sharpe Ratio</div>
                <div className="text-2xl font-bold text-quantis-accent">{portfolio.metrics.sharpe_ratio.toFixed(2)}</div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Benchmark Comparison</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b' }} />
                    <Legend />
                    <Line type="monotone" dataKey="portfolio" stroke="#10b981" strokeWidth={2} name="Your Portfolio" />
                    <Line type="monotone" dataKey="benchmark" stroke="#3b82f6" strokeWidth={2} name="Nifty 50 (^NSEI)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Risk Tab */}
        {activeTab === 'risk' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="card p-4">
                <div className="text-sm text-slate-500 mb-1">Volatility</div>
                <div className="text-2xl font-bold text-orange-400">{(portfolio.metrics.volatility * 100).toFixed(1)}%</div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-slate-500 mb-1">Max Drawdown</div>
                <div className="text-2xl font-bold text-red-400">{(portfolio.metrics.max_drawdown * 100).toFixed(1)}%</div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-slate-500 mb-1">VaR 95%</div>
                <div className="text-2xl font-bold text-orange-400">{(portfolio.metrics.var_95 * 100).toFixed(1)}%</div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-slate-500 mb-1">Probability of Loss</div>
                <div className="text-2xl font-bold text-red-400">{(portfolio.metrics.probability_of_loss * 100).toFixed(1)}%</div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-slate-500 mb-1">Beta</div>
                <div className="text-2xl font-bold text-white">{portfolio.metrics.beta.toFixed(2)}</div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-slate-500 mb-1">Sharpe Ratio</div>
                <div className="text-2xl font-bold text-quantis-accent">{portfolio.metrics.sharpe_ratio.toFixed(2)}</div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Risk Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Vol', value: portfolio.metrics.volatility * 100 },
                    { name: 'VaR', value: portfolio.metrics.var_95 * 100 },
                    { name: 'DD', value: portfolio.metrics.max_drawdown * 100 },
                  ]}>
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b' }} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* AI Debate Tab */}
        {activeTab === 'debate' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {portfolio.agent_logs.slice(0, 3).map((agent, i) => (
                <div key={i} className={`card p-5 border-l-4 ${
                  i === 0 ? 'border-orange-500' : i === 1 ? 'border-blue-500' : 'border-green-500'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-white">{agent.agent_name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      agent.confidence > 0.7 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {(agent.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{agent.reasoning}</p>
                  <div className="flex flex-wrap gap-1">
                    {agent.recommendations.slice(0, 3).map((rec, j) => (
                      <span key={j} className="text-xs px-2 py-0.5 bg-white/10 rounded text-slate-400">
                        {rec}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {portfolio.agent_logs.find(a => a.agent_name === 'Consensus Engine') && (
              <div className="card p-6 bg-quantis-accent/10 border-quantis-accent/30">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-quantis-accent" />
                  <h3 className="text-lg font-semibold text-white">Consensus Decision</h3>
                </div>
                <p className="text-slate-300">
                  {portfolio.agent_logs.find(a => a.agent_name === 'Consensus Engine')?.reasoning}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Simulation Tab */}
        {activeTab === 'simulation' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-4">
                <div className="text-sm text-slate-500 mb-1">5th Percentile</div>
                <div className="text-xl font-bold text-red-400">{formatINR(portfolio.monte_carlo.percentile_5)}</div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-slate-500 mb-1">Median</div>
                <div className="text-xl font-bold text-white">{formatINR(portfolio.monte_carlo.percentile_50)}</div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-slate-500 mb-1">95th Percentile</div>
                <div className="text-xl font-bold text-green-400">{formatINR(portfolio.monte_carlo.percentile_95)}</div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-slate-500 mb-1">Success Probability</div>
                <div className="text-xl font-bold text-quantis-accent">{(portfolio.monte_carlo.success_probability * 100).toFixed(0)}%</div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Monte Carlo Simulation (1000+ Paths)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={portfolio.monte_carlo.final_values.map((v, i) => ({ x: i, value: v }))}>
                    <XAxis dataKey="x" hide />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b' }}
                      formatter={(value: number) => [formatINR(value), 'Portfolio Value']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
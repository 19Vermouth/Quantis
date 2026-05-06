import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLiveMarket } from '../services/api';
import type { PortfolioResponse, LiveMarketResponse } from '../types';
import { Activity, ArrowRight, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#6366f1'];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [liveMarket, setLiveMarket] = useState<LiveMarketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'allocation' | 'monte-carlo' | 'agents'>('allocation');

  useEffect(() => {
    const saved = localStorage.getItem('quantis_portfolio');
    if (saved) {
      setPortfolio(JSON.parse(saved));
    } else {
      navigate('/portfolio');
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
          <p className="text-quantis-text-muted">Loading portfolio data...</p>
        </div>
      </div>
    );
  }

  const pieData = portfolio.allocation.map(a => ({
    name: a.ticker.split('.')[0],
    value: a.weight * 100,
    amount: a.amount,
  }));

  const monteCarloData = portfolio.monte_carlo.sample_paths.map((path, i) => ({
    path: `Sim ${i + 1}`,
    ...path.reduce((acc, val, j) => ({ ...acc, [`y${j}`]: val }), {}),
  }));

  const metricsData = [
    { metric: 'Expected Return', value: `${(portfolio.metrics.expected_return * 100).toFixed(2)}%` },
    { metric: 'Volatility', value: `${(portfolio.metrics.volatility * 100).toFixed(2)}%` },
    { metric: 'Sharpe Ratio', value: portfolio.metrics.sharpe_ratio.toFixed(2) },
    { metric: 'Max Drawdown', value: `${(portfolio.metrics.max_drawdown * 100).toFixed(2)}%` },
    { metric: 'Beta', value: portfolio.metrics.beta.toFixed(2) },
    { metric: 'VaR 95%', value: `${(portfolio.metrics.var_95 * 100).toFixed(2)}%` },
    { metric: 'Prob. of Loss', value: `${(portfolio.metrics.probability_of_loss * 100).toFixed(1)}%` },
  ];

  return (
    <div className="min-h-screen bg-quantis-bg">
      <nav className="border-b border-quantis-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-quantis-accent rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-quantis-text">Quantis</span>
              </Link>
              <span className="text-quantis-text-muted">/ Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/portfolio')}
                className="btn-secondary text-sm"
              >
                New Portfolio
              </button>
              <span className="text-quantis-text-muted text-sm">{user?.email}</span>
              <button onClick={logout} className="text-quantis-text-muted hover:text-quantis-text text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-quantis-text">Portfolio Allocation</h2>
                <div className="flex gap-2">
                  {(['allocation', 'monte-carlo', 'agents'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 text-xs rounded ${
                        activeTab === tab
                          ? 'bg-quantis-accent text-white'
                          : 'bg-quantis-border text-quantis-text-muted'
                      }`}
                    >
                      {tab === 'allocation' ? 'Allocation' : tab === 'monte-carlo' ? 'Monte Carlo' : 'Agents'}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === 'allocation' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b' }}
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Weight']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-quantis-text-muted border-b border-quantis-border">
                          <th className="text-left py-2">Asset</th>
                          <th className="text-right py-2">Weight</th>
                          <th className="text-right py-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolio.allocation.map((a, i) => (
                          <tr key={a.ticker} className="border-b border-quantis-border/50">
                            <td className="py-2">
                              <span className="mono text-quantis-text">{a.ticker.split('.')[0]}</span>
                            </td>
                            <td className="text-right text-quantis-text-muted">{(a.weight * 100).toFixed(1)}%</td>
                            <td className="text-right text-quantis-text">₹{a.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'monte-carlo' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-quantis-bg p-3 rounded">
                      <div className="text-xs text-quantis-text-muted">5th Percentile</div>
                      <div className="text-lg font-semibold text-quantis-text">₹{portfolio.monte_carlo.percentile_5.toLocaleString()}</div>
                    </div>
                    <div className="bg-quantis-bg p-3 rounded">
                      <div className="text-xs text-quantis-text-muted">Median</div>
                      <div className="text-lg font-semibold text-quantis-text">₹{portfolio.monte_carlo.percentile_50.toLocaleString()}</div>
                    </div>
                    <div className="bg-quantis-bg p-3 rounded">
                      <div className="text-xs text-quantis-text-muted">95th Percentile</div>
                      <div className="text-lg font-semibold text-quantis-text">₹{portfolio.monte_carlo.percentile_95.toLocaleString()}</div>
                    </div>
                    <div className="bg-quantis-bg p-3 rounded">
                      <div className="text-xs text-quantis-text-muted">Success Prob.</div>
                      <div className="text-lg font-semibold text-quantis-accent">{(portfolio.monte_carlo.success_probability * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={portfolio.monte_carlo.final_values.map((v, i) => ({ x: i, value: v }))}>
                        <XAxis dataKey="x" hide />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b' }}
                          formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Portfolio Value']}
                        />
                        <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeTab === 'agents' && (
                <div className="space-y-4">
                  {portfolio.agent_logs.map((agent, i) => (
                    <div key={i} className="bg-quantis-bg p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-quantis-text">{agent.agent_name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          agent.confidence > 0.7 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {(agent.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-quantis-text-muted mb-2">{agent.reasoning}</p>
                      {agent.recommendations.length > 0 && (
                        <ul className="text-xs text-quantis-text space-y-1">
                          {agent.recommendations.map((rec, j) => (
                            <li key={j} className="flex items-start gap-2">
                              <span className="text-quantis-accent">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-quantis-text mb-4">Explanation</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-quantis-text-muted mb-1">Summary</div>
                  <p className="text-quantis-text">{portfolio.explanation.summary}</p>
                </div>
                <div>
                  <div className="text-quantis-text-muted mb-1">Diversification</div>
                  <p className="text-quantis-text">{portfolio.explanation.diversification}</p>
                </div>
                <div>
                  <div className="text-quantis-text-muted mb-1">Risk Analysis</div>
                  <p className="text-quantis-text">{portfolio.explanation.risk_summary}</p>
                </div>
                <div>
                  <div className="text-quantis-text-muted mb-1">Methodology</div>
                  <p className="text-quantis-text">{portfolio.explanation.rationale}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-quantis-text mb-4">Risk Metrics</h2>
              <div className="space-y-3">
                {metricsData.map(m => (
                  <div key={m.metric} className="flex justify-between items-center py-2 border-b border-quantis-border/50">
                    <span className="text-quantis-text-muted text-sm">{m.metric}</span>
                    <span className={`font-medium mono ${
                      m.metric === 'Sharpe Ratio' && parseFloat(m.value) > 0.5 ? 'text-quantis-accent' :
                      m.metric === 'Max Drawdown' && parseFloat(m.value) > 0.2 ? 'text-red-400' :
                      'text-quantis-text'
                    }`}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-quantis-text mb-4">Live Market</h2>
              {liveMarket ? (
                <div className="space-y-2">
                  {liveMarket.quotes.slice(0, 5).map(q => (
                    <div key={q.symbol} className="flex justify-between items-center py-2 border-b border-quantis-border/30">
                      <div>
                        <div className="text-quantis-text text-sm font-medium">{q.symbol.split('.')[0]}</div>
                        <div className="text-quantis-text-muted text-xs">₹{q.last_price.toLocaleString()}</div>
                      </div>
                      <div className={`flex items-center gap-1 ${q.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {q.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="text-sm mono">{q.change >= 0 ? '+' : ''}{q.change_percent.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-quantis-text-muted text-sm">Loading market data...</p>
              )}
              <p className="text-xs text-quantis-text-muted mt-3">Updates every 30 seconds</p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-quantis-text">Last Updated</h2>
              </div>
              <p className="text-quantis-text-muted text-sm">
                {new Date(portfolio.timestamp).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
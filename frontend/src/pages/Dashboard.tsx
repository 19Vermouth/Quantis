import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLiveMarket } from '../services/api';
import type { PortfolioResponse, LiveMarketResponse } from '../types';
import { Activity, TrendingUp, TrendingDown, RefreshCw, Brain, Shield, Target, MessageSquare, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#6366f1'];

const AGENT_ICONS: Record<string, React.ReactNode> = {
  "Aggressive Agent": <Target className="w-5 h-5 text-orange-500" />,
  "Historical Agent": <Activity className="w-5 h-5 text-blue-500" />,
  "Risk Agent": <Shield className="w-5 h-5 text-green-500" />,
  "Consensus Engine": <CheckCircle className="w-5 h-5 text-quantis-accent" />,
  "Growth Agent": <Target className="w-5 h-5 text-orange-500" />,
  "Sentiment Agent": <MessageSquare className="w-5 h-5 text-purple-500" />,
};

const AGENT_COLORS: Record<string, string> = {
  "Aggressive Agent": "border-orange-500/50 bg-orange-500/10",
  "Historical Agent": "border-blue-500/50 bg-blue-500/10",
  "Risk Agent": "border-green-500/50 bg-green-500/10",
  "Consensus Engine": "border-quantis-accent/50 bg-quantis-accent/10",
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [liveMarket, setLiveMarket] = useState<LiveMarketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'allocation' | 'monte-carlo' | 'agents' | 'debate'>('allocation');

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
                  {(['allocation', 'monte-carlo', 'agents', 'debate'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 text-xs rounded ${
                        activeTab === tab
                          ? 'bg-quantis-accent text-white'
                          : 'bg-quantis-border text-quantis-text-muted'
                      }`}
                    >
                      {tab === 'allocation' ? 'Allocation' : tab === 'monte-carlo' ? 'Monte Carlo' : tab === 'agents' ? 'Agents' : 'Debate'}
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
                        {portfolio.allocation.map((a) => (
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
                      <div className="text-lg font-semibold text-red-400">₹{portfolio.monte_carlo.percentile_5.toLocaleString()}</div>
                    </div>
                    <div className="bg-quantis-bg p-3 rounded">
                      <div className="text-xs text-quantis-text-muted">25th Percentile</div>
                      <div className="text-lg font-semibold text-orange-400">₹{portfolio.monte_carlo.percentile_25.toLocaleString()}</div>
                    </div>
                    <div className="bg-quantis-bg p-3 rounded">
                      <div className="text-xs text-quantis-text-muted">Median</div>
                      <div className="text-lg font-semibold text-yellow-400">₹{portfolio.monte_carlo.percentile_50.toLocaleString()}</div>
                    </div>
                    <div className="bg-quantis-bg p-3 rounded">
                      <div className="text-xs text-quantis-text-muted">95th Percentile</div>
                      <div className="text-lg font-semibold text-green-400">₹{portfolio.monte_carlo.percentile_95.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={portfolio.monte_carlo.sample_paths[0]?.length 
                        ? Array.from({ length: portfolio.monte_carlo.sample_paths[0].length }, (_, idx) => {
                            const values = portfolio.monte_carlo.sample_paths.map(p => p[idx]).filter(v => v !== undefined);
                            const sorted = values.sort((a, b) => a - b);
                            return {
                              year: idx + 1,
                              p5: sorted[Math.floor(sorted.length * 0.05)] || 0,
                              p25: sorted[Math.floor(sorted.length * 0.25)] || 0,
                              p50: sorted[Math.floor(sorted.length * 0.50)] || 0,
                              p75: sorted[Math.floor(sorted.length * 0.75)] || 0,
                              p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
                              ...Object.fromEntries(portfolio.monte_carlo.sample_paths.slice(0, 15).map((p, i) => [`path${i}`, p[idx]]))
                            };
                          })
                        : portfolio.monte_carlo.final_values.map((v, i) => ({ year: i, value: v }))
                      }>
                        <XAxis 
                          dataKey="year" 
                          stroke="#6b7280"
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          label={{ value: 'Years', position: 'insideBottom', offset: -5, fill: '#6b7280' }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px' }}
                          formatter={(value: number, name: string) => {
                            if (name.startsWith('p')) {
                              const label = { p5: '5th', p25: '25th', p50: '50th', p75: '75th', p95: '95th' }[name] || name;
                              return [`₹${value.toLocaleString()}`, `${label} Percentile`];
                            }
                            return [`₹${value.toLocaleString()}`, `Path ${name.replace('path', '')}`];
                          }}
                          labelFormatter={(label) => `Year ${label}`}
                        />
                        
                        <Area type="monotone" dataKey="p95" stroke="none" fill="#10b981" fillOpacity={0.15} stackId={1} />
                        <Area type="monotone" dataKey="p75" stroke="none" fill="#10b981" fillOpacity={0.15} stackId={2} />
                        <Area type="monotone" dataKey="p50" stroke="none" fill="#10b981" fillOpacity={0.15} stackId={3} />
                        <Area type="monotone" dataKey="p25" stroke="none" fill="#10b981" fillOpacity={0.15} stackId={4} />
                        <Area type="monotone" dataKey="p5" stroke="none" fill="#111827" fillOpacity={0.5} stackId={5} />
                        
                        {portfolio.monte_carlo.sample_paths.slice(0, 15).map((_, idx) => (
                          <Line
                            key={idx}
                            type="monotone"
                            dataKey={`path${idx}`}
                            stroke={['#10b981', '#34d399', '#6ee7b7', '#3b82f6', '#60a5fa', '#60a5fa', '#f59e0b', '#fbbf24', '#fcd34d', '#ef4444', '#f87171', '#fca5a5', '#8b5cf6', '#a78bfa', '#c084fc'][idx % 15]}
                            strokeOpacity={0.4}
                            strokeWidth={1}
                            dot={false}
                          />
                        ))}
                        
                        <Line type="monotone" dataKey="p50" stroke="#fbbf24" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="p5" stroke="#ef4444" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="p95" stroke="#10b981" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-quantis-text-muted">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-0.5 bg-red-500" /> 5th Percentile (Worst)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-0.5 bg-yellow-400 border-dash" /> Median
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-0.5 bg-green-500" /> 95th Percentile (Best)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-1 bg-white/20" /> Simulation Paths
                    </span>
                  </div>
                  
                  <div className="mt-4 p-3 bg-quantis-bg rounded-lg border border-quantis-border">
                    <div className="text-xs text-quantis-text-muted mb-2">
                      Monte Carlo simulation showing {portfolio.monte_carlo.sample_paths.length} possible portfolio trajectories over time based on historical volatility. 
                      Shaded bands represent the 5th-95th percentile range of outcomes.
                    </div>
                    <div className="text-sm text-quantis-text">
                      <span className="text-quantis-accent font-medium">{portfolio.monte_carlo.success_probability > 0.5 ? '✓' : '✗'}</span> 
                      {' '}{(portfolio.monte_carlo.success_probability * 100).toFixed(0)}% probability of returning above initial investment
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'agents' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {portfolio.agent_logs.slice(0, 3).map((agent, i) => (
                      <div key={i} className={`p-4 rounded-lg border ${AGENT_COLORS[agent.agent_name] || 'border-quantis-border bg-quantis-bg'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          {AGENT_ICONS[agent.agent_name] || <Brain className="w-5 h-5" />}
                          <span className="font-medium text-quantis-text">{agent.agent_name}</span>
                        </div>
                        <div className="mb-2">
                          <div className="text-xs text-quantis-text-muted mb-1">Confidence</div>
                          <div className="h-2 bg-quantis-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-quantis-accent"
                              style={{ width: `${agent.confidence * 100}%` }}
                            />
                          </div>
                          <div className="text-right text-xs text-quantis-accent mt-1">{(agent.confidence * 100).toFixed(0)}%</div>
                        </div>
                        <p className="text-xs text-quantis-text-muted line-clamp-2">{agent.reasoning}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-quantis-bg p-4 rounded-lg border border-quantis-border">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-5 h-5 text-quantis-accent" />
                      <span className="font-medium text-quantis-text">Agent Debate</span>
                    </div>
                    <div className="space-y-2">
                      {portfolio.agent_logs.slice(0, 3).map((agent, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-quantis-border flex items-center justify-center text-xs font-bold text-quantis-text-muted">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-quantis-text">{agent.agent_name}:</span>
                            <span className="text-sm text-quantis-text-muted ml-1">{agent.reasoning}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {portfolio.agent_logs.find(a => a.agent_name === 'Consensus Engine') && (
                    <div className="bg-quantis-accent/10 p-4 rounded-lg border border-quantis-accent/30">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-quantis-accent" />
                        <span className="font-medium text-quantis-text">Final Consensus</span>
                      </div>
                      <p className="text-sm text-quantis-text">
                        {portfolio.agent_logs.find(a => a.agent_name === 'Consensus Engine')?.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'debate' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="card p-4 border-l-4 border-orange-500">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-5 h-5 text-orange-500" />
                        <h3 className="font-semibold text-quantis-text">Aggressive Agent</h3>
                      </div>
                      <p className="text-sm text-quantis-text-muted mb-3">
                        Focuses on maximizing returns through high-beta stocks and growth opportunities.
                      </p>
                      <div className="text-xs text-quantis-text-muted">
                        Key concern: Portfolio growth potential
                      </div>
                    </div>

                    <div className="card p-4 border-l-4 border-blue-500">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-5 h-5 text-blue-500" />
                        <h3 className="font-semibold text-quantis-text">Historical Agent</h3>
                      </div>
                      <p className="text-sm text-quantis-text-muted mb-3">
                        Evaluates assets based on historical drawdowns and market regime performance.
                      </p>
                      <div className="text-xs text-quantis-text-muted">
                        Key concern: Drawdown risk & resilience
                      </div>
                    </div>

                    <div className="card p-4 border-l-4 border-green-500">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-5 h-5 text-green-500" />
                        <h3 className="font-semibold text-quantis-text">Risk Agent</h3>
                      </div>
                      <p className="text-sm text-quantis-text-muted mb-3">
                        Enforces volatility, VaR, and diversification constraints.
                      </p>
                      <div className="text-xs text-quantis-text-muted">
                        Key concern: Risk limits & diversification
                      </div>
                    </div>
                  </div>

                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="w-5 h-5 text-quantis-accent" />
                      <h3 className="font-semibold text-quantis-text">Debate Summary</h3>
                    </div>
                    <div className="space-y-3">
                      {portfolio.agent_logs.slice(0, 3).map((agent, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-quantis-bg rounded-lg">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            i === 0 ? 'bg-orange-500/20' : i === 1 ? 'bg-blue-500/20' : 'bg-green-500/20'
                          }`}>
                            <span className={`text-sm font-bold ${
                              i === 0 ? 'text-orange-500' : i === 1 ? 'text-blue-500' : 'text-green-500'
                            }`}>{i + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-quantis-text">{agent.agent_name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                agent.confidence > 0.7 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {(agent.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                            <p className="text-sm text-quantis-text-muted">{agent.reasoning}</p>
                            {agent.recommendations.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {agent.recommendations.slice(0, 2).map((rec, j) => (
                                  <span key={j} className="text-xs px-2 py-0.5 bg-quantis-border rounded text-quantis-text-muted">
                                    {rec}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {portfolio.agent_logs.find(a => a.agent_name === 'Consensus Engine') && (
                    <div className="card p-4 bg-quantis-accent/10 border-quantis-accent/30">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-quantis-accent" />
                        <h3 className="font-semibold text-quantis-text">Consensus Decision</h3>
                      </div>
                      <p className="text-quantis-text">
                        {portfolio.agent_logs.find(a => a.agent_name === 'Consensus Engine')?.reasoning}
                      </p>
                      <div className="mt-3 text-sm text-quantis-text-muted">
                        The final allocation reflects weighted averaging of all agent recommendations, 
                        with adjustments for confidence scores and disagreement resolution.
                      </div>
                    </div>
                  )}
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
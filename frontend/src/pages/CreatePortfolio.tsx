import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { generatePortfolio } from '../services/api';
import type { PortfolioInput, RiskProfile, PortfolioResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { Activity, ArrowLeft, DollarSign, Clock, User, TrendingUp, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

export default function CreatePortfolio() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [portfolioName, setPortfolioName] = useState('');
  const [age, setAge] = useState(30);
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('moderate');
  const [investmentAmount, setInvestmentAmount] = useState(100000);
  const [horizonYears, setHorizonYears] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const input: PortfolioInput = {
        age,
        risk_profile: riskProfile,
        investment_amount: investmentAmount,
        horizon_years: horizonYears,
      };

      const response = await generatePortfolio(input);
      
      const portfolioCard = {
        id: Date.now().toString(),
        name: portfolioName || `Portfolio ${new Date().toLocaleDateString()}`,
        riskProfile: riskProfile,
        investmentAmount: investmentAmount,
        currentValue: investmentAmount,
        expectedValue: response.monte_carlo.percentile_50,
        createdAt: new Date().toISOString(),
        portfolio: response,
      };

      const saved = localStorage.getItem('quantis_portfolios');
      const portfolios = saved ? JSON.parse(saved) : [];
      portfolios.unshift(portfolioCard);
      localStorage.setItem('quantis_portfolios', JSON.stringify(portfolios));
      
      setStep(3);
      setTimeout(() => navigate('/workspace'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate portfolio');
    } finally {
      setLoading(false);
    }
  };

  const riskOptions = [
    { value: 'conservative', label: 'Conservative', desc: 'Capital preservation focus', icon: '🛡️' },
    { value: 'moderate', label: 'Moderate', desc: 'Balanced growth & risk', icon: '⚖️' },
    { value: 'aggressive', label: 'Aggressive', desc: 'Maximum growth potential', icon: '🚀' },
  ];

  return (
    <div className="min-h-screen bg-quantis-bg">
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link to="/workspace" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Workspace
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                step >= s 
                  ? 'bg-quantis-accent text-white' 
                  : 'bg-white/10 text-slate-500'
              }`}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-0.5 ${step > s ? 'bg-quantis-accent' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="card p-8">
            <h1 className="text-2xl font-bold text-white mb-2">Create New Portfolio</h1>
            <p className="text-slate-400 mb-8">Give your portfolio a name to get started</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Portfolio Name
                </label>
                <input
                  type="text"
                  value={portfolioName}
                  onChange={e => setPortfolioName(e.target.value)}
                  placeholder="e.g., Retirement Fund, Growth Portfolio"
                  className="input-field text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Your Age
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="18"
                    max="70"
                    value={age}
                    onChange={e => setAge(Number(e.target.value))}
                    className="flex-1"
                  />
                  <div className="w-16 text-center text-2xl font-bold text-white">{age}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-3">
                  Risk Profile
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {riskOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRiskProfile(opt.value as RiskProfile)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        riskProfile === opt.value
                          ? 'border-quantis-accent bg-quantis-accent/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="text-2xl mb-2">{opt.icon}</div>
                      <div className="font-medium text-white">{opt.label}</div>
                      <div className="text-xs text-slate-500 mt-1">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setStep(2)} className="btn-primary w-full py-3 text-lg">
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card p-8">
            <h1 className="text-2xl font-bold text-white mb-2">Investment Details</h1>
            <p className="text-slate-400 mb-8">Configure your investment parameters</p>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 mb-6">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            <div className="space-y-8">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-3">
                  Investment Amount (₹)
                </label>
                <input
                  type="number"
                  min="1000"
                  value={investmentAmount}
                  onChange={e => setInvestmentAmount(Number(e.target.value))}
                  className="input-field text-2xl font-bold text-center py-4"
                />
                <div className="flex justify-center gap-2 mt-3">
                  {[10000, 50000, 100000, 250000, 500000].map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setInvestmentAmount(amount)}
                      className={`px-3 py-1.5 text-sm rounded-lg border ${
                        investmentAmount === amount
                          ? 'border-quantis-accent text-quantis-accent'
                          : 'border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      ₹{amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-3">
                  Investment Horizon: <span className="text-quantis-accent">{horizonYears} years</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={horizonYears}
                  onChange={e => setHorizonYears(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>1 year</span>
                  <span>30 years</span>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="font-medium text-white mb-2">Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Portfolio Name</span>
                    <div className="text-white">{portfolioName || 'Unnamed'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Risk Profile</span>
                    <div className="text-white capitalize">{riskProfile}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Investment</span>
                    <div className="text-white">₹{investmentAmount.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Time Horizon</span>
                    <div className="text-white">{horizonYears} years</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">
                  Back
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5" />
                      Generate Portfolio
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 bg-quantis-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-quantis-accent" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Portfolio Created!</h2>
            <p className="text-slate-400 mb-4">Your portfolio has been generated with AI analysis</p>
            <p className="text-sm text-slate-500">Redirecting to workspace...</p>
          </div>
        )}
      </div>
    </div>
  );
}
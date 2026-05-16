import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { generatePortfolio, saveScenario } from '../services/api';
import type { PortfolioInput, RiskProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { Activity, ArrowLeft, DollarSign, Clock, User, TrendingUp, AlertCircle, Save } from 'lucide-react';
import PortfolioLoader from '../components/PortfolioLoader';

export default function PortfolioInput() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [age, setAge] = useState(30);
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('moderate');
  const [investmentAmount, setInvestmentAmount] = useState(100000);
  const [horizonYears, setHorizonYears] = useState(5);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const state = location.state as { age?: number; risk_profile?: string; investment_amount?: number; horizon_years?: number } | null;
    if (state) {
      if (state.age) setAge(state.age);
      if (state.risk_profile) setRiskProfile(state.risk_profile as RiskProfile);
      if (state.investment_amount) setInvestmentAmount(state.investment_amount);
      if (state.horizon_years) setHorizonYears(state.horizon_years);
    }
  }, [location.state]);

  const handleSaveScenario = async () => {
    setSaving(true);
    try {
      await saveScenario({
        name: `Scenario ${new Date().toLocaleDateString()}`,
        age,
        risk_profile: riskProfile,
        investment_amount: investmentAmount,
        horizon_years: horizonYears,
      });
      alert('Scenario saved!');
    } catch (e) {
      alert('Failed to save scenario');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const startTime = Date.now();

    try {
      const input: PortfolioInput = {
        age,
        risk_profile: riskProfile,
        investment_amount: investmentAmount,
        horizon_years: horizonYears,
      };

      const response = await generatePortfolio(input);
      
      localStorage.setItem('quantis_portfolio', JSON.stringify(response));
      
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, 6000 - elapsed);
      await new Promise(resolve => setTimeout(resolve, remainingDelay));
      
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate portfolio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-quantis-bg">
      <PortfolioLoader isLoading={loading} />
      <nav className="border-b border-quantis-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-quantis-accent rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-quantis-text">Quantis</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-quantis-text-muted text-sm">{user?.email}</span>
              <button onClick={logout} className="text-quantis-text-muted hover:text-quantis-text">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-quantis-text-muted hover:text-quantis-text mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className="text-3xl font-bold text-quantis-text mb-2">Build Your Portfolio</h1>
        <p className="text-quantis-text-muted mb-8">
          Enter your investment details and we'll construct an optimized portfolio using institutional-grade analytics.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-quantis-text mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-quantis-accent" />
              Profile
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-quantis-text-muted mb-2">
                  Your Age
                </label>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-quantis-text-muted mb-2">
                  Risk Profile
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['conservative', 'moderate', 'aggressive'] as RiskProfile[]).map(profile => (
                    <button
                      key={profile}
                      type="button"
                      onClick={() => setRiskProfile(profile)}
                      className={`p-3 rounded-lg border text-sm capitalize transition-all ${
                        riskProfile === profile
                          ? 'border-quantis-accent bg-quantis-accent/10 text-quantis-accent'
                          : 'border-quantis-border text-quantis-text-muted hover:border-quantis-text-muted'
                      }`}
                    >
                      {profile}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-quantis-text-muted mt-2">
                  {riskProfile === 'conservative' && 'Prioritize capital preservation with lower volatility'}
                  {riskProfile === 'moderate' && 'Balance between growth and risk management'}
                  {riskProfile === 'aggressive' && 'Maximize growth with higher risk tolerance'}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-quantis-text mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-quantis-accent" />
              Investment
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-quantis-text-muted mb-2">
                  Investment Amount (₹)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={investmentAmount}
                  onChange={e => setInvestmentAmount(Number(e.target.value))}
                  className="input-field"
                />
                <div className="flex gap-2 mt-2">
                  {[10000, 50000, 100000, 500000].map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setInvestmentAmount(amount)}
                      className={`px-3 py-1 text-xs rounded border ${
                        investmentAmount === amount
                          ? 'border-quantis-accent text-quantis-accent'
                          : 'border-quantis-border text-quantis-text-muted'
                      }`}
                    >
                      ₹{amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-quantis-text mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-quantis-accent" />
              Time Horizon
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-quantis-text-muted mb-2">
                Investment Horizon (Years)
              </label>
              <input
                type="range"
                min="1"
                max="30"
                value={horizonYears}
                onChange={e => setHorizonYears(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-quantis-text-muted mt-1">
                <span>1 year</span>
                <span className="text-quantis-accent font-medium">{horizonYears} years</span>
                <span>30 years</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSaveScenario}
              disabled={saving}
              className="btn-secondary flex-1 py-3 text-lg flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save as Scenario'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-[2] py-3 text-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Activity className="w-5 h-5 animate-spin" />
                  Generating...
                </span>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  Generate Portfolio
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
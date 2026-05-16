import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Shield, Brain, Activity, Sparkles } from 'lucide-react';

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-quantis-bg">
      <nav className="border-b border-quantis-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-quantis-accent rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-quantis-text">Quantis</span>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="text-quantis-text-muted hover:text-quantis-text transition-colors">
                    Login
                  </Link>
                  <Link to="/signup" className="btn-primary">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-quantis-accent/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-quantis-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-quantis-card border border-quantis-border rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-quantis-accent" />
              <span className="text-sm text-quantis-text-muted">AI-Powered Portfolio Intelligence</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-quantis-text mb-6 leading-tight">
              Institutional-Grade
              <br />
              <span className="text-quantis-accent">Portfolio Construction</span>
              <br />
              for Indian Investors
            </h1>
            <p className="text-xl text-quantis-text-muted max-w-2xl mx-auto mb-8">
              Deterministic portfolio optimization, Monte Carlo simulation, and 
              multi-agent reasoning for data-driven investment decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link to="/portfolio" className="btn-primary text-lg px-8 py-3">
                  Create Portfolio
                </Link>
              ) : (
                <Link to="/signup" className="btn-primary text-lg px-8 py-3">
                  Start Free
                </Link>
              )}
              <button className="btn-secondary text-lg px-8 py-3">
                View Documentation
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="card p-6 text-center hover:border-quantis-accent/50 transition-all">
              <div className="w-12 h-12 mx-auto mb-4 bg-quantis-accent/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-quantis-accent" />
              </div>
              <h3 className="text-lg font-semibold text-quantis-text mb-2">Optimization</h3>
              <p className="text-quantis-text-muted text-sm">
                Mean-variance optimization targeting maximum Sharpe ratio across NSE-listed assets
              </p>
            </div>
            <div className="card p-6 text-center hover:border-quantis-accent/50 transition-all">
              <div className="w-12 h-12 mx-auto mb-4 bg-quantis-accent/10 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-quantis-accent" />
              </div>
              <h3 className="text-lg font-semibold text-quantis-text mb-2">Risk Analytics</h3>
              <p className="text-quantis-text-muted text-sm">
                Real-time VaR, beta, max drawdown, and probability of loss calculations
              </p>
            </div>
            <div className="card p-6 text-center hover:border-quantis-accent/50 transition-all">
              <div className="w-12 h-12 mx-auto mb-4 bg-quantis-accent/10 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-quantis-accent" />
              </div>
              <h3 className="text-lg font-semibold text-quantis-text mb-2">Multi-Agent AI</h3>
              <p className="text-quantis-text-muted text-sm">
                Deterministic agents for growth, risk, and sentiment analysis
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 border-t border-quantis-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-quantis-text text-center mb-12">Architecture</h2>
          <div className="relative">
            <div className="flex flex-wrap justify-center gap-4">
              {['User Input', 'Market Data', 'Feature Engineering', 'Optimization', 'Risk Model', 'Monte Carlo', 'Agent Layer', 'Output'].map((step, i) => (
                <div key={step} className="flex items-center">
                  <div className="px-4 py-2 bg-quantis-card border border-quantis-border rounded-lg text-sm text-quantis-text-muted">
                    {step}
                  </div>
                  {i < 7 && <div className="w-8 h-px bg-quantis-border mx-2" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 border-t border-quantis-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-quantis-text text-center mb-12">Supported Assets</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {['NIFTYBEES', 'GOLDBEES', 'LIQUIDBEES', 'RELIANCE', 'INFY', 'TCS', 'HDFCBANK', 'ICICIBANK', 'TATAMOTORS'].map(ticker => (
              <div key={ticker} className="card p-3 text-center">
                <span className="mono text-quantis-text text-sm">{ticker}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 border-t border-quantis-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-quantis-text mb-4">Ready to Build Your Portfolio?</h2>
          <p className="text-quantis-text-muted mb-8">
            Join thousands of Indian investors using Quantis for data-driven portfolio construction.
          </p>
          {isAuthenticated ? (
            <Link to="/portfolio" className="btn-primary text-lg px-8 py-3">
              Create Portfolio
            </Link>
          ) : (
            <Link to="/signup" className="btn-primary text-lg px-8 py-3">
              Sign Up Free
            </Link>
          )}
        </div>
      </section>

      <footer className="py-8 px-4 border-t border-quantis-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-quantis-accent" />
            <span className="font-semibold text-quantis-text">Quantis</span>
          </div>
          <p className="text-quantis-text-muted text-sm">
            © 2026 Quantis. AI Portfolio Intelligence for India.
          </p>
        </div>
      </footer>
    </div>
  );
}
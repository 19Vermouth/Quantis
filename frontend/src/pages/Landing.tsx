import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Shield, Brain, Activity, Sparkles, ArrowRight, Zap, BarChart3, Users, Globe, Lock, CheckCircle, Star } from 'lucide-react';

const FEATURES = [
  { icon: <BarChart3 className="w-5 h-5" />, title: "Mean-Variance Optimization", desc: "Maximize risk-adjusted returns using PyPortfolioOpt" },
  { icon: <Shield className="w-5 h-5" />, title: "Institutional Risk Analytics", desc: "VaR, beta, Sharpe, max drawdown calculations" },
  { icon: <Brain className="w-5 h-5" />, title: "AI Debate Agents", desc: "Adversarial reasoning with Groq LLM inference" },
  { icon: <Zap className="w-5 h-5" />, title: "Monte Carlo Simulation", desc: "1000+ path scenario analysis" },
  { icon: <Globe className="w-5 h-5" />, title: "NSE Market Data", desc: "Real-time data from yfinance" },
  { icon: <Users className="w-5 h-5" />, title: "Multi-Agent Consensus", desc: "Aggressive, Historical, Risk agents debate" },
];

const STEPS = [
  "User Input", "Market Data", "Feature Engineering", "Optimization", "Risk Model", "Monte Carlo", "AI Debate", "Output"
];

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-quantis-bg">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-quantis-bg/80 backdrop-blur-xl border-b border-quantis-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-quantis-accent to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-quantis-accent/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Quantis</span>
            </Link>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link to="/workspace" className="btn-primary flex items-center gap-2">
                  Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Sign In</Link>
                  <Link to="/signup" className="btn-primary text-sm px-5 py-2">
                    Start Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-quantis-accent/5 via-transparent to-transparent" />
        <div className="absolute top-40 left-20 w-80 h-80 bg-quantis-accent/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-quantis-accent" />
              <span className="text-sm text-slate-300">AI-Powered Portfolio Intelligence</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
              Institutional-Grade
              <span className="block bg-gradient-to-r from-quantis-accent to-emerald-400 bg-clip-text text-transparent">
                Portfolio Construction
              </span>
              <span className="text-slate-400 text-3xl md:text-4xl mt-2">for Indian Investors</span>
            </h1>
            
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              Deterministic optimization, Monte Carlo simulation, and adversarial multi-agent AI 
              for data-driven investment decisions on NSE-listed assets.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isAuthenticated ? (
                <Link to="/workspace" className="btn-primary text-base px-8 py-3.5 flex items-center gap-2 group">
                  Go to Workspace
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link to="/signup" className="btn-primary text-base px-8 py-3.5 flex items-center gap-2 group">
                  Start Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              <a href="#features" className="btn-secondary text-base px-8 py-3.5">
                Explore Features
              </a>
            </div>
          </div>

          {/* Live Stats Bar */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 py-6 border-t border-b border-white/5">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">9+</div>
              <div className="text-xs text-slate-500">NSE Assets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">1000+</div>
              <div className="text-xs text-slate-500">MC Simulations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">3</div>
              <div className="text-xs text-slate-500">AI Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">7+</div>
              <div className="text-xs text-slate-500">Risk Metrics</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gradient-to-b from-transparent to-black/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Built for Modern Investors</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Everything you need to build institutional-grade portfolios</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature, i) => (
              <div key={i} className="group p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-quantis-accent/30 hover:bg-white/10 transition-all duration-300">
                <div className="w-11 h-11 bg-gradient-to-br from-quantis-accent/20 to-quantis-accent/5 rounded-xl flex items-center justify-center mb-4 text-quantis-accent group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Pipeline Architecture</h2>
            <p className="text-slate-400">Deterministic waterfall with adversarial debate layer</p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-2">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 hover:border-quantis-accent/50 hover:text-white transition-colors">
                  {step}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block w-6 h-px bg-gradient-to-r from-white/20 to-white/5 mx-1" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <div className="text-sm font-medium text-orange-400 mb-1">Aggressive Agent</div>
              <div className="text-xs text-slate-400">Maximizes growth, high-beta exposure</div>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="text-sm font-medium text-blue-400 mb-1">Historical Agent</div>
              <div className="text-xs text-slate-400">Evaluates drawdowns, regime performance</div>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <div className="text-sm font-medium text-green-400 mb-1">Risk Agent</div>
              <div className="text-xs text-slate-400">Enforces VaR, volatility constraints</div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Assets */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Supported NSE Assets</h2>
            <p className="text-slate-400 text-sm">Indices, ETFs, and Top NSE Stocks</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {['NIFTYBEES', 'GOLDBEES', 'LIQUIDBEES', 'RELIANCE', 'INFY', 'TCS', 'HDFCBANK', 'ICICIBANK', 'TATAMOTORS'].map(ticker => (
              <div key={ticker} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                <span className="mono text-sm text-slate-300">{ticker}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-quantis-accent/10 via-transparent to-transparent" />
        <div className="max-w-2xl mx-auto relative text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Build Your Portfolio?
          </h2>
          <p className="text-slate-400 mb-8">
            Join Indian investors using Quantis for institutional-grade portfolio construction.
          </p>
          {isAuthenticated ? (
            <Link to="/workspace" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
              Go to Workspace <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link to="/signup" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
              Start Free <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-quantis-accent to-emerald-400 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">Quantis</span>
          </div>
          <p className="text-slate-500 text-sm">
            © 2026 Quantis. AI Portfolio Intelligence for India.
          </p>
        </div>
      </footer>
    </div>
  );
}
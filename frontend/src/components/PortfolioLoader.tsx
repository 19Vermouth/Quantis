import { useState, useEffect } from 'react';
import { Brain, Target, Activity, Shield, CheckCircle, Loader2 } from 'lucide-react';

interface PortfolioLoaderProps {
  isLoading: boolean;
}

const STEPS = [
  { label: 'Fetching Market Data', desc: 'Collecting live NSE quotes...' },
  { label: 'Optimizing Portfolio', desc: 'Running mean-variance optimization...' },
  { label: 'Running Monte Carlo', desc: 'Simulating 1,000+ scenarios...' },
  { label: 'AI Agents Debating', desc: 'Orchestrating multi-agent debate...' },
];

const AGENTS = [
  { name: 'Aggressive Agent', icon: Target, color: 'text-orange-500' },
  { name: 'Historical Agent', icon: Activity, color: 'text-blue-500' },
  { name: 'Risk Agent', icon: Shield, color: 'text-green-500' },
];

export default function PortfolioLoader({ isLoading }: PortfolioLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [agentProgress, setAgentProgress] = useState(-1);

  useEffect(() => {
    if (!isLoading) return;

    setCurrentStep(0);
    setAgentProgress(-1);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= STEPS.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        
        if (prev === 2) {
          setAgentProgress(0);
          setTimeout(() => setAgentProgress(1), 400);
          setTimeout(() => setAgentProgress(2), 800);
        }
        
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(stepInterval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-quantis-bg/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="max-w-lg w-full mx-4 p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-quantis-accent rounded-xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-7 h-7 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-quantis-text">Building Your Portfolio</h2>
          <p className="text-sm text-quantis-text-muted mt-1">Analyzing markets for optimal allocation</p>
        </div>

        <div className="space-y-3">
          {STEPS.map((step, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                index < currentStep
                  ? 'bg-green-500/10 border-green-500/30'
                  : index === currentStep
                  ? 'bg-quantis-accent/10 border-quantis-accent/30'
                  : 'bg-quantis-bg border-transparent'
              }`}
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center">
                {index < currentStep ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : index === currentStep ? (
                  <Loader2 className="w-5 h-5 text-quantis-accent animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-quantis-border" />
                )}
              </div>
              <div className="flex-1">
                <div className={`text-sm ${index <= currentStep ? 'text-quantis-text' : 'text-quantis-text-muted'}`}>
                  {step.label}
                </div>
                {index === currentStep && (
                  <div className="text-xs text-quantis-accent">{step.desc}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-quantis-bg rounded-lg">
          <div className="text-xs text-quantis-text-muted mb-2">AI Agent Feed</div>
          <div className="space-y-1">
            {AGENTS.map((agent, index) => (
              <div key={agent.name} className="flex items-center gap-2 text-xs">
                <agent.icon className={`w-3 h-3 ${agentProgress >= index ? agent.color : 'text-quantis-text-muted'}`} />
                <span className={agentProgress >= index ? agent.color : 'text-quantis-text-muted'}>
                  {agent.name}
                  {agentProgress >= index ? ' - Analyzing...' : ' - Waiting'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
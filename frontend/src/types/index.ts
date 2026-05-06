export type RiskProfile = 'conservative' | 'moderate' | 'aggressive';

export interface PortfolioInput {
  age: number;
  risk_profile: RiskProfile;
  investment_amount: number;
  horizon_years: number;
  constraints?: Record<string, unknown>;
}

export interface AssetAllocation {
  ticker: string;
  name: string;
  weight: number;
  amount: number;
  asset_class: string;
}

export interface PortfolioMetrics {
  expected_return: number;
  volatility: number;
  sharpe_ratio: number;
  max_drawdown: number;
  beta: number;
  var_95: number;
  probability_of_loss: number;
  alpha?: number;
}

export interface MonteCarloResult {
  mean: number;
  std_dev: number;
  percentile_5: number;
  percentile_25: number;
  percentile_50: number;
  percentile_75: number;
  percentile_95: number;
  final_values: number[];
  sample_paths: number[][];
  success_probability: number;
}

export interface AgentLog {
  agent_name: string;
  reasoning: string;
  confidence: number;
  recommendations: string[];
}

export interface PortfolioExplanation {
  summary: string;
  diversification: string;
  risk_summary: string;
  rationale: string;
}

export interface PortfolioResponse {
  allocation: AssetAllocation[];
  metrics: PortfolioMetrics;
  monte_carlo: MonteCarloResult;
  agent_logs: AgentLog[];
  explanation: PortfolioExplanation;
  timestamp: string;
}

export interface LiveQuote {
  symbol: string;
  last_price: number;
  change: number;
  change_percent: number;
  volume: number;
  timestamp: string;
}

export interface LiveMarketResponse {
  quotes: LiveQuote[];
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}
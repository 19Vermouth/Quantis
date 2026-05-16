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

// Portfolio Management Types
export interface SavedPortfolio {
  id: number;
  name?: string;
  risk_profile: string;
  investment_amount: number;
  horizon_years: number;
  created_at: string;
  updated_at: string;
}

export interface PortfolioDetail extends SavedPortfolio {
  age: number;
  allocation: AssetAllocation[];
  metrics: PortfolioMetrics;
  monte_carlo: MonteCarloResult;
  agent_logs: AgentLog[];
  explanation: PortfolioExplanation;
}

export interface Scenario {
  id: number;
  name: string;
  age: number;
  risk_profile: string;
  investment_amount: number;
  horizon_years: number;
  result?: any;
  created_at: string;
}

export interface Watchlist {
  id: number;
  name: string;
  tickers: string[];
  created_at: string;
}

export interface Goal {
  id: number;
  name: string;
  target_amount: number;
  target_date: string;
  current_amount: number;
  portfolio_id?: number;
  created_at: string;
}

export interface Alert {
  id: number;
  name: string;
  alert_type: string;
  ticker?: string;
  threshold_value?: number;
  condition?: string;
  status: string;
  created_at: string;
  triggered_at?: string;
}

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

export interface QuestionnaireQuestion {
  id: number;
  question: string;
  options: { text: string; score: number }[];
}

export interface QuestionnaireResponse {
  score: number;
  risk_profile: string;
  message: string;
}

export interface RebalanceSuggestion {
  ticker: string;
  current_weight: number;
  action: string;
  reason: string;
}

export interface SuitabilityCheck {
  has_questionnaire: boolean;
  questionnaire_profile?: string;
  portfolio_profile?: string;
  is_mismatch: boolean;
  message: string;
}
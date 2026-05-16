import type { 
  PortfolioInput, 
  PortfolioResponse, 
  LiveMarketResponse,
  SavedPortfolio,
  PortfolioDetail,
  Scenario,
  Watchlist,
  Goal,
  Alert,
  AppNotification,
  QuestionnaireQuestion,
  QuestionnaireResponse,
  RebalanceSuggestion,
  SuitabilityCheck
} from '../types';

const API_BASE = '';

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

// Health
export async function checkHealth(): Promise<{ status: string; timestamp: string; version: string }> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
}

// Portfolio Generation
export async function generatePortfolio(input: PortfolioInput): Promise<PortfolioResponse> {
  const response = await fetch(`${API_BASE}/api/portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Portfolio generation failed');
  }
  
  return response.json();
}

// Live Market
export async function getLiveMarket(): Promise<LiveMarketResponse> {
  const response = await fetch(`${API_BASE}/api/live`);
  if (!response.ok) throw new Error('Failed to fetch live market');
  return response.json();
}

// Portfolio Management APIs
export async function listPortfolios(): Promise<SavedPortfolio[]> {
  const response = await fetch(`${API_BASE}/api/portfolios`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch portfolios');
  return response.json();
}

export async function getPortfolio(id: number): Promise<PortfolioDetail> {
  const response = await fetch(`${API_BASE}/api/portfolios/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch portfolio');
  return response.json();
}

export async function savePortfolio(data: {
  name?: string;
  age: number;
  risk_profile: string;
  investment_amount: number;
  horizon_years: number;
  allocation: any[];
  metrics: any;
  monte_carlo: any;
  agent_logs: any[];
  explanation: any;
}): Promise<{ id: number }> {
  const response = await fetch(`${API_BASE}/api/portfolios`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to save portfolio');
  return response.json();
}

export async function deletePortfolio(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/portfolios/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete portfolio');
}

// Scenarios
export async function listScenarios(): Promise<Scenario[]> {
  const response = await fetch(`${API_BASE}/api/scenarios`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch scenarios');
  return response.json();
}

export async function saveScenario(data: {
  name: string;
  age: number;
  risk_profile: string;
  investment_amount: number;
  horizon_years: number;
  result?: any;
}): Promise<{ id: number }> {
  const response = await fetch(`${API_BASE}/api/scenarios`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to save scenario');
  return response.json();
}

export async function deleteScenario(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/scenarios/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete scenario');
}

// Watchlists
export async function listWatchlists(): Promise<Watchlist[]> {
  const response = await fetch(`${API_BASE}/api/watchlists`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch watchlists');
  return response.json();
}

export async function createWatchlist(data: { name: string; tickers: string[] }): Promise<{ id: number }> {
  const response = await fetch(`${API_BASE}/api/watchlists`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create watchlist');
  return response.json();
}

export async function updateWatchlist(id: number, data: { name: string; tickers: string[] }): Promise<void> {
  const response = await fetch(`${API_BASE}/api/watchlists/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update watchlist');
}

export async function deleteWatchlist(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/watchlists/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete watchlist');
}

// Goals
export async function listGoals(): Promise<Goal[]> {
  const response = await fetch(`${API_BASE}/api/goals`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch goals');
  return response.json();
}

export async function createGoal(data: {
  name: string;
  target_amount: number;
  target_date: string;
  current_amount: number;
  portfolio_id?: number;
}): Promise<{ id: number }> {
  const response = await fetch(`${API_BASE}/api/goals`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create goal');
  return response.json();
}

export async function updateGoal(id: number, data: {
  name: string;
  target_amount: number;
  target_date: string;
  current_amount: number;
  portfolio_id?: number;
}): Promise<void> {
  const response = await fetch(`${API_BASE}/api/goals/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update goal');
}

export async function deleteGoal(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/goals/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete goal');
}

// Alerts
export async function listAlerts(): Promise<Alert[]> {
  const response = await fetch(`${API_BASE}/api/alerts`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch alerts');
  return response.json();
}

export async function createAlert(data: {
  name: string;
  alert_type: string;
  ticker?: string;
  threshold_value?: number;
  condition?: string;
}): Promise<{ id: number }> {
  const response = await fetch(`${API_BASE}/api/alerts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create alert');
  return response.json();
}

export async function updateAlert(id: number, data: {
  name: string;
  alert_type: string;
  ticker?: string;
  threshold_value?: number;
  condition?: string;
}): Promise<void> {
  const response = await fetch(`${API_BASE}/api/alerts/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update alert');
}

export async function deleteAlert(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/alerts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete alert');
}

// Notifications
export async function listNotifications(): Promise<AppNotification[]> {
  const response = await fetch(`${API_BASE}/api/notifications`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch notifications');
  return response.json();
}

export async function markNotificationRead(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to mark notification as read');
}

// Risk Questionnaire
export async function getQuestionnaire(): Promise<QuestionnaireQuestion[]> {
  const response = await fetch(`${API_BASE}/api/risk-questionnaire`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch questionnaire');
  return response.json();
}

export async function submitQuestionnaire(answers: Record<string, string>): Promise<QuestionnaireResponse> {
  const response = await fetch(`${API_BASE}/api/risk-questionnaire/submit`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ answers }),
  });
  if (!response.ok) throw new Error('Failed to submit questionnaire');
  return response.json();
}

// Suitability
export async function checkSuitability(portfolioId: number): Promise<SuitabilityCheck> {
  const response = await fetch(`${API_BASE}/api/suitability/${portfolioId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to check suitability');
  return response.json();
}

// Rebalancing
export async function getRebalanceSuggestions(portfolioId: number): Promise<{
  portfolio_id: number;
  drift_threshold: number;
  suggestions: RebalanceSuggestion[];
  needs_rebalancing: boolean;
}> {
  const response = await fetch(`${API_BASE}/api/portfolios/${portfolioId}/rebalance`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get rebalance suggestions');
  return response.json();
}

// PDF Export - generates a simple PDF using browser print
export async function exportPortfolioToPDF(portfolioId: number): Promise<void> {
  const portfolio = await getPortfolio(portfolioId);
  
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Portfolio Report - ${portfolio.name || 'Portfolio #' + portfolio.id}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { color: #1e293b; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
        h2 { color: #334155; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
        th { background: #f8fafc; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-label { color: #64748b; font-size: 14px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #1e293b; }
        .disclaimer { margin-top: 40px; padding: 20px; background: #f8fafc; font-size: 12px; color: #64748b; }
        .disclaimer h3 { margin-top: 0; color: #475569; }
      </style>
    </head>
    <body>
      <h1>Quantis Portfolio Report</h1>
      <p><strong>Generated:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
      <p><strong>Risk Profile:</strong> ${portfolio.risk_profile.toUpperCase()}</p>
      <p><strong>Investment Amount:</strong> ₹${portfolio.investment_amount.toLocaleString('en-IN')}</p>
      <p><strong>Horizon:</strong> ${portfolio.horizon_years} years</p>
      
      <h2>Asset Allocation</h2>
      <table>
        <tr><th>Ticker</th><th>Name</th><th>Weight</th><th>Amount</th><th>Asset Class</th></tr>
        ${portfolio.allocation.map(a => `
          <tr>
            <td>${a.ticker}</td>
            <td>${a.name}</td>
            <td>${(a.weight * 100).toFixed(2)}%</td>
            <td>₹${a.amount.toLocaleString('en-IN')}</td>
            <td>${a.asset_class}</td>
          </tr>
        `).join('')}
      </table>
      
      <h2>Risk Metrics</h2>
      <div>
        <div class="metric"><div class="metric-label">Expected Return</div><div class="metric-value">${(portfolio.metrics.expected_return * 100).toFixed(2)}%</div></div>
        <div class="metric"><div class="metric-label">Volatility</div><div class="metric-value">${(portfolio.metrics.volatility * 100).toFixed(2)}%</div></div>
        <div class="metric"><div class="metric-label">Sharpe Ratio</div><div class="metric-value">${portfolio.metrics.sharpe_ratio.toFixed(2)}</div></div>
        <div class="metric"><div class="metric-label">Max Drawdown</div><div class="metric-value">${(portfolio.metrics.max_drawdown * 100).toFixed(2)}%</div></div>
        <div class="metric"><div class="metric-label">Beta</div><div class="metric-value">${portfolio.metrics.beta.toFixed(2)}</div></div>
        <div class="metric"><div class="metric-label">VaR 95%</div><div class="metric-value">${(portfolio.metrics.var_95 * 100).toFixed(2)}%</div></div>
      </div>
      
      <h2>Monte Carlo Projection</h2>
      <div>
        <div class="metric"><div class="metric-label">5th Percentile</div><div class="metric-value">₹${portfolio.monte_carlo.percentile_5.toLocaleString('en-IN')}</div></div>
        <div class="metric"><div class="metric-label">50th Percentile (Median)</div><div class="metric-value">₹${portfolio.monte_carlo.percentile_50.toLocaleString('en-IN')}</div></div>
        <div class="metric"><div class="metric-label">95th Percentile</div><div class="metric-value">₹${portfolio.monte_carlo.percentile_95.toLocaleString('en-IN')}</div></div>
        <div class="metric"><div class="metric-label">Success Probability</div><div class="metric-value">${(portfolio.monte_carlo.success_probability * 100).toFixed(0)}%</div></div>
      </div>
      
      <h2>AI Analysis</h2>
      ${portfolio.agent_logs.map(agent => `
        <div style="margin: 10px 0; padding: 10px; background: #f8fafc; border-radius: 4px;">
          <strong>${agent.agent_name}</strong> (${(agent.confidence * 100).toFixed(0)}% confidence)
          <p>${agent.reasoning}</p>
        </div>
      `).join('')}
      
      <h2>Explanation</h2>
      <p><strong>Summary:</strong> ${portfolio.explanation.summary}</p>
      <p><strong>Diversification:</strong> ${portfolio.explanation.diversification}</p>
      <p><strong>Risk Analysis:</strong> ${portfolio.explanation.risk_summary}</p>
      <p><strong>Methodology:</strong> ${portfolio.explanation.rationale}</p>
      
      <div class="disclaimer">
        <h3>Disclaimer</h3>
        <p>This report is generated by Quantis AI Portfolio Intelligence Platform for informational purposes only. Past performance is not indicative of future results. Investment in securities market is subject to market risks. Please consult with a qualified financial advisor before making investment decisions.</p>
        <p>SEBI Disclaimer: Investment in securities market is subject to market risks. Please read all scheme related documents carefully before investing.</p>
      </div>
    </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  }
}
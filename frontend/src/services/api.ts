import type { PortfolioInput, PortfolioResponse, LiveMarketResponse } from '../types';

const API_BASE = '';

export async function checkHealth(): Promise<{ status: string; timestamp: string; version: string }> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
}

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

export async function getLiveMarket(): Promise<LiveMarketResponse> {
  const response = await fetch(`${API_BASE}/api/live`);
  if (!response.ok) throw new Error('Failed to fetch live market');
  return response.json();
}
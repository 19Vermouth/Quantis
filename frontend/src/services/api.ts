import type { PortfolioInput, PortfolioResponse, LiveMarketResponse, PortfolioCard, TokenResponse, User, WatchlistItem, PortfolioVersion, RiskProfile } from '../types';

const API_BASE = '';

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('quantis_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function checkHealth(): Promise<{ status: string; timestamp: string; version: string }> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
}

// Auth APIs
export async function login(email: string, password: string): Promise<TokenResponse> {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);
  
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(error.detail || 'Login failed');
  }
  
  const data = await response.json();
  localStorage.setItem('quantis_token', data.access_token);
  return data;
}

export async function register(name: string, email: string, password: string): Promise<User> {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Registration failed' }));
    throw new Error(error.detail || 'Registration failed');
  }
  
  return response.json();
}

export async function getCurrentUser(): Promise<User> {
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { ...getAuthHeader() },
  });
  
  if (!response.ok) throw new Error('Failed to get user');
  return response.json();
}

export function logout(): void {
  localStorage.removeItem('quantis_token');
}

// Portfolio APIs
export async function getPortfolios(): Promise<PortfolioCard[]> {
  const response = await fetch(`${API_BASE}/api/portfolios`, {
    headers: { ...getAuthHeader() },
  });
  
  if (!response.ok) throw new Error('Failed to fetch portfolios');
  return response.json();
}

export async function createPortfolio(name: string, input: PortfolioInput): Promise<{ id: number; name: string }> {
  const response = await fetch(`${API_BASE}/api/portfolios?name=${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader() 
    },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to create portfolio' }));
    throw new Error(error.detail || 'Failed to create portfolio');
  }
  
  return response.json();
}

export async function getPortfolio(id: number): Promise<PortfolioResponse> {
  const response = await fetch(`${API_BASE}/api/portfolios/${id}`, {
    headers: { ...getAuthHeader() },
  });
  
  if (!response.ok) throw new Error('Failed to fetch portfolio');
  return response.json();
}

export async function updatePortfolio(id: number): Promise<{ id: number; message: string }> {
  const response = await fetch(`${API_BASE}/api/portfolios/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeader() },
  });
  
  if (!response.ok) throw new Error('Failed to update portfolio');
  return response.json();
}

export async function deletePortfolio(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/portfolios/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  
  if (!response.ok) throw new Error('Failed to delete portfolio');
}

export async function getPortfolioVersions(id: number): Promise<PortfolioVersion[]> {
  const response = await fetch(`${API_BASE}/api/portfolios/${id}/versions`, {
    headers: { ...getAuthHeader() },
  });
  
  if (!response.ok) throw new Error('Failed to fetch versions');
  return response.json();
}

export async function getPortfolioVersion(id: number, versionNumber: number): Promise<PortfolioResponse> {
  const response = await fetch(`${API_BASE}/api/portfolios/${id}/versions/${versionNumber}`, {
    headers: { ...getAuthHeader() },
  });
  
  if (!response.ok) throw new Error('Failed to fetch version');
  return response.json();
}

// Watchlist APIs
export async function getWatchlist(): Promise<WatchlistItem[]> {
  const response = await fetch(`${API_BASE}/api/watchlist`, {
    headers: { ...getAuthHeader() },
  });
  
  if (!response.ok) throw new Error('Failed to fetch watchlist');
  return response.json();
}

export async function addToWatchlist(ticker: string): Promise<{ id: number; ticker: string }> {
  const response = await fetch(`${API_BASE}/api/watchlist`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader() 
    },
    body: JSON.stringify({ ticker }),
  });
  
  if (!response.ok) throw new Error('Failed to add to watchlist');
  return response.json();
}

export async function removeFromWatchlist(ticker: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/watchlist/${ticker}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  
  if (!response.ok) throw new Error('Failed to remove from watchlist');
}

// Legacy API
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
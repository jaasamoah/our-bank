import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export interface ApiUser {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface ApiAccount {
  id: number;
  account_number: string;
  account_type: string;
  balance: number;
  currency: string;
  created_at: string;
}

export interface ApiTransaction {
  id: number;
  account_id: number;
  amount: number;
  transaction_type: string;
  status: string;
  description: string;
  reference: string;
  created_at: string;
}

export interface InvestmentHolding {
  id: number;
  symbol: string;
  name: string;
  asset_class: string;
  units: number;
  average_cost: number;
  current_price: number;
  market_value: number;
  cost_basis: number;
  daily_change: number;
  total_return: number;
  allocation_percentage: number;
  currency: string;
  created_at: string;
}

export interface InvestmentPortfolio {
  summary: {
    total_value: number;
    total_cost: number;
    total_gain: number;
    gain_percentage: number;
    daily_change: number;
    currency: string;
  };
  holdings: InvestmentHolding[];
}

export interface ApiCard {
  id: number;
  account_id: number;
  holder_name: string;
  last_four: string;
  expiry: string;
  network: string;
  frozen: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
}

export async function loginRequest(username: string, password: string) {
  const form = new URLSearchParams();
  form.set('username', username);
  form.set('password', password);
  const response = await api.post<LoginResponse>('/api/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get<ApiUser>('/api/users/me');
  return response.data;
}

export async function getAccounts() {
  const response = await api.get<ApiAccount[]>('/api/accounts/');
  return response.data;
}

export async function getTransactions() {
  const response = await api.get<ApiTransaction[]>('/api/transactions/');
  return response.data;
}

export async function getInvestmentPortfolio() {
  const response = await api.get<InvestmentPortfolio>('/api/investments/portfolio');
  return response.data;
}

export async function getCards() {
  const response = await api.get<ApiCard[]>('/api/cards/');
  return response.data;
}

export async function updateCardFreeze(cardId: number, frozen: boolean) {
  const response = await api.patch<ApiCard>(`/api/cards/${cardId}/freeze`, null, {
    params: { frozen },
  });
  return response.data;
}

export async function sendTransfer(payload: {
  from_account_id: number;
  to_account_id?: number;
  payee_name?: string;
  amount: number;
  note?: string;
}) {
  const response = await api.post('/api/transactions/transfer', payload);
  return response.data as {
    message: string;
    amount: number;
    from_account_id: number;
    to_account_id?: number;
    transaction_ids: number[];
  };
}

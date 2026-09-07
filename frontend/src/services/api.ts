import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getCookie(name: string) {
  return document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=');
}

const csrfExemptPaths = new Set([
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/password-reset/request',
  '/api/auth/password-reset/confirm',
]);

// Authentication is cookie-based. Only the non-HttpOnly CSRF token is read by JS.
api.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method) && !csrfExemptPaths.has(config.url || '')) {
    let csrf = getCookie('csrf_token');
    if (!csrf) {
      await api.get('/api/security/csrf');
      csrf = getCookie('csrf_token');
    }
    if (csrf) {
      config.headers['X-CSRF-Token'] = csrf;
    }
  }
  return config;
});

let refreshPromise: Promise<void> | null = null;
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const url = original?.url || '';
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !url.includes('/api/auth/login') &&
      !url.includes('/api/auth/refresh') &&
      !url.includes('/api/auth/logout')
    ) {
      original._retry = true;
      refreshPromise ??= api.post('/api/auth/refresh', undefined, {
        headers: url.startsWith('/api/admin') ? { 'X-Client-Role': 'admin' } : undefined,
      }).then(() => undefined).finally(() => {
        refreshPromise = null;
      });
      await refreshPromise;
      return api(original);
    }
    return Promise.reject(error);
  },
);

export default api;

export interface ApiUser {
  id: number;
  email: string;
  username: string;
  full_name: string;
  address?: string | null;
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

export interface ApiAdminTransaction extends ApiTransaction {
  user_id: number;
  user_name: string;
  account_number: string;
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
  card_number?: string | null;
  expiry: string;
  cvc?: string | null;
  network: string;
  frozen: boolean;
  created_at: string;
}

export interface ApiPayee {
  id: number;
  name: string;
  bank: string;
  account_number: string;
  iban?: string | null;
  swift_code?: string | null;
  created_at: string;
}

export interface ApiComplaint {
  id: number;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface ApiSupportRequest extends ApiComplaint {
  user_id?: number | null;
  contact_name?: string | null;
  contact_email?: string | null;
}

export interface ApiAdminAccount {
  id: number;
  user_id: number;
  user_name: string;
  account_number: string;
  account_type: string;
  balance: number;
  currency: string;
  status: string;
}

export interface ApiLoan {
  id: number;
  amount: number;
  outstanding: number;
  interest_rate: number;
  term: string;
  status: string;
  disbursed_date?: string | null;
  description?: string | null;
  created_at: string;
}

export interface ApiAdminLoan extends ApiLoan {
  user_id: number;
  user_name: string;
}

export interface ApiBeneficiary {
  id: number;
  user_id: number;
  name: string;
  relationship?: string | null;
  bank?: string | null;
  account_number?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface LoginResponse {
  access_token?: string;
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

export async function adminLoginRequest(username: string, password: string) {
  const form = new URLSearchParams();
  form.set('username', username);
  form.set('password', password);
  const response = await api.post<LoginResponse>('/api/auth/login', form, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Client-Role': 'admin',
    },
  });
  return response.data;
}

export async function logoutRequest() {
  await api.post('/api/auth/logout');
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
  payee_id?: number;
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

export async function getPayees() {
  const response = await api.get<ApiPayee[]>('/api/payees/');
  return response.data;
}

export async function createPayee(payload: {
  name: string;
  bank: string;
  account_number: string;
  iban: string;
  swift_code: string;
  password: string;
}) {
  const response = await api.post<ApiPayee>('/api/payees/', payload);
  return response.data;
}

export async function deletePayee(payeeId: number, password: string) {
  await api.delete(`/api/payees/${payeeId}`, { data: { password } });
}

export async function requestPasswordReset(identifier: string) {
  const response = await api.post<{ message: string; reset_token?: string }>(
    '/api/auth/password-reset/request',
    { identifier },
  );
  return response.data;
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  const response = await api.post<{ message: string }>('/api/auth/password-reset/confirm', {
    token,
    new_password: newPassword,
  });
  return response.data;
}

export async function createComplaint(payload: { subject: string; message: string }) {
  const response = await api.post<ApiComplaint>('/api/support/', payload);
  return response.data;
}

export async function createPublicSupportRequest(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const response = await api.post<ApiSupportRequest>('/api/support/public', payload);
  return response.data;
}

export async function getAdminUser() {
  const response = await api.get<ApiUser>('/api/admin/me');
  return response.data;
}

export async function getAdminUsers() {
  const response = await api.get<Array<ApiUser & { total_balance: number }>>('/api/admin/users');
  return response.data;
}

export async function createAdminUser(payload: {
  email: string;
  username: string;
  full_name: string;
  address?: string;
  password: string;
}) {
  const response = await api.post<ApiUser & { total_balance: number }>('/api/admin/users', payload);
  return response.data;
}

export async function updateAdminUser(userId: number, payload: {
  email?: string;
  username?: string;
  full_name?: string;
  address?: string;
  is_active?: boolean;
  created_at?: string;
}) {
  const response = await api.patch<ApiUser & { total_balance: number }>(`/api/admin/users/${userId}`, payload);
  return response.data;
}

export async function deleteAdminUser(userId: number) {
  await api.delete(`/api/admin/users/${userId}`);
}

export async function getAdminAccounts() {
  const response = await api.get<ApiAdminAccount[]>('/api/admin/accounts');
  return response.data;
}

export async function getAdminTransactions() {
  const response = await api.get<ApiAdminTransaction[]>('/api/admin/transactions');
  return response.data;
}

export async function createAdminTransaction(payload: {
  user_id: number;
  account_id: number;
  merchant: string;
  category: string;
  amount: number;
  direction: 'debit' | 'credit';
  status: string;
  reference?: string;
  created_at?: string;
}) {
  const response = await api.post<ApiAdminTransaction>('/api/admin/transactions', payload);
  return response.data;
}

export async function updateAdminTransactionStatus(transactionId: number, status: string) {
  const response = await api.patch<ApiAdminTransaction>(
    `/api/admin/transactions/${transactionId}/status`,
    { status },
  );
  return response.data;
}

export async function updateAdminTransaction(transactionId: number, payload: {
  user_id?: number;
  account_id?: number;
  amount?: number;
  transaction_type?: string;
  status?: string;
  description?: string;
  reference?: string;
  created_at?: string;
}) {
  const response = await api.patch<ApiAdminTransaction>(
    `/api/admin/transactions/${transactionId}`,
    payload,
  );
  return response.data;
}

export async function deleteAdminTransaction(transactionId: number) {
  await api.delete(`/api/admin/transactions/${transactionId}`);
}

export async function updateAdminAccount(accountId: number, payload: { balance?: number; status?: string }) {
  const response = await api.patch<ApiAdminAccount>(`/api/admin/accounts/${accountId}`, payload);
  return response.data;
}

export async function getAdminCards() {
  const response = await api.get<ApiCard[]>('/api/admin/cards');
  return response.data;
}

export async function updateAdminCardFreeze(cardId: number, frozen: boolean) {
  const response = await api.patch<ApiCard>(`/api/admin/cards/${cardId}/freeze`, null, {
    params: { frozen },
  });
  return response.data;
}

export async function updateAdminCard(cardId: number, payload: {
  holder_name?: string;
  card_number?: string;
  expiry?: string;
  cvc?: string;
}) {
  const response = await api.patch<ApiCard>(`/api/admin/cards/${cardId}`, payload);
  return response.data;
}

export async function getLoans() {
  const response = await api.get<ApiLoan[]>('/api/loans/');
  return response.data;
}

export async function getAdminLoans() {
  const response = await api.get<ApiAdminLoan[]>('/api/admin/loans');
  return response.data;
}

export async function updateAdminLoan(loanId: number, payload: {
  amount?: number;
  outstanding?: number;
  interest_rate?: number;
  term?: string;
  status?: string;
  disbursed_date?: string;
  description?: string;
}) {
  const response = await api.patch<ApiAdminLoan>(`/api/admin/loans/${loanId}`, payload);
  return response.data;
}

export async function createAdminLoan(payload: {
  user_id: number;
  amount: number;
  outstanding: number;
  interest_rate: number;
  term: string;
  status: string;
  disbursed_date?: string;
  description?: string;
}) {
  const response = await api.post<ApiAdminLoan>('/api/admin/loans', payload);
  return response.data;
}

export async function deleteAdminLoan(loanId: number) {
  await api.delete(`/api/admin/loans/${loanId}`);
}

export async function getBeneficiaries() {
  const response = await api.get<ApiBeneficiary[]>('/api/beneficiaries/');
  return response.data;
}

export async function getAdminBeneficiaries(userId: number) {
  const response = await api.get<ApiBeneficiary[]>(`/api/admin/users/${userId}/beneficiaries`);
  return response.data;
}

export async function createAdminBeneficiary(userId: number, payload: {
  name: string;
  relationship?: string;
  bank?: string;
  account_number?: string;
  notes?: string;
  created_at?: string;
}) {
  const response = await api.post<ApiBeneficiary>(`/api/admin/users/${userId}/beneficiaries`, payload);
  return response.data;
}

export async function updateAdminBeneficiary(beneficiaryId: number, payload: {
  name: string;
  relationship?: string;
  bank?: string;
  account_number?: string;
  notes?: string;
  created_at?: string;
}) {
  const response = await api.patch<ApiBeneficiary>(`/api/admin/beneficiaries/${beneficiaryId}`, payload);
  return response.data;
}

export async function deleteAdminBeneficiary(beneficiaryId: number) {
  await api.delete(`/api/admin/beneficiaries/${beneficiaryId}`);
}

export async function getAdminComplaints() {
  const response = await api.get<ApiSupportRequest[]>('/api/admin/complaints');
  return response.data;
}

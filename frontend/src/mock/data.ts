export interface MockUser {
  id: string;
  fullName: string;
  email: string;
  username: string;
  memberSince: string;
  avatarInitials: string;
}

export interface MockAccount {
  id: string;
  name: string;
  type: 'Checking' | 'Savings' | 'Credit';
  number: string;
  balance: number;
  currency: string;
  color: string;
}

export interface MockTransaction {
  id: string;
  accountId: string;
  merchant: string;
  category: string;
  date: string;
  amount: number;
  status: 'Completed' | 'Processing' | 'Pending' | 'Failed' | 'Reversed' | 'On hold';
  reference?: string;
  transactionType?: string;
  type?: 'Debit' | 'Credit';
}

export interface MockCard {
  id: string;
  accountId: string;
  holder: string;
  number: string;
  expiry: string;
  network: 'Visa' | 'Mastercard';
  frozen: boolean;
  gradient: string;
}

export interface MockPayee {
  id: string;
  name: string;
  bank: string;
  accountNumber: string;
  initials: string;
}

export const mockUser: MockUser = {
  id: 'usr_1',
  fullName: 'Jordan Ellis',
  email: 'jordan.ellis@example.com',
  username: 'demo',
  memberSince: 'March 2021',
  avatarInitials: 'JE',
};

export const mockAccounts: MockAccount[] = [
  {
    id: 'acc_checking',
    name: 'Everyday Checking',
    type: 'Checking',
    number: '**** 4821',
    balance: 8542.13,
    currency: 'USD',
    color: 'from-brand-600 to-brand-800',
  },
  {
    id: 'acc_savings',
    name: 'High-Yield Savings',
    type: 'Savings',
    number: '**** 7734',
    balance: 24310.87,
    currency: 'USD',
    color: 'from-blue-500 to-brand-700',
  },
  {
    id: 'acc_credit',
    name: 'telosbank Rewards Card',
    type: 'Credit',
    number: '**** 1092',
    balance: -1284.5,
    currency: 'USD',
    color: 'from-slate-700 to-slate-900',
  },
];

export const mockTransactions: MockTransaction[] = [
  { id: 'txn_1', accountId: 'acc_checking', merchant: 'Whole Foods Market', category: 'Groceries', date: '2026-07-09', amount: -84.21, status: 'Completed' },
  { id: 'txn_2', accountId: 'acc_checking', merchant: 'Payroll Deposit', category: 'Income', date: '2026-07-08', amount: 3200.0, status: 'Completed' },
  { id: 'txn_3', accountId: 'acc_credit', merchant: 'Delta Airlines', category: 'Travel', date: '2026-07-08', amount: -412.9, status: 'Completed' },
  { id: 'txn_4', accountId: 'acc_checking', merchant: 'Netflix', category: 'Entertainment', date: '2026-07-07', amount: -15.99, status: 'Completed' },
  { id: 'txn_5', accountId: 'acc_savings', merchant: 'Interest Payment', category: 'Interest', date: '2026-07-06', amount: 42.18, status: 'Completed' },
  { id: 'txn_6', accountId: 'acc_checking', merchant: 'Shell Gas Station', category: 'Transport', date: '2026-07-06', amount: -52.4, status: 'Completed' },
  { id: 'txn_7', accountId: 'acc_credit', merchant: 'Amazon', category: 'Shopping', date: '2026-07-05', amount: -128.55, status: 'Pending' },
  { id: 'txn_8', accountId: 'acc_checking', merchant: 'Electric Co.', category: 'Utilities', date: '2026-07-04', amount: -96.3, status: 'Completed' },
  { id: 'txn_9', accountId: 'acc_savings', merchant: 'Transfer from Checking', category: 'Transfer', date: '2026-07-03', amount: 500.0, status: 'Completed' },
  { id: 'txn_10', accountId: 'acc_checking', merchant: 'Blue Bottle Coffee', category: 'Dining', date: '2026-07-03', amount: -6.75, status: 'Completed' },
  { id: 'txn_11', accountId: 'acc_credit', merchant: 'Gym Membership', category: 'Health', date: '2026-07-02', amount: -49.99, status: 'Completed' },
  { id: 'txn_12', accountId: 'acc_checking', merchant: 'Rent Payment', category: 'Housing', date: '2026-07-01', amount: -1850.0, status: 'Completed' },
];

export const mockCards: MockCard[] = [
  {
    id: 'card_1',
    accountId: 'acc_checking',
    holder: 'Jordan Ellis',
    number: '4821 •••• •••• 4821',
    expiry: '09/28',
    network: 'Visa',
    frozen: false,
    gradient: 'from-brand-700 via-brand-800 to-slate-900',
  },
  {
    id: 'card_2',
    accountId: 'acc_credit',
    holder: 'Jordan Ellis',
    number: '1092 •••• •••• 1092',
    expiry: '02/27',
    network: 'Mastercard',
    frozen: true,
    gradient: 'from-slate-700 via-slate-800 to-slate-950',
  },
];

export const mockPayees: MockPayee[] = [
  { id: 'payee_1', name: 'Maria Chen', bank: 'Chase Bank', accountNumber: '**** 2291', initials: 'MC' },
  { id: 'payee_2', name: 'Sam Patel', bank: 'Bank of America', accountNumber: '**** 8823', initials: 'SP' },
  { id: 'payee_3', name: 'Riverside Landlord LLC', bank: 'Wells Fargo', accountNumber: '**** 0071', initials: 'RL' },
];

export const spendingByCategory = [
  { category: 'Housing', amount: 1850, color: 'bg-brand-700' },
  { category: 'Groceries', amount: 412, color: 'bg-brand-500' },
  { category: 'Travel', amount: 412.9, color: 'bg-brand-400' },
  { category: 'Utilities', amount: 96.3, color: 'bg-brand-300' },
  { category: 'Entertainment', amount: 65.98, color: 'bg-brand-200' },
];

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

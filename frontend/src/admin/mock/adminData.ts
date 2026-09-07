export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: 'superadmin' | 'admin' | 'support';
  avatarInitials: string;
}

export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  username: string;
  status: 'Active' | 'Suspended' | 'Pending';
  kycStatus: 'Verified' | 'Pending' | 'Rejected' | 'Not Started';
  joinedDate: string;
  totalBalance: number;
}

export interface ManagedAccount {
  id: string;
  userId: string;
  userName: string;
  type: 'Checking' | 'Savings' | 'Credit' | 'Loan' | 'Investment';
  number: string;
  balance: number;
  currency: string;
  status: 'Active' | 'Frozen' | 'Closed';
}

export interface ManagedTransaction {
  id: string;
  userId: string;
  userName: string;
  accountId: string;
  merchant: string;
  category: string;
  date: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed' | 'Reversed';
  type: 'Debit' | 'Credit';
}

export interface ManagedCard {
  id: string;
  userId: string;
  userName: string;
  accountId: string;
  number: string;
  expiry: string;
  network: 'Visa' | 'Mastercard';
  status: 'Active' | 'Frozen' | 'Cancelled';
  type: 'Debit' | 'Credit';
}

export interface ManagedLoan {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  outstanding: number;
  interestRate: number;
  term: string;
  status: 'Active' | 'Pending' | 'Paid' | 'Defaulted';
  disbursedDate: string;
  description?: string;
}

export interface KYCRecord {
  id: string;
  userId: string;
  userName: string;
  email: string;
  submittedDate: string;
  documentType: string;
  status: 'Pending' | 'Verified' | 'Rejected';
}

export interface FXRate {
  id: string;
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  adminName: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
  severity: 'Info' | 'Warning' | 'Critical';
}

export interface AdminNotification {
  id: string;
  userId: string;
  userName: string;
  title: string;
  message: string;
  type: 'Info' | 'Alert' | 'Promo' | 'Security';
  sent: boolean;
  sentAt: string;
}

export const adminUser: AdminUser = {
  id: 'adm_1',
  fullName: 'Alex Rivera',
  email: 'admin@telosbank.com',
  username: 'admin',
  role: 'superadmin',
  avatarInitials: 'AR',
};

export const managedUsers: ManagedUser[] = [
  { id: 'usr_1', fullName: 'Jordan Ellis', email: 'jordan.ellis@example.com', username: 'demo', status: 'Active', kycStatus: 'Verified', joinedDate: '2021-03-12', totalBalance: 31568.00 },
  { id: 'usr_2', fullName: 'Maria Chen', email: 'maria.chen@example.com', username: 'mchen', status: 'Active', kycStatus: 'Verified', joinedDate: '2022-06-28', totalBalance: 14290.55 },
  { id: 'usr_3', fullName: 'Sam Patel', email: 'sam.patel@example.com', username: 'spatel', status: 'Suspended', kycStatus: 'Pending', joinedDate: '2023-01-05', totalBalance: 3820.10 },
  { id: 'usr_4', fullName: 'Taylor Nguyen', email: 'taylor.ng@example.com', username: 'tnguyen', status: 'Active', kycStatus: 'Verified', joinedDate: '2022-11-14', totalBalance: 58200.00 },
  { id: 'usr_5', fullName: 'Casey Kim', email: 'casey.kim@example.com', username: 'ckim', status: 'Pending', kycStatus: 'Not Started', joinedDate: '2026-07-01', totalBalance: 500.00 },
  { id: 'usr_6', fullName: 'Morgan Blake', email: 'morgan.b@example.com', username: 'mblake', status: 'Active', kycStatus: 'Rejected', joinedDate: '2023-09-20', totalBalance: 9100.75 },
];

export const managedAccounts: ManagedAccount[] = [
  { id: 'acc_1', userId: 'usr_1', userName: 'Jordan Ellis', type: 'Checking', number: '**** 4821', balance: 8542.13, currency: 'USD', status: 'Active' },
  { id: 'acc_2', userId: 'usr_1', userName: 'Jordan Ellis', type: 'Savings', number: '**** 7734', balance: 24310.87, currency: 'USD', status: 'Active' },
  { id: 'acc_3', userId: 'usr_2', userName: 'Maria Chen', type: 'Checking', number: '**** 2291', balance: 6700.00, currency: 'USD', status: 'Active' },
  { id: 'acc_4', userId: 'usr_3', userName: 'Sam Patel', type: 'Savings', number: '**** 8823', balance: 3820.10, currency: 'USD', status: 'Frozen' },
  { id: 'acc_5', userId: 'usr_4', userName: 'Taylor Nguyen', type: 'Investment', number: '**** 0091', balance: 48200.00, currency: 'USD', status: 'Active' },
  { id: 'acc_6', userId: 'usr_4', userName: 'Taylor Nguyen', type: 'Savings', number: '**** 5522', balance: 10000.00, currency: 'USD', status: 'Active' },
  { id: 'acc_7', userId: 'usr_5', userName: 'Casey Kim', type: 'Checking', number: '**** 3310', balance: 500.00, currency: 'USD', status: 'Active' },
  { id: 'acc_8', userId: 'usr_6', userName: 'Morgan Blake', type: 'Credit', number: '**** 9944', balance: -2300.00, currency: 'USD', status: 'Active' },
];

export const managedTransactions: ManagedTransaction[] = [
  { id: 'txn_a1', userId: 'usr_1', userName: 'Jordan Ellis', accountId: 'acc_1', merchant: 'Whole Foods Market', category: 'Groceries', date: '2026-07-09', amount: -84.21, status: 'Completed', type: 'Debit' },
  { id: 'txn_a2', userId: 'usr_1', userName: 'Jordan Ellis', accountId: 'acc_1', merchant: 'Payroll Deposit', category: 'Income', date: '2026-07-08', amount: 3200.00, status: 'Completed', type: 'Credit' },
  { id: 'txn_a3', userId: 'usr_2', userName: 'Maria Chen', accountId: 'acc_3', merchant: 'Apple Store', category: 'Shopping', date: '2026-07-08', amount: -999.00, status: 'Pending', type: 'Debit' },
  { id: 'txn_a4', userId: 'usr_3', userName: 'Sam Patel', accountId: 'acc_4', merchant: 'Wire Transfer', category: 'Transfer', date: '2026-07-07', amount: -5000.00, status: 'Failed', type: 'Debit' },
  { id: 'txn_a5', userId: 'usr_4', userName: 'Taylor Nguyen', accountId: 'acc_5', merchant: 'Dividend Credit', category: 'Investment', date: '2026-07-07', amount: 812.45, status: 'Completed', type: 'Credit' },
  { id: 'txn_a6', userId: 'usr_6', userName: 'Morgan Blake', accountId: 'acc_8', merchant: 'Restaurant Charge', category: 'Dining', date: '2026-07-06', amount: -128.00, status: 'Reversed', type: 'Debit' },
  { id: 'txn_a7', userId: 'usr_2', userName: 'Maria Chen', accountId: 'acc_3', merchant: 'Salary Deposit', category: 'Income', date: '2026-07-05', amount: 5200.00, status: 'Completed', type: 'Credit' },
  { id: 'txn_a8', userId: 'usr_1', userName: 'Jordan Ellis', accountId: 'acc_2', merchant: 'Interest Payment', category: 'Interest', date: '2026-07-06', amount: 42.18, status: 'Completed', type: 'Credit' },
];

export const managedCards: ManagedCard[] = [
  { id: 'card_a1', userId: 'usr_1', userName: 'Jordan Ellis', accountId: 'acc_1', number: '**** 4821', expiry: '09/28', network: 'Visa', status: 'Active', type: 'Debit' },
  { id: 'card_a2', userId: 'usr_1', userName: 'Jordan Ellis', accountId: 'acc_2', number: '**** 1092', expiry: '02/27', network: 'Mastercard', status: 'Frozen', type: 'Credit' },
  { id: 'card_a3', userId: 'usr_2', userName: 'Maria Chen', accountId: 'acc_3', number: '**** 2291', expiry: '11/26', network: 'Visa', status: 'Active', type: 'Debit' },
  { id: 'card_a4', userId: 'usr_3', userName: 'Sam Patel', accountId: 'acc_4', number: '**** 8823', expiry: '04/26', network: 'Mastercard', status: 'Cancelled', type: 'Debit' },
  { id: 'card_a5', userId: 'usr_4', userName: 'Taylor Nguyen', accountId: 'acc_6', number: '**** 5522', expiry: '08/29', network: 'Visa', status: 'Active', type: 'Credit' },
];

export const managedLoans: ManagedLoan[] = [
  { id: 'loan_1', userId: 'usr_1', userName: 'Jordan Ellis', amount: 15000, outstanding: 11200, interestRate: 6.5, term: '5 years', status: 'Active', disbursedDate: '2023-02-01' },
  { id: 'loan_2', userId: 'usr_2', userName: 'Maria Chen', amount: 25000, outstanding: 0, interestRate: 7.2, term: '3 years', status: 'Paid', disbursedDate: '2021-08-15' },
  { id: 'loan_3', userId: 'usr_4', userName: 'Taylor Nguyen', amount: 50000, outstanding: 42300, interestRate: 5.9, term: '10 years', status: 'Active', disbursedDate: '2024-01-10' },
  { id: 'loan_4', userId: 'usr_6', userName: 'Morgan Blake', amount: 8000, outstanding: 8000, interestRate: 9.1, term: '2 years', status: 'Pending', disbursedDate: '2026-07-01' },
  { id: 'loan_5', userId: 'usr_3', userName: 'Sam Patel', amount: 12000, outstanding: 12000, interestRate: 8.4, term: '3 years', status: 'Defaulted', disbursedDate: '2022-05-20' },
];

export const kycRecords: KYCRecord[] = [
  { id: 'kyc_1', userId: 'usr_1', userName: 'Jordan Ellis', email: 'jordan.ellis@example.com', submittedDate: '2021-03-15', documentType: 'Passport', status: 'Verified' },
  { id: 'kyc_2', userId: 'usr_2', userName: 'Maria Chen', email: 'maria.chen@example.com', submittedDate: '2022-06-30', documentType: 'Driver\'s License', status: 'Verified' },
  { id: 'kyc_3', userId: 'usr_3', userName: 'Sam Patel', email: 'sam.patel@example.com', submittedDate: '2023-01-10', documentType: 'National ID', status: 'Pending' },
  { id: 'kyc_4', userId: 'usr_4', userName: 'Taylor Nguyen', email: 'taylor.ng@example.com', submittedDate: '2022-11-20', documentType: 'Passport', status: 'Verified' },
  { id: 'kyc_5', userId: 'usr_6', userName: 'Morgan Blake', email: 'morgan.b@example.com', submittedDate: '2023-09-25', documentType: 'Driver\'s License', status: 'Rejected' },
];

export const fxRates: FXRate[] = [
  { id: 'fx_1', baseCurrency: 'USD', targetCurrency: 'EUR', rate: 0.9231, updatedAt: '2026-07-15T08:00:00Z' },
  { id: 'fx_2', baseCurrency: 'USD', targetCurrency: 'GBP', rate: 0.7893, updatedAt: '2026-07-15T08:00:00Z' },
  { id: 'fx_3', baseCurrency: 'USD', targetCurrency: 'JPY', rate: 149.85, updatedAt: '2026-07-15T08:00:00Z' },
  { id: 'fx_4', baseCurrency: 'USD', targetCurrency: 'CAD', rate: 1.3612, updatedAt: '2026-07-15T08:00:00Z' },
  { id: 'fx_5', baseCurrency: 'USD', targetCurrency: 'AUD', rate: 1.5021, updatedAt: '2026-07-15T08:00:00Z' },
  { id: 'fx_6', baseCurrency: 'USD', targetCurrency: 'CHF', rate: 0.8944, updatedAt: '2026-07-15T08:00:00Z' },
  { id: 'fx_7', baseCurrency: 'USD', targetCurrency: 'CNY', rate: 7.2433, updatedAt: '2026-07-15T08:00:00Z' },
  { id: 'fx_8', baseCurrency: 'USD', targetCurrency: 'SGD', rate: 1.3388, updatedAt: '2026-07-15T08:00:00Z' },
];

export const auditLogs: AuditLog[] = [
  { id: 'log_1', adminName: 'Alex Rivera', action: 'Balance Edited', target: 'Jordan Ellis (acc_1)', details: 'Changed balance from $8,000 to $8,542.13', timestamp: '2026-07-15T10:30:00Z', severity: 'Warning' },
  { id: 'log_2', adminName: 'Alex Rivera', action: 'User Suspended', target: 'Sam Patel (usr_3)', details: 'Account suspended due to suspicious activity', timestamp: '2026-07-14T14:22:00Z', severity: 'Critical' },
  { id: 'log_3', adminName: 'Alex Rivera', action: 'Transaction Status Changed', target: 'txn_a6', details: 'Status changed from Completed to Reversed', timestamp: '2026-07-14T09:15:00Z', severity: 'Warning' },
  { id: 'log_4', adminName: 'Alex Rivera', action: 'KYC Approved', target: 'Jordan Ellis (kyc_1)', details: 'KYC documents verified and approved', timestamp: '2026-07-13T16:45:00Z', severity: 'Info' },
  { id: 'log_5', adminName: 'Alex Rivera', action: 'FX Rate Updated', target: 'USD/EUR', details: 'Rate updated from 0.9115 to 0.9231', timestamp: '2026-07-13T08:00:00Z', severity: 'Info' },
  { id: 'log_6', adminName: 'Alex Rivera', action: 'Card Frozen', target: 'Jordan Ellis (**** 1092)', details: 'Credit card frozen at admin request', timestamp: '2026-07-12T11:10:00Z', severity: 'Warning' },
  { id: 'log_7', adminName: 'Alex Rivera', action: 'New User Created', target: 'Casey Kim (usr_5)', details: 'Admin-created user account', timestamp: '2026-07-12T09:05:00Z', severity: 'Info' },
  { id: 'log_8', adminName: 'Alex Rivera', action: 'KYC Rejected', target: 'Morgan Blake (kyc_5)', details: 'Documents rejected: image quality too low', timestamp: '2026-07-11T15:30:00Z', severity: 'Warning' },
];

export const adminNotifications: AdminNotification[] = [
  { id: 'notif_1', userId: 'usr_1', userName: 'Jordan Ellis', title: 'Security Alert', message: 'A new device signed into your account.', type: 'Security', sent: true, sentAt: '2026-07-14T09:00:00Z' },
  { id: 'notif_2', userId: 'usr_2', userName: 'Maria Chen', title: 'Transaction Reversed', message: 'Your transaction of $128 has been reversed.', type: 'Alert', sent: true, sentAt: '2026-07-14T09:15:00Z' },
  { id: 'notif_3', userId: 'all', userName: 'All Users', title: 'Scheduled Maintenance', message: 'The system will be down for maintenance on July 20 from 2 to 4 AM.', type: 'Info', sent: false, sentAt: '' },
  { id: 'notif_4', userId: 'usr_5', userName: 'Casey Kim', title: 'Complete Your KYC', message: 'Please submit your identity documents to unlock all features.', type: 'Alert', sent: true, sentAt: '2026-07-12T10:00:00Z' },
];

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

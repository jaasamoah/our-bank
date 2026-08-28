import type { MockAccount, MockTransaction } from '../mock/data';
import type { ApiAccount, ApiTransaction } from './api';

const accountColors: Record<string, string> = {
  checking: 'from-brand-600 to-brand-800',
  savings: 'from-blue-500 to-brand-700',
  credit: 'from-slate-700 to-slate-900',
};

export function mapAccount(account: ApiAccount): MockAccount {
  const type = account.account_type.toLowerCase();
  return {
    id: String(account.id),
    name: account.account_type === 'checking'
      ? 'Everyday Checking'
      : account.account_type === 'savings'
        ? 'High-Yield Savings'
        : 'Horizon Rewards Card',
    type: type === 'credit' ? 'Credit' : type === 'savings' ? 'Savings' : 'Checking',
    number: `•••• ${account.account_number.slice(-4)}`,
    balance: account.balance,
    currency: account.currency,
    color: accountColors[type] ?? 'from-brand-600 to-brand-800',
  };
}

export function mapTransaction(transaction: ApiTransaction): MockTransaction {
  const [merchant, category = 'Account activity'] = transaction.description.split(' · ');
  const status = transaction.status.toLowerCase();
  return {
    id: String(transaction.id),
    accountId: String(transaction.account_id),
    merchant,
    category,
    date: transaction.created_at,
    amount: transaction.amount,
    status: status === 'pending' ? 'Pending' : status === 'failed' ? 'Failed' : 'Completed',
  };
}
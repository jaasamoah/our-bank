import type { MockAccount, MockTransaction } from '../mock/data';
import type { ApiAccount, ApiCard, ApiTransaction } from './api';

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
        : 'Telos Rewards Card',
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
    reference: transaction.reference,
    transactionType: transaction.transaction_type,
    type: transaction.amount >= 0 ? 'Credit' : 'Debit',
    status:
      status === 'processing'
        ? 'Processing'
        : status === 'pending'
          ? 'Pending'
          : status === 'failed'
            ? 'Failed'
            : status === 'reversed'
              ? 'Reversed'
              : status === 'on_hold'
                ? 'On hold'
              : 'Completed',
  };
}

export function mapCard(card: ApiCard, accountName?: string) {
  return {
    id: String(card.id),
    accountId: String(card.account_id),
    holder: card.holder_name,
    number: card.card_number
      ? card.card_number.replace(/(\d{4})(?=\d)/g, '$1 ')
      : `${card.last_four} •••• •••• ${card.last_four}`,
    expiry: card.expiry,
    network: card.network as 'Visa' | 'Mastercard',
    frozen: card.frozen,
    gradient: accountName?.toLowerCase().includes('rewards')
      ? 'from-slate-700 via-slate-800 to-slate-950'
      : 'from-brand-700 via-brand-800 to-slate-900',
  };
}
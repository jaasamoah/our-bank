import React from 'react';
import { formatCurrency } from '../mock/data';
import type { MockAccount } from '../mock/data';

const AccountCard: React.FC<{ account: MockAccount; onClick?: () => void }> = ({ account, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`relative w-full overflow-hidden rounded-2xl bg-gradient-to-br ${account.color} p-6 text-left text-white shadow-soft transition-transform hover:-translate-y-0.5`}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/5" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-white/70">{account.type}</p>
          <p className="mt-1 text-sm font-semibold">{account.name}</p>
        </div>
        <span className="text-xs text-white/70">{account.number}</span>
      </div>
      <p className="relative mt-8 text-2xl font-bold sm:text-3xl">
        {formatCurrency(account.balance, account.currency)}
      </p>
      <p className="relative mt-1 text-xs text-white/70">
        {account.type === 'Credit' ? 'Current balance owed' : 'Available balance'}
      </p>
    </button>
  );
};

export default AccountCard;

import React, { useState } from 'react';
import Layout from '../components/Layout';
import { mockAccounts, mockPayees, formatCurrency } from '../mock/data';

const Transfer = () => {
  const [fromId, setFromId] = useState(mockAccounts[0].id);
  const [toType, setToType] = useState<'own' | 'payee'>('own');
  const [toId, setToId] = useState(mockAccounts[1].id);
  const [payeeId, setPayeeId] = useState(mockPayees[0].id);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fromAccount = mockAccounts.find((a) => a.id === fromId)!;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Enter a valid amount greater than $0.');
      return;
    }
    if (toType === 'own' && fromId === toId) {
      setError('Choose a different destination account.');
      return;
    }
    if (numericAmount > fromAccount.balance && fromAccount.type !== 'Credit') {
      setError('Amount exceeds available balance.');
      return;
    }

    const destination =
      toType === 'own'
        ? mockAccounts.find((a) => a.id === toId)?.name
        : mockPayees.find((p) => p.id === payeeId)?.name;

    setSuccess(`Transfer of ${formatCurrency(numericAmount)} to ${destination} was submitted (simulated).`);
    setAmount('');
    setNote('');
  };

  return (
    <Layout title="Transfer money" subtitle="Move funds between your accounts or send to a saved payee.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-card lg:col-span-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">From account</label>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              {mockAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {formatCurrency(a.balance)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Send to</label>
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => setToType('own')}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  toType === 'own'
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                My accounts
              </button>
              <button
                type="button"
                onClick={() => setToType('payee')}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  toType === 'payee'
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Saved payee
              </button>
            </div>

            {toType === 'own' ? (
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                {mockAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={payeeId}
                onChange={(e) => setPayeeId(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                {mockPayees.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.bank} {p.accountNumber}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Amount</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="block w-full rounded-xl border border-slate-200 py-2.5 pl-8 pr-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's this for?"
              className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {error && <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>}
          {success && <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{success}</div>}

          <button
            type="submit"
            className="w-full rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
          >
            Review &amp; send
          </button>
        </form>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Saved payees</h3>
            <div className="space-y-3">
              {mockPayees.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                    {p.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {p.bank} · {p.accountNumber}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-brand-50 p-6">
            <h3 className="mb-1 text-sm font-semibold text-brand-800">Good to know</h3>
            <p className="text-sm text-brand-700">
              This is a simulated transfer — no real money moves and nothing is sent to a bank.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Transfer;

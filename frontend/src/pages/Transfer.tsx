import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { formatCurrency } from '../mock/data';
import { createPayee, deletePayee, getAccounts, getPayees, sendTransfer } from '../services/api';
import { mapAccount } from '../services/adapters';
import type { ApiPayee } from '../services/api';

const Transfer = () => {
  const [fromId, setFromId] = useState('');
  const [toType, setToType] = useState<'own' | 'payee'>('own');
  const [toId, setToId] = useState('');
  const [payeeId, setPayeeId] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<ReturnType<typeof mapAccount>[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payees, setPayees] = useState<ApiPayee[]>([]);
  const [showPayeeForm, setShowPayeeForm] = useState(false);
  const [newPayee, setNewPayee] = useState({ name: '', bank: '', account_number: '' });

  useEffect(() => {
    Promise.all([getAccounts(), getPayees()])
      .then(([accountData, payeeData]) => {
        const mappedAccounts = accountData.map(mapAccount);
        setAccounts(mappedAccounts);
        setFromId(mappedAccounts[0]?.id ?? '');
        setToId(mappedAccounts[1]?.id ?? mappedAccounts[0]?.id ?? '');
        setPayees(payeeData);
        setPayeeId(payeeData[0]?.id ?? '');
      })
      .catch(() => setError('We could not load your accounts. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const numericAmount = parseFloat(amount);
    const fromAccount = accounts.find((account) => account.id === fromId);
    if (!numericAmount || numericAmount <= 0) {
      setError('Enter a valid amount greater than $0.');
      return;
    }
    if (toType === 'own' && fromId === toId) {
      setError('Choose a different destination account.');
      return;
    }
    if (!fromAccount) {
      setError('Choose a source account.');
      return;
    }
    if (toType === 'payee' && !payeeId) {
      setError('Choose a saved payee.');
      return;
    }
    if (numericAmount > fromAccount.balance && fromAccount.type !== 'Credit') {
      setError('Amount exceeds available balance.');
      return;
    }

    const destination =
      toType === 'own'
        ? accounts.find((a) => a.id === toId)?.name
        : payees.find((p) => p.id === payeeId)?.name;

    setSubmitting(true);
    try {
      const result = await sendTransfer({
        from_account_id: Number(fromId),
        to_account_id: toType === 'own' ? Number(toId) : undefined,
        payee_id: toType === 'payee' ? Number(payeeId) : undefined,
        payee_name: toType === 'payee' ? destination : undefined,
        amount: numericAmount,
        note: note.trim() || undefined,
      });
      setSuccess(`${result.message}. ${formatCurrency(numericAmount)} is now reflected in your balances.`);
      setAmount('');
      setNote('');
      const accountData = await getAccounts();
      setAccounts(accountData.map(mapAccount));
    } catch {
      setError('We could not complete that transfer. Please check the amount and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPayee = async () => {
    setError(null);
    try {
      const created = await createPayee(newPayee);
      setPayees((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setPayeeId(created.id);
      setNewPayee({ name: '', bank: '', account_number: '' });
      setShowPayeeForm(false);
    } catch {
      setError('We could not save that payee. Check the details and try again.');
    }
  };

  const handleDeletePayee = async (payeeIdToDelete: number) => {
    try {
      await deletePayee(payeeIdToDelete);
      const remaining = payees.filter((payee) => payee.id !== payeeIdToDelete);
      setPayees(remaining);
      if (payeeId === payeeIdToDelete) setPayeeId(remaining[0]?.id ?? '');
    } catch {
      setError('We could not remove that payee. Please try again.');
    }
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
              {accounts.map((a) => (
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
                {accounts.map((a) => (
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
                {payees.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.bank} ···· {p.account_number.slice(-4)}
                  </option>
                ))}
              </select>
            )}
            <button type="button" onClick={() => setShowPayeeForm((open) => !open)} className="mt-3 text-sm font-semibold text-brand-700 hover:text-brand-800">
              {showPayeeForm ? 'Cancel adding payee' : '+ Add a new saved payee'}
            </button>
            {showPayeeForm && (
              <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-4">
                <input value={newPayee.name} onChange={(e) => setNewPayee({ ...newPayee, name: e.target.value })} placeholder="Payee name" required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
                <input value={newPayee.bank} onChange={(e) => setNewPayee({ ...newPayee, bank: e.target.value })} placeholder="Bank name" required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
                <div className="flex gap-2">
                  <input value={newPayee.account_number} onChange={(e) => setNewPayee({ ...newPayee, account_number: e.target.value })} placeholder="Account number" required className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
                  <button type="button" onClick={handleAddPayee} className="rounded-xl bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800">Save</button>
                </div>
              </div>
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
              disabled={loading || submitting}
              className="w-full rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
             {submitting ? 'Sending…' : 'Review & send'}
          </button>
        </form>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Saved payees</h3>
            <div className="space-y-3">
              {payees.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                    {p.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {p.bank} ···· {p.account_number.slice(-4)}
                    </p>
                  </div>
                  <button onClick={() => handleDeletePayee(p.id)} className="text-xs font-medium text-slate-400 hover:text-red-600">Remove</button>
                </div>
              ))}
              {payees.length === 0 && <p className="text-sm text-slate-500">No saved payees yet.</p>}
            </div>
          </div>

          <div className="rounded-2xl bg-brand-50 p-6">
            <h3 className="mb-1 text-sm font-semibold text-brand-800">Good to know</h3>
            <p className="text-sm text-brand-700">
              Transfers between your Horizon accounts update immediately. Every new transfer appears as processing until it is reviewed.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Transfer;

import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { formatCurrency } from '../mock/data';
import { createPayee, deletePayee, getAccounts, getPayees, sendTransfer } from '../services/api';
import { mapAccount } from '../services/adapters';
import type { ApiPayee } from '../services/api';
import { useToast } from '../context/ToastContext';

const Transfer = () => {
  const { showToast } = useToast();

  const [fromId, setFromId] = useState('');
  const [toType, setToType] = useState<'own' | 'payee'>('own');
  const [toId, setToId] = useState('');
  const [payeeId, setPayeeId] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<ReturnType<typeof mapAccount>[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingPayee, setSavingPayee] = useState(false);
  const [payees, setPayees] = useState<ApiPayee[]>([]);
  const [showPayeeForm, setShowPayeeForm] = useState(false);
  const [newPayee, setNewPayee] = useState({
    name: '',
    bank: '',
    account_number: '',
    iban: '',
    swift_code: '',
    password: '',
  });
  const [payeeToRemove, setPayeeToRemove] = useState<ApiPayee | null>(null);
  const [payeePassword, setPayeePassword] = useState('');
  const [removingPayee, setRemovingPayee] = useState(false);

  // Review & Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmStep, setConfirmStep] = useState<'review' | 'password'>('review');
  const [transferPassword, setTransferPassword] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

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
      .catch(() => {
        showToast('Could not load accounts. Please refresh.', 'error');
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  const selectedSourceAccount = accounts.find((account) => account.id === fromId);
  const selectedDestAccount = accounts.find((a) => a.id === toId);
  const selectedPayee = payees.find((p) => p.id === payeeId);

  const destinationName =
    toType === 'own'
      ? selectedDestAccount?.name || 'Destination Account'
      : selectedPayee?.name || 'Saved Payee';

  const handleOpenReview = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Enter a valid amount greater than $0.');
      return;
    }
    if (toType === 'own' && fromId === toId) {
      setError('Choose a different destination account.');
      return;
    }
    if (!selectedSourceAccount) {
      setError('Choose a source account.');
      return;
    }
    if (toType === 'payee' && !payeeId) {
      setError('Choose a saved payee.');
      return;
    }
    if (numericAmount > selectedSourceAccount.balance && selectedSourceAccount.type !== 'Credit') {
      setError('Amount exceeds available balance.');
      return;
    }

    setModalError(null);
    setTransferPassword('');
    setConfirmStep('review');
    setShowConfirmModal(true);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferPassword) {
      setModalError('Enter your password to authorize this transfer.');
      return;
    }

    setSubmitting(true);
    setModalError(null);

    const numericAmount = parseFloat(amount);

    try {
      await sendTransfer({
        from_account_id: Number(fromId),
        to_account_id: toType === 'own' ? Number(toId) : undefined,
        payee_id: toType === 'payee' ? Number(payeeId) : undefined,
        payee_name: toType === 'payee' ? destinationName : undefined,
        amount: numericAmount,
        note: note.trim() || undefined,
        password: transferPassword,
      });

      showToast(`Sent ${formatCurrency(numericAmount)} to ${destinationName}`, 'success');
      setAmount('');
      setNote('');
      setShowConfirmModal(false);
      setTransferPassword('');
      const accountData = await getAccounts();
      setAccounts(accountData.map(mapAccount));
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;

      if (status === 401) {
        setModalError(typeof detail === 'string' ? detail : 'Password is incorrect. Please try again.');
      } else if (typeof detail === 'string') {
        setModalError(detail);
      } else if (Array.isArray(detail)) {
        setModalError(detail[0]?.msg || 'Validation failed. Please check your password.');
      } else {
        setModalError('We could not authorize that transfer. Please check your password.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPayee = async () => {
    setError(null);
    if (!newPayee.name.trim() || !newPayee.bank.trim() || !newPayee.account_number.trim()) {
      setError('Enter the recipient name, bank name, and account number.');
      return;
    }
    if (!newPayee.iban.trim() || !newPayee.swift_code.trim()) {
      setError('Enter both the IBAN and SWIFT code to save this payee.');
      return;
    }
    if (!newPayee.password) {
      setError('Enter your current password to confirm and save this payee.');
      return;
    }

    setSavingPayee(true);
    try {
      const created = await createPayee(newPayee);
      setPayees((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setPayeeId(created.id);
      setNewPayee({ name: '', bank: '', account_number: '', iban: '', swift_code: '', password: '' });
      setShowPayeeForm(false);
      showToast(`Added payee ${created.name}`, 'success');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail[0]?.msg || 'Validation failed. Please check the fields.');
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('We could not save that payee. Check the details and try again.');
      }
    } finally {
      setSavingPayee(false);
    }
  };

  const handleDeletePayee = (payee: ApiPayee) => {
    setError(null);
    setPayeePassword('');
    setPayeeToRemove(payee);
  };

  const confirmDeletePayee = async () => {
    if (!payeeToRemove || !payeePassword) {
      setError('Enter your password to remove this payee.');
      return;
    }
    setRemovingPayee(true);
    try {
      await deletePayee(payeeToRemove.id, payeePassword);
      const remaining = payees.filter((payee) => payee.id !== payeeToRemove.id);
      setPayees(remaining);
      if (payeeId === payeeToRemove.id) setPayeeId(remaining[0]?.id ?? '');
      showToast(`Removed payee ${payeeToRemove.name}`, 'success');
      setPayeeToRemove(null);
      setPayeePassword('');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'We could not remove that payee. Check your password and try again.');
    } finally {
      setRemovingPayee(false);
    }
  };

  return (
    <Layout title="Transfer money" subtitle="Move funds between your accounts or send to a saved payee.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={handleOpenReview} className="space-y-5 rounded-2xl bg-white p-6 shadow-card lg:col-span-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">From account</label>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {formatCurrency(a.balance)}
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
                className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
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
                onChange={(e) => setPayeeId(Number(e.target.value) || '')}
                className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                {payees.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.bank} ···· {p.account_number.slice(-4)}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setShowPayeeForm((open) => !open)}
              className="mt-3 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              {showPayeeForm ? 'Cancel adding payee' : '+ Add a new saved payee'}
            </button>

            {showPayeeForm && (
              <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
                <input
                  value={newPayee.name}
                  onChange={(e) => setNewPayee({ ...newPayee, name: e.target.value })}
                  placeholder="Payee name"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                <input
                  value={newPayee.bank}
                  onChange={(e) => setNewPayee({ ...newPayee, bank: e.target.value })}
                  placeholder="Bank name"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                <input
                  value={newPayee.account_number}
                  onChange={(e) => setNewPayee({ ...newPayee, account_number: e.target.value })}
                  placeholder="Account number"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    value={newPayee.iban}
                    onChange={(e) => setNewPayee({ ...newPayee, iban: e.target.value })}
                    placeholder="IBAN number"
                    required
                    className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                  <input
                    value={newPayee.swift_code}
                    onChange={(e) => setNewPayee({ ...newPayee, swift_code: e.target.value })}
                    placeholder="SWIFT code"
                    required
                    className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm uppercase outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={newPayee.password}
                  onChange={(e) => setNewPayee({ ...newPayee, password: e.target.value })}
                  placeholder="Confirm with your login password"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddPayee}
                    disabled={savingPayee}
                    className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
                  >
                    {savingPayee ? 'Saving…' : 'Save Payee'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Amount</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-medium text-slate-400">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="block w-full rounded-xl border border-slate-200 py-2.5 pl-8 pr-4 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's this for?"
              className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

          <button
            type="submit"
            disabled={loading || submitting}
            className="w-full rounded-xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Review & send
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
                      {p.iban && ` · IBAN ${p.iban}`}
                      {p.swift_code && ` · SWIFT ${p.swift_code}`}
                    </p>
                  </div>
                  <button type="button" onClick={() => handleDeletePayee(p)} className="text-xs font-medium text-slate-400 hover:text-red-600">
                    Remove
                  </button>
                </div>
              ))}
              {payees.length === 0 && <p className="text-sm text-slate-500">No saved payees yet.</p>}
            </div>
          </div>

          <div className="rounded-2xl bg-brand-50 p-6">
            <h3 className="mb-1 text-sm font-semibold text-brand-800">Good to know</h3>
            <p className="text-sm text-brand-700">
              Transfers between your telosbank accounts update immediately. Every new transfer appears as processing until it is reviewed.
            </p>
          </div>
        </div>
      </div>

      {/* Transfer Review & Password Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm animate-backdrop-enter">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all animate-modal-enter">
            {confirmStep === 'review' ? (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Review transfer</h2>
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">Step 1 of 2</span>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3 text-sm">
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500">From account</span>
                    <span className="font-medium text-slate-900 text-right">{selectedSourceAccount?.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500">Destination</span>
                    <span className="font-medium text-slate-900 text-right">{destinationName}</span>
                  </div>
                  {toType === 'payee' && selectedPayee && (
                    <div className="flex justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-slate-500">Bank & IBAN</span>
                      <span className="font-medium text-slate-900 text-right">
                        {selectedPayee.bank} {selectedPayee.iban ? `(···${selectedPayee.iban.slice(-4)})` : ''}
                      </span>
                    </div>
                  )}
                  {note.trim() && (
                    <div className="flex justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-slate-500">Note</span>
                      <span className="font-medium text-slate-900 text-right truncate max-w-[200px]">{note}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1">
                    <span className="font-semibold text-slate-900">Transfer amount</span>
                    <span className="text-base font-bold text-brand-700">{formatCurrency(parseFloat(amount) || 0)}</span>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmStep('password')}
                    className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
                  >
                    Confirm details
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleExecuteTransfer}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Security authorization</h2>
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">Step 2 of 2</span>
                </div>

                <p className="text-sm text-slate-500">
                  Please enter your account password to authorize sending <span className="font-semibold text-slate-900">{formatCurrency(parseFloat(amount) || 0)}</span> to <span className="font-semibold text-slate-900">{destinationName}</span>.
                </p>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1.5">Account Password</label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    autoFocus
                    value={transferPassword}
                    onChange={(e) => {
                      setTransferPassword(e.target.value);
                      if (modalError) setModalError(null);
                    }}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </div>

                {modalError && <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{modalError}</div>}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmStep('review')}
                    disabled={submitting}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'Authorizing…' : 'Send money'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Payee Removal Confirmation Modal */}
      {payeeToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm animate-backdrop-enter">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-modal-enter">
            <h2 className="text-lg font-bold text-slate-900">Remove saved payee?</h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter your password to remove {payeeToRemove.name} from your saved payees.
            </p>
            <label className="mt-5 block text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                autoComplete="current-password"
                autoFocus
                value={payeePassword}
                onChange={(e) => setPayeePassword(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </label>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setPayeeToRemove(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeletePayee()}
                disabled={removingPayee}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {removingPayee ? 'Removing…' : 'Remove payee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Transfer;
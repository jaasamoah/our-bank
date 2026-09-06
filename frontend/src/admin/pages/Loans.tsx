import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { formatCurrency } from '../mock/adminData';
import type { ManagedLoan } from '../mock/adminData';
import { getAdminLoans, updateAdminLoan } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const statusColors: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700',
  Pending: 'bg-amber-50 text-amber-700',
  Paid: 'bg-slate-100 text-slate-500',
  Defaulted: 'bg-red-50 text-red-700',
};

const AdminLoans: React.FC = () => {
  const [loans, setLoans] = useState<ManagedLoan[]>([]);
  const [editLoan, setEditLoan] = useState<ManagedLoan | null>(null);
  const [statusInput, setStatusInput] = useState<ManagedLoan['status']>('Active');
  const [amountInput, setAmountInput] = useState('');
  const [outstandingInput, setOutstandingInput] = useState('');
  const [interestRateInput, setInterestRateInput] = useState('');
  const [termInput, setTermInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const mapLoan = (loan: Awaited<ReturnType<typeof getAdminLoans>>[number]): ManagedLoan => ({
    id: String(loan.id),
    userId: String(loan.user_id),
    userName: loan.user_name,
    amount: loan.amount,
    outstanding: loan.outstanding,
    interestRate: loan.interest_rate,
    term: loan.term,
    status: (loan.status.charAt(0).toUpperCase() + loan.status.slice(1)) as ManagedLoan['status'],
    disbursedDate: loan.disbursed_date ?? loan.created_at,
    description: loan.description ?? '',
  });

  useEffect(() => {
    getAdminLoans()
      .then((data) => setLoans(data.map(mapLoan)))
      .catch(() => setError('We could not load loans. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const openEdit = (l: ManagedLoan) => {
    setEditLoan(l);
    setStatusInput(l.status);
    setAmountInput(String(l.amount));
    setOutstandingInput(String(l.outstanding));
    setInterestRateInput(String(l.interestRate));
    setTermInput(l.term);
    setDateInput(l.disbursedDate.slice(0, 10));
    setDescriptionInput(l.description ?? '');
    setError('');
  };

  const handleSave = async () => {
    if (!editLoan) return;
    const amount = Number(amountInput);
    const outstanding = Number(outstandingInput);
    const interestRate = Number(interestRateInput);
    if (!amountInput || !outstandingInput || !interestRateInput || !termInput.trim() || !dateInput || amount < 0 || outstanding < 0 || interestRate < 0) {
      setError('Complete the loan details with valid non-negative numbers.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await updateAdminLoan(Number(editLoan.id), {
        amount,
        outstanding,
        interest_rate: interestRate,
        term: termInput.trim(),
        status: statusInput.toLowerCase(),
        disbursed_date: new Date(`${dateInput}T00:00:00`).toISOString(),
        description: descriptionInput.trim(),
      });
      setLoans((prev) => prev.map((loan) => loan.id === editLoan.id ? mapLoan(updated) : loan));
      setEditLoan(null);
    } catch {
      setError('We could not save this loan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const totalLent = loans.reduce((s, l) => s + l.amount, 0);
  const totalOutstanding = loans.reduce((s, l) => s + l.outstanding, 0);

  return (
    <AdminLayout title="Loan Management" subtitle="Monitor and manage customer loans">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
            <p className="text-xs text-slate-500 mb-1">Total Disbursed</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalLent)}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
            <p className="text-xs text-slate-500 mb-1">Outstanding Balance</p>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalOutstanding)}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
            <p className="text-xs text-slate-500 mb-1">Defaulted</p>
            <p className="text-2xl font-bold text-red-600">{loans.filter(l => l.status === 'Defaulted').length}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Borrower</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Outstanding</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rate</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Term</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Disbursed</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
        {loans.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{l.userName}</td>
                    <td className="px-6 py-4 text-slate-700">{formatCurrency(l.amount)}</td>
                    <td className="px-6 py-4 font-semibold text-amber-700">{formatCurrency(l.outstanding)}</td>
                    <td className="px-6 py-4 text-slate-600">{l.interestRate}%</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{l.term}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{new Date(l.disbursedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[l.status]}`}>{l.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => openEdit(l)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 transition">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </div>
      </div>

      {editLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Edit Loan</h2>
            <p className="text-sm text-slate-500 mb-5">{editLoan.userName}</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Loan amount</label>
                  <input type="number" min="0" step="0.01" value={amountInput} onChange={e => setAmountInput(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Interest rate (%)</label>
                  <input type="number" min="0" step="0.01" value={interestRateInput} onChange={e => setInterestRateInput(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Outstanding Balance</label>
                <input type="number" value={outstandingInput} onChange={e => setOutstandingInput(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Term</label>
                  <input value={termInput} onChange={e => setTermInput(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Disbursed date</label>
                  <input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea value={descriptionInput} onChange={e => setDescriptionInput(e.target.value)} rows={2} placeholder="Loan information or notes" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <select value={statusInput} onChange={e => setStatusInput(e.target.value as ManagedLoan['status'])} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500">
                  <option>Active</option><option>Pending</option><option>Paid</option><option>Defaulted</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditLoan(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
              <button onClick={() => void handleSave()} disabled={saving} className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminLoans;

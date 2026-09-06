import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { getLoans, type ApiLoan } from '../services/api';

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-slate-100 text-slate-600',
  defaulted: 'bg-red-50 text-red-700',
};

const Loans: React.FC = () => {
  const [loans, setLoans] = useState<ApiLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getLoans()
      .then(setLoans)
      .catch(() => setError('We could not load your loans. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Loans" subtitle="Review your loan balances and repayment information.">
      {loading && <div className="rounded-2xl bg-white p-8 shadow-card"><LoadingSpinner label="Loading your loans" /></div>}
      {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!loading && !error && loans.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-card">No loans are currently listed on your profile.</div>
      )}
      {!loading && !error && loans.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {loans.map((loan) => (
            <div key={loan.id} className="rounded-2xl bg-white p-6 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Loan</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">{loan.description || 'Personal loan'}</h2>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[loan.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                </span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Original amount</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(loan.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Outstanding</p>
                  <p className="mt-1 text-lg font-bold text-amber-700">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(loan.outstanding)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Interest rate</p>
                  <p className="mt-1 font-semibold text-slate-900">{loan.interest_rate}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Term</p>
                  <p className="mt-1 font-semibold text-slate-900">{loan.term}</p>
                </div>
              </div>
              <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
                Disbursed {loan.disbursed_date ? new Date(loan.disbursed_date).toLocaleDateString() : 'Not specified'}
              </p>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default Loans;
import React, { useState } from 'react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { getTransactions } from '../services/api';
import { mapTransaction } from '../services/adapters';
import { generateAccountStatementPDF } from '../utils/statementGenerator';

interface StatementDownloadModalProps {
  account: {
    id: string;
    name: string;
    accountNumber: string;
    type: string;
    currency: string;
    balance: number;
  };
  customer: {
    fullName?: string;
    email?: string;
    address?: string | null;
  };
  onClose: () => void;
}

export const StatementDownloadModal: React.FC<StatementDownloadModalProps> = ({
  account,
  customer,
  onClose,
}) => {
  const [periodPreset, setPeriodPreset] = useState<'30days' | '90days' | 'year' | 'custom'>('30days');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const handlePresetChange = (preset: '30days' | '90days' | 'year' | 'custom') => {
    setPeriodPreset(preset);
    const end = new Date();
    setEndDate(end.toISOString().slice(0, 10));
    if (preset === '30days') {
      const start = new Date();
      start.setDate(start.getDate() - 30);
      setStartDate(start.toISOString().slice(0, 10));
    } else if (preset === '90days') {
      const start = new Date();
      start.setDate(start.getDate() - 90);
      setStartDate(start.toISOString().slice(0, 10));
    } else if (preset === 'year') {
      const start = new Date();
      start.setFullYear(start.getFullYear() - 1);
      setStartDate(start.toISOString().slice(0, 10));
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      const rawTxns = await getTransactions({
        account_id: account.id,
        start_date: new Date(`${startDate}T00:00:00`).toISOString(),
        end_date: new Date(`${endDate}T23:59:59`).toISOString(),
      });
      const mapped = rawTxns.map(mapTransaction);

      generateAccountStatementPDF({
        account,
        customer,
        startDate,
        endDate,
        transactions: mapped.map((t) => ({
          date: t.date,
          description: t.description,
          reference: t.reference,
          type: t.type,
          amount: t.amount,
          status: t.status,
        })),
      });

      onClose();
    } catch {
      setError('Could not generate your statement. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Download Statement</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-1 text-xs text-slate-500">
          Generating PDF statement for <strong className="text-slate-700">{account.name}</strong> (•••• {account.accountNumber.slice(-4)})
        </p>

        {error && <div className="mt-3 rounded-xl bg-red-50 p-2.5 text-xs text-red-700">{error}</div>}

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600">Preset Period</label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePresetChange('30days')}
                className={`rounded-xl py-2 text-xs font-medium transition ${
                  periodPreset === '30days'
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('90days')}
                className={`rounded-xl py-2 text-xs font-medium transition ${
                  periodPreset === '90days'
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Last 90 Days
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('year')}
                className={`rounded-xl py-2 text-xs font-medium transition ${
                  periodPreset === 'year'
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Last 1 Year
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-700 py-2.5 text-xs font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            {downloading ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};
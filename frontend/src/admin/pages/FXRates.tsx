import React, { useState } from 'react';
import { CurrencyDollarIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import AdminLayout from '../components/AdminLayout';
import { fxRates } from '../mock/adminData';
import type { FXRate } from '../mock/adminData';

const AdminFXRates: React.FC = () => {
  const [rates, setRates] = useState<FXRate[]>(fxRates);
  const [editRate, setEditRate] = useState<FXRate | null>(null);
  const [rateInput, setRateInput] = useState('');

  const openEdit = (r: FXRate) => {
    setEditRate(r);
    setRateInput(String(r.rate));
  };

  const handleSave = () => {
    if (!editRate) return;
    setRates((prev) =>
      prev.map((r) =>
        r.id === editRate.id
          ? { ...r, rate: parseFloat(rateInput) || r.rate, updatedAt: new Date().toISOString() }
          : r
      )
    );
    setEditRate(null);
  };

  return (
    <AdminLayout title="FX Rates" subtitle="Manage foreign exchange rates used across the platform">
      <div className="space-y-6">
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
          <p className="text-sm font-medium text-white/70 mb-1">Base Currency</p>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <CurrencyDollarIcon className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold">USD · US Dollar</p>
              <p className="text-sm text-white/60">All rates are quoted against USD</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {rates.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <GlobeAltIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-bold text-slate-900">{r.targetCurrency}</span>
                </div>
                <button onClick={() => openEdit(r)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 transition">Edit</button>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-1">{r.rate.toFixed(4)}</p>
              <p className="text-xs text-slate-400">1 USD = {r.rate.toFixed(4)} {r.targetCurrency}</p>
              <p className="text-xs text-slate-300 mt-2">
                Updated {new Date(r.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {editRate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Edit FX Rate</h2>
            <p className="text-sm text-slate-500 mb-5">USD → {editRate.targetCurrency}</p>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Exchange Rate</label>
              <input
                type="number"
                step="0.0001"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <p className="text-xs text-slate-400 mt-1">1 USD = [rate] {editRate.targetCurrency}</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditRate(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleSave} className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition">Update Rate</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminFXRates;

import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  createAdminInvestment,
  deleteAdminInvestment,
  getAdminInvestments,
  getAdminUsers,
  updateAdminInvestment,
  getApiValidationErrors,
  type ApiAdminInvestment,
  type ApiUser,
} from '../../services/api';
import { formatCurrency } from '../mock/adminData';

type InvestmentForm = {
  userId: string;
  symbol: string;
  name: string;
  assetClass: string;
  units: string;
  averageCost: string;
  currentPrice: string;
  marketValue: string;
  costBasis: string;
  dailyChange: string;
  totalReturn: string;
  allocationPercentage: string;
  currency: string;
};

const emptyForm: InvestmentForm = {
  userId: '',
  symbol: '',
  name: '',
  assetClass: 'Equities',
  units: '0',
  averageCost: '0',
  currentPrice: '0',
  marketValue: '0',
  costBasis: '0',
  dailyChange: '0',
  totalReturn: '0',
  allocationPercentage: '0',
  currency: 'USD',
};

const numberFields: Array<keyof InvestmentForm> = [
  'units',
  'averageCost',
  'currentPrice',
  'marketValue',
  'costBasis',
  'dailyChange',
  'totalReturn',
  'allocationPercentage',
];

const AdminInvestments: React.FC = () => {
  const [investments, setInvestments] = useState<ApiAdminInvestment[]>([]);
  const [customers, setCustomers] = useState<Array<ApiUser & { total_balance: number }>>([]);
  const [form, setForm] = useState<InvestmentForm>(emptyForm);
  const [editing, setEditing] = useState<ApiAdminInvestment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([getAdminInvestments(), getAdminUsers()])
      .then(([investmentData, customerData]) => {
        setInvestments(investmentData);
        setCustomers(customerData);
        setForm((current) => ({ ...current, userId: current.userId || String(customerData[0]?.id ?? '') }));
      })
      .catch(() => setError('We could not load investments. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return investments.filter((investment) =>
      !query ||
      investment.user_name.toLowerCase().includes(query) ||
      investment.symbol.toLowerCase().includes(query) ||
      investment.name.toLowerCase().includes(query),
    );
  }, [investments, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, userId: String(customers[0]?.id ?? '') });
    setFieldErrors({});
    setError('');
    setShowModal(true);
  };

  const openEdit = (investment: ApiAdminInvestment) => {
    setEditing(investment);
    setForm({
      userId: String(investment.user_id),
      symbol: investment.symbol,
      name: investment.name,
      assetClass: investment.asset_class,
      units: String(investment.units),
      averageCost: String(investment.average_cost),
      currentPrice: String(investment.current_price),
      marketValue: String(investment.market_value),
      costBasis: String(investment.cost_basis),
      dailyChange: String(investment.daily_change),
      totalReturn: String(investment.total_return),
      allocationPercentage: String(investment.allocation_percentage),
      currency: investment.currency,
    });
    setFieldErrors({});
    setError('');
    setShowModal(true);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.userId) next.userId = 'Select a customer.';
    if (!form.symbol.trim()) next.symbol = 'Symbol is required.';
    if (!form.name.trim()) next.name = 'Investment name is required.';
    if (!form.assetClass.trim()) next.assetClass = 'Asset class is required.';
    if (!form.currency.trim() || form.currency.trim().length < 3) next.currency = 'Use a 3-letter currency code.';
    for (const field of numberFields) {
      const value = Number(form[field]);
      if (!form[field].trim() || Number.isNaN(value) || value < 0 || (field === 'allocationPercentage' && value > 100)) {
        next[field] = field === 'allocationPercentage' ? 'Enter a number between 0 and 100.' : 'Enter a valid non-negative number.';
      }
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    setError('');
    const payload = {
      user_id: Number(form.userId),
      symbol: form.symbol.trim().toUpperCase(),
      name: form.name.trim(),
      asset_class: form.assetClass.trim(),
      units: Number(form.units),
      average_cost: Number(form.averageCost),
      current_price: Number(form.currentPrice),
      market_value: Number(form.marketValue),
      cost_basis: Number(form.costBasis),
      daily_change: Number(form.dailyChange),
      total_return: Number(form.totalReturn),
      allocation_percentage: Number(form.allocationPercentage),
      currency: form.currency.trim().toUpperCase(),
    };
    try {
      const saved = editing
        ? await updateAdminInvestment(editing.id, payload)
        : await createAdminInvestment(payload);
      setInvestments((current) => editing ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      setEditing(null);
      setShowModal(false);
      setForm(emptyForm);
    } catch (saveError) {
      const parsed = getApiValidationErrors(saveError);
      setFieldErrors(parsed.fields);
      setError(parsed.form || 'We could not save this investment. Check the values and customer.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (investment: ApiAdminInvestment) => {
    if (!window.confirm(`Delete ${investment.symbol} for ${investment.user_name}?`)) return;
    try {
      await deleteAdminInvestment(investment.id);
      setInvestments((current) => current.filter((item) => item.id !== investment.id));
    } catch {
      setError('We could not delete this investment. Please try again.');
    }
  };

  const field = (key: keyof InvestmentForm) => ({
    value: form[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [key]: event.target.value })),
  });

  const FieldError = ({ name }: { name: string }) => fieldErrors[name] ? <span className="mt-1 block text-xs text-red-600">{fieldErrors[name]}</span> : null;

  return (
    <AdminLayout title="Investment Management" subtitle="Keep customer portfolios synchronized with live records">
      <div className="space-y-6">
        {error && !showModal && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input type="search" placeholder="Search customer, symbol, or investment" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 sm:w-80" />
          <button type="button" onClick={openCreate} className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">New investment</button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {loading ? <div className="p-10"><LoadingSpinner label="Loading investments" /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead><tr className="border-b border-slate-100 bg-slate-50 text-left">
                  {['Holding', 'Owner', 'Units', 'Price', 'Market value', 'Cost basis', 'Return', 'Allocation', 'Actions'].map((heading) => <th key={heading} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((investment) => (
                    <tr key={investment.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4"><p className="font-semibold text-slate-900">{investment.symbol}</p><p className="text-xs text-slate-500">{investment.name}</p></td>
                      <td className="px-5 py-4 text-slate-700">{investment.user_name}</td>
                      <td className="px-5 py-4 text-slate-700">{investment.units}</td>
                      <td className="px-5 py-4 text-slate-700">{formatCurrency(investment.current_price, investment.currency)}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{formatCurrency(investment.market_value, investment.currency)}</td>
                      <td className="px-5 py-4 text-slate-700">{formatCurrency(investment.cost_basis, investment.currency)}</td>
                      <td className={`px-5 py-4 font-semibold ${investment.total_return >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(investment.total_return, investment.currency)}</td>
                      <td className="px-5 py-4 text-slate-700">{investment.allocation_percentage}%</td>
                      <td className="px-5 py-4"><div className="flex gap-2"><button type="button" onClick={() => openEdit(investment)} className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100">Edit</button><button type="button" onClick={() => void remove(investment)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">Delete</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <p className="p-10 text-center text-sm text-slate-500">No investments found.</p>}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit investment' : 'Create investment'}</h2>
            <p className="mt-1 text-sm text-slate-500">Every value below is persisted to the customer portfolio.</p>
            {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Customer<select value={form.userId} onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"><option value="">Select customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name}</option>)}</select><FieldError name="userId" /></label>
              <label className="text-sm font-medium text-slate-700">Symbol<input {...field('symbol')} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal uppercase" /><FieldError name="symbol" /></label>
              <label className="text-sm font-medium text-slate-700">Name<input {...field('name')} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /><FieldError name="name" /></label>
              <label className="text-sm font-medium text-slate-700">Asset class<input {...field('assetClass')} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /><FieldError name="assetClass" /></label>
              {([
                ['units', 'Units'],
                ['averageCost', 'Average cost'],
                ['currentPrice', 'Current price'],
                ['marketValue', 'Market value'],
                ['costBasis', 'Cost basis'],
                ['dailyChange', 'Daily change'],
                ['totalReturn', 'Total return'],
                ['allocationPercentage', 'Allocation (%)'],
              ] as Array<[keyof InvestmentForm, string]>).map(([key, label]) => (
                <label key={key} className="text-sm font-medium text-slate-700">{label}<input type="number" step="0.01" {...field(key)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /><FieldError name={key} /></label>
              ))}
              <label className="text-sm font-medium text-slate-700">Currency<input {...field('currency')} maxLength={8} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal uppercase" /><FieldError name="currency" /></label>
            </div>
            <div className="mt-6 flex gap-3"><button type="button" onClick={() => { setShowModal(false); setEditing(null); setError(''); }} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600">Cancel</button><button type="button" onClick={() => void save()} disabled={saving} className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : editing ? 'Save changes' : 'Create investment'}</button></div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminInvestments;
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getBeneficiaries, type ApiBeneficiary } from '../services/api';

const Profile = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({ email: true, sms: false, push: true });
  const [saved, setSaved] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState<ApiBeneficiary[]>([]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  React.useEffect(() => {
    getBeneficiaries().then(setBeneficiaries).catch(() => setBeneficiaries([]));
  }, []);

  return (
    <Layout title="Profile & settings" subtitle="Manage your personal information and preferences.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 text-center shadow-card">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-700 text-2xl font-bold text-white">
            {user?.avatarInitials}
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">{user?.fullName}</h2>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <p className="mt-4 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            Member since {user?.memberSince}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5 rounded-2xl bg-white p-6 shadow-card lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900">Personal information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
              <input
                defaultValue={user?.fullName}
                className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input
                defaultValue={user?.email}
                className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone number</label>
              <input
                defaultValue="+1 (555) 019-2837"
                className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Username</label>
              <input
                defaultValue={user?.username}
                disabled
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-400 outline-none"
              />
            </div>
          </div>

          <h3 className="pt-2 text-sm font-semibold text-slate-900">Notification preferences</h3>
          <div className="space-y-3">
            {(
              [
                { key: 'email', label: 'Email notifications' },
                { key: 'sms', label: 'SMS alerts' },
                { key: 'push', label: 'Push notifications' },
              ] as const
            ).map((item) => (
              <label key={item.key} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
                <input
                  type="checkbox"
                  checked={notifications[item.key]}
                  onChange={(e) => setNotifications((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                  className="h-5 w-5 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
                />
              </label>
            ))}
          </div>

          {saved && (
            <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
              Changes saved successfully.
            </div>
          )}

          <button
            type="submit"
            className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
          >
            Save changes
          </button>
        </form>
      </div>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-card">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Previous beneficiaries</h3>
            <p className="mt-1 text-sm text-slate-500">Beneficiaries previously associated with this account.</p>
          </div>
          <span className="text-xs text-slate-400">{beneficiaries.length} saved</span>
        </div>
        {beneficiaries.length === 0 ? (
          <p className="mt-5 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-500">No previous beneficiaries have been recorded.</p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {beneficiaries.map((beneficiary) => (
              <div key={beneficiary.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{beneficiary.name}</p>
                    {beneficiary.relationship && <p className="text-xs text-slate-500">{beneficiary.relationship}</p>}
                  </div>
                  {beneficiary.bank && <span className="text-xs text-slate-400">{beneficiary.bank}</span>}
                </div>
                {beneficiary.account_number && <p className="mt-3 font-mono text-xs text-slate-600">Account ending {beneficiary.account_number.slice(-4)}</p>}
                {beneficiary.notes && <p className="mt-2 text-sm text-slate-600">{beneficiary.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Profile;

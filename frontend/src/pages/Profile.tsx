import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({ email: true, sms: false, push: true });
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

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
    </Layout>
  );
};

export default Profile;

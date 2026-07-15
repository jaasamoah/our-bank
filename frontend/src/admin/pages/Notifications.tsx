import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminNotifications, managedUsers } from '../mock/adminData';
import type { AdminNotification } from '../mock/adminData';

const typeColors: Record<string, string> = {
  Info: 'bg-brand-50 text-brand-700',
  Alert: 'bg-amber-50 text-amber-700',
  Promo: 'bg-purple-50 text-purple-700',
  Security: 'bg-red-50 text-red-700',
};

const empty: Omit<AdminNotification, 'id' | 'sent' | 'sentAt'> = {
  userId: 'all', userName: 'All Users', title: '', message: '', type: 'Info',
};

const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>(adminNotifications);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Omit<AdminNotification, 'id' | 'sent' | 'sentAt'>>(empty);

  const handleSend = () => {
    if (!form.title || !form.message) return;
    const newNotif: AdminNotification = {
      ...form,
      id: `notif_new_${Date.now()}`,
      sent: true,
      sentAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setShowModal(false);
    setForm(empty);
  };

  const handleUserChange = (userId: string) => {
    if (userId === 'all') {
      setForm(f => ({ ...f, userId: 'all', userName: 'All Users' }));
    } else {
      const u = managedUsers.find(u => u.id === userId);
      setForm(f => ({ ...f, userId, userName: u?.fullName || '' }));
    }
  };

  return (
    <AdminLayout title="Notifications" subtitle="Send and manage customer notifications">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button onClick={() => setShowModal(true)} className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition">
            + Send Notification
          </button>
        </div>

        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className={`mt-0.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${typeColors[n.type]}`}>{n.type}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{n.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-2">To: {n.userName}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {n.sent ? (
                    <>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Sent
                      </span>
                      {n.sentAt && <p className="text-xs text-slate-400 mt-1">{new Date(n.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                      Scheduled
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-5">Send Notification</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Recipient</label>
                <select value={form.userId} onChange={e => handleUserChange(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500">
                  <option value="all">All Users</option>
                  {managedUsers.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as AdminNotification['type'] }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500">
                  <option>Info</option><option>Alert</option><option>Promo</option><option>Security</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Message</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleSend} className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition">Send Now</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminNotifications;

import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { formatCurrency } from '../mock/adminData';
import type { ManagedUser } from '../mock/adminData';
import {
  createAdminBeneficiary,
  createAdminUser,
  deleteAdminBeneficiary,
  deleteAdminUser,
  getAdminBeneficiaries,
  getAdminUsers,
  updateAdminBeneficiary,
  updateAdminUser,
  type ApiBeneficiary,
} from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const statusColors: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700',
  Suspended: 'bg-red-50 text-red-700',
  Pending: 'bg-amber-50 text-amber-700',
};

const kycColors: Record<string, string> = {
  Verified: 'bg-emerald-50 text-emerald-700',
  Pending: 'bg-amber-50 text-amber-700',
  Rejected: 'bg-red-50 text-red-700',
  'Not Started': 'bg-slate-100 text-slate-500',
};

const emptyUser: Omit<ManagedUser, 'id'> = {
  fullName: '', email: '', username: '', address: '', status: 'Pending',
  kycStatus: 'Not Started', joinedDate: new Date().toISOString().slice(0, 10), totalBalance: 0,
};

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<Omit<ManagedUser, 'id'>>(emptyUser);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [beneficiaryUser, setBeneficiaryUser] = useState<ManagedUser | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<ApiBeneficiary[]>([]);
  const [beneficiaryForm, setBeneficiaryForm] = useState({ name: '', relationship: '', bank: '', account_number: '', notes: '', created_at: new Date().toISOString().slice(0, 10) });
  const [editingBeneficiary, setEditingBeneficiary] = useState<ApiBeneficiary | null>(null);
  const [beneficiarySaving, setBeneficiarySaving] = useState(false);

  const mapUser = (user: Awaited<ReturnType<typeof getAdminUsers>>[number]): ManagedUser => ({
    id: String(user.id),
    fullName: user.full_name,
    email: user.email,
    username: user.username,
    address: user.address ?? '',
    status: user.is_active ? 'Active' : 'Suspended',
    kycStatus: 'Not Started',
    joinedDate: user.created_at,
    totalBalance: user.total_balance,
  });

  useEffect(() => {
    getAdminUsers()
      .then((data) => setUsers(data.map(mapUser)))
      .catch(() => setError('We could not load customers. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditUser(null);
    setForm(emptyUser);
    setPassword('');
    setError('');
    setShowModal(true);
  };

  const openEdit = (u: ManagedUser) => {
    setEditUser(u);
    setForm({ fullName: u.fullName, email: u.email, username: u.username, address: u.address, status: u.status, kycStatus: u.kycStatus, joinedDate: u.joinedDate, totalBalance: u.totalBalance });
    setPassword('');
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.fullName || !form.email || !form.username || (!editUser && password.length < 8)) {
      setError(editUser ? 'Complete the required fields.' : 'Complete all fields and use a password of at least 8 characters.');
      return;
    }
    try {
      const updated = editUser
        ? await updateAdminUser(Number(editUser.id), {
            full_name: form.fullName,
            email: form.email,
            username: form.username,
            address: form.address.trim(),
            is_active: form.status === 'Active',
            created_at: new Date(`${form.joinedDate}T00:00:00`).toISOString(),
          })
        : await createAdminUser({
            full_name: form.fullName,
            email: form.email,
            username: form.username,
            address: form.address.trim(),
            password,
          });
      setUsers((prev) => editUser
        ? prev.map((u) => u.id === editUser.id ? mapUser(updated) : u)
        : [mapUser(updated), ...prev]);
      setShowModal(false);
    } catch {
      setError('We could not save this customer. Check for duplicate details and try again.');
    }
  };

  const removeUser = async (user: ManagedUser) => {
    if (!window.confirm(`Delete ${user.fullName}? This removes their accounts, transactions, loans, beneficiaries, and KYC listing.`)) return;
    try {
      await deleteAdminUser(Number(user.id));
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
    } catch {
      setError('We could not delete this customer. Please try again.');
    }
  };

  const toggleStatus = async (id: string) => {
    const user = users.find((item) => item.id === id);
    if (!user) return;
    try {
      const updated = await updateAdminUser(Number(id), { is_active: user.status !== 'Active' });
      setUsers((prev) => prev.map((u) => u.id === id ? mapUser(updated) : u));
    } catch {
      setError('We could not update this customer. Please try again.');
    }
  };

  const openBeneficiaries = async (user: ManagedUser) => {
    setBeneficiaryUser(user);
    setEditingBeneficiary(null);
    setBeneficiaryForm({ name: '', relationship: '', bank: '', account_number: '', notes: '', created_at: new Date().toISOString().slice(0, 10) });
    setError('');
    try {
      setBeneficiaries(await getAdminBeneficiaries(Number(user.id)));
    } catch {
      setError('We could not load this customer’s previous beneficiaries.');
    }
  };

  const editBeneficiary = (beneficiary: ApiBeneficiary) => {
    setEditingBeneficiary(beneficiary);
    setBeneficiaryForm({
      name: beneficiary.name,
      relationship: beneficiary.relationship ?? '',
      bank: beneficiary.bank ?? '',
      account_number: beneficiary.account_number ?? '',
      notes: beneficiary.notes ?? '',
      created_at: beneficiary.created_at.slice(0, 10),
    });
  };

  const saveBeneficiary = async () => {
    if (!beneficiaryUser || !beneficiaryForm.name.trim()) {
      setError('Beneficiary name is required.');
      return;
    }
    setBeneficiarySaving(true);
    setError('');
    try {
      const payload = {
        name: beneficiaryForm.name.trim(),
        relationship: beneficiaryForm.relationship.trim() || undefined,
        bank: beneficiaryForm.bank.trim() || undefined,
        account_number: beneficiaryForm.account_number.trim() || undefined,
        notes: beneficiaryForm.notes.trim() || undefined,
        created_at: beneficiaryForm.created_at ? new Date(`${beneficiaryForm.created_at}T00:00:00`).toISOString() : undefined,
      };
      const savedBeneficiary = editingBeneficiary
        ? await updateAdminBeneficiary(editingBeneficiary.id, payload)
        : await createAdminBeneficiary(Number(beneficiaryUser.id), payload);
      setBeneficiaries((current) => editingBeneficiary
        ? current.map((item) => item.id === savedBeneficiary.id ? savedBeneficiary : item)
        : [savedBeneficiary, ...current]);
      setEditingBeneficiary(null);
       setBeneficiaryForm({ name: '', relationship: '', bank: '', account_number: '', notes: '', created_at: new Date().toISOString().slice(0, 10) });
    } catch {
      setError('We could not save this beneficiary.');
    } finally {
      setBeneficiarySaving(false);
    }
  };

  const removeBeneficiary = async (beneficiaryId: number) => {
    try {
      await deleteAdminBeneficiary(beneficiaryId);
      setBeneficiaries((current) => current.filter((item) => item.id !== beneficiaryId));
    } catch {
      setError('We could not remove this beneficiary.');
    }
  };

  return (
    <AdminLayout title="User Management" subtitle="Create, edit, and manage customer accounts">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 w-full sm:w-72"
          />
           <button
            onClick={openCreate}
            className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition"
          >
             New customer
          </button>
        </div>

        {error && !showModal && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          {loading ? <div className="p-10"><LoadingSpinner label="Loading customers" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Username</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Address</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">KYC</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Balance</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-sm font-semibold text-brand-700 shrink-0">
                          {u.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{u.fullName}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{u.username}</td>
                    <td className="max-w-xs px-6 py-4 text-slate-600 text-xs">{u.address || 'Not provided'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[u.status]}`}>{u.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${kycColors[u.kycStatus]}`}>{u.kycStatus}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(u.totalBalance)}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{new Date(u.joinedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(u)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 transition">Edit</button>
                        <button
                          onClick={() => toggleStatus(u.id)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${u.status === 'Active' ? 'text-red-700 bg-red-50 hover:bg-red-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
                        >
                          {u.status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button onClick={() => void openBeneficiaries(u)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition">Beneficiaries</button>
                        <button onClick={() => void removeUser(u)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-5">{editUser ? 'Edit User' : 'Create New User'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
              </div>
               {!editUser && (
                 <div>
                   <label className="block text-xs font-medium text-slate-600 mb-1">Temporary password</label>
                   <input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} placeholder="At least 8 characters" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                 </div>
               )}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Username</label>
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
              </div>
               <div>
                 <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
                 <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={3} placeholder="Street, city, region, postal code" className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
               </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date joined</label>
                <input type="date" value={form.joinedDate.slice(0, 10)} onChange={e => setForm(f => ({ ...f, joinedDate: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ManagedUser['status'] }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500">
                    <option>Active</option><option>Suspended</option><option>Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">KYC Status</label>
                  <select value={form.kycStatus} onChange={e => setForm(f => ({ ...f, kycStatus: e.target.value as ManagedUser['kycStatus'] }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500">
                    <option>Verified</option><option>Pending</option><option>Rejected</option><option>Not Started</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleSave} className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition">Save</button>
            </div>
          </div>
        </div>
      )}

      {beneficiaryUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Previous beneficiaries</h2>
                <p className="mt-1 text-sm text-slate-500">{beneficiaryUser.fullName}</p>
              </div>
              <button type="button" onClick={() => setBeneficiaryUser(null)} className="text-sm text-slate-400 hover:text-slate-700">Close</button>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {beneficiaries.map((beneficiary) => (
                <div key={beneficiary.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{beneficiary.name}</p>
                      <p className="text-xs text-slate-500">{beneficiary.relationship || 'Relationship not specified'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => editBeneficiary(beneficiary)} className="text-xs font-medium text-brand-700">Edit</button>
                      <button type="button" onClick={() => void removeBeneficiary(beneficiary.id)} className="text-xs font-medium text-red-700">Remove</button>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-600">{beneficiary.bank || 'Bank not specified'} · {beneficiary.account_number || 'Account not specified'}</p>
                  {beneficiary.notes && <p className="mt-2 text-sm text-slate-600">{beneficiary.notes}</p>}
                </div>
              ))}
              {beneficiaries.length === 0 && <p className="text-sm text-slate-500">No previous beneficiaries have been recorded.</p>}
            </div>
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-semibold text-slate-900">{editingBeneficiary ? 'Edit beneficiary' : 'Add beneficiary'}</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input placeholder="Name" value={beneficiaryForm.name} onChange={(event) => setBeneficiaryForm((current) => ({ ...current, name: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
                <input placeholder="Relationship" value={beneficiaryForm.relationship} onChange={(event) => setBeneficiaryForm((current) => ({ ...current, relationship: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
                <input placeholder="Bank" value={beneficiaryForm.bank} onChange={(event) => setBeneficiaryForm((current) => ({ ...current, bank: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
                <input placeholder="Account number" value={beneficiaryForm.account_number} onChange={(event) => setBeneficiaryForm((current) => ({ ...current, account_number: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
              </div>
              <textarea placeholder="Notes" rows={2} value={beneficiaryForm.notes} onChange={(event) => setBeneficiaryForm((current) => ({ ...current, notes: event.target.value }))} className="mt-3 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
              {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <div className="mt-4 flex gap-3">
                <label className="text-xs font-medium text-slate-600">Date added
                  <input type="date" value={beneficiaryForm.created_at} onChange={(event) => setBeneficiaryForm((current) => ({ ...current, created_at: event.target.value }))} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
                </label>
                 {editingBeneficiary && <button type="button" onClick={() => { setEditingBeneficiary(null); setBeneficiaryForm({ name: '', relationship: '', bank: '', account_number: '', notes: '', created_at: new Date().toISOString().slice(0, 10) }); }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600">Cancel edit</button>}
                <button type="button" onClick={() => void saveBeneficiary()} disabled={beneficiarySaving} className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{beneficiarySaving ? 'Saving…' : editingBeneficiary ? 'Save beneficiary' : 'Add beneficiary'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;

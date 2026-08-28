import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BellIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useAdminAuth } from '../context/AdminAuthContext';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: ChartBarIcon },
  { to: '/admin/users', label: 'Users', icon: UsersIcon },
  { to: '/admin/accounts', label: 'Accounts', icon: BuildingLibraryIcon },
  { to: '/admin/transactions', label: 'Transactions', icon: CreditCardIcon },
  { to: '/admin/cards', label: 'Cards', icon: CreditCardIcon },
  { to: '/admin/loans', label: 'Loans', icon: ClipboardDocumentListIcon },
  { to: '/admin/kyc', label: 'KYC Approvals', icon: MagnifyingGlassIcon },
  { to: '/admin/notifications', label: 'Notifications', icon: BellIcon },
  { to: '/admin/fx-rates', label: 'FX Rates', icon: CurrencyDollarIcon },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: FolderIcon },
];

const AdminSidebar: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const { admin, logout } = useAdminAuth();

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-2 px-6 py-6 border-b border-slate-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white text-lg font-bold">
          H
        </div>
        <div>
          <span className="text-base font-bold text-slate-900 block">Horizon Bank</span>
          <span className="text-xs font-medium text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">Admin Panel</span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <item.icon className="h-5 w-5" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 mb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">
            {admin?.avatarInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{admin?.fullName}</p>
            <p className="truncate text-xs text-brand-600 capitalize">{admin?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;

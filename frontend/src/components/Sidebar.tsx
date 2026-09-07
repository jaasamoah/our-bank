import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowsRightLeftIcon,
  BanknotesIcon,
  ChartBarIcon,
  CreditCardIcon,
  ClipboardDocumentListIcon,
  PresentationChartLineIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import Brand from './Brand';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: ChartBarIcon },
  { to: '/accounts', label: 'Accounts', icon: BanknotesIcon },
  { to: '/investments', label: 'Investments', icon: PresentationChartLineIcon },
  { to: '/transactions', label: 'Transactions', icon: ChartBarIcon },
  { to: '/transfer', label: 'Transfer', icon: ArrowsRightLeftIcon },
  { to: '/cards', label: 'Cards', icon: CreditCardIcon },
  { to: '/loans', label: 'Loans', icon: ClipboardDocumentListIcon },
  { to: '/profile', label: 'Profile', icon: UserCircleIcon },
];

const Sidebar: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center px-6 py-6">
        <Brand className="text-xl" />
      </div>

      <nav className="flex-1 space-y-1 px-3">
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
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">
            {user?.avatarInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{user?.fullName}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

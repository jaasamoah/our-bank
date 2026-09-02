import React, { ReactNode, useState } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import SupportWidget from './SupportWidget';

const Layout: React.FC<{ title: string; subtitle?: string; children: ReactNode }> = ({
  title,
  subtitle,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-100 lg:block">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 shadow-xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Bars3Icon className="h-5 w-5" aria-hidden="true" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
              {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            All systems normal
          </div>
        </header>

        <main className="px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
      <SupportWidget />
    </div>
  );
};

export default Layout;

import React, { useState } from 'react';
import Layout from '../components/Layout';
import { mockCards, mockAccounts } from '../mock/data';

const Cards = () => {
  const [cards, setCards] = useState(mockCards);

  const toggleFreeze = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, frozen: !c.frozen } : c)));
  };

  return (
    <Layout title="Cards" subtitle="View, freeze, and manage your debit and credit cards.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {cards.map((card) => {
          const account = mockAccounts.find((a) => a.id === card.accountId);
          return (
            <div key={card.id} className="space-y-4">
              <div
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-6 text-white shadow-soft transition-opacity ${
                  card.frozen ? 'opacity-60' : ''
                }`}
              >
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
                <div className="relative flex items-start justify-between">
                  <span className="text-sm font-medium text-white/70">{account?.name}</span>
                  <span className="text-lg font-bold tracking-wide">{card.network}</span>
                </div>
                <p className="relative mt-10 font-mono text-lg tracking-widest sm:text-xl">{card.number}</p>
                <div className="relative mt-6 flex items-end justify-between text-sm">
                  <div>
                    <p className="text-white/60">Card holder</p>
                    <p className="font-medium">{card.holder}</p>
                  </div>
                  <div>
                    <p className="text-white/60">Expires</p>
                    <p className="font-medium">{card.expiry}</p>
                  </div>
                </div>
                {card.frozen && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px]">
                    <span className="rounded-full bg-white/90 px-4 py-1.5 text-sm font-semibold text-slate-900">
                      ❄️ Frozen
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-card">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{card.frozen ? 'Card frozen' : 'Card active'}</p>
                  <p className="text-xs text-slate-500">
                    {card.frozen ? 'Purchases and withdrawals are blocked.' : 'Ready to use for purchases.'}
                  </p>
                </div>
                <button
                  onClick={() => toggleFreeze(card.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    card.frozen
                      ? 'bg-brand-700 text-white hover:bg-brand-800'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {card.frozen ? 'Unfreeze' : 'Freeze card'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
        <p className="text-sm font-medium text-slate-500">Need another card?</p>
        <button className="mt-3 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
          Request a new card
        </button>
      </div>
    </Layout>
  );
};

export default Cards;

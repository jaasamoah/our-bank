import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowTrendingUpIcon,
  ChartPieIcon,
  CurrencyDollarIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import { formatCurrency } from '../mock/data';
import { getInvestmentPortfolio, type InvestmentPortfolio } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const allocationColors = ['bg-brand-600', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500'];

const Investments = () => {
  const [portfolio, setPortfolio] = useState<InvestmentPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getInvestmentPortfolio()
      .then(setPortfolio)
      .catch(() => setError('We could not load your investment portfolio. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const allocationTotal = useMemo(
    () => portfolio?.holdings.reduce((sum, holding) => sum + holding.allocation_percentage, 0) ?? 0,
    [portfolio],
  );

  return (
    <Layout title="Investments" subtitle="Track your portfolio, performance, and asset allocation.">
      {loading && (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-card">
          <LoadingSpinner label="Loading your portfolio" />
        </div>
      )}
      {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {portfolio && !error && (
        <div className="space-y-6">
          <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-brand-900 to-brand-700 p-6 text-white shadow-soft sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-brand-200">
                  <PresentationChartLineIcon className="h-5 w-5" aria-hidden="true" />
                  Portfolio value
                </div>
                <p className="mt-3 text-4xl font-bold tracking-tight">
                  {formatCurrency(portfolio.summary.total_value)}
                </p>
                <p className="mt-2 text-sm text-brand-100">
                  Invested capital {formatCurrency(portfolio.summary.total_cost)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-2 text-sm text-brand-100">
                  <ArrowTrendingUpIcon className="h-4 w-4" aria-hidden="true" />
                  Total return
                </div>
                <p className="mt-1 text-xl font-bold text-emerald-300">
                  +{formatCurrency(portfolio.summary.total_gain)}
                </p>
                <p className="text-sm text-emerald-200">+{portfolio.summary.gain_percentage.toFixed(2)}%</p>
              </div>
            </div>
            <div className="mt-8 grid gap-4 border-t border-white/15 pt-5 text-sm sm:grid-cols-3">
              <div>
                <p className="text-brand-200">Today&apos;s change</p>
                <p className="mt-1 font-semibold text-emerald-300">+{formatCurrency(portfolio.summary.daily_change)}</p>
              </div>
              <div>
                <p className="text-brand-200">Positions</p>
                <p className="mt-1 font-semibold">{portfolio.holdings.length} holdings</p>
              </div>
              <div>
                <p className="text-brand-200">Diversified allocation</p>
                <p className="mt-1 font-semibold">{allocationTotal.toFixed(1)}% invested</p>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-2xl bg-white p-6 shadow-card">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Your holdings</h2>
                  <p className="mt-1 text-sm text-slate-500">Current market value across your portfolio.</p>
                </div>
                <CurrencyDollarIcon className="h-6 w-6 text-brand-600" aria-hidden="true" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-3 font-medium">Holding</th>
                      <th className="pb-3 font-medium">Units</th>
                      <th className="pb-3 font-medium">Price</th>
                      <th className="pb-3 text-right font-medium">Value</th>
                      <th className="pb-3 text-right font-medium">Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.holdings.map((holding) => (
                      <tr key={holding.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700">
                              {holding.symbol.slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{holding.symbol}</p>
                              <p className="max-w-[190px] truncate text-xs text-slate-500">{holding.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-slate-600">{holding.units.toFixed(2)}</td>
                        <td className="py-4 text-sm text-slate-600">{formatCurrency(holding.current_price)}</td>
                        <td className="py-4 text-right text-sm font-semibold text-slate-900">
                          {formatCurrency(holding.market_value)}
                        </td>
                        <td className="py-4 text-right">
                          <p className="text-sm font-semibold text-emerald-600">+{formatCurrency(holding.total_return)}</p>
                          <p className="text-xs text-slate-400">{holding.allocation_percentage.toFixed(1)}% allocation</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-card">
              <div className="flex items-center gap-2">
                <ChartPieIcon className="h-5 w-5 text-brand-600" aria-hidden="true" />
                <h2 className="text-base font-semibold text-slate-900">Allocation</h2>
              </div>
              <div className="mt-5 space-y-4">
                {portfolio.holdings.map((holding, index) => (
                  <div key={holding.id}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{holding.asset_class}</span>
                      <span className="text-slate-500">{holding.allocation_percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${allocationColors[index % allocationColors.length]}`}
                        style={{ width: `${holding.allocation_percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Portfolio note</p>
                <p className="mt-1 text-sm leading-5 text-slate-600">
                  Your portfolio is spread across equities, fixed income, and international exposure.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </Layout>
  );
};

export default Investments;
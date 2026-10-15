import React, { useState, useMemo } from 'react';
import { Transaction, CategoryName, CurrencyCode, Budget } from '../types/finance';
import { convertCurrency, formatCurrency, CATEGORY_COLORS } from '../constants/currencies';
import { TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SpendingChartsProps {
  transactions: Transaction[];
  budgets: Budget[];
  baseCurrency: CurrencyCode;
  selectedCategory: CategoryName | 'all';
  onSelectCategory: (category: CategoryName | 'all') => void;
}

export const SpendingCharts: React.FC<SpendingChartsProps> = ({
  transactions,
  budgets,
  baseCurrency,
  selectedCategory,
  onSelectCategory,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<CategoryName | null>(null);

  // Compute total expenses per category normalized to baseCurrency
  const categoryBreakdown = useMemo(() => {
    const totals: Record<string, { total: number; count: number }> = {};
    let grandTotal = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        const converted = convertCurrency(tx.amount, tx.currency, baseCurrency);
        if (!totals[tx.category]) {
          totals[tx.category] = { total: 0, count: 0 };
        }
        totals[tx.category].total += converted;
        totals[tx.category].count += 1;
        grandTotal += converted;
      }
    });

    const list = Object.entries(totals)
      .map(([cat, data]) => ({
        category: cat as CategoryName,
        total: data.total,
        count: data.count,
        percent: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return { list, grandTotal };
  }, [transactions, baseCurrency]);

  // Donut chart math using SVG stroke-dasharray
  const radius = 80;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const slices = categoryBreakdown.list.map((item) => {
    const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercent / 100) * circumference);
    cumulativePercent += item.percent;

    const color = CATEGORY_COLORS[item.category]?.hex || '#94A3B8';
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
      color,
    };
  });

  const activeCategory = hoveredCategory || (selectedCategory !== 'all' ? selectedCategory : null);
  const activeItem = activeCategory ? categoryBreakdown.list.find((c) => c.category === activeCategory) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Interactive Pie / Donut Chart */}
      <div className="lg:col-span-7 bg-white/80 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-neutral-800/80">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100">Category Expense Distribution</h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Normalized in <span className="font-mono text-slate-700 dark:text-neutral-200">{baseCurrency}</span> · Click a segment to filter ledger
            </p>
          </div>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => onSelectCategory('all')}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Reset Category Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center my-6">
          {/* SVG Donut */}
          <div className="sm:col-span-6 flex justify-center items-center relative">
            <svg
              viewBox="0 0 220 220"
              className="w-52 h-52 -rotate-90 transform transition-transform"
            >
              {/* Background ring */}
              <circle
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-slate-100 dark:text-neutral-800/80"
              />
              {/* Segments */}
              {slices.map((slice) => {
                const isSelected = selectedCategory === slice.category;
                const isHovered = hoveredCategory === slice.category;
                return (
                  <circle
                    key={slice.category}
                    cx="110"
                    cy="110"
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={isSelected || isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    className="transition-all duration-200 cursor-pointer opacity-90 hover:opacity-100"
                    onMouseEnter={() => setHoveredCategory(slice.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => {
                      onSelectCategory(selectedCategory === slice.category ? 'all' : slice.category);
                    }}
                  />
                );
              })}
            </svg>

            {/* Donut Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                {activeItem ? activeItem.category : 'Total Outflow'}
              </span>
              <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-neutral-100 mt-0.5">
                {activeItem
                  ? formatCurrency(activeItem.total, baseCurrency)
                  : formatCurrency(categoryBreakdown.grandTotal, baseCurrency)}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono mt-0.5">
                {activeItem
                  ? `${activeItem.percent.toFixed(1)}% of total`
                  : `${transactions.filter((t) => t.type === 'expense').length} entries`}
              </span>
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="sm:col-span-6 space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {slices.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-neutral-500 py-4">No expense transactions recorded yet.</p>
            ) : (
              slices.map((item) => {
                const isCurrent = selectedCategory === item.category;
                return (
                  <div
                    key={item.category}
                    onClick={() => onSelectCategory(isCurrent ? 'all' : item.category)}
                    onMouseEnter={() => setHoveredCategory(item.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                      isCurrent
                        ? 'bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 ring-1 ring-slate-300 dark:ring-neutral-700'
                        : 'hover:bg-slate-50 dark:hover:bg-neutral-800/50 text-slate-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate font-medium">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums">
                      <span className="text-slate-400 dark:text-neutral-500">{item.percent.toFixed(1)}%</span>
                      <span className="font-semibold text-slate-900 dark:text-neutral-200">
                        {formatCurrency(item.total, baseCurrency)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-neutral-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
          <span>Active filter: <strong className="text-slate-800 dark:text-neutral-200">{selectedCategory === 'all' ? 'All Categories' : selectedCategory}</strong></span>
          <span className="font-mono tabular-nums">Grand Total: {formatCurrency(categoryBreakdown.grandTotal, baseCurrency)}</span>
        </div>
      </div>

      {/* 2. Budget vs Actual Variance Quick Meters */}
      <div className="lg:col-span-5 bg-white/80 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-neutral-800/80">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100">Budget Pacing & Variance</h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Real-time category spending vs planned limits</p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400 dark:text-neutral-400" />
          </div>

          <div className="space-y-4 my-5 max-h-64 overflow-y-auto pr-1">
            {budgets.slice(0, 5).map((b) => {
              const spent = categoryBreakdown.list.find((c) => c.category === b.category)?.total || 0;
              const percentUsed = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
              const isOver = percentUsed > 100;
              const isWarning = percentUsed >= (b.warningPercent || 80);

              let barColor = 'bg-emerald-500';
              if (isOver) barColor = 'bg-rose-500';
              else if (isWarning) barColor = 'bg-amber-500';

              return (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-neutral-200">{b.category}</span>
                    <div className="flex items-center gap-1.5 font-mono tabular-nums text-slate-500 dark:text-neutral-400">
                      <span className={isOver ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-800 dark:text-neutral-200'}>
                        {formatCurrency(spent, baseCurrency)}
                      </span>
                      <span>/</span>
                      <span>{formatCurrency(b.monthlyLimit, baseCurrency)}</span>
                    </div>
                  </div>

                  {/* Progress track */}
                  <div className="w-full bg-slate-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${Math.min(percentUsed, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-500">
                    <span>
                      {isOver ? (
                        <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                          <AlertTriangle className="w-3 h-3 inline" /> Over budget by {formatCurrency(spent - b.monthlyLimit, baseCurrency)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400/90 font-medium">
                          <CheckCircle2 className="w-3 h-3 inline" /> {formatCurrency(b.monthlyLimit - spent, baseCurrency)} remaining
                        </span>
                      )}
                    </span>
                    <span className="font-mono tabular-nums">{percentUsed.toFixed(0)}% used</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-neutral-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
          <span>Active Budgets: <strong className="text-slate-800 dark:text-neutral-200">{budgets.length} categories</strong></span>
          <span className="text-[11px] text-slate-400 dark:text-neutral-500">50/30/20 Disciplined Allocation</span>
        </div>
      </div>
    </div>
  );
};

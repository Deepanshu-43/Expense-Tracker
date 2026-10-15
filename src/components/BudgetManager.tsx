import React, { useState } from 'react';
import { Budget, CategoryName, CurrencyCode, Transaction, BudgetSuggestion } from '../types/finance';
import { convertCurrency, formatCurrency, CATEGORY_COLORS } from '../constants/currencies';
import { Sparkles, Plus, Check, RotateCw, AlertTriangle, ArrowDownRight, Edit2, Trash2 } from 'lucide-react';

interface BudgetManagerProps {
  budgets: Budget[];
  transactions: Transaction[];
  baseCurrency: CurrencyCode;
  onUpdateBudgets: (budgets: Budget[]) => void;
}

const ALL_CATEGORIES: CategoryName[] = [
  'Housing',
  'Food & Dining',
  'Groceries',
  'Utilities',
  'Transportation',
  'Entertainment',
  'Health & Fitness',
  'Shopping',
  'Travel',
  'Education',
  'Subscriptions',
  'Personal Care',
  'Miscellaneous',
];

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  budgets,
  transactions,
  baseCurrency,
  onUpdateBudgets,
}) => {
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [advisorReport, setAdvisorReport] = useState<{
    overallAssessment?: string;
    totalRecommendedBudget?: number;
    potentialMonthlySavings?: number;
    suggestions: BudgetSuggestion[];
  } | null>(null);

  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editLimitValue, setEditLimitValue] = useState<string>('');

  // New budget form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState<CategoryName>('Shopping');
  const [newLimit, setNewLimit] = useState<string>('300');

  // Compute spend in current month per category
  const currentMonthExpenses = React.useMemo(() => {
    const currentMonthPrefix = new Date().toISOString().substring(0, 7); // e.g. "2026-10"
    const map: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx.type === 'expense' && tx.date.startsWith(currentMonthPrefix)) {
        const inBase = convertCurrency(tx.amount, tx.currency, baseCurrency);
        map[tx.category] = (map[tx.category] || 0) + inBase;
      }
    });
    return map;
  }, [transactions, baseCurrency]);

  const handleFetchAiSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch('/api/gemini/budget-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions,
          currentBudgets: budgets,
          baseCurrency,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      if (data.suggestions) {
        setAdvisorReport({
          overallAssessment: data.overallAssessment,
          totalRecommendedBudget: data.totalRecommendedBudget,
          potentialMonthlySavings: data.potentialMonthlySavings,
          suggestions: data.suggestions,
        });
      }
    } catch (err) {
      console.error('Failed to get budget suggestions:', err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleApplySingleSuggestion = (suggestion: BudgetSuggestion) => {
    const existingIndex = budgets.findIndex((b) => b.category === suggestion.category);
    let updated: Budget[];

    if (existingIndex >= 0) {
      updated = [...budgets];
      updated[existingIndex] = {
        ...updated[existingIndex],
        monthlyLimit: suggestion.suggestedLimit,
        updatedAt: new Date().toISOString(),
      };
    } else {
      updated = [
        ...budgets,
        {
          id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          category: suggestion.category,
          monthlyLimit: suggestion.suggestedLimit,
          warningPercent: 80,
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    onUpdateBudgets(updated);
  };

  const handleApplyAllSuggestions = () => {
    if (!advisorReport?.suggestions) return;

    let updated = [...budgets];
    advisorReport.suggestions.forEach((s) => {
      const idx = updated.findIndex((b) => b.category === s.category);
      if (idx >= 0) {
        updated[idx] = {
          ...updated[idx],
          monthlyLimit: s.suggestedLimit,
          updatedAt: new Date().toISOString(),
        };
      } else {
        updated.push({
          id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          category: s.category,
          monthlyLimit: s.suggestedLimit,
          warningPercent: 80,
          updatedAt: new Date().toISOString(),
        });
      }
    });

    onUpdateBudgets(updated);
  };

  const handleSaveEditLimit = (id: string) => {
    const num = parseFloat(editLimitValue);
    if (!isNaN(num) && num > 0) {
      const updated = budgets.map((b) =>
        b.id === id ? { ...b, monthlyLimit: num, updatedAt: new Date().toISOString() } : b
      );
      onUpdateBudgets(updated);
    }
    setEditingBudgetId(null);
  };

  const handleDeleteBudget = (id: string) => {
    onUpdateBudgets(budgets.filter((b) => b.id !== id));
  };

  const handleAddNewBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(newLimit);
    if (isNaN(num) || num <= 0) return;

    const existing = budgets.find((b) => b.category === newCategory);
    if (existing) {
      const updated = budgets.map((b) =>
        b.id === existing.id ? { ...b, monthlyLimit: num, updatedAt: new Date().toISOString() } : b
      );
      onUpdateBudgets(updated);
    } else {
      onUpdateBudgets([
        ...budgets,
        {
          id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          category: newCategory,
          monthlyLimit: num,
          warningPercent: 80,
          updatedAt: new Date().toISOString(),
        },
      ]);
    }

    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Advisory Banner */}
      <div className="bg-white/80 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>AI Monthly Budget Advisor</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
              Evaluates past transaction patterns and automatically proposes sustainable 50/30/20 spending caps.
            </p>
          </div>

          <button
            type="button"
            disabled={isLoadingSuggestions}
            onClick={handleFetchAiSuggestions}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isLoadingSuggestions ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing Spending Velocity...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Budget Recommendations</span>
              </>
            )}
          </button>
        </div>

        {/* AI Suggestions Display */}
        {advisorReport && (
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-neutral-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-neutral-950/80 border border-emerald-200 dark:border-emerald-900/30 rounded-lg">
              <div>
                <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed font-sans">
                  {advisorReport.overallAssessment}
                </p>
                {advisorReport.potentialMonthlySavings ? (
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                    Potential Monthly Savings: {formatCurrency(advisorReport.potentialMonthlySavings, baseCurrency)}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={handleApplyAllSuggestions}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply All Recommendations</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {advisorReport.suggestions.map((s) => {
                const isCurrentMatch = budgets.some(
                  (b) => b.category === s.category && Math.abs(b.monthlyLimit - s.suggestedLimit) < 1
                );

                return (
                  <div
                    key={s.category}
                    className="p-3 bg-slate-50 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800 rounded-lg flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-neutral-200">{s.category}</span>
                        <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono">
                          {s.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-1 font-mono tabular-nums">
                        <span className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                          {formatCurrency(s.suggestedLimit, baseCurrency)}/mo
                        </span>
                        <span className="text-xs text-slate-400 dark:text-neutral-500 line-through">
                          {formatCurrency(s.currentAvgSpend, baseCurrency)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-neutral-400 mt-1 leading-snug">{s.rationale}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-neutral-800/60">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                        <ArrowDownRight className="w-3 h-3 inline" /> Save ~{formatCurrency(s.savingsOpportunity, baseCurrency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplySingleSuggestion(s)}
                        disabled={isCurrentMatch}
                        className={`text-xs px-2.5 py-1 rounded transition-colors ${
                          isCurrentMatch
                            ? 'bg-slate-200 dark:bg-neutral-800 text-slate-500 dark:text-neutral-500 cursor-default'
                            : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30'
                        }`}
                      >
                        {isCurrentMatch ? 'Applied' : 'Adopt Limit'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Active Budget Cards & Management */}
      <div className="bg-white/80 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-neutral-800/80">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100">Active Monthly Budgets</h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Monitoring in <span className="font-mono text-slate-800 dark:text-neutral-200">{baseCurrency}</span> · {budgets.length} configured targets
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Cancel' : 'Set Category Limit'}</span>
          </button>
        </div>

        {/* Add Budget Form */}
        {showAddForm && (
          <form onSubmit={handleAddNewBudget} className="p-4 my-4 bg-slate-50 dark:bg-neutral-950/80 border border-slate-200 dark:border-neutral-800 rounded-lg flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 dark:text-neutral-400 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as CategoryName)}
                className="bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-neutral-200 focus:outline-none focus:border-emerald-500"
              >
                {ALL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 dark:text-neutral-400 mb-1">Monthly Limit ({baseCurrency})</label>
              <input
                type="number"
                min="10"
                step="10"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                className="bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-1 text-xs text-slate-900 dark:text-neutral-200 font-mono w-32 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-4 flex items-center gap-2">
              <button
                type="submit"
                className="px-3 py-1 bg-emerald-500 text-neutral-950 text-xs font-semibold rounded hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                Save Budget
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 text-xs rounded hover:bg-slate-300 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </form>
        )}

        {/* Budget Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {budgets.map((b) => {
            const spent = currentMonthExpenses[b.category] || 0;
            const percent = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
            const isOver = percent > 100;
            const isWarning = percent >= (b.warningPercent || 80);

            const isEditing = editingBudgetId === b.id;

            let badgeColor = 'text-emerald-600 dark:text-emerald-400';
            let barColor = 'bg-emerald-500';
            if (isOver) {
              badgeColor = 'text-rose-600 dark:text-rose-400';
              barColor = 'bg-rose-500';
            } else if (isWarning) {
              badgeColor = 'text-amber-600 dark:text-amber-400';
              barColor = 'bg-amber-500';
            }

            return (
              <div
                key={b.id}
                className="p-4 bg-slate-50 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800/80 rounded-xl flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-800 dark:text-neutral-200">{b.category}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBudgetId(b.id);
                        setEditLimitValue(b.monthlyLimit.toString());
                      }}
                      className="text-slate-400 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-300 transition-colors p-1"
                      title="Edit Limit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBudget(b.id)}
                      className="text-slate-400 dark:text-neutral-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-1"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Amount display or edit input */}
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={editLimitValue}
                      onChange={(e) => setEditLimitValue(e.target.value)}
                      className="bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-xs px-2 py-1 rounded w-24 font-mono text-slate-900 dark:text-neutral-100"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEditLimit(b.id)}
                      className="px-2 py-1 bg-emerald-500 text-neutral-950 text-xs rounded font-medium"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingBudgetId(null)}
                      className="px-2 py-1 bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 text-xs rounded"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline justify-between font-mono tabular-nums">
                      <span className="text-base font-bold text-slate-900 dark:text-neutral-100">
                        {formatCurrency(spent, baseCurrency)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-neutral-400">
                        / {formatCurrency(b.monthlyLimit, baseCurrency)}
                      </span>
                    </div>

                    {/* Progress track */}
                    <div className="w-full bg-slate-200 dark:bg-neutral-800 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-500">
                  <span className={badgeColor}>
                    {isOver ? (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 inline" /> Over by {formatCurrency(spent - b.monthlyLimit, baseCurrency)}
                      </span>
                    ) : (
                      <span>{formatCurrency(b.monthlyLimit - spent, baseCurrency)} left</span>
                    )}
                  </span>
                  <span className="font-mono tabular-nums">{percent.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Transaction, Account, CategoryName, CurrencyCode, TransactionType } from '../types/finance';
import { convertCurrency, formatCurrency, CATEGORY_COLORS } from '../constants/currencies';
import { Search, Download, Plus, Trash2, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  baseCurrency: CurrencyCode;
  selectedCategory: CategoryName | 'all';
  onSelectCategory: (cat: CategoryName | 'all') => void;
  onDeleteTransaction: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenExportModal: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  accounts,
  baseCurrency,
  selectedCategory,
  onSelectCategory,
  onDeleteTransaction,
  onOpenAddModal,
  onOpenExportModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (selectedAccountId !== 'all' && tx.accountId !== selectedAccountId) return false;
        if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;
        if (selectedType !== 'all' && tx.type !== selectedType) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchMerchant = tx.merchant.toLowerCase().includes(q);
          const matchDesc = tx.description.toLowerCase().includes(q);
          const matchCat = tx.category.toLowerCase().includes(q);
          if (!matchMerchant && !matchDesc && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedAccountId, selectedCategory, selectedType, searchQuery]);

  return (
    <div className="bg-white/80 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 space-y-4 shadow-xs">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-neutral-800/80">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Transaction Ledger</span>
            <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">
              ({filteredTransactions.length} of {transactions.length})
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Multi-currency tracking with automated rate normalization to {baseCurrency}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search merchant, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-slate-800 dark:text-neutral-200 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Account Filter */}
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-1.5 text-slate-800 dark:text-neutral-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Accounts ({accounts.length})</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name} ({acc.currency})
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => onSelectCategory(e.target.value as CategoryName | 'all')}
          className="bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-1.5 text-slate-800 dark:text-neutral-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Categories</option>
          {Object.keys(CATEGORY_COLORS).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg">
          {(['all', 'expense', 'income'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`flex-1 py-1 text-center font-medium capitalize rounded transition-colors ${
                selectedType === t
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 shadow-xs'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Merchant / Payee</th>
              <th className="py-2.5 px-3">Account</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3 text-right">Native Amount</th>
              <th className="py-2.5 px-3 text-right">Normalized ({baseCurrency})</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60 font-sans">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400 dark:text-neutral-500">
                  No transactions match the selected filters.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const account = accountMap.get(tx.accountId);
                const isIncome = tx.type === 'income';
                const converted = convertCurrency(tx.amount, tx.currency, baseCurrency);

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-neutral-800/30 transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-3 px-3 font-mono text-slate-500 dark:text-neutral-400 whitespace-nowrap">
                      {tx.date}
                    </td>

                    {/* Merchant & Recurring */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-neutral-100 truncate max-w-[200px]">
                          {tx.merchant}
                        </span>
                        {tx.isRecurring && (
                          <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400" title="Recurring subscription">
                            recurring
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-500 truncate max-w-[220px]">
                        {tx.description}
                      </div>
                    </td>

                    {/* Account */}
                    <td className="py-3 px-3 text-slate-700 dark:text-neutral-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: account?.color || '#3B82F6' }}
                        />
                        <span>{account?.name || 'Account'}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 text-slate-800 dark:text-neutral-200 whitespace-nowrap">
                      <span className="font-medium">{tx.category}</span>
                    </td>

                    {/* Native Amount */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                      <span className={isIncome ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-900 dark:text-neutral-100 font-semibold'}>
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount, tx.currency)}
                      </span>
                    </td>

                    {/* Normalized Amount */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap text-slate-500 dark:text-neutral-400">
                      <span>{formatCurrency(converted, baseCurrency)}</span>
                    </td>

                    {/* Delete action */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1 opacity-60 group-hover:opacity-100 cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

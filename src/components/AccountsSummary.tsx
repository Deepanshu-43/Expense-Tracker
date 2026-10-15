import React, { useState } from 'react';
import { Account, CurrencyCode, AccountType } from '../types/finance';
import { CURRENCIES, convertCurrency, formatCurrency } from '../constants/currencies';
import { CreditCard, Plus, Wallet, Building2, Check, X, ArrowUpRight } from 'lucide-react';

interface AccountsSummaryProps {
  accounts: Account[];
  baseCurrency: CurrencyCode;
  onAddAccount: (account: Omit<Account, 'id' | 'updatedAt'>) => void;
  selectedAccountId: string | 'all';
  onSelectAccount: (accId: string | 'all') => void;
}

export const AccountsSummary: React.FC<AccountsSummaryProps> = ({
  accounts,
  baseCurrency,
  onAddAccount,
  selectedAccountId,
  onSelectAccount,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [balance, setBalance] = useState('');

  // Calculate Net Worth in Base Currency
  const totalNetWorth = accounts.reduce((acc, a) => {
    return acc + convertCurrency(a.balance, a.currency, baseCurrency);
  }, 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const balNum = parseFloat(balance) || 0;
    if (!name.trim()) return;

    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];
    const randomColor = colors[accounts.length % colors.length];

    onAddAccount({
      name: name.trim(),
      institution: institution.trim() || 'Bank',
      type,
      currency,
      balance: balNum,
      initialBalance: balNum,
      color: randomColor,
      accountNumberMask: `•••• ${Math.floor(1000 + Math.random() * 9000)}`,
    });

    setName('');
    setInstitution('');
    setBalance('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Net Worth Summary Strip */}
      <div className="bg-white/80 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-medium">
            Total Multi-Currency Net Worth
          </span>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-neutral-100">
              {formatCurrency(totalNetWorth, baseCurrency)}
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">
              in {baseCurrency} base
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-500 mt-1">
            Aggregated across {accounts.length} liquid accounts with automated cross-rate conversions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSelectAccount('all')}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              selectedAccountId === 'all'
                ? 'bg-slate-100 dark:bg-neutral-800 border-slate-300 dark:border-neutral-600 text-slate-900 dark:text-neutral-100 font-semibold'
                : 'bg-white dark:bg-neutral-950/60 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            All Accounts
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map((acc) => {
          const isSelected = selectedAccountId === acc.id;
          const convertedVal = convertCurrency(acc.balance, acc.currency, baseCurrency);

          return (
            <div
              key={acc.id}
              onClick={() => onSelectAccount(isSelected ? 'all' : acc.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-50 dark:bg-neutral-800/80 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md'
                  : 'bg-white/80 dark:bg-neutral-900/60 border-slate-200 dark:border-neutral-800/80 hover:border-slate-300 dark:hover:border-neutral-700 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: acc.color }}
                  />
                  <span className="font-semibold text-xs text-slate-800 dark:text-neutral-200 truncate max-w-[140px]">
                    {acc.name}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-600 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-950 px-2 py-0.5 rounded border border-slate-200 dark:border-neutral-800">
                  {acc.currency}
                </span>
              </div>

              <div className="mt-4">
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-neutral-100">
                  {formatCurrency(acc.balance, acc.currency)}
                </div>
                {acc.currency !== baseCurrency && (
                  <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-neutral-400 mt-0.5">
                    ≈ {formatCurrency(convertedVal, baseCurrency)}
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-neutral-800/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-500">
                <span>{acc.institution}</span>
                <span className="font-mono">{acc.accountNumberMask}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-100"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">Add Account</h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-neutral-400 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Salary, INC Vault, Cash Wallet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-3 py-2 text-slate-900 dark:text-neutral-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-neutral-400 mb-1">Financial Institution</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, Chase, Revolut"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-3 py-2 text-slate-900 dark:text-neutral-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1">Account Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-2 text-slate-900 dark:text-neutral-200 font-mono focus:outline-none focus:border-emerald-500"
                  >
                    {Object.keys(CURRENCIES).map((c) => (
                      <option key={c} value={c}>
                        {c} ({CURRENCIES[c as CurrencyCode].symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1">Initial Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-2 text-slate-900 dark:text-neutral-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-neutral-400 mb-1">Account Classification</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-2 text-slate-900 dark:text-neutral-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="checking">Checking / Current Account</option>
                  <option value="savings">Savings Account</option>
                  <option value="credit">Credit Card</option>
                  <option value="investment">Investment / Brokerage</option>
                  <option value="cash">Physical Cash / Travel Wallet</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold rounded"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

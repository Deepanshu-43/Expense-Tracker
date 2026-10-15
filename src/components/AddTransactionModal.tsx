import React, { useState } from 'react';
import { Account, Transaction, CategoryName, CurrencyCode, TransactionType } from '../types/finance';
import { CURRENCIES, convertCurrency, formatCurrency } from '../constants/currencies';
import { X, Check } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  accounts: Account[];
  baseCurrency: CurrencyCode;
}

const CATEGORIES: CategoryName[] = [
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
  'Income',
  'Investments',
  'Miscellaneous',
];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  accounts,
  baseCurrency,
}) => {
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(accounts[0]?.currency || 'USD');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<CategoryName>('Food & Dining');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);

  if (!isOpen) return null;

  const handleAccountChange = (accId: string) => {
    setAccountId(accId);
    const acc = accounts.find((a) => a.id === accId);
    if (acc) setCurrency(acc.currency);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (!merchant.trim()) return;

    onAddTransaction({
      accountId: accountId || accounts[0]?.id || 'acc_default',
      merchant: merchant.trim(),
      description: description.trim() || merchant.trim(),
      amount: parsedAmount,
      currency,
      type,
      category,
      date,
      isRecurring,
    });

    onClose();
  };

  const parsedAmount = parseFloat(amount) || 0;
  const converted = convertCurrency(parsedAmount, currency, baseCurrency);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 shadow-2xl relative text-slate-900 dark:text-neutral-100">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 dark:hover:text-neutral-100 transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-base font-semibold mb-4">Log New Transaction</h2>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Type Segmented Control */}
          <div className="flex p-1 bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                if (category === 'Income') setCategory('Food & Dining');
              }}
              className={`flex-1 py-1.5 text-center font-medium rounded transition-colors ${
                type === 'expense'
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 shadow-xs'
                  : 'text-slate-500 dark:text-neutral-400'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('Income');
              }}
              className={`flex-1 py-1.5 text-center font-medium rounded transition-colors ${
                type === 'income'
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 shadow-xs'
                  : 'text-slate-500 dark:text-neutral-400'
              }`}
            >
              Income
            </button>
          </div>

          {/* Account Selection */}
          <div>
            <label className="block text-slate-600 dark:text-neutral-400 mb-1">Account</label>
            <select
              value={accountId}
              onChange={(e) => handleAccountChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200 focus:outline-none focus:border-emerald-500"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency} · {formatCurrency(a.balance, a.currency)})
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-slate-600 dark:text-neutral-400 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-neutral-400 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200 focus:outline-none focus:border-emerald-500"
              >
                {Object.keys(CURRENCIES).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Normalized preview */}
          {currency !== baseCurrency && parsedAmount > 0 && (
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
              Equivalent in Base: {formatCurrency(converted, baseCurrency)} (using live spot rates)
            </p>
          )}

          {/* Merchant */}
          <div>
            <label className="block text-slate-600 dark:text-neutral-400 mb-1">Merchant / Payee</label>
            <input
              type="text"
              required
              placeholder="e.g. Starbucks, Target, Uber, Swiggy"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 dark:text-neutral-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryName)}
                className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200 focus:outline-none focus:border-emerald-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-neutral-400 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Description & Recurring */}
          <div>
            <label className="block text-slate-600 dark:text-neutral-400 mb-1">Description (Optional)</label>
            <input
              type="text"
              placeholder="Optional transaction memo or note"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-emerald-500 focus:ring-0"
            />
            <span className="text-slate-700 dark:text-neutral-300">Mark as recurring monthly expense / subscription</span>
          </label>

          {/* Submit */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-medium rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Record Transaction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

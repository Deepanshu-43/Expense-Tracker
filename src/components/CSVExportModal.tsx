import React, { useState, useMemo } from 'react';
import { Transaction, Account, CurrencyCode } from '../types/finance';
import { CURRENCIES } from '../constants/currencies';
import { generateTransactionsCSV, downloadCSVFile } from '../utils/csv';
import { X, Download, Copy, Check, FileSpreadsheet } from 'lucide-react';

interface CSVExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  accounts: Account[];
  baseCurrency: CurrencyCode;
}

export const CSVExportModal: React.FC<CSVExportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  accounts,
  baseCurrency,
}) => {
  const [dateRangePreset, setDateRangePreset] = useState<'all' | 'this_month' | 'last_month' | 'ytd' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');
  const [targetCurrency, setTargetCurrency] = useState<CurrencyCode>(baseCurrency);
  const [isCopied, setIsCopied] = useState(false);

  // Compute date bounds based on preset
  const computedDateRange = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (dateRangePreset === 'this_month') {
      const start = new Date(year, month, 1).toISOString().split('T')[0];
      const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
      return { start, end };
    }
    if (dateRangePreset === 'last_month') {
      const start = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const end = new Date(year, month, 0).toISOString().split('T')[0];
      return { start, end };
    }
    if (dateRangePreset === 'ytd') {
      const start = `${year}-01-01`;
      const end = now.toISOString().split('T')[0];
      return { start, end };
    }
    if (dateRangePreset === 'custom') {
      return { start: startDate, end: endDate };
    }
    return { start: undefined, end: undefined };
  }, [dateRangePreset, startDate, endDate]);

  const csvContent = useMemo(() => {
    return generateTransactionsCSV(transactions, accounts, {
      accountId: selectedAccountId !== 'all' ? selectedAccountId : undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      type: selectedType,
      startDate: computedDateRange.start,
      endDate: computedDateRange.end,
      targetCurrency,
    });
  }, [transactions, accounts, selectedAccountId, selectedCategory, selectedType, computedDateRange, targetCurrency]);

  const lineCount = useMemo(() => {
    const lines = csvContent.split('\r\n').filter((l) => l.trim().length > 0);
    return Math.max(0, lines.length - 1); // exclude header
  }, [csvContent]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const fileName = `vaultflow_export_${targetCurrency}_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSVFile(csvContent, fileName);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(csvContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 shadow-2xl relative space-y-4 text-slate-900 dark:text-neutral-100">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 dark:hover:text-neutral-100 transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base font-semibold">Export Ledger Data (CSV)</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-neutral-400">
          Configure filters and download a standardized CSV file ready for Excel, Google Sheets, or financial modeling.
        </p>

        {/* Filter Controls */}
        <div className="space-y-3 text-xs pt-2">
          {/* Preset Date Range */}
          <div>
            <label className="block text-slate-600 dark:text-neutral-400 mb-1">Time Horizon</label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg">
              {[
                { id: 'all', label: 'All Time' },
                { id: 'this_month', label: 'This Month' },
                { id: 'last_month', label: 'Last Month' },
                { id: 'custom', label: 'Custom' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setDateRangePreset(p.id as any)}
                  className={`py-1 text-center font-medium rounded transition-colors ${
                    dateRangePreset === p.id
                      ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 shadow-xs'
                      : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range if selected */}
          {dateRangePreset === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 dark:text-neutral-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-slate-900 dark:text-neutral-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-neutral-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-slate-900 dark:text-neutral-200 font-mono"
                />
              </div>
            </div>
          )}

          {/* Account & Currency */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 dark:text-neutral-400 mb-1">Filter by Account</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-slate-800 dark:text-neutral-200"
              >
                <option value="all">All Accounts</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-neutral-400 mb-1">Normalize Amounts To</label>
              <select
                value={targetCurrency}
                onChange={(e) => setTargetCurrency(e.target.value as CurrencyCode)}
                className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-slate-800 dark:text-neutral-200 font-mono"
              >
                {Object.keys(CURRENCIES).map((c) => (
                  <option key={c} value={c}>
                    {c} ({CURRENCIES[c as CurrencyCode].symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-slate-600 dark:text-neutral-400 mb-1">Transaction Type</label>
            <div className="flex gap-2">
              {(['all', 'expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedType(t)}
                  className={`px-3 py-1 capitalize rounded border ${
                    selectedType === t
                      ? 'bg-slate-100 dark:bg-neutral-800 border-slate-300 dark:border-neutral-600 text-slate-900 dark:text-neutral-100 font-semibold'
                      : 'bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Info */}
        <div className="p-3 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-neutral-400">
            Total records ready for export: <strong className="text-slate-900 dark:text-neutral-100 font-mono">{lineCount}</strong>
          </span>
          <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono">
            Format: RFC 4180 UTF-8 CSV
          </span>
        </div>

        {/* Buttons */}
        <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied CSV' : 'Copy to Clipboard'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV File</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Account, Transaction, CategoryName, CurrencyCode, TransactionType } from '../types/finance';
import { SAMPLE_STATEMENTS } from '../data/initialData';
import { CATEGORY_COLORS, formatCurrency } from '../constants/currencies';
import { Upload, Sparkles, Check, FileText, AlertCircle, ArrowRight, RotateCw, CheckSquare, Square } from 'lucide-react';

interface StatementImporterProps {
  accounts: Account[];
  onImportTransactions: (transactions: Transaction[], targetAccountId: string) => void;
  onNavigateToBudgets?: () => void;
  baseCurrency: CurrencyCode;
}

interface ParsedRow {
  id: string;
  selected: boolean;
  date: string;
  merchant: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  type: TransactionType;
  category: CategoryName;
  isRecurring: boolean;
  confidenceScore: number;
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
  'Income',
  'Investments',
  'Miscellaneous',
];

export const StatementImporter: React.FC<StatementImporterProps> = ({
  accounts,
  onImportTransactions,
  onNavigateToBudgets,
  baseCurrency,
}) => {
  const [statementText, setStatementText] = useState<string>(SAMPLE_STATEMENTS.chase_usd);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<{
    summary?: string;
    detectedCurrency?: CurrencyCode;
    source?: string;
  } | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setStatementText(content);
        setParsedRows([]);
        setImportSuccessCount(null);
        setErrorMsg(null);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read file. Please ensure it is a valid text or CSV statement.');
    };
    reader.readAsText(file);
  };

  const handleAnalyzeStatement = async () => {
    if (!statementText.trim()) {
      setErrorMsg('Please paste bank statement text or upload a statement file.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setImportSuccessCount(null);

    try {
      const response = await fetch('/api/gemini/categorize-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statementText,
          defaultCurrency: selectedAccount?.currency || 'USD',
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data.transactions || data.transactions.length === 0) {
        setErrorMsg('No recognizable transactions could be parsed from the provided text. Try another statement format or sample.');
        setIsLoading(false);
        return;
      }

      const rows: ParsedRow[] = data.transactions.map((tx: any, idx: number) => ({
        id: `parsed_${Date.now()}_${idx}`,
        selected: true,
        date: tx.date || new Date().toISOString().split('T')[0],
        merchant: tx.merchant || 'Merchant',
        description: tx.description || tx.merchant || 'Bank Transaction',
        amount: Math.abs(Number(tx.amount) || 0),
        currency: (tx.currency || selectedAccount?.currency || 'USD') as CurrencyCode,
        type: (tx.type === 'income' ? 'income' : 'expense') as TransactionType,
        category: (tx.category || 'Miscellaneous') as CategoryName,
        isRecurring: Boolean(tx.isRecurring),
        confidenceScore: Number(tx.confidenceScore) || 0.9,
      }));

      setParsedRows(rows);
      setSummaryData({
        summary: data.summary,
        detectedCurrency: data.detectedCurrency,
        source: data.source,
      });
    } catch (err: any) {
      console.error('Statement parse failure:', err);
      setErrorMsg('Analysis failed. Check your network or try pasting statement text.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectRow = (id: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const toggleSelectAll = (select: boolean) => {
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: select })));
  };

  const updateRowCategory = (id: string, newCategory: CategoryName) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, category: newCategory } : r))
    );
  };

  const handleCommitImport = () => {
    const selectedRows = parsedRows.filter((r) => r.selected);
    if (selectedRows.length === 0) {
      setErrorMsg('Please select at least one transaction to import.');
      return;
    }

    const newTransactions: Transaction[] = selectedRows.map((r) => ({
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      accountId: selectedAccountId || accounts[0]?.id || 'acc_default',
      date: r.date,
      merchant: r.merchant,
      description: r.description,
      amount: r.amount,
      currency: r.currency,
      type: r.type,
      category: r.category,
      isRecurring: r.isRecurring,
      confidenceScore: r.confidenceScore,
      createdAt: new Date().toISOString(),
    }));

    onImportTransactions(newTransactions, selectedAccountId || accounts[0]?.id);
    setImportSuccessCount(newTransactions.length);
    setParsedRows([]);
  };

  const allSelected = parsedRows.length > 0 && parsedRows.every((r) => r.selected);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white/80 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-neutral-800/80">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Automated Bank Statement Importer</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
              Extract transactions directly from statement text, PDF exports, or CSV feeds with automated AI categorization.
            </p>
          </div>

          {/* Target Account Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-neutral-400 whitespace-nowrap">Deposit into:</span>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-neutral-200 focus:outline-none focus:border-emerald-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency} · {formatCurrency(acc.balance, acc.currency)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preset Sample Statements */}
        <div className="flex flex-wrap items-center gap-2 my-4">
          <span className="text-xs text-slate-500 dark:text-neutral-400">Load Template:</span>
          <button
            type="button"
            onClick={() => {
              setStatementText(SAMPLE_STATEMENTS.chase_usd);
              setParsedRows([]);
              setImportSuccessCount(null);
            }}
            className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 rounded-md transition-colors cursor-pointer"
          >
            Chase Checking (USD)
          </button>
          <button
            type="button"
            onClick={() => {
              setStatementText(SAMPLE_STATEMENTS.revolut_eur);
              setParsedRows([]);
              setImportSuccessCount(null);
            }}
            className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 rounded-md transition-colors cursor-pointer"
          >
            Revolut Global (EUR)
          </button>
          <button
            type="button"
            onClick={() => {
              setStatementText(SAMPLE_STATEMENTS.amex_multi);
              setParsedRows([]);
              setImportSuccessCount(null);
            }}
            className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 rounded-md transition-colors cursor-pointer"
          >
            Amex Statement (USD)
          </button>

          {/* File input */}
          <label className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 rounded-md cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Upload File (.csv / .txt)</span>
            <input
              type="file"
              accept=".csv,.txt,.ofx,.tsv,.text"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            value={statementText}
            onChange={(e) => setStatementText(e.target.value)}
            rows={7}
            placeholder="Paste your raw bank statement text, transaction table, or CSV export lines here..."
            className="w-full bg-slate-50 dark:bg-neutral-950/90 border border-slate-200 dark:border-neutral-800 rounded-lg p-3 text-xs font-mono text-slate-800 dark:text-neutral-200 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 leading-relaxed resize-y"
          />
        </div>

        {errorMsg && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-lg text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-neutral-500">
            Automated entity extraction · Normalizes POS abbreviations & detects recurring subscriptions
          </span>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleAnalyzeStatement}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isLoading ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Extracting & Categorizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Parse Statement with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {importSuccessCount !== null && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                Successfully imported {importSuccessCount} transactions!
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400/80">
                Balances recalculated in {selectedAccount.name}. Ready for budget optimization.
              </p>
            </div>
          </div>
          {onNavigateToBudgets && (
            <button
              onClick={onNavigateToBudgets}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-emerald-500 text-neutral-950 rounded-lg hover:bg-emerald-400 transition-colors cursor-pointer"
            >
              <span>View Budget Suggestions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Parsed Transactions Review Table */}
      {parsedRows.length > 0 && (
        <div className="bg-white/80 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-neutral-800/80">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                <span>Extracted Items for Review</span>
                <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">
                  ({parsedRows.filter((r) => r.selected).length}/{parsedRows.length} selected)
                </span>
              </h3>
              {summaryData?.summary && (
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">{summaryData.summary}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleSelectAll(!allSelected)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 rounded-md transition-colors cursor-pointer"
              >
                {allSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
              </button>

              <button
                type="button"
                onClick={handleCommitImport}
                className="flex items-center gap-1.5 text-xs px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold rounded-md transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Import {parsedRows.filter((r) => r.selected).length} Items</span>
              </button>
            </div>
          </div>

          {/* High density review grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400">
                  <th className="py-2.5 px-3 w-8">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Clean Merchant</th>
                  <th className="py-2.5 px-3">Raw Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Recurring</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60">
                {parsedRows.map((row) => {
                  const isIncome = row.type === 'income';

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors ${
                        row.selected ? 'text-slate-900 dark:text-neutral-200' : 'text-slate-400 dark:text-neutral-500 opacity-60'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={() => toggleSelectRow(row.id)}
                          className="rounded border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-emerald-500 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-neutral-300 whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-neutral-100 whitespace-nowrap">
                        {row.merchant}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 dark:text-neutral-400 max-w-[200px] truncate">
                        {row.description}
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={row.category}
                          onChange={(e) => updateRowCategory(row.id, e.target.value as CategoryName)}
                          className="bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 text-xs rounded px-2 py-1 text-slate-800 dark:text-neutral-200 focus:outline-none focus:border-emerald-500"
                        >
                          {ALL_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {row.isRecurring ? (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-medium">Yes</span>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-neutral-500">No</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        <span className={isIncome ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-900 dark:text-neutral-100'}>
                          {isIncome ? '+' : '-'}
                          {formatCurrency(row.amount, row.currency)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500 dark:text-neutral-400">
                        {(row.confidenceScore * 100).toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

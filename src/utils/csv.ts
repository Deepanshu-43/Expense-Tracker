import { Transaction, Account, CurrencyCode } from '../types/finance';
import { convertCurrency } from '../constants/currencies';

export interface CSVExportOptions {
  accountId?: string;
  category?: string;
  type?: 'all' | 'expense' | 'income';
  startDate?: string;
  endDate?: string;
  targetCurrency?: CurrencyCode;
}

export function generateTransactionsCSV(
  transactions: Transaction[],
  accounts: Account[],
  options: CSVExportOptions = {}
): string {
  const accountMap = new Map<string, Account>(accounts.map((a) => [a.id, a]));
  const targetCurrency = options.targetCurrency || 'USD';

  // Filter transactions
  const filtered = transactions.filter((tx) => {
    if (options.accountId && options.accountId !== 'all' && tx.accountId !== options.accountId) return false;
    if (options.category && options.category !== 'all' && tx.category !== options.category) return false;
    if (options.type && options.type !== 'all' && tx.type !== options.type) return false;
    if (options.startDate && tx.date < options.startDate) return false;
    if (options.endDate && tx.date > options.endDate) return false;
    return true;
  });

  const headers = [
    'Date',
    'Transaction ID',
    'Account Name',
    'Institution',
    'Merchant / Description',
    'Category',
    'Type',
    'Original Amount',
    'Original Currency',
    `Normalized Amount (${targetCurrency})`,
    'Is Recurring',
    'Notes',
    'Created At',
  ];

  const escapeCSV = (val: string | number | boolean | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = filtered.map((tx) => {
    const account = accountMap.get(tx.accountId);
    const converted = convertCurrency(tx.amount, tx.currency, targetCurrency);

    return [
      escapeCSV(tx.date),
      escapeCSV(tx.id),
      escapeCSV(account?.name || 'Unknown Account'),
      escapeCSV(account?.institution || '-'),
      escapeCSV(tx.merchant || tx.description),
      escapeCSV(tx.category),
      escapeCSV(tx.type),
      escapeCSV(tx.amount.toFixed(2)),
      escapeCSV(tx.currency),
      escapeCSV(converted.toFixed(2)),
      escapeCSV(tx.isRecurring ? 'Yes' : 'No'),
      escapeCSV(tx.notes || ''),
      escapeCSV(tx.createdAt),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

export function downloadCSVFile(csvContent: string, fileName: string = 'vaultflow_transactions.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

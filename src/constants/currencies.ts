import { Currency, CurrencyCode, CategoryName } from '../types/finance';

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateToUSD: 1.0 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateToUSD: 0.92 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateToUSD: 0.79 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateToUSD: 153.2 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rateToUSD: 1.37 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateToUSD: 1.54 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateToUSD: 83.5 },
  INC: { code: 'INC', symbol: 'INC', name: 'INC Currency', rateToUSD: 10.0 },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rateToUSD: 0.90 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rateToUSD: 1.35 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rateToUSD: 7.24 },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', rateToUSD: 1.68 },
};

export const CATEGORY_COLORS: Record<CategoryName, { hex: string; bg: string; text: string }> = {
  Housing: { hex: '#6366F1', bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
  'Food & Dining': { hex: '#F59E0B', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  Groceries: { hex: '#10B981', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  Utilities: { hex: '#06B6D4', bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  Transportation: { hex: '#3B82F6', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  Entertainment: { hex: '#EC4899', bg: 'bg-pink-500/10', text: 'text-pink-400' },
  'Health & Fitness': { hex: '#14B8A6', bg: 'bg-teal-500/10', text: 'text-teal-400' },
  Shopping: { hex: '#8B5CF6', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  Travel: { hex: '#F97316', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  Education: { hex: '#38BDF8', bg: 'bg-sky-500/10', text: 'text-sky-400' },
  Subscriptions: { hex: '#A855F7', bg: 'bg-violet-500/10', text: 'text-violet-400' },
  'Personal Care': { hex: '#FB7185', bg: 'bg-rose-500/10', text: 'text-rose-400' },
  Income: { hex: '#22C55E', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  Investments: { hex: '#2DD4BF', bg: 'bg-teal-500/10', text: 'text-teal-400' },
  Transfers: { hex: '#94A3B8', bg: 'bg-slate-500/10', text: 'text-slate-400' },
  Miscellaneous: { hex: '#64748B', bg: 'bg-slate-500/10', text: 'text-slate-400' },
};

export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  customRates: Partial<Record<CurrencyCode, number>> = {}
): number {
  if (from === to) return amount;
  const fromRate = customRates[from] ?? CURRENCIES[from]?.rateToUSD ?? 1.0;
  const toRate = customRates[to] ?? CURRENCIES[to]?.rateToUSD ?? 1.0;
  // Convert from `from` currency to USD: amount / fromRate
  const inUSD = amount / fromRate;
  // Convert from USD to target currency: inUSD * toRate
  return inUSD * toRate;
}

export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode = 'USD',
  showSymbol: boolean = true
): string {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const absAmount = Math.abs(amount);
  
  // Format with commas and appropriate decimal places
  const isZeroDecimals = currencyCode === 'JPY';
  const formatted = absAmount.toLocaleString('en-US', {
    minimumFractionDigits: isZeroDecimals ? 0 : 2,
    maximumFractionDigits: isZeroDecimals ? 0 : 2,
  });

  const sign = amount < 0 ? '-' : '';
  return showSymbol ? `${sign}${currency.symbol}${formatted}` : `${sign}${formatted}`;
}

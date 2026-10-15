export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'CAD'
  | 'AUD'
  | 'INR'
  | 'INC'
  | 'CHF'
  | 'SGD'
  | 'CNY'
  | 'NZD';

export interface LinkedCard {
  id: string;
  cardholderName: string;
  last4: string;
  network: 'visa' | 'mastercard' | 'amex' | 'rupay';
  bank: string;
  expiry: string;
  currency: CurrencyCode;
  color: string;
  accountId: string;
  lastFetchedAt?: string;
}

export interface LinkedUPI {
  id: string;
  upiId: string;
  provider: 'Google Pay' | 'PhonePe' | 'Paytm' | 'BHIM' | 'Amazon Pay' | 'Bank UPI';
  linkedAccountName: string;
  accountId: string;
  currency: CurrencyCode;
  lastFetchedAt?: string;
}

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateToUSD: number; // e.g. 1 USD = 0.92 EUR -> rateToUSD = 0.92
}

export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'cash';

export interface Account {
  id: string;
  name: string;
  institution: string;
  type: AccountType;
  currency: CurrencyCode;
  balance: number;
  initialBalance: number;
  color: string;
  accountNumberMask?: string;
  isDefault?: boolean;
  updatedAt: string;
}

export type TransactionType = 'expense' | 'income' | 'transfer';

export type CategoryName =
  | 'Housing'
  | 'Food & Dining'
  | 'Groceries'
  | 'Utilities'
  | 'Transportation'
  | 'Entertainment'
  | 'Health & Fitness'
  | 'Shopping'
  | 'Travel'
  | 'Education'
  | 'Subscriptions'
  | 'Personal Care'
  | 'Income'
  | 'Investments'
  | 'Transfers'
  | 'Miscellaneous';

export interface Transaction {
  id: string;
  accountId: string;
  date: string; // YYYY-MM-DD
  merchant: string;
  description: string;
  amount: number; // positive number
  currency: CurrencyCode;
  type: TransactionType;
  category: CategoryName;
  isRecurring?: boolean;
  notes?: string;
  tags?: string[];
  confidenceScore?: number; // 0.0 - 1.0 AI confidence
  createdAt: string;
}

export interface Budget {
  id: string;
  category: CategoryName;
  monthlyLimit: number; // in base currency
  warningPercent: number; // default 80%
  notes?: string;
  updatedAt: string;
}

export interface BudgetSuggestion {
  category: CategoryName;
  currentAvgSpend: number;
  suggestedLimit: number;
  rationale: string;
  savingsOpportunity: number;
  priority: 'high' | 'medium' | 'low';
}

export interface StatementParseResult {
  transactions: Array<{
    date: string;
    merchant: string;
    description: string;
    amount: number;
    currency: CurrencyCode;
    type: TransactionType;
    category: CategoryName;
    isRecurring?: boolean;
    confidenceScore: number;
  }>;
  statementPeriod?: string;
  accountHint?: string;
  detectedCurrency?: CurrencyCode;
  totalIncome: number;
  totalExpense: number;
  summary: string;
}

export interface VaultData {
  vaultId: string;
  syncCode: string;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  baseCurrency: CurrencyCode;
  lastUpdated: string;
  deviceOrigin?: string;
}

export interface BiometricSecurityState {
  hasBiometricSupport: boolean;
  isBiometricEnrolled: boolean;
  credentialId?: string;
  isPinSet: boolean;
  pinHash?: string;
  autoLockMinutes: number; // 0 = immediate, 1, 5, 15, -1 = never
  isLocked: boolean;
  lastActiveTimestamp: number;
}

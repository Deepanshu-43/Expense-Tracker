/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Account, Transaction, Budget, CurrencyCode, CategoryName, VaultData, BiometricSecurityState, LinkedCard, LinkedUPI } from './types/finance';
import { INITIAL_ACCOUNTS, INITIAL_TRANSACTIONS, INITIAL_BUDGETS, INITIAL_CARDS, INITIAL_UPIS } from './data/initialData';
import { CURRENCIES, convertCurrency, formatCurrency } from './constants/currencies';
import { isBiometricAvailable } from './services/biometrics';

import { TopBar } from './components/TopBar';
import { AccountsSummary } from './components/AccountsSummary';
import { SpendingCharts } from './components/SpendingCharts';
import { TransactionList } from './components/TransactionList';
import { StatementImporter } from './components/StatementImporter';
import { BudgetManager } from './components/BudgetManager';
import { CardsAndUPIManager } from './components/CardsAndUPIManager';
import { SecurityAndSyncView } from './components/SecurityAndSyncView';
import { FinancialChatbot } from './components/FinancialChatbot';
import { AddTransactionModal } from './components/AddTransactionModal';
import { CSVExportModal } from './components/CSVExportModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { BiometricSecurityModal, BiometricLockScreen } from './components/BiometricSecurityModal';

import {
  TrendingDown,
  TrendingUp,
  CreditCard,
  FileText,
  Sparkles,
  ShieldCheck,
  Cloud,
  Download,
  Plus,
  Smartphone,
  MessageSquare,
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'vaultflow_state_v1';
const SECURITY_STORAGE_KEY = 'vaultflow_security_v1';

export default function App() {
  // Theme state: dark or light
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('vaultflow_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });

  useEffect(() => {
    try {
      localStorage.setItem('vaultflow_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.warn('Theme effect error:', e);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Navigation State
  const [currentTab, setCurrentTab] = useState<'overview' | 'statements' | 'budgets' | 'cards' | 'ledger' | 'security'>('overview');

  // Base Viewing Currency (supports USD, EUR, GBP, JPY, CAD, AUD, INR, INC, etc.)
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>('USD');

  // Core Financial Data
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_accounts`);
      return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_transactions`);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_budgets`);
      return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
    } catch {
      return INITIAL_BUDGETS;
    }
  });

  // Linked Cards & UPI Handles
  const [cards, setCards] = useState<LinkedCard[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_cards`);
      return saved ? JSON.parse(saved) : INITIAL_CARDS;
    } catch {
      return INITIAL_CARDS;
    }
  });

  const [upis, setUpis] = useState<LinkedUPI[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_upis`);
      return saved ? JSON.parse(saved) : INITIAL_UPIS;
    } catch {
      return INITIAL_UPIS;
    }
  });

  // Category and Account filtering across views
  const [selectedCategory, setSelectedCategory] = useState<CategoryName | 'all'>('all');
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');

  // Cloud Sync State
  const [vaultData, setVaultData] = useState<VaultData>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_vault`);
      if (saved) return JSON.parse(saved);
    } catch {}
    const randomCode = `VF-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      vaultId: `vault_${Date.now()}`,
      syncCode: randomCode,
      accounts: INITIAL_ACCOUNTS,
      transactions: INITIAL_TRANSACTIONS,
      budgets: INITIAL_BUDGETS,
      baseCurrency: 'USD',
      lastUpdated: new Date().toISOString(),
    };
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Biometric Security State
  const [securityState, setSecurityState] = useState<BiometricSecurityState>(() => {
    try {
      const saved = localStorage.getItem(SECURITY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      hasBiometricSupport: false,
      isBiometricEnrolled: false,
      isPinSet: false,
      autoLockMinutes: -1, // default no auto-lock until configured
      isLocked: false,
      lastActiveTimestamp: Date.now(),
    };
  });

  // Modal & Panel Open States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Check hardware biometric availability once on mount
  useEffect(() => {
    isBiometricAvailable().then((supported) => {
      setSecurityState((prev) => ({ ...prev, hasBiometricSupport: supported }));
    });
  }, []);

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_accounts`, JSON.stringify(accounts));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_transactions`, JSON.stringify(transactions));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_budgets`, JSON.stringify(budgets));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_cards`, JSON.stringify(cards));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_upis`, JSON.stringify(upis));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_vault`, JSON.stringify(vaultData));
      localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(securityState));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }, [accounts, transactions, budgets, cards, upis, vaultData, securityState]);

  // Push updates to cloud server on change (debounced 1.5s)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!vaultData.vaultId) return;
      try {
        const payload: VaultData = {
          vaultId: vaultData.vaultId,
          syncCode: vaultData.syncCode,
          accounts,
          transactions,
          budgets,
          baseCurrency,
          lastUpdated: new Date().toISOString(),
        };

        const res = await fetch(`/api/sync/vault/${vaultData.vaultId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          setLastSyncedAt(data.lastUpdated);
        }
      } catch (err) {
        // Silent offline tolerance
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [accounts, transactions, budgets, baseCurrency, vaultData.vaultId, vaultData.syncCode]);

  // Inactivity and Tab Blur Auto-lock listener
  useEffect(() => {
    if (securityState.autoLockMinutes === -1) return;

    const checkLock = () => {
      if (securityState.isLocked) return;

      if (securityState.autoLockMinutes === 0) {
        if (document.hidden) {
          setSecurityState((prev) => ({ ...prev, isLocked: true }));
        }
      } else {
        const idleDurationMs = Date.now() - securityState.lastActiveTimestamp;
        if (idleDurationMs > securityState.autoLockMinutes * 60 * 1000) {
          setSecurityState((prev) => ({ ...prev, isLocked: true }));
        }
      }
    };

    const handleUserActivity = () => {
      if (!securityState.isLocked) {
        setSecurityState((prev) => ({ ...prev, lastActiveTimestamp: Date.now() }));
      }
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    document.addEventListener('visibilitychange', checkLock);

    const interval = setInterval(checkLock, 15000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      document.removeEventListener('visibilitychange', checkLock);
      clearInterval(interval);
    };
  }, [securityState.autoLockMinutes, securityState.isLocked, securityState.lastActiveTimestamp]);

  // Handlers for Accounts & Transactions
  const handleAddTransaction = useCallback(
    (newTx: Omit<Transaction, 'id' | 'createdAt'>) => {
      const fullTx: Transaction = {
        ...newTx,
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
      };

      setTransactions((prev) => [fullTx, ...prev]);

      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === fullTx.accountId) {
            const delta = fullTx.type === 'income' ? fullTx.amount : -fullTx.amount;
            return {
              ...acc,
              balance: acc.balance + delta,
              updatedAt: new Date().toISOString(),
            };
          }
          return acc;
        })
      );
    },
    []
  );

  const handleDeleteTransaction = useCallback(
    (id: string) => {
      const tx = transactions.find((t) => t.id === id);
      if (tx) {
        setAccounts((prev) =>
          prev.map((acc) => {
            if (acc.id === tx.accountId) {
              const delta = tx.type === 'income' ? -tx.amount : tx.amount;
              return {
                ...acc,
                balance: acc.balance + delta,
                updatedAt: new Date().toISOString(),
              };
            }
            return acc;
          })
        );
      }
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    },
    [transactions]
  );

  const handleImportTransactions = useCallback(
    (newTransactions: Transaction[], targetAccountId: string) => {
      setTransactions((prev) => [...newTransactions, ...prev]);

      let balanceDelta = 0;
      newTransactions.forEach((t) => {
        if (t.type === 'income') balanceDelta += t.amount;
        else balanceDelta -= t.amount;
      });

      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === targetAccountId) {
            return {
              ...acc,
              balance: acc.balance + balanceDelta,
              updatedAt: new Date().toISOString(),
            };
          }
          return acc;
        })
      );
    },
    []
  );

  const handleAddAccount = useCallback((newAcc: Omit<Account, 'id' | 'updatedAt'>) => {
    const fullAcc: Account = {
      ...newAcc,
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      updatedAt: new Date().toISOString(),
    };
    setAccounts((prev) => [...prev, fullAcc]);
  }, []);

  // Card & UPI Handlers
  const handleAddCard = useCallback((card: Omit<LinkedCard, 'id'>) => {
    const fullCard: LinkedCard = {
      ...card,
      id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setCards((prev) => [...prev, fullCard]);
  }, []);

  const handleRemoveCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleAddUPI = useCallback((upi: Omit<LinkedUPI, 'id'>) => {
    const fullUPI: LinkedUPI = {
      ...upi,
      id: `upi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setUpis((prev) => [...prev, fullUPI]);
  }, []);

  const handleRemoveUPI = useCallback((id: string) => {
    setUpis((prev) => prev.filter((u) => u.id !== id));
  }, []);

  // Cloud Manual Sync
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const payload: VaultData = {
        vaultId: vaultData.vaultId,
        syncCode: vaultData.syncCode,
        accounts,
        transactions,
        budgets,
        baseCurrency,
        lastUpdated: new Date().toISOString(),
      };

      const res = await fetch(`/api/sync/vault/${vaultData.vaultId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setLastSyncedAt(data.lastUpdated);
      }
    } catch (err) {
      console.warn('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectVaultCode = async (code: string) => {
    try {
      const res = await fetch(`/api/sync/vault/${code}`);
      if (!res.ok) {
        return { success: false, message: 'Vault code not found on server.' };
      }
      const data: VaultData = await res.json();
      if (data) {
        if (data.accounts?.length) setAccounts(data.accounts);
        if (data.transactions?.length) setTransactions(data.transactions);
        if (data.budgets?.length) setBudgets(data.budgets);
        if (data.baseCurrency) setBaseCurrency(data.baseCurrency);
        setVaultData(data);
        setLastSyncedAt(data.lastUpdated);
        return { success: true };
      }
      return { success: false, message: 'Invalid vault response.' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Network error connecting vault.' };
    }
  };

  // Summary Metrics
  const monthlyMetrics = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach((tx) => {
      const converted = convertCurrency(tx.amount, tx.currency, baseCurrency);
      if (tx.type === 'income') income += converted;
      else expense += converted;
    });

    const netCashflow = income - expense;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    return { income, expense, netCashflow, savingsRate };
  }, [transactions, baseCurrency]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      {/* 1. Universal Top Navigation Bar */}
      <TopBar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        baseCurrency={baseCurrency}
        onCurrencyChange={setBaseCurrency}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onOpenChat={() => setIsChatOpen(!isChatOpen)}
        isBiometricEnrolled={securityState.isBiometricEnrolled}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* 2. Main Work Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400">
              <span className="text-xs uppercase tracking-wider font-medium">Total Inflow</span>
              <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-neutral-100">
              {formatCurrency(monthlyMetrics.income, baseCurrency)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-neutral-500 font-mono mt-1">
              {transactions.filter((t) => t.type === 'income').length} credit transactions
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400">
              <span className="text-xs uppercase tracking-wider font-medium">Total Outflow</span>
              <TrendingDown className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-neutral-100">
              {formatCurrency(monthlyMetrics.expense, baseCurrency)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-neutral-500 font-mono mt-1">
              {transactions.filter((t) => t.type === 'expense').length} debits normalized
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400">
              <span className="text-xs uppercase tracking-wider font-medium">Net Surplus</span>
              <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div
              className={`mt-2 text-2xl font-bold font-mono tabular-nums ${
                monthlyMetrics.netCashflow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(monthlyMetrics.netCashflow, baseCurrency)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-neutral-500 font-mono mt-1">
              Savings rate: {monthlyMetrics.savingsRate.toFixed(1)}%
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400">
              <span className="text-xs uppercase tracking-wider font-medium">Cards & UPI Live</span>
              <CreditCard className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">
                {cards.length} Cards · {upis.length} UPIs Active
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-neutral-500 font-mono mt-1 truncate">
              Sync Code: <span className="text-slate-800 dark:text-neutral-200 font-bold">{vaultData.syncCode}</span>
            </div>
          </div>
        </div>

        {/* Tab 1: Overview */}
        {currentTab === 'overview' && (
          <div className="space-y-8">
            {/* Accounts Strip */}
            <AccountsSummary
              accounts={accounts}
              baseCurrency={baseCurrency}
              onAddAccount={handleAddAccount}
              selectedAccountId={selectedAccountId}
              onSelectAccount={setSelectedAccountId}
            />

            {/* Visual Insights Donut & Variance */}
            <SpendingCharts
              transactions={transactions}
              budgets={budgets}
              baseCurrency={baseCurrency}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Quick Actions Callout Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => setCurrentTab('statements')}
                className="p-5 bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 rounded-xl cursor-pointer transition-all group flex flex-col justify-between shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-slate-400 dark:text-neutral-500 group-hover:text-slate-700 dark:group-hover:text-neutral-300 transition-colors">
                    Import →
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">Statement Parser</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                    AI extraction from bank statements & PDF exports.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setCurrentTab('cards')}
                className="p-5 bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 rounded-xl cursor-pointer transition-all group flex flex-col justify-between shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-slate-400 dark:text-neutral-500 group-hover:text-slate-700 dark:group-hover:text-neutral-300 transition-colors">
                    Fetch Feed →
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">Cards & UPI Sync</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                    Fetch live transactions from linked cards and UPI IDs.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setCurrentTab('budgets')}
                className="p-5 bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 rounded-xl cursor-pointer transition-all group flex flex-col justify-between shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-slate-400 dark:text-neutral-500 group-hover:text-slate-700 dark:group-hover:text-neutral-300 transition-colors">
                    AI Advisor →
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">Monthly Budgets</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                    Automated 50/30/20 caps and leak detection.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setIsExportModalOpen(true)}
                className="p-5 bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 rounded-xl cursor-pointer transition-all group flex flex-col justify-between shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-slate-400 dark:text-neutral-500 group-hover:text-slate-700 dark:group-hover:text-neutral-300 transition-colors">
                    Export →
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">CSV Export</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                    Download sanitized, normalized spreadsheet data.
                  </p>
                </div>
              </div>
            </div>

            {/* Transactions Ledger */}
            <TransactionList
              transactions={transactions}
              accounts={accounts}
              baseCurrency={baseCurrency}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />
          </div>
        )}

        {/* Tab 2: Bank Statement Importer */}
        {currentTab === 'statements' && (
          <StatementImporter
            accounts={accounts}
            onImportTransactions={handleImportTransactions}
            onNavigateToBudgets={() => setCurrentTab('budgets')}
            baseCurrency={baseCurrency}
          />
        )}

        {/* Tab 3: Monthly Budgets & AI Advisor */}
        {currentTab === 'budgets' && (
          <BudgetManager
            budgets={budgets}
            transactions={transactions}
            baseCurrency={baseCurrency}
            onUpdateBudgets={setBudgets}
          />
        )}

        {/* Tab 4: Cards & UPI ID Manager */}
        {currentTab === 'cards' && (
          <CardsAndUPIManager
            cards={cards}
            upis={upis}
            accounts={accounts}
            baseCurrency={baseCurrency}
            onAddCard={handleAddCard}
            onRemoveCard={handleRemoveCard}
            onAddUPI={handleAddUPI}
            onRemoveUPI={handleRemoveUPI}
            onImportTransactions={handleImportTransactions}
          />
        )}

        {/* Tab 5: Full Ledger Data Grid */}
        {currentTab === 'ledger' && (
          <div className="space-y-6">
            <TransactionList
              transactions={transactions}
              accounts={accounts}
              baseCurrency={baseCurrency}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />
          </div>
        )}

        {/* Tab 6: Sync & Security */}
        {currentTab === 'security' && (
          <SecurityAndSyncView
            vaultData={vaultData}
            securityState={securityState}
            onUpdateSecurityState={(up) => setSecurityState((prev) => ({ ...prev, ...up }))}
            onLockVault={() => setSecurityState((prev) => ({ ...prev, isLocked: true }))}
            isSyncing={isSyncing}
            lastSyncedAt={lastSyncedAt}
            onManualSync={handleManualSync}
            onConnectVaultCode={handleConnectVaultCode}
            baseCurrency={baseCurrency}
          />
        )}
      </main>

      {/* Floating Chatbot Action Button */}
      <button
        type="button"
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        title="Open Gemini Financial Chat Advisor"
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-xs font-semibold hidden sm:inline">Ask AI Strategist</span>
      </button>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-neutral-800/80 mt-16 py-8 text-xs text-slate-500 dark:text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-neutral-300">VaultFlow</span>
            <span>·</span>
            <span>Multi-Currency Personal Finance (USD, EUR, GBP, INR, INC)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Cards & UPI Sync</span>
            <span>·</span>
            <span>Biometric Passkey Guard</span>
            <span>·</span>
            <span>Cloud Code: {vaultData.syncCode}</span>
          </div>
        </div>
      </footer>

      {/* Modals & Slide-out Panels */}
      <FinancialChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        accounts={accounts}
        transactions={transactions}
        budgets={budgets}
        baseCurrency={baseCurrency}
      />

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTransaction={handleAddTransaction}
        accounts={accounts}
        baseCurrency={baseCurrency}
      />

      <CSVExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        transactions={transactions}
        accounts={accounts}
        baseCurrency={baseCurrency}
      />

      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        vaultData={vaultData}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
        onManualSync={handleManualSync}
        onConnectVaultCode={handleConnectVaultCode}
      />

      <BiometricSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        securityState={securityState}
        onUpdateSecurityState={(up) => setSecurityState((prev) => ({ ...prev, ...up }))}
        onLockNow={() => {
          setSecurityState((prev) => ({ ...prev, isLocked: true }));
          setIsSecurityModalOpen(false);
        }}
      />

      {/* Full Screen Biometric Lock Overlay */}
      {securityState.isLocked && (
        <BiometricLockScreen
          securityState={securityState}
          onUnlock={() => setSecurityState((prev) => ({ ...prev, isLocked: false, lastActiveTimestamp: Date.now() }))}
        />
      )}
    </div>
  );
}

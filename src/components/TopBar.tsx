import React from 'react';
import { CurrencyCode } from '../types/finance';
import { CURRENCIES } from '../constants/currencies';
import { Lock, Cloud, Plus, Fingerprint, Sun, Moon, Sparkles, CreditCard } from 'lucide-react';

interface TopBarProps {
  currentTab: 'overview' | 'statements' | 'budgets' | 'cards' | 'ledger' | 'security';
  onTabChange: (tab: 'overview' | 'statements' | 'budgets' | 'cards' | 'ledger' | 'security') => void;
  baseCurrency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onOpenAddModal: () => void;
  onOpenSyncModal: () => void;
  onOpenSecurityModal: () => void;
  onOpenChat: () => void;
  isBiometricEnrolled: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onTabChange,
  baseCurrency,
  onCurrencyChange,
  onOpenAddModal,
  onOpenSyncModal,
  onOpenSecurityModal,
  onOpenChat,
  isBiometricEnrolled,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-950/90 backdrop-blur-md border-b border-slate-200 dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand title, single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onTabChange('overview');
            }}
            className="text-lg font-bold tracking-tight text-slate-950 dark:text-neutral-100 whitespace-nowrap shrink-0 hover:text-emerald-500 transition-colors"
          >
            VaultFlow
          </a>
        </div>

        {/* Zone 2: Single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-neutral-400">
          <button
            type="button"
            onClick={() => onTabChange('overview')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'overview'
                ? 'text-slate-900 dark:text-neutral-100 font-semibold underline underline-offset-8 decoration-emerald-500 decoration-2'
                : 'hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => onTabChange('statements')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'statements'
                ? 'text-slate-900 dark:text-neutral-100 font-semibold underline underline-offset-8 decoration-emerald-500 decoration-2'
                : 'hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            Statement Import
          </button>
          <button
            type="button"
            onClick={() => onTabChange('budgets')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'budgets'
                ? 'text-slate-900 dark:text-neutral-100 font-semibold underline underline-offset-8 decoration-emerald-500 decoration-2'
                : 'hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            Budgets & AI
          </button>
          <button
            type="button"
            onClick={() => onTabChange('cards')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
              currentTab === 'cards'
                ? 'text-slate-900 dark:text-neutral-100 font-semibold underline underline-offset-8 decoration-emerald-500 decoration-2'
                : 'hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            <span>Cards & UPI</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('ledger')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'ledger'
                ? 'text-slate-900 dark:text-neutral-100 font-semibold underline underline-offset-8 decoration-emerald-500 decoration-2'
                : 'hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            Ledger
          </button>
          <button
            type="button"
            onClick={() => onTabChange('security')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'security'
                ? 'text-slate-900 dark:text-neutral-100 font-semibold underline underline-offset-8 decoration-emerald-500 decoration-2'
                : 'hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            Sync & Security
          </button>
        </nav>

        {/* Zone 3: 1 primary action area */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Base Currency Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg px-2 py-1">
            <span className="text-[10px] text-slate-500 dark:text-neutral-400 uppercase font-mono">Base:</span>
            <select
              value={baseCurrency}
              onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
              className="bg-transparent text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 focus:outline-none cursor-pointer"
            >
              {Object.keys(CURRENCIES).map((c) => (
                <option key={c} value={c} className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-neutral-200 font-mono">
                  {c} ({CURRENCIES[c as CurrencyCode].symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Dark / Light Mode Switch */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* AI Chatbot Launcher */}
          <button
            type="button"
            onClick={onOpenChat}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
            title="Open Gemini Financial Chat Advisor"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">AI Advisor</span>
          </button>

          {/* Quick sync trigger button */}
          <button
            type="button"
            onClick={onOpenSyncModal}
            className="p-1.5 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Cloud Sync Status"
          >
            <Cloud className="w-4 h-4" />
          </button>

          {/* Quick lock trigger */}
          <button
            type="button"
            onClick={onOpenSecurityModal}
            className="p-1.5 text-slate-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg transition-colors cursor-pointer"
            title={isBiometricEnrolled ? 'Biometrics Active' : 'Security Settings'}
          >
            {isBiometricEnrolled ? <Fingerprint className="w-4 h-4 text-emerald-500" /> : <Lock className="w-4 h-4" />}
          </button>

          {/* Primary CTA */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Entry</span>
          </button>
        </div>
      </div>

      {/* Mobile nav subrow */}
      <div className="lg:hidden flex items-center justify-around px-2 py-2 border-t border-slate-200 dark:border-neutral-800/80 bg-slate-50 dark:bg-neutral-950 text-[11px] font-medium text-slate-600 dark:text-neutral-400 overflow-x-auto">
        <button
          onClick={() => onTabChange('overview')}
          className={`whitespace-nowrap px-2 py-1 ${currentTab === 'overview' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}
        >
          Overview
        </button>
        <button
          onClick={() => onTabChange('statements')}
          className={`whitespace-nowrap px-2 py-1 ${currentTab === 'statements' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}
        >
          Statements
        </button>
        <button
          onClick={() => onTabChange('budgets')}
          className={`whitespace-nowrap px-2 py-1 ${currentTab === 'budgets' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}
        >
          Budgets
        </button>
        <button
          onClick={() => onTabChange('cards')}
          className={`whitespace-nowrap px-2 py-1 ${currentTab === 'cards' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}
        >
          Cards & UPI
        </button>
        <button
          onClick={() => onTabChange('ledger')}
          className={`whitespace-nowrap px-2 py-1 ${currentTab === 'ledger' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}
        >
          Ledger
        </button>
        <button
          onClick={() => onTabChange('security')}
          className={`whitespace-nowrap px-2 py-1 ${currentTab === 'security' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}
        >
          Security
        </button>
      </div>
    </header>
  );
};

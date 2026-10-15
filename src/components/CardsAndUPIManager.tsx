import React, { useState } from 'react';
import { LinkedCard, LinkedUPI, Account, CurrencyCode, Transaction } from '../types/finance';
import { CURRENCIES, formatCurrency } from '../constants/currencies';
import { CreditCard, QrCode, Plus, RefreshCw, Check, ArrowRight, ShieldCheck, X, Trash2, Smartphone } from 'lucide-react';

interface CardsAndUPIManagerProps {
  cards: LinkedCard[];
  upis: LinkedUPI[];
  accounts: Account[];
  baseCurrency: CurrencyCode;
  onAddCard: (card: Omit<LinkedCard, 'id'>) => void;
  onRemoveCard: (id: string) => void;
  onAddUPI: (upi: Omit<LinkedUPI, 'id'>) => void;
  onRemoveUPI: (id: string) => void;
  onImportTransactions: (transactions: Transaction[], targetAccountId: string) => void;
}

export const CardsAndUPIManager: React.FC<CardsAndUPIManagerProps> = ({
  cards,
  upis,
  accounts,
  baseCurrency,
  onAddCard,
  onRemoveCard,
  onAddUPI,
  onRemoveUPI,
  onImportTransactions,
}) => {
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddUPI, setShowAddUPI] = useState(false);
  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const [fetchResult, setFetchResult] = useState<{
    targetAccountName: string;
    targetAccountId: string;
    transactions: any[];
  } | null>(null);

  // New Card Form state
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardNetwork, setCardNetwork] = useState<'visa' | 'mastercard' | 'amex' | 'rupay'>('visa');
  const [cardBank, setCardBank] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCurrency, setCardCurrency] = useState<CurrencyCode>('USD');
  const [cardAccountId, setCardAccountId] = useState(accounts[0]?.id || '');

  // New UPI Form state
  const [upiId, setUpiId] = useState('');
  const [upiProvider, setUpiProvider] = useState<LinkedUPI['provider']>('Google Pay');
  const [upiCurrency, setUpiCurrency] = useState<CurrencyCode>('INR');
  const [upiAccountId, setUpiAccountId] = useState(accounts[0]?.id || '');

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardholderName.trim() || !cardNumber.trim()) return;

    const rawLast4 = cardNumber.replace(/\D/g, '').slice(-4) || '4242';
    const colors = ['#1E293B', '#0F172A', '#1E1B4B', '#064E3B'];
    const chosenColor = colors[cards.length % colors.length];

    onAddCard({
      cardholderName: cardholderName.trim(),
      last4: rawLast4,
      network: cardNetwork,
      bank: cardBank.trim() || 'Bank Card',
      expiry: cardExpiry.trim() || '12/28',
      currency: cardCurrency,
      color: chosenColor,
      accountId: cardAccountId || accounts[0]?.id || 'acc_default',
    });

    setCardholderName('');
    setCardNumber('');
    setCardBank('');
    setCardExpiry('');
    setShowAddCard(false);
  };

  const handleCreateUPI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId.trim() || !upiId.includes('@')) return;

    const matchedAccount = accounts.find((a) => a.id === upiAccountId) || accounts[0];

    onAddUPI({
      upiId: upiId.trim().toLowerCase(),
      provider: upiProvider,
      linkedAccountName: matchedAccount?.name || 'Primary Bank Account',
      accountId: upiAccountId || accounts[0]?.id || 'acc_default',
      currency: upiCurrency,
    });

    setUpiId('');
    setShowAddUPI(false);
  };

  const handleFetchTransactions = async (
    type: 'card' | 'upi',
    item: LinkedCard | LinkedUPI
  ) => {
    setFetchingId(item.id);
    setFetchResult(null);

    const identifier = type === 'card' ? (item as LinkedCard).last4 : (item as LinkedUPI).upiId;
    const provider = type === 'card' ? (item as LinkedCard).bank : (item as LinkedUPI).provider;

    try {
      const res = await fetch('/api/payment-methods/fetch-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          methodType: type,
          identifier,
          provider,
          currency: item.currency,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const account = accounts.find((a) => a.id === item.accountId) || accounts[0];
        setFetchResult({
          targetAccountName: account?.name || 'Account',
          targetAccountId: item.accountId,
          transactions: data.transactions || [],
        });
      }
    } catch (e) {
      console.warn('Fetch failed:', e);
    } finally {
      setFetchingId(null);
    }
  };

  const handleConfirmImportFetched = () => {
    if (!fetchResult || fetchResult.transactions.length === 0) return;

    const formatted: Transaction[] = fetchResult.transactions.map((tx: any, idx: number) => ({
      id: `tx_fetch_${Date.now()}_${idx}`,
      accountId: fetchResult.targetAccountId,
      date: tx.date || new Date().toISOString().split('T')[0],
      merchant: tx.merchant || 'Merchant',
      description: tx.description || tx.merchant || 'Payment Method Transaction',
      amount: tx.amount,
      currency: tx.currency,
      type: tx.type || 'expense',
      category: tx.category || 'Food & Dining',
      isRecurring: Boolean(tx.isRecurring),
      confidenceScore: tx.confidenceScore || 0.95,
      createdAt: new Date().toISOString(),
    }));

    onImportTransactions(formatted, fetchResult.targetAccountId);
    setFetchResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white/80 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              <span>Cards & UPI ID Gateway Sync</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
              Connect your Credit/Debit cards and UPI handles (Google Pay, PhonePe, Paytm, BHIM) to fetch real-time transaction feeds directly.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddUPI(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
              <span>Add UPI ID</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddCard(true)}
              className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Fetched Results Preview */}
      {fetchResult && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200 dark:border-emerald-800/60">
            <div>
              <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Fetched {fetchResult.transactions.length} Transactions</span>
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400/80 mt-0.5">
                Ready to import into <strong>{fetchResult.targetAccountName}</strong> with auto-categorization applied.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFetchResult(null)}
                className="text-xs px-3 py-1.5 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleConfirmImportFetched}
                className="flex items-center gap-1.5 text-xs px-4 py-1.5 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-neutral-950 font-semibold rounded-lg transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Import {fetchResult.transactions.length} Records</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {fetchResult.transactions.map((tx, idx) => (
              <div
                key={idx}
                className="p-3 bg-white/90 dark:bg-neutral-900/80 border border-emerald-100 dark:border-neutral-800 rounded-lg text-xs flex justify-between items-center"
              >
                <div className="truncate pr-2">
                  <p className="font-semibold text-slate-900 dark:text-neutral-100 truncate">{tx.merchant}</p>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400">{tx.category} · {tx.date}</p>
                </div>
                <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-neutral-100 whitespace-nowrap">
                  {formatCurrency(tx.amount, tx.currency)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Left Cards, Right UPI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Linked Cards Section */}
        <div className="lg:col-span-7 bg-white/80 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800/80">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                <span>Linked Payment Cards</span>
                <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">({cards.length})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Visa, Mastercard, Amex & RuPay card feeds
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddCard(true)}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              + Add Card
            </button>
          </div>

          {cards.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-neutral-500 text-xs">
              No cards linked yet. Click "+ Add Card" to connect a payment card.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cards.map((card) => {
                const isFetching = fetchingId === card.id;

                return (
                  <div
                    key={card.id}
                    className="p-5 rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900 to-slate-950 text-white flex flex-col justify-between h-44 shadow-md relative overflow-hidden"
                  >
                    {/* Card Top */}
                    <div className="flex items-center justify-between z-10">
                      <div>
                        <span className="text-[11px] font-medium tracking-wide uppercase text-slate-400">
                          {card.bank}
                        </span>
                        <div className="text-xs font-mono text-emerald-400 uppercase font-semibold">
                          {card.currency}
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider font-mono px-2 py-0.5 bg-white/10 rounded">
                        {card.network}
                      </span>
                    </div>

                    {/* Card Number */}
                    <div className="z-10 font-mono text-base tracking-widest text-slate-200">
                      •••• •••• •••• {card.last4}
                    </div>

                    {/* Card Footer & Action */}
                    <div className="flex items-center justify-between z-10 pt-2 border-t border-white/10 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Cardholder</span>
                        <span className="font-medium truncate max-w-[120px] block">{card.cardholderName}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isFetching}
                          onClick={() => handleFetchTransactions('card', card)}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold rounded transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
                          <span>{isFetching ? 'Fetching...' : 'Fetch Feed'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveCard(card.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Remove card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Linked UPI IDs Section */}
        <div className="lg:col-span-5 bg-white/80 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800/80">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                <span>Unified Payments Interface (UPI)</span>
                <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">({upis.length})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Instant VPA transaction feeds
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddUPI(true)}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              + Add UPI ID
            </button>
          </div>

          {upis.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-neutral-500 text-xs">
              No UPI handles configured. Add a UPI ID like user@okhdfcbank to fetch app payments.
            </div>
          ) : (
            <div className="space-y-3">
              {upis.map((upi) => {
                const isFetching = fetchingId === upi.id;

                return (
                  <div
                    key={upi.id}
                    className="p-3.5 bg-slate-50 dark:bg-neutral-950/80 border border-slate-200 dark:border-neutral-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-neutral-100 truncate">
                          {upi.upiId}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 dark:bg-neutral-800 rounded text-slate-600 dark:text-neutral-300">
                          {upi.currency}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                        {upi.provider} · Linked: {upi.linkedAccountName}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={isFetching}
                        onClick={() => handleFetchTransactions('upi', upi)}
                        className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold rounded transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
                        <span>{isFetching ? 'Fetching...' : 'Fetch UPI'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveUPI(upi.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Remove UPI handle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowAddCard(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-900 dark:hover:text-neutral-100"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
              Add Payment Card
            </h3>

            <form onSubmit={handleCreateCard} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-neutral-400 mb-1">Cardholder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deepanshu Dhar"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-3 py-2 text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1">Card Number (Last 4)</label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="•••• •••• •••• 4182"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-3 py-2 text-slate-900 dark:text-neutral-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1">Card Network</label>
                  <select
                    value={cardNetwork}
                    onChange={(e) => setCardNetwork(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-2 text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="amex">American Express</option>
                    <option value="rupay">RuPay (India)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1">Issuing Bank</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank, Chase, Barclays"
                    value={cardBank}
                    onChange={(e) => setCardBank(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-3 py-2 text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-3 py-2 text-slate-900 dark:text-neutral-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1">Currency</label>
                  <select
                    value={cardCurrency}
                    onChange={(e) => setCardCurrency(e.target.value as CurrencyCode)}
                    className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-2 text-slate-900 dark:text-neutral-100 font-mono focus:outline-none focus:border-emerald-500"
                  >
                    {Object.keys(CURRENCIES).map((c) => (
                      <option key={c} value={c}>
                        {c} ({CURRENCIES[c as CurrencyCode].symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1">Linked Account</label>
                  <select
                    value={cardAccountId}
                    onChange={(e) => setCardAccountId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-2 text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-emerald-500"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddCard(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold rounded"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add UPI Modal */}
      {showAddUPI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowAddUPI(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-900 dark:hover:text-neutral-100"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
              Add UPI ID
            </h3>

            <form onSubmit={handleCreateUPI} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-neutral-400 mb-1">UPI Handle / VPA</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. user@okhdfcbank, name@upi, 9876543210@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-3 py-2 text-slate-900 dark:text-neutral-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1">UPI Provider</label>
                  <select
                    value={upiProvider}
                    onChange={(e) => setUpiProvider(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-2 text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Google Pay">Google Pay</option>
                    <option value="PhonePe">PhonePe</option>
                    <option value="Paytm">Paytm</option>
                    <option value="BHIM">BHIM UPI</option>
                    <option value="Amazon Pay">Amazon Pay</option>
                    <option value="Bank UPI">Bank Direct UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1">Currency</label>
                  <select
                    value={upiCurrency}
                    onChange={(e) => setUpiCurrency(e.target.value as CurrencyCode)}
                    className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-2 text-slate-900 dark:text-neutral-100 font-mono focus:outline-none focus:border-emerald-500"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="INC">INC (INC)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-neutral-400 mb-1">Deposit Account</label>
                <select
                  value={upiAccountId}
                  onChange={(e) => setUpiAccountId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-2 text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-emerald-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddUPI(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold rounded"
                >
                  Save UPI ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

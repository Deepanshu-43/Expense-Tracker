import React, { useState, useRef, useEffect } from 'react';
import { CurrencyCode, Account, Transaction, Budget } from '../types/finance';
import { formatCurrency } from '../constants/currencies';
import { MessageSquare, Sparkles, Send, X, Bot, User, Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

interface FinancialChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  baseCurrency: CurrencyCode;
}

export const FinancialChatbot: React.FC<FinancialChatbotProps> = ({
  isOpen,
  onClose,
  accounts,
  transactions,
  budgets,
  baseCurrency,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hello! I'm VaultFlow AI, your personal financial advisor. I have real-time visibility into your multi-currency accounts (${accounts.map((a) => a.currency).join(', ')}), monthly budgets, and categorized spending. Ask me anything or try one of the prompt suggestions below!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Compute basic context snapshot to ground Gemini's answer
    const topCategories: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        topCategories[tx.category] = (topCategories[tx.category] || 0) + tx.amount;
      }
    });

    const contextPayload = {
      baseCurrency,
      accounts: accounts.map((a) => ({ name: a.name, currency: a.currency, balance: a.balance })),
      totalTransactions: transactions.length,
      budgetsCount: budgets.length,
      topSpendingCategories: topCategories,
    };

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.map((m) => ({ role: m.role, text: m.text })),
          financialContext: contextPayload,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const replyText = data.reply || "I've reviewed your request. Let me know if you need any further analysis!";

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        role: 'model',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);

      if (voiceEnabled && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(replyText.slice(0, 200));
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          role: 'model',
          text: 'I encountered an issue processing your prompt. Try asking about your top spending categories or budget recommendations.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome_reset',
        role: 'model',
        text: 'Chat history cleared. How can I help optimize your financial accounts?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const samplePrompts = [
    'How can I reduce my dining & food expenses by 20%?',
    'Analyze my recurring subscriptions and recommend cuts',
    'Explain the optimal 50/30/20 budget for my net outflow',
    'How do INR and INC currency transactions impact my portfolio?',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-neutral-900 border-l border-slate-200 dark:border-neutral-800 shadow-2xl flex flex-col justify-between">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between bg-slate-50/80 dark:bg-neutral-950/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100 flex items-center gap-1.5">
              <span>VaultFlow AI Strategist</span>
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-neutral-400">
              Grounded in your active accounts & budgets
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-1.5 rounded-lg transition-colors ${
              voiceEnabled
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-neutral-300'
            }`}
            title={voiceEnabled ? 'Voice output on' : 'Enable voice readback'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleClearHistory}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-300 transition-colors rounded-lg"
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-300 transition-colors rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
        {messages.map((m) => {
          const isUser = m.role === 'user';

          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isUser
                    ? 'bg-slate-900 dark:bg-neutral-800 text-white'
                    : 'bg-emerald-500 text-neutral-950 font-bold'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3 shadow-sm leading-relaxed ${
                  isUser
                    ? 'bg-emerald-500 text-neutral-950 font-medium rounded-tr-none'
                    : 'bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                <p>{m.text}</p>
                <span
                  className={`block text-[10px] mt-1 font-mono ${
                    isUser ? 'text-neutral-900/70' : 'text-slate-400 dark:text-neutral-500'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 dark:text-neutral-500 text-xs py-2">
            <Bot className="w-4 h-4 animate-spin text-emerald-500" />
            <span>Analyzing portfolio and formulating response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-neutral-800/60 bg-slate-50/50 dark:bg-neutral-950/40">
        <p className="text-[10px] uppercase font-semibold text-slate-400 dark:text-neutral-500 mb-1.5">
          Suggested Inquiries
        </p>
        <div className="flex flex-wrap gap-1.5">
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(p)}
              className="text-[11px] text-left px-2.5 py-1 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700/80 rounded-md text-slate-700 dark:text-neutral-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask VaultFlow AI about your budgets, cards, UPI..."
          className="flex-1 bg-slate-100 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

import React, { useState } from 'react';
import { VaultData } from '../types/finance';
import { Cloud, Copy, Check, QrCode, Smartphone, Laptop, RefreshCw, X, ArrowRight, ShieldCheck } from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultData: VaultData;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  onManualSync: () => Promise<void>;
  onConnectVaultCode: (code: string) => Promise<{ success: boolean; message?: string }>;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  vaultData,
  isSyncing,
  lastSyncedAt,
  onManualSync,
  onConnectVaultCode,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [connectStatus, setConnectStatus] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(vaultData.syncCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setIsConnecting(true);
    setConnectStatus(null);

    const res = await onConnectVaultCode(inputCode.trim().toUpperCase());
    setIsConnecting(false);

    if (res.success) {
      setConnectStatus('Successfully linked and downloaded cloud vault!');
      setInputCode('');
    } else {
      setConnectStatus(res.message || 'Failed to connect. Please verify the code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 shadow-2xl relative space-y-5 text-slate-900 dark:text-neutral-100">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 dark:hover:text-neutral-100 transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Multi-Device Cloud Sync</h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Synchronize your accounts, budgets, and categorized statements across desktop and mobile.
            </p>
          </div>
        </div>

        {/* Current Device Vault Code Card */}
        <div className="p-4 bg-slate-50 dark:bg-neutral-950/90 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-neutral-400">Your Unique Sync Code:</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> End-to-end Vault
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700/80 rounded-lg p-3 shadow-xs">
            <span className="text-2xl font-bold font-mono tracking-widest text-emerald-600 dark:text-emerald-400">
              {vaultData.syncCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 text-xs font-medium rounded-md transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 pt-1">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-slate-400 dark:text-neutral-500" />
              <span>Desktop</span>
              <span className="text-slate-400 dark:text-neutral-600">⇄</span>
              <Smartphone className="w-4 h-4 text-slate-400 dark:text-neutral-500" />
              <span>Mobile Phone</span>
            </div>

            <button
              type="button"
              disabled={isSyncing}
              onClick={onManualSync}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>

          {lastSyncedAt && (
            <p className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono">
              Last synced: {new Date(lastSyncedAt).toLocaleTimeString()} · {vaultData.accounts.length} accounts · {vaultData.transactions.length} records
            </p>
          )}
        </div>

        {/* Pair / Link Another Device */}
        <div className="p-4 bg-slate-50 dark:bg-neutral-950/50 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-3">
          <h3 className="text-xs font-semibold text-slate-800 dark:text-neutral-200">Pair With An Existing Device</h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
            Enter the 6-character Sync Code displayed on your other device to link this browser to your existing vault.
          </p>

          <form onSubmit={handleConnect} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. VF-8492"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              className="flex-1 bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs font-mono tracking-wider text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isConnecting || !inputCode.trim()}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isConnecting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
              <span>Link Device</span>
            </button>
          </form>

          {connectStatus && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">{connectStatus}</p>
          )}
        </div>

        {/* Close */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

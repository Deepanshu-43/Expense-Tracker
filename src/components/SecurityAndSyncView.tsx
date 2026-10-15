import React, { useState } from 'react';
import { VaultData, BiometricSecurityState, CurrencyCode } from '../types/finance';
import { CURRENCIES, formatCurrency } from '../constants/currencies';
import { isBiometricAvailable, registerBiometrics, verifyBiometrics, hashPin } from '../services/biometrics';
import { Cloud, Fingerprint, Lock, Shield, Check, Smartphone, Laptop, RefreshCw, KeyRound, Globe, ArrowRight } from 'lucide-react';

interface SecurityAndSyncViewProps {
  vaultData: VaultData;
  securityState: BiometricSecurityState;
  onUpdateSecurityState: (updated: Partial<BiometricSecurityState>) => void;
  onLockVault: () => void;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  onManualSync: () => Promise<void>;
  onConnectVaultCode: (code: string) => Promise<{ success: boolean; message?: string }>;
  baseCurrency: CurrencyCode;
}

export const SecurityAndSyncView: React.FC<SecurityAndSyncViewProps> = ({
  vaultData,
  securityState,
  onUpdateSecurityState,
  onLockVault,
  isSyncing,
  lastSyncedAt,
  onManualSync,
  onConnectVaultCode,
  baseCurrency,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [connectStatus, setConnectStatus] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // PIN settings
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinMsg, setPinMsg] = useState<string | null>(null);

  // Biometric status
  const [bioMsg, setBioMsg] = useState<string | null>(null);
  const [isBioTesting, setIsBioTesting] = useState(false);

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
      setConnectStatus(res.message || 'Failed to connect. Please verify code.');
    }
  };

  const handleEnrollBiometrics = async () => {
    setIsBioTesting(true);
    setBioMsg(null);

    const available = await isBiometricAvailable();
    if (!available) {
      setBioMsg('Hardware platform authenticator (Touch ID, Face ID, Windows Hello) not detected.');
      setIsBioTesting(false);
      return;
    }

    const res = await registerBiometrics('VaultFlow User');
    setIsBioTesting(false);

    if (res.success && res.credentialId) {
      onUpdateSecurityState({
        isBiometricEnrolled: true,
        credentialId: res.credentialId,
      });
      setBioMsg('Biometrics successfully enrolled!');
    } else {
      setBioMsg(res.error || 'Biometric enrollment cancelled.');
    }
  };

  const handleTestBiometrics = async () => {
    setIsBioTesting(true);
    setBioMsg(null);
    const res = await verifyBiometrics(securityState.credentialId);
    setIsBioTesting(false);
    if (res.success) {
      setBioMsg('Biometric authentication verified successfully!');
    } else {
      setBioMsg(res.error || 'Biometric verification unsuccessful.');
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length < 4 || pinInput.length > 8) {
      setPinMsg('PIN must be 4 to 8 digits.');
      return;
    }
    if (pinInput !== pinConfirm) {
      setPinMsg('PINs do not match.');
      return;
    }

    const hashed = await hashPin(pinInput);
    onUpdateSecurityState({
      isPinSet: true,
      pinHash: hashed,
    });
    setPinMsg('Master PIN saved and hashed.');
    setPinInput('');
    setPinConfirm('');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Cloud Sync Hub */}
        <div className="bg-white/80 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800/80">
            <div className="flex items-center gap-2.5">
              <Cloud className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100">Multi-Device Cloud Sync</h2>
            </div>
            <button
              type="button"
              disabled={isSyncing}
              onClick={onManualSync}
              className="flex items-center gap-1.5 text-xs px-3 py-1 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 rounded-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
            Your transactions, accounts, and budgets stay continuously synchronized across phone, tablet, and desktop without manual file transfers.
          </p>

          {/* Current Device Vault Code Card */}
          <div className="p-4 bg-slate-50 dark:bg-neutral-950/80 border border-slate-200 dark:border-neutral-800 rounded-lg space-y-2">
            <span className="text-[11px] text-slate-500 dark:text-neutral-400">Vault Pairing Code for Other Devices:</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold font-mono tracking-widest text-emerald-600 dark:text-emerald-400">
                {vaultData.syncCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-xs px-3 py-1 bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 rounded transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : null}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-neutral-500 pt-1">
              <div className="flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </div>
              <span>⇄</span>
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Browser</span>
              </div>
            </div>
            {lastSyncedAt && (
              <p className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono pt-1">
                Last cloud update: {new Date(lastSyncedAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Connect Another Device Vault */}
          <div className="pt-2 space-y-2">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-neutral-200">Connect An Existing Vault</h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Enter the Sync Code from another device to merge accounts and records:
            </p>
            <form onSubmit={handleConnect} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. VF-2819"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="flex-1 bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-3 py-1.5 text-xs font-mono tracking-wider text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isConnecting || !inputCode.trim()}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs rounded transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isConnecting ? 'Linking...' : 'Connect'}
              </button>
            </form>
            {connectStatus && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{connectStatus}</p>
            )}
          </div>
        </div>

        {/* 2. Biometric Security Hub */}
        <div className="bg-white/80 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800/80">
            <div className="flex items-center gap-2.5">
              <Fingerprint className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100">Biometric & Vault Protection</h2>
            </div>
            <button
              type="button"
              onClick={onLockVault}
              className="flex items-center gap-1.5 text-xs px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 rounded-md transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Now</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
            Hardware-backed biometric authentication via WebAuthn API (Apple Touch ID, Face ID, Windows Hello, Android Biometrics).
          </p>

          {/* Biometrics Status */}
          <div className="p-4 bg-slate-50 dark:bg-neutral-950/80 border border-slate-200 dark:border-neutral-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-neutral-200">Hardware Sensor</p>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  {securityState.isBiometricEnrolled
                    ? 'Active · Enrolled on this device'
                    : 'Not enrolled'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {securityState.isBiometricEnrolled ? (
                  <>
                    <button
                      type="button"
                      disabled={isBioTesting}
                      onClick={handleTestBiometrics}
                      className="text-xs px-2.5 py-1 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 rounded cursor-pointer"
                    >
                      {isBioTesting ? 'Prompting...' : 'Test Sensor'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateSecurityState({ isBiometricEnrolled: false, credentialId: undefined })}
                      className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 rounded border border-slate-200 dark:border-neutral-800 cursor-pointer"
                    >
                      Disable
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={isBioTesting}
                    onClick={handleEnrollBiometrics}
                    className="text-xs px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold rounded cursor-pointer"
                  >
                    {isBioTesting ? 'Prompting...' : 'Enroll Sensor'}
                  </button>
                )}
              </div>
            </div>

            {bioMsg && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{bioMsg}</p>
            )}
          </div>

          {/* Master PIN Settings */}
          <div className="p-4 bg-slate-50 dark:bg-neutral-950/80 border border-slate-200 dark:border-neutral-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 dark:text-neutral-200">Master Passcode / PIN</span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-500">
                {securityState.isPinSet ? 'SHA-256 Protected' : 'Default (1234)'}
              </span>
            </div>

            <form onSubmit={handleSavePin} className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="password"
                  placeholder="New PIN (4-8 digits)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-1 text-slate-900 dark:text-neutral-100 font-mono text-center tracking-widest"
                />
                <input
                  type="password"
                  placeholder="Confirm New PIN"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                  className="bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-1 text-slate-900 dark:text-neutral-100 font-mono text-center tracking-widest"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!pinInput || !pinConfirm}
                  className="px-3 py-1 bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 rounded font-medium disabled:opacity-40 cursor-pointer"
                >
                  Update PIN
                </button>
              </div>
            </form>
            {pinMsg && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{pinMsg}</p>
            )}
          </div>

          {/* Auto Lock Configuration */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-600 dark:text-neutral-400">Auto-lock Inactivity Timeout:</span>
            <select
              value={securityState.autoLockMinutes}
              onChange={(e) => onUpdateSecurityState({ autoLockMinutes: parseInt(e.target.value, 10) })}
              className="bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-2 py-1 text-slate-800 dark:text-neutral-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="0">Immediately on tab blur</option>
              <option value="1">After 1 minute idle</option>
              <option value="5">After 5 minutes idle</option>
              <option value="15">After 15 minutes idle</option>
              <option value="-1">Never auto-lock</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Multi-Currency Spot Rates Matrix (Includes INC) */}
      <div className="bg-white/80 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 space-y-3 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800/80">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100">Live Multi-Currency Matrix (USD, EUR, INR, INC, etc.)</h2>
          </div>
          <span className="text-xs font-mono text-slate-600 dark:text-neutral-400 font-semibold">Base: {baseCurrency}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
          {Object.values(CURRENCIES).map((c) => {
            const inTarget = (1 / CURRENCIES[baseCurrency].rateToUSD) * c.rateToUSD;

            return (
              <div key={c.code} className="p-3 bg-slate-50 dark:bg-neutral-950/70 border border-slate-200 dark:border-neutral-800 rounded-lg text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400">
                  <span className="font-semibold text-slate-800 dark:text-neutral-200">{c.code}</span>
                  <span className="font-mono">{c.symbol}</span>
                </div>
                <div className="mt-2 text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-neutral-100">
                  {inTarget.toFixed(c.code === 'JPY' ? 1 : 3)}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-neutral-500 mt-0.5 truncate">
                  1 {baseCurrency} = {inTarget.toFixed(2)} {c.code}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

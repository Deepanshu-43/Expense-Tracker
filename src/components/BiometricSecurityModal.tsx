import React, { useState } from 'react';
import { BiometricSecurityState } from '../types/finance';
import { isBiometricAvailable, registerBiometrics, verifyBiometrics, hashPin, verifyPin } from '../services/biometrics';
import { Fingerprint, Lock, KeyRound, Shield, Check, AlertCircle, X } from 'lucide-react';

interface BiometricSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  securityState: BiometricSecurityState;
  onUpdateSecurityState: (updated: Partial<BiometricSecurityState>) => void;
  onLockNow: () => void;
}

export const BiometricSecurityModal: React.FC<BiometricSecurityModalProps> = ({
  isOpen,
  onClose,
  securityState,
  onUpdateSecurityState,
  onLockNow,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinMessage, setPinMessage] = useState<string | null>(null);
  const [enrollMsg, setEnrollMsg] = useState<string | null>(null);
  const [isLoadingBiometric, setIsLoadingBiometric] = useState(false);

  if (!isOpen) return null;

  const handleEnrollBiometrics = async () => {
    setIsLoadingBiometric(true);
    setEnrollMsg(null);

    const hasSupport = await isBiometricAvailable();
    if (!hasSupport) {
      setEnrollMsg('Device authenticator (TouchID / FaceID) is not supported or not configured in this browser.');
      setIsLoadingBiometric(false);
      return;
    }

    const res = await registerBiometrics('VaultFlow Owner');
    setIsLoadingBiometric(false);

    if (res.success && res.credentialId) {
      onUpdateSecurityState({
        isBiometricEnrolled: true,
        credentialId: res.credentialId,
      });
      setEnrollMsg('Biometrics successfully enrolled and paired with your hardware key!');
    } else {
      setEnrollMsg(res.error || 'Biometric enrollment cancelled.');
    }
  };

  const handleDisableBiometrics = () => {
    onUpdateSecurityState({
      isBiometricEnrolled: false,
      credentialId: undefined,
    });
    setEnrollMsg('Biometric authentication disabled.');
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length < 4 || pinInput.length > 8) {
      setPinMessage('PIN must be between 4 and 8 digits.');
      return;
    }
    if (pinInput !== pinConfirm) {
      setPinMessage('PINs do not match.');
      return;
    }

    const hashed = await hashPin(pinInput);
    onUpdateSecurityState({
      isPinSet: true,
      pinHash: hashed,
    });
    setPinMessage('Master PIN updated and cryptographically hashed.');
    setPinInput('');
    setPinConfirm('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 shadow-2xl relative space-y-5 text-slate-900 dark:text-neutral-100">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 dark:hover:text-neutral-100 transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Biometric & Hardware Security</h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Protect your financial records with WebAuthn Passkeys and Master PIN lock.
            </p>
          </div>
        </div>

        {/* Section 1: Biometrics Hardware */}
        <div className="p-4 bg-slate-50 dark:bg-neutral-950/80 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-neutral-200 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Touch ID / Face ID / Windows Hello
              </p>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                {securityState.isBiometricEnrolled
                  ? 'Active · Verified device authenticator'
                  : 'Enroll your device sensor for instant 1-tap unlock'}
              </p>
            </div>

            {securityState.isBiometricEnrolled ? (
              <button
                type="button"
                onClick={handleDisableBiometrics}
                className="text-xs px-2.5 py-1 bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-300 rounded-md transition-colors cursor-pointer"
              >
                Disable
              </button>
            ) : (
              <button
                type="button"
                disabled={isLoadingBiometric}
                onClick={handleEnrollBiometrics}
                className="text-xs px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold rounded-md transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>{isLoadingBiometric ? 'Prompting...' : 'Enroll Sensor'}</span>
              </button>
            )}
          </div>

          {enrollMsg && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{enrollMsg}</p>
          )}
        </div>

        {/* Section 2: Master PIN */}
        <div className="p-4 bg-slate-50 dark:bg-neutral-950/80 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900 dark:text-neutral-200 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Master PIN Fallback
            </span>
            <span className="text-[11px] text-slate-500 dark:text-neutral-500 font-mono">
              {securityState.isPinSet ? 'PIN Enabled' : 'Not Set'}
            </span>
          </div>

          <form onSubmit={handleSavePin} className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="password"
                maxLength={8}
                placeholder="4-8 Digit PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-slate-900 dark:text-neutral-100 font-mono text-center tracking-widest"
              />
              <input
                type="password"
                maxLength={8}
                placeholder="Confirm PIN"
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-slate-900 dark:text-neutral-100 font-mono text-center tracking-widest"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!pinInput || !pinConfirm}
                className="px-3 py-1 bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 rounded font-medium disabled:opacity-40 transition-colors cursor-pointer"
              >
                Save Master PIN
              </button>
            </div>
          </form>

          {pinMessage && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{pinMessage}</p>
          )}
        </div>

        {/* Section 3: Auto-lock Timeout */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-neutral-400">Auto-lock Vault:</span>
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

        {/* Lock Vault Now CTA */}
        <div className="pt-2 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onLockNow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Vault Immediately</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const BiometricLockScreen: React.FC<{
  securityState: BiometricSecurityState;
  onUnlock: () => void;
}> = ({ securityState, onUnlock }) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleBiometricUnlock = async () => {
    setIsVerifying(true);
    setErrorMsg(null);

    const res = await verifyBiometrics(securityState.credentialId);
    setIsVerifying(false);

    if (res.success) {
      onUnlock();
    } else {
      setErrorMsg(res.error || 'Biometric verification failed. Please use your PIN.');
    }
  };

  const handlePinUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityState.pinHash) {
      if (pinInput === '1234') {
        onUnlock();
        return;
      }
      setErrorMsg('Incorrect PIN. Default is 1234.');
      return;
    }

    const isValid = await verifyPin(pinInput, securityState.pinHash);
    if (isValid) {
      onUnlock();
    } else {
      setErrorMsg('Incorrect PIN. Please re-enter.');
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 dark:bg-neutral-950/95 backdrop-blur-md">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-neutral-100">VaultFlow Locked</h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Biometric or Master PIN required to access financial accounts.
          </p>
        </div>

        {/* Biometrics Action if Enrolled or Supported */}
        {securityState.isBiometricEnrolled ? (
          <button
            type="button"
            disabled={isVerifying}
            onClick={handleBiometricUnlock}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            <Fingerprint className="w-4 h-4" />
            <span>{isVerifying ? 'Awaiting Sensor...' : 'Unlock with Biometrics'}</span>
          </button>
        ) : null}

        {/* PIN Input */}
        <form onSubmit={handlePinUnlock} className="space-y-3">
          <label className="block text-xs text-slate-600 dark:text-neutral-400">
            {securityState.isBiometricEnrolled ? 'Or enter Master PIN:' : 'Enter 4-digit Master PIN (Default: 1234):'}
          </label>
          <input
            type="password"
            maxLength={8}
            autoFocus
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-center font-mono text-xl tracking-widest text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-emerald-500"
          />

          <button
            type="submit"
            disabled={!pinInput}
            className="w-full py-2.5 bg-slate-900 dark:bg-neutral-800 hover:bg-slate-800 dark:hover:bg-neutral-700 text-white dark:text-neutral-100 text-xs font-semibold rounded-xl transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
          >
            Unlock Vault
          </button>
        </form>

        {errorMsg && (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{errorMsg}</p>
        )}
      </div>
    </div>
  );
};

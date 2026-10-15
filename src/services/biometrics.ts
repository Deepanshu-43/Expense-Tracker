// Biometric and PIN authentication service using WebAuthn & Web Crypto API

export async function isBiometricAvailable(): Promise<boolean> {
  if (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential &&
    typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  ) {
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }
  return false;
}

export async function registerBiometrics(username: string = 'VaultFlow User'): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  try {
    if (!window.PublicKeyCredential) {
      return { success: false, error: 'WebAuthn not supported on this browser' };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'VaultFlow Finance',
        id: window.location.hostname || 'localhost',
      },
      user: {
        id: userId,
        name: username,
        displayName: username,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // built-in biometric sensor (TouchID, FaceID, Windows Hello)
        userVerification: 'required',
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential;

    if (credential) {
      const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      return { success: true, credentialId };
    }
    return { success: false, error: 'Biometric registration failed' };
  } catch (err: any) {
    console.warn('Biometric registration error:', err);
    return { success: false, error: err?.message || 'Biometric registration was cancelled or unsupported' };
  }
}

export async function verifyBiometrics(savedCredentialId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!window.PublicKeyCredential) {
      return { success: false, error: 'Biometrics unavailable' };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const allowCredentials: PublicKeyCredentialDescriptor[] = [];
    if (savedCredentialId) {
      try {
        const rawId = Uint8Array.from(atob(savedCredentialId), (c) => c.charCodeAt(0));
        allowCredentials.push({
          type: 'public-key',
          id: rawId,
        });
      } catch (e) {
        // Fallback to open platform prompt
      }
    }

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      userVerification: 'required',
      rpId: window.location.hostname || 'localhost',
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    if (assertion) {
      return { success: true };
    }
    return { success: false, error: 'Biometric verification failed' };
  } catch (err: any) {
    console.warn('Biometric verify error:', err);
    return { success: false, error: err?.message || 'Authentication failed or dismissed' };
  }
}

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + '_vaultflow_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(inputPin: string, storedHash: string): Promise<boolean> {
  const computed = await hashPin(inputPin);
  return computed === storedHash;
}

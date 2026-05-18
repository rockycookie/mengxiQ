const SALT_KEY = 'mengxiq_enc_salt';
const PASSPHRASE_KEY = 'mengxiq_enc_passphrase';
const ENC_PREFIX = 'ENC:v1:';

function getOrCreateSalt(): Uint8Array<ArrayBuffer> {
  const stored = localStorage.getItem(SALT_KEY);
  if (stored) {
    return new Uint8Array(JSON.parse(stored) as number[]) as Uint8Array<ArrayBuffer>;
  }
  const salt = crypto.getRandomValues(new Uint8Array(16)) as Uint8Array<ArrayBuffer>;
  localStorage.setItem(SALT_KEY, JSON.stringify(Array.from(salt)));
  return salt;
}

async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const salt = getOrCreateSalt();
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export function setSessionPassphrase(passphrase: string): void {
  sessionStorage.setItem(PASSPHRASE_KEY, passphrase);
}

export function getSessionPassphrase(): string | null {
  return sessionStorage.getItem(PASSPHRASE_KEY);
}

export function clearSessionPassphrase(): void {
  sessionStorage.removeItem(PASSPHRASE_KEY);
}

export function hasSessionPassphrase(): boolean {
  return sessionStorage.getItem(PASSPHRASE_KEY) !== null;
}

export async function encryptText(plaintext: string): Promise<string> {
  const passphrase = getSessionPassphrase();
  if (!passphrase) throw new Error('No passphrase set');
  const key = await deriveKey(passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );
  const ivB64 = btoa(String.fromCharCode(...Array.from(iv)));
  const ctB64 = btoa(String.fromCharCode(...Array.from(new Uint8Array(ciphertext))));
  return `${ENC_PREFIX}${ivB64}:${ctB64}`;
}

export async function decryptText(encrypted: string): Promise<string> {
  const passphrase = getSessionPassphrase();
  if (!passphrase) throw new Error('No passphrase set');
  if (!encrypted.startsWith(ENC_PREFIX)) throw new Error('Not encrypted format');
  const rest = encrypted.slice(ENC_PREFIX.length);
  const colonIdx = rest.indexOf(':');
  if (colonIdx === -1) throw new Error('Invalid encrypted format');
  const ivB64 = rest.slice(0, colonIdx);
  const ctB64 = rest.slice(colonIdx + 1);
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0));
  const key = await deriveKey(passphrase);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plainBuffer);
}

export function isEncryptedFormat(text: string): boolean {
  return text.startsWith(ENC_PREFIX);
}

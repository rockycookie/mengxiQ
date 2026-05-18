const SALT_KEY = 'mengxiq_enc_salt';
const PASSPHRASE_KEY = 'mengxiq_enc_passphrase';
const HINT_KEY = 'mengxiq_enc_hint';
const ENC_PREFIX = 'ENC:v1:';

const LOVELY_NAMES: string[] = [
  'Aria', 'Aurora', 'Blossom', 'Breeze', 'Camellia', 'Cascade', 'Celeste', 'Cherry',
  'Cinnamon', 'Clover', 'Coral', 'Cosmo', 'Crystal', 'Dahlia', 'Dawn', 'Dew',
  'Ember', 'Fable', 'Fawn', 'Fern', 'Finch', 'Flora', 'Flutter', 'Fog',
  'Frost', 'Gale', 'Gem', 'Ginger', 'Glow', 'Harbor', 'Hazel', 'Honey',
  'Iris', 'Ivy', 'Jade', 'Jasmine', 'Juniper', 'Lark', 'Lavender', 'Lily',
  'Linden', 'Luna', 'Lush', 'Maple', 'Meadow', 'Mellow', 'Merry', 'Mist',
  'Misty', 'Mocha', 'Moss', 'Muse', 'Nectar', 'Nestle', 'Nimbus', 'Nova',
  'Opal', 'Orchid', 'Patchwork', 'Pearl', 'Petal', 'Pine', 'Pixel', 'Plum',
  'Poppy', 'Primrose', 'Quill', 'Rain', 'Rainbow', 'Ripple', 'Robin', 'Rose',
  'Rosemary', 'Ruby', 'Sage', 'Sable', 'Sandy', 'Satin', 'Shine', 'Silver',
  'Sky', 'Snowflake', 'Soleil', 'Sparrow', 'Sprig', 'Sprout', 'Starling', 'Storm',
  'Summer', 'Sunny', 'Tansy', 'Teal', 'Terra', 'Thistle', 'Twilight', 'Velvet',
  'Viola', 'Wallow', 'Willow', 'Wren',
];

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
  sessionStorage.removeItem(HINT_KEY);
}

export function hasSessionPassphrase(): boolean {
  return sessionStorage.getItem(PASSPHRASE_KEY) !== null;
}

export function setSessionHint(hint: string): void {
  sessionStorage.setItem(HINT_KEY, hint);
}

export function getSessionHint(): string | null {
  return sessionStorage.getItem(HINT_KEY);
}

export async function getPassphraseHint(passphrase: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(passphrase));
  const bytes = new Uint8Array(hashBuffer);
  const index = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return LOVELY_NAMES[index % LOVELY_NAMES.length];
}

export async function encryptText(plaintext: string): Promise<string> {
  const passphrase = getSessionPassphrase();
  if (!passphrase) throw new Error('No passphrase set');
  const hint = getSessionHint() ?? await getPassphraseHint(passphrase);
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
  // Format: ENC:v1:<hint>:<iv>:<ct>
  return `${ENC_PREFIX}${hint}:${ivB64}:${ctB64}`;
}

export async function decryptText(encrypted: string): Promise<string> {
  const passphrase = getSessionPassphrase();
  if (!passphrase) throw new Error('No passphrase set');
  if (!encrypted.startsWith(ENC_PREFIX)) throw new Error('Not encrypted format');
  const rest = encrypted.slice(ENC_PREFIX.length);
  const parts = rest.split(':');
  let ivB64: string, ctB64: string;
  if (parts.length === 3) {
    // New format: hint:iv:ct
    ivB64 = parts[1];
    ctB64 = parts[2];
  } else if (parts.length === 2) {
    // Legacy format: iv:ct (no hint)
    ivB64 = parts[0];
    ctB64 = parts[1];
  } else {
    throw new Error('Invalid encrypted format');
  }
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

export function getHintFromEncrypted(text: string): string | null {
  if (!text.startsWith(ENC_PREFIX)) return null;
  const rest = text.slice(ENC_PREFIX.length);
  const parts = rest.split(':');
  // New format has 3 parts: hint:iv:ct
  return parts.length === 3 ? parts[0] : null;
}

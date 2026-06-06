# Fix: Encrypted Items Fail to Decrypt

## Problem

Encrypted to-do items cannot be decrypted even with the correct passphrase. The error shown is:

```
Wrong passphrase — unable to decrypt.
```

This can happen in two scenarios:

### Scenario A — Different device or browser
A different device or browser has no salt in its `localStorage` → generates a new random one → produces a different key → decryption fails.

### Scenario B — Same device, port changed (most likely cause)
`localStorage` is scoped to the browser **origin** (`protocol + hostname + port`). If the app's port changed (e.g., from `:3019` to `:3069` after the nginx migration), the new origin has no salt → same result.

**Root cause (both cases):** `deriveKey` (in `src/utils/encryption.ts`) derives the AES key from both the passphrase *and* a random salt stored in `localStorage` under `mengxiq_enc_salt`. If that salt is missing or different, decryption fails.

## Data Recovery

### Scenario B: Port changed on the same device (e.g. after nginx migration)

The salt is still in the browser — just under the old origin. Copy it to the new one:

1. In Chrome/Firefox, navigate to the **old URL** (e.g. `https://raspberrypi.local:3019`) → open DevTools → Console:
   ```js
   localStorage.getItem('mengxiq_enc_salt')
   ```
   Copy the output (a JSON array like `[12, 34, 56, ...]`).

2. Navigate to the **new URL** (e.g. `https://raspberrypi.local:3069`) → open DevTools → Console:
   ```js
   localStorage.setItem('mengxiq_enc_salt', '<paste value here>')
   ```

Refresh the page — existing encrypted items will decrypt correctly.

### Scenario A: Different device or browser

**Option A — Re-encrypt from the original device (recommended)**

Open the app on the original device, edit and save each encrypted item. Once the fix below is applied, the new format embeds the salt inside the ciphertext string, so the item will decrypt correctly on any device.

**Option B — Copy the salt to the new device**

1. On the **original device**, open DevTools → Console:
   ```js
   localStorage.getItem('mengxiq_enc_salt')
   ```
   Copy the output (a JSON array like `[12, 34, 56, ...]`).

2. On the **new device**, open DevTools → Console:
   ```js
   localStorage.setItem('mengxiq_enc_salt', '<paste value here>')
   ```

The legacy encrypted items will now decrypt correctly on that device.

### If the original device's data is gone

The salt is lost and the encrypted data is **unrecoverable**. AES-GCM with a unique salt cannot be reversed without both the passphrase and the original salt.

## Fix: Embed Salt in the Ciphertext String

Change the encrypted format from:

```
ENC:v1:<hint>:<iv>:<ct>           ← salt lives only in localStorage
```

to:

```
ENC:v1:<hint>:<salt>:<iv>:<ct>    ← salt travels with the data
```

### Changes to `src/utils/encryption.ts`

**1. Pass salt as a parameter to `deriveKey`** (instead of reading from localStorage):
```ts
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey>
```

**2. `encryptText`** — generate/retrieve salt and embed it in the output string:
```ts
const salt = getOrCreateSalt();
const key = await deriveKey(passphrase, salt);
// ...
const saltB64 = btoa(String.fromCharCode(...Array.from(salt)));
return `${ENC_PREFIX}${hint}:${saltB64}:${ivB64}:${ctB64}`;
```

**3. `decryptText`** — extract salt from the string, fall back to localStorage for legacy items:
```ts
if (parts.length === 4) {
  // Current format: hint:salt:iv:ct
  salt = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));
  ivB64 = parts[2]; ctB64 = parts[3];
} else if (parts.length === 3) {
  // Legacy format: hint:iv:ct — salt in localStorage
  salt = getOrCreateSalt();
  ivB64 = parts[1]; ctB64 = parts[2];
} else if (parts.length === 2) {
  // Oldest legacy format: iv:ct — salt in localStorage
  salt = getOrCreateSalt();
  ivB64 = parts[0]; ctB64 = parts[1];
}
const key = await deriveKey(passphrase, salt);
```

**4. `getHintFromEncrypted`** — handle 4-part format:
```ts
return parts.length >= 3 ? parts[0] : null;
```

### Backwards compatibility

| Format | Parts after `ENC:v1:` | Salt source | Decryptable on any device? |
|---|---|---|---|
| Current (after fix) | 4 (`hint:salt:iv:ct`) | Embedded | ✅ Yes |
| Legacy | 3 (`hint:iv:ct`) | localStorage | ❌ Original device only |
| Oldest legacy | 2 (`iv:ct`) | localStorage | ❌ Original device only |

Legacy items continue to work on the original device unchanged. Re-encrypting them (edit + save) upgrades them to the new format.

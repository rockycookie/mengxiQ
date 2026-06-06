import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { hasSessionPassphrase, decryptText, getHintFromEncrypted } from '../utils/encryption';

type RevealState = 'hidden' | 'loading' | 'revealed' | 'error';

function EncryptedDescriptionView({ encryptedText }: { encryptedText: string }): JSX.Element {
  const [state, setState] = useState<RevealState>('hidden');
  const [decryptedText, setDecryptedText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const hint = getHintFromEncrypted(encryptedText);

  useEffect(() => {
    function onPassphraseSet() {
      setState(prev => (prev === 'error' ? 'hidden' : prev));
    }
    window.addEventListener('mengxiq:passphraseSet', onPassphraseSet);
    return () => window.removeEventListener('mengxiq:passphraseSet', onPassphraseSet);
  }, []);

  async function handleReveal() {
    if (state === 'revealed') {
      setState('hidden');
      return;
    }
    if (!hasSessionPassphrase()) {
      setState('error');
      setErrorMsg('Set a passphrase first (🔒 Passphrase button in header)');
      return;
    }
    setState('loading');
    try {
      const plaintext = await decryptText(encryptedText);
      setDecryptedText(plaintext);
      setState('revealed');
    } catch (e) {
      setState('error');
      setErrorMsg('Wrong passphrase — unable to decrypt.');
    }
  }

  if (state === 'hidden') {
    return (
      <div
        onClick={handleReveal}
        className="cursor-pointer flex items-center gap-2 text-gray-400 italic hover:text-gray-600 transition-colors duration-150 select-none py-1"
      >
        <span>🔒</span>
        <span className="text-sm">
          Encrypted{hint ? <> · <span className="not-italic font-medium text-gray-500">{hint}</span></> : ''} — click to reveal
        </span>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="flex items-center gap-2 text-gray-400 italic py-1">
        <span>🔒</span>
        <span className="text-sm">Decrypting...</span>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex items-center gap-2 py-1">
        <span>🔒</span>
        {hint && <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{hint}</span>}
        <span className="text-sm text-red-600">{errorMsg}</span>
        <button
          onClick={() => setState('hidden')}
          className="text-xs text-gray-500 hover:text-gray-700 underline ml-2"
        >
          Dismiss
        </button>
      </div>
    );
  }

  // revealed
  return (
    <div>
      <div className="prose prose-base max-w-full overflow-x-auto">
        <ReactMarkdown
          components={{
            a: ({ node: _node, ...props }) => (
              <a {...props} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" />
            ),
            code: ({ node: _node, ...props }) => (
              <code {...props} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono break-all max-w-full inline-block" />
            ),
            pre: ({ node: _node, ...props }) => (
              <pre {...props} className="bg-gray-100 p-3 rounded overflow-x-auto my-2 whitespace-pre max-w-full" />
            )
          }}
        >
          {decryptedText}
        </ReactMarkdown>
      </div>
      <button
        onClick={() => setState('hidden')}
        className="mt-1 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
      >
        🔒 Hide
      </button>
    </div>
  );
}

export default EncryptedDescriptionView;

import { useState, useEffect } from 'react';
import { hasSessionPassphrase, setSessionPassphrase, clearSessionPassphrase, getSessionPassphrase, getPassphraseHint, setSessionHint, getSessionHint } from '../utils/encryption';

function PassphraseButton(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [passphraseSet, setPassphraseSet] = useState(hasSessionPassphrase());
  const [inputValue, setInputValue] = useState('');
  const [hintInput, setHintInput] = useState('');
  const [autoHintPreview, setAutoHintPreview] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    const existing = getSessionPassphrase();
    if (existing) {
      const stored = getSessionHint();
      if (stored) {
        setHint(stored);
      } else {
        getPassphraseHint(existing).then(setHint);
      }
    }
  }, []);

  function handleSet() {
    if (!inputValue.trim()) {
      alert('Passphrase cannot be empty');
      return;
    }
    setSessionPassphrase(inputValue);
    const finalHint = hintInput.trim() || autoHintPreview || '';
    setSessionHint(finalHint);
    getPassphraseHint(inputValue).then(h => {
      setHint(hintInput.trim() || h);
      setPassphraseSet(true);
      setInputValue('');
      setHintInput('');
      setAutoHintPreview(null);
      setIsOpen(false);
      window.dispatchEvent(new CustomEvent('mengxiq:passphraseSet'));
    });
  }

  function handleClear() {
    clearSessionPassphrase();
    setPassphraseSet(false);
    setHint(null);
    setAutoHintPreview(null);
    setHintInput('');
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={passphraseSet ? 'Passphrase set — click to manage' : 'No passphrase set — click to set'}
        className={`px-4 py-2 rounded-lg font-medium transition-all duration-150 whitespace-nowrap ${
          passphraseSet
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {passphraseSet
          ? <>🔓 {hint ? <span className="font-semibold">{hint}</span> : 'Passphrase'}</>
          : '🔒 Passphrase'
        }
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[280px]">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>

          {passphraseSet ? (
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">🔓 Passphrase is active this session</p>
              {hint && (
                <p className="text-xs text-gray-500 mb-3">
                  Hint: <span className="font-semibold text-gray-700">{hint}</span>
                </p>
              )}
              <button
                onClick={handleClear}
                className="w-full px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-sm font-medium transition-colors duration-150"
              >
                🔒 Clear passphrase
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 font-medium">Set session passphrase</p>
              <p className="text-xs text-gray-400">Cleared when you close the tab</p>
              <input
                type="password"
                value={inputValue}
                onChange={e => {
                  setInputValue(e.target.value);
                  if (e.target.value.trim()) {
                    getPassphraseHint(e.target.value).then(setAutoHintPreview);
                  } else {
                    setAutoHintPreview(null);
                  }
                }}
                onKeyDown={e => e.key === 'Enter' && handleSet()}
                placeholder="Enter passphrase..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <div>
                <input
                  type="text"
                  value={hintInput}
                  onChange={e => setHintInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSet()}
                  placeholder={autoHintPreview ? `Auto: ${autoHintPreview}` : 'Custom hint (optional)...'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {autoHintPreview && !hintInput.trim() && (
                  <p className="text-xs text-gray-400 mt-1 pl-1">
                    Leave blank to use auto-hint: <span className="font-medium text-gray-600">{autoHintPreview}</span>
                  </p>
                )}
              </div>
              <button
                onClick={handleSet}
                className="w-full px-3 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-md text-sm font-medium transition-colors duration-150"
              >
                ✓ Set passphrase
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PassphraseButton;

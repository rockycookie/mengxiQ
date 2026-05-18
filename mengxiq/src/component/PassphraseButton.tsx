import { useState } from 'react';
import { hasSessionPassphrase, setSessionPassphrase, clearSessionPassphrase } from '../utils/encryption';

function PassphraseButton(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [passphraseSet, setPassphraseSet] = useState(hasSessionPassphrase());
  const [inputValue, setInputValue] = useState('');

  function handleSet() {
    if (!inputValue.trim()) {
      alert('Passphrase cannot be empty');
      return;
    }
    setSessionPassphrase(inputValue);
    setPassphraseSet(true);
    setInputValue('');
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('mengxiq:passphraseSet'));
  }

  function handleClear() {
    clearSessionPassphrase();
    setPassphraseSet(false);
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
        {passphraseSet ? '🔓 Passphrase' : '🔒 Passphrase'}
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
              <p className="text-sm text-green-700 font-medium mb-3">🔓 Passphrase is active this session</p>
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
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSet()}
                placeholder="Enter passphrase..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
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

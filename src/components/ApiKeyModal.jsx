import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, ShieldCheck, HelpCircle, X, Check, AlertCircle } from 'lucide-react';
import { validateApiKey } from '../services/gemini';

export default function ApiKeyModal({ isOpen, onClose, onKeySaved, currentKey }) {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null); // 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setKeyInput(currentKey || '');
      setValidationResult(null);
      setErrorMessage('');
    }
  }, [isOpen, currentKey]);

  if (!isOpen) return null;

  const handleTestKey = async (e) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      setValidationResult('error');
      setErrorMessage('Please enter an API Key.');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);
    setErrorMessage('');

    const isValid = await validateApiKey(keyInput.trim());

    setIsValidating(false);
    if (isValid) {
      setValidationResult('success');
    } else {
      setValidationResult('error');
      setErrorMessage('Invalid API Key. Please verify the key and try again.');
    }
  };

  const handleSave = () => {
    localStorage.setItem('gemini_api_key', keyInput.trim());
    onKeySaved(keyInput.trim());
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <h3 className="modal-title">
          <Key size={22} />
          Gemini API Configuration
        </h3>
        <p className="modal-desc">
          AegisScan AI operates directly in your browser. To summarize documents, you'll need to provide a Gemini API Key. Your key is stored securely in your browser's local storage and is never sent to any third-party servers.
        </p>

        <form onSubmit={handleTestKey} className="modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="api-key-input">Gemini API Key</label>
            <div className="form-input-wrapper">
              <input
                id="api-key-input"
                type={showKey ? 'text' : 'password'}
                className="form-input"
                placeholder="AIzaSy..."
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value);
                  if (validationResult) setValidationResult(null);
                }}
                disabled={isValidating}
              />
              <button
                type="button"
                className="form-input-toggle-btn"
                onClick={() => setShowKey(!showKey)}
                tabIndex="-1"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="key-help-link"
            >
              <HelpCircle size={14} />
              Get a free API Key from Google AI Studio
            </a>
          </div>

          {validationResult === 'success' && (
            <div className="inline-alert success">
              <Check size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Key Verified!</strong> You can now save your key and start scanning medical documents.
              </div>
            </div>
          )}

          {validationResult === 'error' && (
            <div className="inline-alert error">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Validation Failed:</strong> {errorMessage}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn secondary"
              onClick={onClose}
              disabled={isValidating}
            >
              Cancel
            </button>
            
            {validationResult === 'success' ? (
              <button
                type="button"
                className="modal-btn primary"
                onClick={handleSave}
              >
                Save & Connect
              </button>
            ) : (
              <button
                type="submit"
                className="modal-btn primary"
                disabled={isValidating || !keyInput.trim()}
              >
                {isValidating ? 'Testing connection...' : 'Test Connection'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import '../styles/components/GlobalHeader.css';

export default function GlobalHeader({ mode = 'PUBLIC RECORD' }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="global-header">
      <div className="header-left">
        <div className="header-logo">
          <div className="logo-mark">
            <svg viewBox="0 0 32 32" className="logo-icon" aria-hidden="true">
              <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="16" cy="16" r="5" fill="currentColor" />
            </svg>
          </div>
          <div className="logo-text">
            <div className="logo-wordmark">STATED</div>
            <div className="logo-tagline">DECLARE → BUILD → PROVE</div>
          </div>
        </div>
      </div>

      <button
        className="header-menu-toggle"
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="menu-bar"></span>
        <span className="menu-bar"></span>
        <span className="menu-bar"></span>
      </button>

      <div className={`header-right ${menuOpen ? 'open' : ''}`}>
        <div className="registry-metadata" aria-label="Registry metadata">
          <div className="metadata-pair">
            <span className="metadata-key">Registry</span>
            <span className="metadata-value">Public</span>
          </div>
          <div className="metadata-pair">
            <span className="metadata-key">Network</span>
            <span className="metadata-value">Monad Testnet</span>
          </div>
          <div className="metadata-pair">
            <span className="metadata-key">Mode</span>
            <span className="metadata-value mode-value">{mode}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

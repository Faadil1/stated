import React from 'react';
import '../styles/components/GlobalHeader.css';

export default function GlobalHeader() {
  return (
    <header className="global-header">
      <div className="header-left">
        <div className="header-logo">
          <div className="logo-mark">S</div>
          <div className="logo-text">
            <div className="logo-wordmark">STATED</div>
            <div className="logo-tagline">Declare → Build → Prove</div>
          </div>
        </div>
      </div>

      <div className="header-center">
        <p className="header-statement">The public record of your intent.</p>
        <div className="header-badges">
          <div className="header-badge">
            <span className="badge-icon">⚓</span>
            <span className="badge-text">ON-CHAIN ANCHORED<br/>Immutable timestamps<br/>on Monad.</span>
          </div>
          <div className="header-badge">
            <span className="badge-icon">◯</span>
            <span className="badge-text">GAP MADE VISIBLE<br/>What you stated vs.<br/>what you showed.</span>
          </div>
          <div className="header-badge">
            <span className="badge-icon">🌐</span>
            <span className="badge-text">PUBLIC BY DEFAULT<br/>Anyone can verify.<br/>No wallet needed.</span>
          </div>
          <div className="header-badge">
            <span className="badge-icon">✓</span>
            <span className="badge-text">HONEST BY DESIGN<br/>Clear about what it does—<br/>and doesn't—prove.</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="header-theme">
          <span className="theme-label">THEME</span>
          <span className="theme-value">Workstation / Monad</span>
        </div>
        <div className="header-swatches">
          <div className="swatch swatch-cream"></div>
          <div className="swatch swatch-rust"></div>
          <div className="swatch swatch-green"></div>
          <div className="swatch swatch-dark"></div>
        </div>
      </div>
    </header>
  );
}

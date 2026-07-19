import React from 'react';
import '../styles/components/GlobalHeader.css';

export default function GlobalHeader() {
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
            <div className="logo-tagline">Declare → Build → Prove</div>
          </div>
        </div>
      </div>

      <div className="header-center">
        <p className="header-statement">The public record of your intent.</p>
        <div className="header-badges">
          <div className="header-badge">
            <span className="badge-icon">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1L2 4v8l6 3 6-3V4L8 1z" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="9" r="2" fill="currentColor"/></svg>
            </span>
            <span className="badge-text">
              <strong>ON-CHAIN ANCHORED</strong>
              <span>Immutable timestamps on Monad.</span>
            </span>
          </div>
          <div className="header-badge">
            <span className="badge-icon">
              <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.5"/></svg>
            </span>
            <span className="badge-text">
              <strong>GAP MADE VISIBLE</strong>
              <span>What you stated vs. what you showed.</span>
            </span>
          </div>
          <div className="header-badge">
            <span className="badge-icon">
              <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/></svg>
            </span>
            <span className="badge-text">
              <strong>PUBLIC BY DEFAULT</strong>
              <span>Anyone can verify. No wallet needed.</span>
            </span>
          </div>
          <div className="header-badge">
            <span className="badge-icon">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8l4 4 6-8" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
            </span>
            <span className="badge-text">
              <strong>HONEST BY DESIGN</strong>
              <span>Clear about what it does—and doesn't—prove.</span>
            </span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="header-theme">
          <span className="theme-label">THEME</span>
          <span className="theme-value">BuildAnything / Monad</span>
        </div>
        <div className="header-swatches">
          <div className="swatch swatch-cream" title="Cream paper"></div>
          <div className="swatch swatch-rust" title="Seal rust"></div>
          <div className="swatch swatch-green" title="Integrity green"></div>
          <div className="swatch swatch-dark" title="Examination dark"></div>
        </div>
      </div>
    </header>
  );
}

import React from 'react';
import '../styles/components/TruthBoundary.css';

export default function TruthBoundary() {
  return (
    <section className="truth-boundary">
      <div className="boundary-header">
        <h2 className="boundary-title">THE RECEIPT EXPERIENCE — LIKE A CASE FILE</h2>
        <p className="boundary-subtitle">What this case file establishes and what it cannot</p>
      </div>

      <div className="boundary-grid">
        <div className="boundary-section establishes">
          <h3 className="section-title">WHAT THIS PROVES</h3>
          <ul className="establishing-list">
            <li>The declaration existed at the recorded on-chain time.</li>
            <li>The attached evidence was recorded at the shown time.</li>
            <li>The stored manifest still matches its recorded hash.</li>
            <li>The listed evidence is what the owner chose to attach.</li>
            <li>The displayed conditions are those originally declared.</li>
          </ul>
        </div>

        <div className="boundary-divider"></div>

        <div className="boundary-section cannot-establish">
          <h3 className="section-title">WHAT THIS DOES NOT PROVE</h3>
          <ul className="cannot-establish-list">
            <li>Whether the builder completed the work.</li>
            <li>Whether the evidence is truthful or authentic.</li>
            <li>Whether the result is high quality.</li>
            <li>Whether attached evidence fully satisfies a condition.</li>
            <li>Whether external links remain available forever.</li>
          </ul>
        </div>
      </div>

      <div className="boundary-seal">
        <p className="seal-title">THE GAP EXISTS</p>
        <p className="seal-text">
          STATED doesn't decide whether you kept your promise.
          It makes it impossible to hide what you promised and what you actually showed.
        </p>
        <p className="seal-subtext">
          STATED proves chronology and integrity, not completion, quality, authenticity, or truth.
        </p>
        <div className="registry-seal-visual" aria-hidden="true">
          <svg viewBox="0 0 120 120" className="registry-seal-svg">
            <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="3" />
            <circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="60" cy="60" r="40" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <text x="60" y="52" textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fontWeight="700" fill="currentColor" letterSpacing="1.5">STATED</text>
            <text x="60" y="64" textAnchor="middle" fontSize="7" fontFamily="var(--font-mono)" fill="currentColor" letterSpacing="0.8">PUBLIC RECORD</text>
            <text x="60" y="76" textAnchor="middle" fontSize="6" fontFamily="var(--font-mono)" fill="currentColor" letterSpacing="0.5">MONAD REGISTRY</text>
            <circle cx="60" cy="88" r="3" fill="currentColor" />
          </svg>
        </div>
      </div>
    </section>
  );
}

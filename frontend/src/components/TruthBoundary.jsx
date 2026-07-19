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
          STATED records what was declared and what was shown.
          It does not decide whether you kept your promise.
          It makes it impossible to hide what you promised and what you actually showed.
        </p>
      </div>
    </section>
  );
}

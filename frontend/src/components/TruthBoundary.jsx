import React from 'react';
import '../styles/components/TruthBoundary.css';

export default function TruthBoundary() {
  return (
    <section className="truth-boundary">
      <div className="boundary-header">
        <h2 className="boundary-title">LIMITS OF THIS RECORD</h2>
        <p className="boundary-subtitle">What this case file establishes and what it cannot</p>
      </div>

      <div className="boundary-grid">
        <div className="boundary-section establishes">
          <h3 className="section-title">WHAT THIS RECORD ESTABLISHES</h3>
          <ul className="establishing-list">
            <li>The declaration content fetched matches the recorded declaration hash.</li>
            <li>The declaration was anchored at the displayed on-chain time.</li>
            <li>The evidence manifest fetched matches the recorded evidence hash.</li>
            <li>The listed evidence is what the owner chose to attach.</li>
            <li>The displayed conditions are those originally declared.</li>
          </ul>
        </div>

        <div className="boundary-divider"></div>

        <div className="boundary-section cannot-establish">
          <h3 className="section-title">WHAT THIS RECORD CANNOT ESTABLISH</h3>
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
        <p className="seal-text">
          STATED records what was declared and what was shown.
          It does not decide whether you kept your promise.
          It makes it impossible to hide what you promised and what you actually showed.
        </p>
      </div>
    </section>
  );
}

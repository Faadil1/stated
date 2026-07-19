import React, { useState } from 'react';
import { connectWallet } from '../utils/contract';
import '../styles/Landing.css';

export default function Landing({ onNavigate, setWalletAddress }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnectWallet = async () => {
    setLoading(true);
    setError(null);
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      onNavigate('create');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="landing">
      <div className="landing-surface">
        {/* HEADLINE */}
        <section className="headline-section">
          <h1 className="headline">THE GAP BETWEEN YOUR WORDS AND YOUR WORK</h1>
          <h2 className="subheadline">MADE PUBLIC</h2>
          <p className="headline-description">
            STATED records what a builder declared before building, anchors that declaration on Monad,
            allows evidence to be attached later, and exposes the gap between what was stated and what was shown.
          </p>
        </section>

        {/* FEATURE STEPS */}
        <section className="feature-steps">
          <div className="step">
            <div className="step-number">01</div>
            <h3 className="step-title">DECLARE BEFORE BUILDING</h3>
            <p className="step-description">
              State your project title, promise, deadline, and conditions of completion before you begin work.
            </p>
          </div>

          <div className="step">
            <div className="step-number">02</div>
            <h3 className="step-title">ANCHOR ON MONAD</h3>
            <p className="step-description">
              Your declaration is recorded on-chain with an immutable timestamp. It cannot be rewritten.
            </p>
          </div>

          <div className="step">
            <div className="step-number">03</div>
            <h3 className="step-title">ATTACH EVIDENCE LATER</h3>
            <p className="step-description">
              When finished, attach evidence that shows what you actually delivered against each condition.
            </p>
          </div>

          <div className="step">
            <div className="step-number">04</div>
            <h3 className="step-title">EXPOSE THE GAP</h3>
            <p className="step-description">
              The public receipt shows what was stated, what was shown, and what remains unaccounted for.
            </p>
          </div>
        </section>

        {/* PRIMARY CTA */}
        <section className="cta-section">
          <button className="primary-cta" onClick={handleConnectWallet} disabled={loading}>
            {loading ? 'Connecting...' : 'STATE YOUR OWN'}
          </button>
          <p className="cta-note">Connect wallet to begin</p>
        </section>

        {/* TRUTH BOUNDARY */}
        <section className="landing-truth-boundary">
          <div className="boundary-box establishes">
            <h3 className="boundary-label">STATED DOES</h3>
            <ul className="boundary-list">
              <li>Records what you promised</li>
              <li>Anchors it on-chain with a timestamp</li>
              <li>Accepts evidence you attach</li>
              <li>Makes the gap public</li>
            </ul>
          </div>

          <div className="boundary-divider"></div>

          <div className="boundary-box cannot">
            <h3 className="boundary-label">STATED DOES NOT</h3>
            <ul className="boundary-list">
              <li>Verify you completed the work</li>
              <li>Judge the quality of your work</li>
              <li>Confirm your evidence is authentic</li>
              <li>Decide whether you kept your promise</li>
            </ul>
          </div>
        </section>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="error-banner">
            <p className="error-text">{error}</p>
          </div>
        )}

        {/* FOOTER */}
        <footer className="landing-footer">
          <p className="footer-text">
            STATED is a smart contract on Monad that records immutable declarations and evidence.
          </p>
        </footer>
      </div>
    </div>
  );
}

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
      <div className="landing-container">
        <header className="landing-header">
          <h1>STATED</h1>
          <p className="tagline">A promise-versus-proof receipt for builders</p>
        </header>

        <main className="landing-content">
          <section className="hero">
            <h2>What was stated. What was shown.</h2>
            <p>
              Before you build, record what "done" means.
              When you finish, attach proof of your work.
              The receipt shows the gap—so you own it.
            </p>
          </section>

          <section className="features">
            <div className="feature">
              <h3>Record Your Promise</h3>
              <p>State your project title, promise, deadline, and conditions before building.</p>
            </div>
            <div className="feature">
              <h3>Attach Your Evidence</h3>
              <p>When done, attach a single evidence manifest linking proof to each condition.</p>
            </div>
            <div className="feature">
              <h3>Publish Your Receipt</h3>
              <p>Share a public receipt showing what you promised, what you proved, and what remains.</p>
            </div>
          </section>

          <section className="truth-boundary">
            <h3>What STATED proves</h3>
            <ul>
              <li>✓ Your declaration existed at an onchain time</li>
              <li>✓ Your declaration was not rewritten</li>
              <li>✓ Evidence was attached at an onchain time</li>
              <li>✓ A manifest matches or does not match the recorded hash</li>
            </ul>
            <h3>What STATED does not prove</h3>
            <ul>
              <li>✗ Objective completion</li>
              <li>✗ Quality of your work</li>
              <li>✗ Truthfulness of your claims</li>
              <li>✗ Authenticity of artifacts</li>
            </ul>
          </section>

          <button
            className="cta-button"
            onClick={handleConnectWallet}
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect Wallet to Start'}
          </button>

          {error && <div className="error-message">{error}</div>}
        </main>

        <footer className="landing-footer">
          <p>STATED is a smart contract on Monad that records immutable declarations and evidence.</p>
        </footer>
      </div>
    </div>
  );
}

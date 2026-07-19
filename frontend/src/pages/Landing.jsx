import React, { useState, useEffect } from 'react';
import { connectWallet } from '../utils/contract';
import FeaturedRecordPreview from '../components/FeaturedRecordPreview';
import '../styles/Landing.css';

const MOCK_FEATURED_RECORD = {
  recordId: 1,
  title: 'Build STATED',
  promise: 'A tool that makes the gap between promises and delivery impossible to hide.',
  conditions: [
    { id: 1, text: 'Smart contract deployed on Monad' },
    { id: 2, text: 'Declaration anchored immutably on-chain' },
    { id: 3, text: 'Evidence attachment mechanism working' },
    { id: 4, text: 'Gap revealed on public receipt' },
    { id: 5, text: 'Judge remembers it three hours later' }
  ],
  evidenceByCondition: {
    1: ['Contract verified at 0x1234...'],
    2: ['Timestamp: 2026-07-19'],
    3: ['Attachment flow implemented'],
    4: ['Public receipt renders correctly']
  }
};

export default function Landing({ onNavigate, setWalletAddress }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [featuredRecord, setFeaturedRecord] = useState(MOCK_FEATURED_RECORD);

  useEffect(() => {
    // Try to fetch official record (when available)
    // For now, use mock data
  }, []);

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
        </section>

        {/* FEATURED RECORD PREVIEW - THE HERO */}
        <section className="featured-record-section">
          <FeaturedRecordPreview record={featuredRecord} />
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

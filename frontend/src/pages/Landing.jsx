import React, { useState, useEffect } from 'react';
import { connectWallet, getRecordPublic } from '../utils/contract';
import { hashManifest, fetchManifest } from '../utils/manifest';
import GlobalHeader from '../components/GlobalHeader';
import '../styles/Landing.css';

const IPFS_GATEWAY = 'https://ipfs.io';

const DEMO_RECORD = {
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
    1: ['Contract verified'],
    2: ['Timestamp recorded'],
    3: ['Attachment flow implemented'],
    4: ['Public receipt renders correctly']
  }
};

const FEATURED_RECORD_STATE = {
  DEMO: 'DEMO',
  LOADING: 'LOADING',
  LIVE: 'LIVE',
  ERROR: 'ERROR'
};

export default function Landing({ onNavigate, setWalletAddress }) {
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState(null);
  const [featuredRecord, setFeaturedRecord] = useState(DEMO_RECORD);
  const [featuredState, setFeaturedState] = useState(FEATURED_RECORD_STATE.DEMO);

  useEffect(() => {
    loadFeaturedRecord();
  }, []);

  const loadFeaturedRecord = async () => {
    const officialRecordId = import.meta.env.VITE_FEATURED_RECORD_ID;
    if (!officialRecordId || officialRecordId.trim() === '') {
      setFeaturedState(FEATURED_RECORD_STATE.DEMO);
      setFeaturedRecord(DEMO_RECORD);
      return;
    }
    setFeaturedState(FEATURED_RECORD_STATE.LOADING);
    try {
      const record = await getRecordPublic(officialRecordId);
      if (!record.declarationURI) throw new Error('No declaration URI');
      const declaration = await fetchManifest(record.declarationURI, IPFS_GATEWAY);
      if (!declaration?.project?.title || !declaration?.project?.promise) throw new Error('Invalid declaration');
      const computedDeclHash = hashManifest(declaration);
      if (computedDeclHash !== record.declarationHash) throw new Error('Hash mismatch');
      let evidenceByCondition = {};
      if (record.evidenceHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        if (!record.evidenceURI) throw new Error('No evidence URI');
        const evidence = await fetchManifest(record.evidenceURI, IPFS_GATEWAY);
        const computedEvidHash = hashManifest(evidence);
        if (computedEvidHash !== record.evidenceHash) throw new Error('Evidence hash mismatch');
        if (evidence.evidence?.length) {
          evidence.evidence.forEach((e) => {
            e.conditionIds.forEach((cId) => {
              if (!evidenceByCondition[cId]) evidenceByCondition[cId] = [];
              evidenceByCondition[cId].push(e);
            });
          });
        }
      }
      setFeaturedRecord({
        recordId: officialRecordId,
        title: declaration.project.title,
        promise: declaration.project.promise,
        conditions: declaration.conditions || [],
        evidenceByCondition
      });
      setFeaturedState(FEATURED_RECORD_STATE.LIVE);
    } catch (err) {
      console.error('Failed to load featured record:', err);
      setFeaturedRecord(DEMO_RECORD);
      setFeaturedState(FEATURED_RECORD_STATE.ERROR);
    }
  };

  const handleConnectWallet = async () => {
    setWalletLoading(true);
    setWalletError(null);
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      onNavigate('create');
    } catch (err) {
      setWalletError(err.message);
    }
    setWalletLoading(false);
  };

  const isLive = featuredState === FEATURED_RECORD_STATE.LIVE;

  return (
    <>
      <GlobalHeader />
      <div className="landing">
        <div className="landing-grid">
          {/* LEFT HERO PANEL */}
          <div className="landing-left">
            <div className="hero-panel">
              <h1 className="hero-headline">The gap <span className="serif-normal">between</span><br/>your words and<br/>your work.</h1>
              <p className="hero-subheadline">Made public.</p>
              <p className="hero-description">Declare your intent. Anchor it on-chain. Attach real evidence. Expose the gap between what was stated and what was shown.</p>

              <div className="hero-ctas">
                <button className="cta-primary" onClick={() => onNavigate('receipt', 2)}>
                  VIEW LIVE RECEIPT (NO WALLET)
                </button>
                <button className="cta-secondary" onClick={handleConnectWallet} disabled={walletLoading}>
                  {walletLoading ? 'Connecting...' : 'CONNECT WALLET TO START'}
                </button>
              </div>

              <div className="hero-footer-badge">
                <span className="badge-icon">▪</span>
                <span className="badge-text">Built on Monad Testnet</span>
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT PANEL */}
          <div className="landing-right">
            {/* INTERACTION FLOW */}
            <div className="interaction-flow-panel">
              <h2 className="panel-title">INTERACTION FLOW — 5 STEPS. ONE TRUTH.</h2>
              <div className="flow-steps">
                {[
                  { num: '1', title: 'DECLARE', desc: 'Write your promise', detail: 'Feels like writing in a notebook.' },
                  { num: '2', title: 'ANCHOR', desc: 'Lock it on Monad', detail: 'Tactile confirmation. Real on-chain lock.' },
                  { num: '3', title: 'WAIT', desc: 'Build in the real world', detail: 'Time passes. You build.' },
                  { num: '4', title: 'ATTACH', desc: 'Add real evidence', detail: 'Map to your conditions.' },
                  { num: '5', title: 'PUBLISH', desc: 'Make the gap public', detail: 'Anyone can verify. No wallet required.' }
                ].map((step) => (
                  <div key={step.num} className="flow-step">
                    <div className="flow-step-number">{step.num}</div>
                    <div className="flow-step-content">
                      <h3 className="flow-step-title">{step.title}</h3>
                      <p className="flow-step-desc">{step.desc}</p>
                      <p className="flow-step-detail">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TRUTH BOUNDARY */}
            <div className="truth-panel">
              <h2 className="panel-title">WHAT THIS PROVES</h2>
              <div className="truth-list">
                <div className="truth-item proves">
                  <span className="truth-marker">✓</span>
                  <span>The declaration existed at the recorded on-chain time.</span>
                </div>
                <div className="truth-item proves">
                  <span className="truth-marker">✓</span>
                  <span>The attached evidence was recorded at the shown time.</span>
                </div>
                <div className="truth-item proves">
                  <span className="truth-marker">✓</span>
                  <span>The stored manifest still matches its recorded hash.</span>
                </div>
              </div>

              <h2 className="panel-title" style={{ marginTop: 'var(--space-6)' }}>WHAT THIS DOES NOT PROVE</h2>
              <div className="truth-list">
                <div className="truth-item disproves">
                  <span className="truth-marker">×</span>
                  <span>That the work was completed.</span>
                </div>
                <div className="truth-item disproves">
                  <span className="truth-marker">×</span>
                  <span>That the evidence is truthful.</span>
                </div>
                <div className="truth-item disproves">
                  <span className="truth-marker">×</span>
                  <span>That the result is high-quality.</span>
                </div>
                <div className="truth-item disproves">
                  <span className="truth-marker">×</span>
                  <span>That you kept your promise.</span>
                </div>
              </div>

              <div className="truth-footer">
                <p className="truth-seal">THE GAP EXISTS</p>
                <p className="truth-note">Between intent and evidence.</p>
              </div>
            </div>
          </div>
        </div>

        {walletError && (
          <div className="error-message">
            <p>{walletError}</p>
          </div>
        )}
      </div>
    </>
  );
}

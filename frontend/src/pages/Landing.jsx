import React, { useState, useEffect } from 'react';
import { connectWallet, getRecordPublic } from '../utils/contract';
import { hashManifest, fetchManifest } from '../utils/manifest';
import FeaturedRecordPreview from '../components/FeaturedRecordPreview';
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

// State machine for featured record
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
  const [featuredError, setFeaturedError] = useState(null);

  useEffect(() => {
    loadFeaturedRecord();
  }, []);

  const loadFeaturedRecord = async () => {
    const officialRecordId = import.meta.env.VITE_FEATURED_RECORD_ID;

    if (!officialRecordId || officialRecordId.trim() === '') {
      // No official record configured, use labeled demo
      setFeaturedState(FEATURED_RECORD_STATE.DEMO);
      setFeaturedRecord(DEMO_RECORD);
      return;
    }

    // Official record ID is set, attempt to load
    setFeaturedState(FEATURED_RECORD_STATE.LOADING);

    try {
      // Fetch record from blockchain (public, no wallet required)
      const record = await getRecordPublic(officialRecordId);

      // Fetch declaration from IPFS
      if (!record.declarationURI) {
        throw new Error('Record has no declaration URI');
      }

      const declaration = await fetchManifest(record.declarationURI, IPFS_GATEWAY);

      // Validate declaration structure
      if (!declaration || typeof declaration !== 'object') {
        throw new Error('Declaration is not a valid object');
      }
      if (!declaration.project || !declaration.project.title || !declaration.project.promise) {
        throw new Error('Declaration missing required fields');
      }

      // Verify declaration integrity
      const computedDeclHash = hashManifest(declaration);
      if (computedDeclHash !== record.declarationHash) {
        throw new Error('Declaration integrity check failed');
      }

      // Fetch evidence if attached
      let evidenceByCondition = {};
      if (record.evidenceHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        if (!record.evidenceURI) {
          throw new Error('Evidence hash present but no evidence URI');
        }

        const evidence = await fetchManifest(record.evidenceURI, IPFS_GATEWAY);

        // Verify evidence integrity
        const computedEvidHash = hashManifest(evidence);
        if (computedEvidHash !== record.evidenceHash) {
          throw new Error('Evidence integrity check failed');
        }

        // Build evidenceByCondition map
        if (evidence.evidence && Array.isArray(evidence.evidence)) {
          evidence.evidence.forEach((e) => {
            e.conditionIds.forEach((cId) => {
              if (!evidenceByCondition[cId]) {
                evidenceByCondition[cId] = [];
              }
              evidenceByCondition[cId].push(e);
            });
          });
        }
      }

      // Build the live record object from fetched data
      const liveRecord = {
        recordId: officialRecordId,
        title: declaration.project.title,
        promise: declaration.project.promise,
        conditions: declaration.conditions || [],
        evidenceByCondition
      };

      // All validations passed, set to LIVE
      setFeaturedRecord(liveRecord);
      setFeaturedState(FEATURED_RECORD_STATE.LIVE);
      setFeaturedError(null);
    } catch (err) {
      console.error('Failed to load official featured record:', err);
      // Fetch failed, fall back to labeled demo
      setFeaturedRecord(DEMO_RECORD);
      setFeaturedState(FEATURED_RECORD_STATE.ERROR);
      setFeaturedError('The featured public record is temporarily unavailable.');
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
  const isLoading = featuredState === FEATURED_RECORD_STATE.LOADING;

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
          {isLoading ? (
            <div className="featured-loading">
              <p className="featured-loading-text">Loading featured record...</p>
            </div>
          ) : (
            <>
              <FeaturedRecordPreview
                record={featuredRecord}
                isLive={isLive}
                recordId={isLive ? featuredRecord.recordId : null}
                onNavigate={onNavigate}
              />
              {featuredState === FEATURED_RECORD_STATE.ERROR && featuredError && (
                <p className="featured-error-note">{featuredError}</p>
              )}
            </>
          )}
        </section>

        {/* PRIMARY CTA */}
        <section className="cta-section">
          <button className="primary-cta" onClick={handleConnectWallet} disabled={walletLoading}>
            {walletLoading ? 'Connecting...' : 'STATE YOUR OWN'}
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
        {walletError && (
          <div className="error-banner">
            <p className="error-text">{walletError}</p>
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

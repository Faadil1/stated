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

const FLOW_STEPS = [
  { num: '01', title: 'DECLARE', desc: 'Write what you intend to build.', detail: 'Feels like writing in a notebook.' },
  { num: '02', title: 'ANCHOR', desc: 'Record the declaration on Monad.', detail: 'Tactile confirmation. Real on-chain lock.' },
  { num: '03', title: 'BUILD', desc: 'Work happens outside STATED.', detail: 'Time passes. You build.' },
  { num: '04', title: 'ATTACH', desc: 'Present the evidence you choose to show.', detail: 'Map to your conditions.' },
  { num: '05', title: 'COMPARE', desc: 'The public can inspect what was stated and what was shown.', detail: 'Anyone can verify. No wallet required.' }
];

const MICRO_INTERACTIONS = [
  { id: 'seal', label: 'Seal Stamp', preview: '◉', desc: 'A stamp animation when it locks on-chain.' },
  { id: 'lift', label: 'Paper Lift', preview: '▭', desc: 'Panels lift slightly on hover.' },
  { id: 'clip', label: 'Evidence Clip', preview: '🖇', desc: 'Evidence slips clip to the case file.' },
  { id: 'reveal', label: 'Registry Reveal', preview: '▣', desc: 'Metadata reveals as the case file opens.' },
  { id: 'pulse', label: 'Gap Pulse', preview: '○', desc: 'The gap pulses when unfulfilled conditions exist.' }
];

export default function Landing({ onNavigate, setWalletAddress, mode }) {
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

  return (
    <>
      <GlobalHeader mode={mode} />
      <div className="landing">
        <div className="landing-grid">
          {/* LEFT HERO PANEL */}
          <div className="landing-left">
            <div className="hero-panel fade-in-up">
              <div className="hero-eyebrow">LANDING PAGE</div>
              <h1 className="hero-headline">
                The gap <em className="hero-em">between</em><br />
                your words and<br />
                your work.
              </h1>
              <p className="hero-subheadline">Made public.</p>
              <p className="hero-description">
                Declare your intent. Attach real evidence. Lock it on-chain. Show the truth.
              </p>

              <div className="hero-ctas">
                <button className="cta-primary tactile-press" onClick={() => onNavigate('receipt', 2)}>
                  View live receipt (no wallet) →
                </button>
                <button
                  className="cta-secondary tactile-press"
                  onClick={handleConnectWallet}
                  disabled={walletLoading}
                >
                  {walletLoading ? 'Connecting...' : 'Connect wallet to start'}
                </button>
              </div>

              <div className="hero-footer-badge">
                <span className="badge-dot"></span>
                <span className="badge-text">Built on Monad Testnet</span>
              </div>
            </div>

            {/* Analog interactions panel */}
            <div className="analog-panel fade-in-up">
              <h2 className="panel-title">ANALOG INTERACTIONS</h2>
              <div className="analog-grid">
                <div className="analog-item">
                  <div className="analog-icon" aria-hidden="true">✎</div>
                  <div className="analog-label">WRITE TO DECLARE</div>
                  <div className="analog-desc">Handwritten feel when typing your promise.</div>
                </div>
                <div className="analog-item">
                  <div className="analog-icon" aria-hidden="true">◉</div>
                  <div className="analog-label">SEAL TO ANCHOR</div>
                  <div className="analog-desc">A stamp animation when it's locked on-chain.</div>
                </div>
                <div className="analog-item">
                  <div className="analog-icon" aria-hidden="true">🖇</div>
                  <div className="analog-label">CLIP EVIDENCE</div>
                  <div className="analog-desc">Drag & drop feels like adding papers to a folder.</div>
                </div>
                <div className="analog-item">
                  <div className="analog-icon" aria-hidden="true">▣</div>
                  <div className="analog-label">PUBLISH TO REVEAL</div>
                  <div className="analog-desc">A folder opens to the public.</div>
                </div>
              </div>
            </div>

            {/* Micro-interactions panel */}
            <div className="micro-interactions-panel fade-in-up">
              <h2 className="panel-title">MICRO-INTERACTIONS</h2>
              <div className="micro-grid">
                {MICRO_INTERACTIONS.map((item) => (
                  <div key={item.id} className="micro-item">
                    <div className="micro-preview" aria-hidden="true">
                      <span className={`micro-symbol micro-${item.id}`}>{item.preview}</span>
                    </div>
                    <div className="micro-content">
                      <div className="micro-label">{item.label}</div>
                      <div className="micro-desc">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT PANEL */}
          <div className="landing-right">
            {/* RECORD PREVIEW CARD */}
            <div className="record-preview-card fade-in-up">
              <div className="record-preview-paper">
                <div className="record-preview-stamp">
                  <span>ON-CHAIN ANCHORED</span>
                </div>
                <div className="record-preview-header">
                  <span className="record-preview-label">RECORD #42</span>
                  <span className="record-preview-status">PUBLIC RECORD</span>
                </div>
                <div className="record-preview-body">
                  <p className="record-preview-declared">Declared</p>
                  <p className="record-preview-date">May 18, 2026 14:32 UTC</p>
                  <p className="record-preview-deadline">Deadline: May 20, 2026 09:17 UTC</p>
                  <div className="record-preview-separator"></div>
                  <p className="record-preview-promise">
                    Ship a working onboarding flow for new users.
                  </p>
                </div>
                <div className="record-preview-footer">
                  <span className="record-preview-match">INTEGRITY MATCH</span>
                </div>
              </div>
              <div className="record-preview-shadow"></div>
            </div>

            {/* INTERACTION FLOW */}
            <div className="interaction-flow-panel fade-in-up">
              <h2 className="panel-title">INTERACTION FLOW — 5 STEPS. ONE TRUTH.</h2>
              <div className="flow-steps">
                {FLOW_STEPS.map((step, index) => (
                  <div key={step.num} className="flow-step lift-hover" style={{ animationDelay: `${index * 80}ms` }}>
                    <div className="flow-step-number">{step.num}</div>
                    <div className="flow-step-content">
                      <div className="flow-step-header">
                        <h3 className="flow-step-title">{step.title}</h3>
                        <span className="flow-step-connector" aria-hidden="true">—</span>
                        <span className="flow-step-desc">{step.desc}</span>
                      </div>
                      <p className="flow-step-detail">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TRUTH BOUNDARY */}
            <div className="truth-panel fade-in-up">
              <h2 className="panel-title">THE RECEIPT EXPERIENCE — LIKE A CASE FILE</h2>
              <div className="truth-grid">
                <div className="truth-box proves">
                  <h3 className="truth-box-title">WHAT THIS PROVES</h3>
                  <ul className="truth-list">
                    <li><span className="truth-check" aria-hidden="true">✓</span> The declaration existed at the recorded on-chain time.</li>
                    <li><span className="truth-check" aria-hidden="true">✓</span> The attached evidence was recorded at the shown time.</li>
                    <li><span className="truth-check" aria-hidden="true">✓</span> The stored manifest still matches its recorded hash.</li>
                  </ul>
                </div>
                <div className="truth-box disproves">
                  <h3 className="truth-box-title">WHAT THIS DOES NOT PROVE</h3>
                  <ul className="truth-list">
                    <li><span className="truth-cross" aria-hidden="true">×</span> That the work was completed.</li>
                    <li><span className="truth-cross" aria-hidden="true">×</span> That the evidence is truthful.</li>
                    <li><span className="truth-cross" aria-hidden="true">×</span> That the result is high-quality.</li>
                    <li><span className="truth-cross" aria-hidden="true">×</span> That you kept your promise.</li>
                  </ul>
                </div>
              </div>
              <div className="truth-footer">
                <p className="truth-seal">THE GAP EXISTS</p>
                <p className="truth-note">Between intent and evidence.</p>
              </div>
            </div>

            {/* WHY THIS DIRECTION WORKS */}
            <div className="why-panel fade-in-up">
              <h2 className="panel-title">WHY THIS DIRECTION WORKS</h2>
              <div className="why-grid">
                <div className="why-item">
                  <div className="why-icon" aria-hidden="true">✦</div>
                  <div>
                    <div className="why-label">Feels real</div>
                    <div className="why-desc">Not another blockchain app.</div>
                  </div>
                </div>
                <div className="why-item">
                  <div className="why-icon" aria-hidden="true">✦</div>
                  <div>
                    <div className="why-label">Memorable</div>
                    <div className="why-desc">The metaphor teaches the model instantly.</div>
                  </div>
                </div>
                <div className="why-item">
                  <div className="why-icon" aria-hidden="true">✦</div>
                  <div>
                    <div className="why-label">Honest by design</div>
                    <div className="why-desc">The limits are part of the UX.</div>
                  </div>
                </div>
                <div className="why-item">
                  <div className="why-icon" aria-hidden="true">✦</div>
                  <div>
                    <div className="why-label">Judges remember it</div>
                    <div className="why-desc">Three hours later, the gap is still visible.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {walletError && (
          <div className="error-message landing-error" role="alert">
            <p>{walletError}</p>
          </div>
        )}
      </div>
    </>
  );
}

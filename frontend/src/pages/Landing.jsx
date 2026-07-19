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

const VALUE_PROPS = [
  { id: 'anchored', label: 'ON-CHAIN ANCHORED', desc: 'Immutable timestamps on Monad.' },
  { id: 'gap', label: 'GAP MADE VISIBLE', desc: 'What you stated vs. what you showed.' },
  { id: 'public', label: 'PUBLIC BY DEFAULT', desc: 'Anyone can verify. No wallet needed.' },
];

const FLOW_STEPS = [
  { num: '01', title: 'DECLARE', desc: 'Write what you intend to build.' },
  { num: '02', title: 'ANCHOR', desc: 'Record the declaration on Monad.' },
  { num: '03', title: 'BUILD', desc: 'Work happens outside STATED.' },
  { num: '04', title: 'ATTACH', desc: 'Present the evidence you choose to show.' },
  { num: '05', title: 'COMPARE', desc: 'The public can inspect what was stated and what was shown.' },
];

const MICRO_INTERACTIONS = [
  { id: 'seal', label: 'Seal Stamp', desc: 'A stamp animation when it locks on-chain.' },
  { id: 'lift', label: 'Paper Lift', desc: 'Panels lift slightly on hover.' },
  { id: 'clip', label: 'Evidence Clip', desc: 'Evidence slips clip to the case file.' },
  { id: 'reveal', label: 'Registry Reveal', desc: 'Metadata reveals as the case file opens.' },
  { id: 'pulse', label: 'Gap Pulse', desc: 'The gap pulses when unfulfilled conditions exist.' },
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
      <div className="landing paper-shell">
        <div className="value-props-strip">
          {VALUE_PROPS.map((prop) => (
            <div key={prop.id} className="value-prop">
              <span className="value-prop-label">{prop.label}</span>
              <span className="value-prop-desc">{prop.desc}</span>
            </div>
          ))}
        </div>

        <div className="landing-grid">
          {/* LEFT HERO PANEL */}
          <div className="landing-left">
            <div className="hero-panel fade-in-up">
              <div className="hero-eyebrow">THE PUBLIC RECORD OF YOUR INTENT.</div>
              <h1 className="hero-headline">
                Declare it.<br />
                Build it.<br />
                <span className="hero-em">Prove it.</span>
              </h1>
              <p className="hero-description">
                STATED makes your commitments public, your evidence verifiable, and the gap undeniable.
              </p>

              <div className="hero-ctas">
                <button className="cta-primary tactile-press" onClick={handleConnectWallet} disabled={walletLoading}>
                  {walletLoading ? 'CONNECTING...' : 'DECLARE A NEW INTENT →'}
                </button>
                <button className="cta-secondary tactile-press" onClick={() => onNavigate('receipt', 2)}>
                  VIEW PUBLIC RECORDS
                </button>
              </div>
            </div>

            <div className="micro-interactions-panel fade-in-up">
              <h2 className="panel-title">MICRO-INTERACTIONS</h2>
              <div className="micro-grid">
                {MICRO_INTERACTIONS.map((item) => (
                  <div key={item.id} className="micro-item">
                    <div className="micro-preview" aria-hidden="true">
                      <MicroIcon id={item.id} />
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
            <div className="case-file-visual fade-in-up" aria-hidden="true">
              <CaseFileVisual />
            </div>

            <div className="interaction-flow-panel fade-in-up">
              <h2 className="panel-title">THE FIVE-STEP PROCESS</h2>
              <div className="flow-steps">
                {FLOW_STEPS.map((step, index) => (
                  <div key={step.num} className="flow-step lift-hover" style={{ animationDelay: `${index * 80}ms` }}>
                    <div className="flow-step-number">{step.num}</div>
                    <div className="flow-step-content">
                      <h3 className="flow-step-title">{step.title}</h3>
                      <p className="flow-step-desc">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="landing-footer">
          <p>STATED proves chronology and integrity, not completion, quality, authenticity, or truth.</p>
        </footer>

        {walletError && (
          <div className="error-message landing-error" role="alert">
            <p>{walletError}</p>
          </div>
        )}
      </div>
    </>
  );
}

function MicroIcon({ id }) {
  switch (id) {
    case 'seal':
      return (
        <svg viewBox="0 0 32 32" className="micro-svg">
          <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="16" cy="16" r="5" fill="currentColor" />
        </svg>
      );
    case 'lift':
      return (
        <svg viewBox="0 0 32 32" className="micro-svg">
          <rect x="6" y="10" width="20" height="14" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M6 14 L26 14" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 7 L16 2 L22 7" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'clip':
      return (
        <svg viewBox="0 0 32 32" className="micro-svg">
          <path d="M10 22 C10 26, 22 26, 22 22 L22 10 C22 7, 18 7, 18 10 L18 20 C18 22, 14 22, 14 20 L14 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'reveal':
      return (
        <svg viewBox="0 0 32 32" className="micro-svg">
          <rect x="4" y="8" width="24" height="18" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
          <rect x="8" y="12" width="16" height="2" fill="currentColor" />
          <rect x="8" y="16" width="12" height="2" fill="currentColor" />
          <rect x="8" y="20" width="14" height="2" fill="currentColor" />
        </svg>
      );
    case 'pulse':
      return (
        <svg viewBox="0 0 32 32" className="micro-svg">
          <circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="16" cy="16" r="4" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

function CaseFileVisual() {
  return (
    <div className="case-file-composition">
      {/* Background paper stack */}
      <div className="composition-sheet sheet-back"></div>
      <div className="composition-sheet sheet-mid"></div>

      {/* Notebook paper */}
      <div className="composition-notebook">
        <div className="notebook-line"></div>
        <div className="notebook-line"></div>
        <div className="notebook-line"></div>
        <div className="notebook-line"></div>
        <div className="notebook-line"></div>
        <div className="notebook-line"></div>
        <div className="notebook-sketch" aria-hidden="true">
          <svg viewBox="0 0 120 80" className="sketch-svg">
            <path d="M10 60 Q30 20 60 40 T110 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="90" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* Main record sheet */}
      <div className="composition-record">
        <div className="record-stamp">PUBLIC RECORD</div>
        <div className="record-field">
          <span className="record-label">ISSUED ON MONAD</span>
        </div>
        <div className="record-field">
          <span className="record-label">BLOCK</span>
          <span className="record-value">18254671</span>
        </div>
        <div className="record-seal">
          <svg viewBox="0 0 60 60" className="mini-seal">
            <circle cx="30" cy="30" r="26" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="30" cy="30" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="30" cy="30" r="5" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* Photo prints */}
      <div className="composition-photo photo-one">
        <svg viewBox="0 0 80 100" className="photo-svg">
          <rect x="2" y="2" width="76" height="96" fill="var(--paper-cream)" stroke="currentColor" strokeWidth="2" />
          <circle cx="28" cy="35" r="14" fill="var(--ink-muted)" opacity="0.5" />
          <rect x="42" y="55" width="26" height="18" fill="var(--ink-muted)" opacity="0.35" />
          <path d="M10 80 L30 55 L50 80 Z" fill="var(--ink-muted)" opacity="0.25" />
        </svg>
      </div>
      <div className="composition-photo photo-two">
        <svg viewBox="0 0 80 100" className="photo-svg">
          <rect x="2" y="2" width="76" height="96" fill="var(--paper-cream)" stroke="currentColor" strokeWidth="2" />
          <rect x="14" y="22" width="52" height="42" fill="var(--ink-muted)" opacity="0.3" />
          <circle cx="30" cy="42" r="10" fill="var(--ink-muted)" opacity="0.5" />
        </svg>
      </div>

      {/* Paper clip */}
      <div className="composition-clip">
        <svg viewBox="0 0 24 60" className="clip-svg">
          <path d="M8 52 C8 56, 16 56, 16 52 L16 14 C16 9, 8 9, 8 14 L8 42 C8 46, 12 46, 12 42 L12 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>

      {/* Tape strip */}
      <div className="composition-tape"></div>

      {/* Coffee cup */}
      <div className="composition-coffee">
        <svg viewBox="0 0 60 50" className="coffee-svg">
          <ellipse cx="25" cy="42" rx="18" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M10 18 L12 40 C12 44 38 44 38 40 L40 18 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <ellipse cx="25" cy="18" rx="15" ry="5" fill="var(--ink-primary)" opacity="0.85" />
          <path d="M40 22 C50 22 50 36 40 36" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        <div className="coffee-ring"></div>
      </div>

      {/* Pen */}
      <div className="composition-pen">
        <svg viewBox="0 0 12 140" className="pen-svg">
          <rect x="2" y="0" width="8" height="110" rx="1" fill="var(--ink-primary)" />
          <path d="M2 110 L6 140 L10 110 Z" fill="var(--seal-rust)" />
        </svg>
      </div>
    </div>
  );
}

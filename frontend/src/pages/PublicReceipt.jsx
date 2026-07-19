import React, { useState, useEffect } from 'react';
import { getRecordPublic } from '../utils/contract';
import { hashManifest, fetchManifest } from '../utils/manifest';
import '../styles/PublicReceipt.css';

const IPFS_GATEWAY = 'https://ipfs.io';

export default function PublicReceipt({ recordId, declaration, evidenceManifest, onNavigate }) {
  const [record, setRecord] = useState(null);
  const [fetchedDeclaration, setFetchedDeclaration] = useState(null);
  const [fetchedEvidence, setFetchedEvidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [declarationStatus, setDeclarationStatus] = useState('LOADING');
  const [evidenceStatus, setEvidenceStatus] = useState('LOADING');
  const [integrityStatus, setIntegrityStatus] = useState('UNKNOWN');

  useEffect(() => {
    loadReceipt();
  }, [recordId]);

  const loadReceipt = async () => {
    try {
      setLoading(true);
      setError(null);

      if (recordId === null && recordId !== 0) {
        throw new Error('No record ID provided');
      }

      // Fetch record from blockchain (no wallet required)
      const rec = await getRecordPublic(recordId);
      setRecord(rec);

      // Fetch declaration from URI
      await loadDeclaration(rec);

      // Fetch evidence if attached
      if (rec.evidenceHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        await loadEvidence(rec);
      } else {
        setEvidenceStatus('NO_EVIDENCE_ATTACHED');
      }
    } catch (err) {
      setError(err.message);
      setDeclarationStatus('ERROR');
      setEvidenceStatus('ERROR');
    } finally {
      setLoading(false);
    }
  };

  const loadDeclaration = async (rec) => {
    try {
      if (!rec.declarationURI) {
        throw new Error('No declaration URI in record');
      }

      const decl = await fetchManifest(rec.declarationURI, IPFS_GATEWAY);

      // Validate structure before proceeding
      if (!decl || typeof decl !== 'object') {
        throw new Error('Declaration is not a valid object');
      }
      if (!decl.project || !decl.project.title || !decl.project.promise) {
        console.error('Invalid declaration structure:', decl);
        throw new Error('Declaration missing required fields: project.title and project.promise');
      }

      // Verify integrity
      const computedHash = hashManifest(decl);
      if (computedHash !== rec.declarationHash) {
        setDeclarationStatus('INTEGRITY_MISMATCH');
        throw new Error(
          `Declaration hash mismatch: computed ${computedHash} !== stored ${rec.declarationHash}`
        );
      }

      setFetchedDeclaration(decl);
      setDeclarationStatus('LOADED');
    } catch (err) {
      setDeclarationStatus('MANIFEST_NOT_LOADED');
      throw err;
    }
  };

  const loadEvidence = async (rec) => {
    try {
      if (!rec.evidenceURI) {
        setEvidenceStatus('NO_EVIDENCE_ATTACHED');
        return;
      }

      const evidence = await fetchManifest(rec.evidenceURI, IPFS_GATEWAY);

      // Verify integrity
      const computedHash = hashManifest(evidence);
      if (computedHash !== rec.evidenceHash) {
        setIntegrityStatus('INTEGRITY_MISMATCH');
        setEvidenceStatus('INTEGRITY_MISMATCH');
        throw new Error(
          `Evidence hash mismatch: computed ${computedHash} !== stored ${rec.evidenceHash}`
        );
      }

      setFetchedEvidence(evidence);
      setIntegrityStatus('INTEGRITY_MATCH');
      setEvidenceStatus('LOADED');
    } catch (err) {
      setEvidenceStatus('MANIFEST_NOT_LOADED');
      throw err;
    }
  };

  if (loading) {
    return <div className="receipt-container"><p>Loading receipt...</p></div>;
  }

  if (error || !record || !fetchedDeclaration) {
    return (
      <div className="receipt-container">
        <p className="error">
          {error || 'Receipt not found'}
          {declarationStatus === 'MANIFEST_NOT_LOADED' && ' (declaration not found on IPFS)'}
        </p>
        <button onClick={() => onNavigate('landing', null)} className="back-button">
          ← Start Over
        </button>
      </div>
    );
  }

  // Derive states
  const declaredAt = new Date(Number(record.declaredAt) * 1000);
  const deadline = new Date(Number(record.deadline) * 1000);
  const evidenceAttachedAt =
    record.evidenceAttachedAt === 0n ? null : new Date(Number(record.evidenceAttachedAt) * 1000);

  const timingStatus = evidenceAttachedAt
    ? evidenceAttachedAt <= deadline
      ? 'ATTACHED_ON_TIME'
      : 'ATTACHED_LATE'
    : 'NO_EVIDENCE_ATTACHED';

  // Map evidence to conditions
  const evidenceByCondition = {};
  if (fetchedEvidence && fetchedEvidence.evidence) {
    fetchedEvidence.evidence.forEach((e) => {
      e.conditionIds.forEach((cId) => {
        if (!evidenceByCondition[cId]) {
          evidenceByCondition[cId] = [];
        }
        evidenceByCondition[cId].push(e);
      });
    });
  }

  const unaccountedConditions = fetchedDeclaration.conditions.filter(
    (c) => !evidenceByCondition[c.id]
  );

  return (
    <div className="public-receipt">
      <div className="receipt-container">
        <header className="receipt-header">
          <div className="brand">
            <h1>STATED</h1>
            <span className="record-id">Record #{recordId}</span>
          </div>
        </header>

        <div className="receipt-content">
          {/* WHAT WAS STATED */}
          <section className="stated-section">
            <h2>WHAT WAS STATED</h2>
            <div className="stated-box">
              <h3>{fetchedDeclaration.project.title}</h3>
              <p className="promise">{fetchedDeclaration.project.promise}</p>
              <div className="conditions">
                {fetchedDeclaration.conditions.map((c) => (
                  <div key={c.id} className="condition">
                    {evidenceByCondition[c.id] ? '✓' : '—'} {c.text}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* WHAT WAS SHOWN */}
          <section className="shown-section">
            <h2>WHAT WAS SHOWN</h2>
            {evidenceAttachedAt ? (
              <div className="shown-box">
                {fetchedEvidence && fetchedEvidence.evidence && fetchedEvidence.evidence.length > 0 ? (
                  <ul className="evidence-list">
                    {fetchedEvidence.evidence.map((e) => (
                      <li key={e.id}>
                        <strong>{e.label}</strong>
                        {e.uri && <a href={e.uri} target="_blank" rel="noopener noreferrer">{e.uri}</a>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-evidence">No evidence items</p>
                )}
              </div>
            ) : (
              <p className="no-evidence">No evidence attached</p>
            )}
          </section>

          {/* UNACCOUNTED CONDITIONS */}
          {unaccountedConditions.length > 0 && (
            <section className="unaccounted-section">
              <h3 className="unaccounted-title">
                ⚠️ {unaccountedConditions.length} condition{unaccountedConditions.length !== 1 ? 's' : ''} remain{unaccountedConditions.length !== 1 ? '' : 's'} unaccounted for
              </h3>
              <div className="unaccounted-box">
                {unaccountedConditions.map((c) => (
                  <div key={c.id} className="unaccounted-item">
                    {c.text}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TIMING */}
          <section className="timing-section">
            <div className="timing-grid">
              <div className="timing-item">
                <label>Declared</label>
                <time>{declaredAt.toLocaleString()}</time>
              </div>
              <div className="timing-item">
                <label>Deadline</label>
                <time>{deadline.toLocaleString()}</time>
              </div>
              {evidenceAttachedAt && (
                <div className="timing-item">
                  <label>Evidence Attached</label>
                  <time>{evidenceAttachedAt.toLocaleString()}</time>
                </div>
              )}
            </div>
          </section>

          {/* TIMING STATUS */}
          <section className="status-section">
            <div className={`status-badge timing-status ${timingStatus.replace(/\s+/g, '-').toLowerCase()}`}>
              {timingStatus}
            </div>
          </section>

          {/* INTEGRITY */}
          {evidenceAttachedAt && (
            <section className="integrity-section">
              <h3>Evidence Integrity</h3>
              <div className={`status-badge integrity-status ${integrityStatus.replace(/\s+/g, '-').toLowerCase()}`}>
                {integrityStatus === 'INTEGRITY_MATCH' ? 'MANIFEST INTEGRITY VERIFIED' : integrityStatus}
              </div>
              {integrityStatus !== 'UNKNOWN' && (
                <div className="integrity-details">
                  <p><strong>Stored hash:</strong> {record.evidenceHash.slice(0, 16)}...</p>
                  <p className="integrity-note">
                    {integrityStatus === 'INTEGRITY_MATCH'
                      ? 'The evidence manifest fetched from IPFS matches the hash recorded on-chain. This does not verify completion, quality, authenticity, or truth.'
                      : 'The evidence manifest does NOT match the hash recorded on-chain. The evidence may have been modified or is corrupted.'}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* TRUTH BOUNDARY */}
          <section className="truth-boundary">
            <h3>What This Receipt Proves</h3>
            <div className="truth-content">
              <div className="proves">
                <h4>✓ STATED proves:</h4>
                <ul>
                  <li>Your declaration existed at an onchain time</li>
                  <li>Your declaration was not rewritten</li>
                  <li>Evidence was attached at an onchain time</li>
                  <li>A manifest matches or does not match the recorded hash</li>
                </ul>
              </div>
              <div className="does-not-prove">
                <h4>✗ STATED does not prove:</h4>
                <ul>
                  <li>Objective completion of your project</li>
                  <li>Quality of your work</li>
                  <li>Truthfulness of your claims</li>
                  <li>Authenticity of artifacts</li>
                  <li>Client acceptance</li>
                </ul>
              </div>
            </div>
          </section>

          {/* CONTRACT DETAILS */}
          <section className="contract-details">
            <h3>Onchain Record</h3>
            <div className="details-grid">
              <div className="detail">
                <label>Owner</label>
                <code>{record.owner.slice(0, 6)}...{record.owner.slice(-4)}</code>
              </div>
              <div className="detail">
                <label>Declaration Hash</label>
                <code>{record.declarationHash.slice(0, 12)}...</code>
              </div>
              <div className="detail">
                <label>Declaration URI</label>
                <code>{record.declarationURI.slice(0, 30)}...</code>
              </div>
              {record.evidenceHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
                <>
                  <div className="detail">
                    <label>Evidence Hash</label>
                    <code>{record.evidenceHash.slice(0, 12)}...</code>
                  </div>
                  <div className="detail">
                    <label>Evidence URI</label>
                    <code>{record.evidenceURI.slice(0, 30)}...</code>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        <nav className="nav-buttons">
          <button onClick={() => onNavigate('landing', null)} className="back-button">
            ← Create Another Record
          </button>
        </nav>
      </div>
    </div>
  );
}

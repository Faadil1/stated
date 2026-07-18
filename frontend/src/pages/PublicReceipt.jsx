import React, { useState, useEffect } from 'react';
import { getRecord } from '../utils/contract';
import { hashManifest } from '../utils/manifest';
import '../styles/PublicReceipt.css';

export default function PublicReceipt({ recordId, declaration, evidenceManifest, onNavigate }) {
  const [record, setRecord] = useState(null);
  const [integrity, setIntegrity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecord();
  }, [recordId]);

  const loadRecord = async () => {
    try {
      if (!recordId && recordId !== 0) {
        throw new Error('No record ID provided');
      }

      const rec = await getRecord(recordId);
      setRecord(rec);

      // Verify integrity if we have evidence
      if (evidenceManifest) {
        const computedHash = hashManifest(evidenceManifest);
        setIntegrity({
          stored: rec.evidenceHash,
          computed: computedHash,
          match: rec.evidenceHash === computedHash,
        });
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="receipt-container"><p>Loading receipt...</p></div>;
  }

  if (error || !record) {
    return (
      <div className="receipt-container">
        <p className="error">{error || 'Receipt not found'}</p>
        <button onClick={() => onNavigate('landing')} className="back-button">
          ← Start Over
        </button>
      </div>
    );
  }

  // Derive states
  const declaredAt = new Date(Number(record.declaredAt) * 1000);
  const deadline = new Date(Number(record.deadline) * 1000);
  const evidenceAttachedAt = record.evidenceAttachedAt === 0n ? null : new Date(Number(record.evidenceAttachedAt) * 1000);

  const timingStatus = evidenceAttachedAt
    ? evidenceAttachedAt <= deadline
      ? 'ATTACHED ON TIME'
      : 'ATTACHED LATE'
    : 'NO EVIDENCE ATTACHED';

  const integrityStatus =
    !evidenceAttachedAt ? 'NO EVIDENCE' : integrity
      ? integrity.match
        ? 'INTEGRITY MATCH'
        : 'INTEGRITY MISMATCH'
      : 'UNKNOWN';

  // Map evidence to conditions
  const evidenceByCondition = {};
  if (evidenceManifest && evidenceManifest.evidence) {
    evidenceManifest.evidence.forEach((e) => {
      e.conditionIds.forEach((cId) => {
        if (!evidenceByCondition[cId]) {
          evidenceByCondition[cId] = [];
        }
        evidenceByCondition[cId].push(e);
      });
    });
  }

  const unaccountedConditions = declaration.conditions.filter(
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
              <h3>{declaration.project.title}</h3>
              <p className="promise">{declaration.project.promise}</p>
              <div className="conditions">
                {declaration.conditions.map((c) => (
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
                {evidenceManifest && evidenceManifest.evidence && evidenceManifest.evidence.length > 0 ? (
                  <ul className="evidence-list">
                    {evidenceManifest.evidence.map((e) => (
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
                {integrityStatus}
              </div>
              {integrity && (
                <div className="integrity-details">
                  <p><strong>Stored hash:</strong> {integrity.stored.slice(0, 16)}...</p>
                  <p><strong>Computed hash:</strong> {integrity.computed.slice(0, 16)}...</p>
                  <p className="integrity-note">
                    {integrity.match
                      ? 'The evidence manifest on your device matches the hash recorded onchain.'
                      : 'The evidence manifest on your device does NOT match the hash recorded onchain. The evidence may have been modified.'}
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
              {record.evidenceHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
                <div className="detail">
                  <label>Evidence Hash</label>
                  <code>{record.evidenceHash.slice(0, 12)}...</code>
                </div>
              )}
            </div>
          </section>
        </div>

        <nav className="nav-buttons">
          <button onClick={() => onNavigate('landing')} className="back-button">
            ← Create Another Record
          </button>
        </nav>
      </div>
    </div>
  );
}

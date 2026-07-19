import React, { useState, useEffect } from 'react';
import { attachEvidence, getRecordPublic } from '../utils/contract';
import { hashManifest, validateEvidence, uploadManifest, fetchManifest } from '../utils/manifest';
import GlobalHeader from '../components/GlobalHeader';
import '../styles/AttachEvidence.css';

const IPFS_GATEWAY = 'https://ipfs.io';

const TX_STATES = {
  DRAFT: 'DRAFT',
  READY_TO_ATTACH: 'READY TO ATTACH',
  PREPARING_MANIFEST: 'PREPARING MANIFEST',
  AWAITING_WALLET: 'AWAITING WALLET',
  SUBMITTING_TO_MONAD: 'SUBMITTING TO MONAD',
  EVIDENCE_ATTACHED: 'EVIDENCE ATTACHED',
  ERROR: 'ERROR',
};

function isEmptyOrMalformed(text) {
  if (text === undefined || text === null) return true;
  const trimmed = String(text).trim();
  if (trimmed.length === 0) return true;
  // punctuation-only or placeholder dots
  if (/^[.\s]+$/.test(trimmed)) return true;
  return false;
}

function formatFieldLabel(content, fallback) {
  return isEmptyOrMalformed(content) ? fallback : String(content).trim();
}

export default function AttachEvidence({ declaration: propDeclaration, recordId, onNavigate, onEvidenceAttached, networkState, mode }) {
  const [evidence, setEvidence] = useState({
    items: [{ id: 'evidence-1', conditionIds: [], label: '', uri: '' }],
  });

  const [declaration, setDeclaration] = useState(propDeclaration || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [txState, setTxState] = useState(TX_STATES.DRAFT);

  useEffect(() => {
    if (!declaration && recordId !== null && recordId !== undefined) {
      loadDeclarationFromContract();
    }
  }, [recordId, declaration]);

  useEffect(() => {
    if (success) {
      setTxState(TX_STATES.EVIDENCE_ATTACHED);
    }
  }, [success]);

  const loadDeclarationFromContract = async () => {
    try {
      setLoading(true);
      const record = await getRecordPublic(recordId);

      if (!record.declarationURI) {
        throw new Error('No declaration URI in record');
      }

      const decl = await fetchManifest(record.declarationURI, IPFS_GATEWAY);

      const computedHash = hashManifest(decl);
      if (computedHash !== record.declarationHash) {
        throw new Error(
          `Declaration hash mismatch: computed ${computedHash} !== stored ${record.declarationHash}`
        );
      }

      setDeclaration(decl);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    const newItem = {
      id: `evidence-${evidence.items.length + 1}`,
      conditionIds: [],
      label: '',
      uri: '',
    };
    setEvidence({ items: [...evidence.items, newItem] });
  };

  const handleRemoveItem = (idx) => {
    if (evidence.items.length > 1) {
      setEvidence({ items: evidence.items.filter((_, i) => i !== idx) });
    }
  };

  const handleItemChange = (idx, field, value) => {
    const newItems = [...evidence.items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setEvidence({ items: newItems });
  };

  const handleConditionToggle = (itemIdx, conditionId) => {
    const newItems = [...evidence.items];
    const item = newItems[itemIdx];
    if (item.conditionIds.includes(conditionId)) {
      item.conditionIds = item.conditionIds.filter((id) => id !== conditionId);
    } else {
      item.conditionIds = [...item.conditionIds, conditionId];
    }
    setEvidence({ items: newItems });
  };

  const validItems = evidence.items.filter((e) => e.label.trim() && e.uri.trim());
  const hasNetwork = networkState?.isMonad;
  const hasValidItems = validItems.length > 0;
  const hasLinkedConditions = validItems.every((item) => item.conditionIds.length > 0);

  const unmetRequirements = [
    !hasNetwork && 'Switch to Monad Testnet',
    !hasValidItems && 'Add a valid evidence URL',
    hasValidItems && !hasLinkedConditions && 'Link every evidence item to at least one condition',
  ].filter(Boolean);

  const isReadyToAttach = hasNetwork && hasValidItems && hasLinkedConditions && !loading && !success;

  useEffect(() => {
    if (success) {
      setTxState(TX_STATES.EVIDENCE_ATTACHED);
    } else if (loading) {
      // keep current loading state
    } else if (isReadyToAttach) {
      setTxState(TX_STATES.READY_TO_ATTACH);
    } else {
      setTxState(TX_STATES.DRAFT);
    }
  }, [isReadyToAttach, loading, success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTxState(TX_STATES.PREPARING_MANIFEST);

    try {
      if (!declaration) {
        throw new Error('No declaration found');
      }

      if (evidence.items.length === 0) {
        throw new Error('Add at least one evidence item');
      }

      const manifestData = {
        schema: 'stated/evidence/v1',
        recordId: String(recordId),
        evidence: validItems,
      };

      validateEvidence(manifestData, declaration);

      const localEvidenceHash = hashManifest(manifestData);
      setTxState(TX_STATES.AWAITING_WALLET);
      const uploadResult = await uploadManifest(manifestData, 'evidence');

      if (uploadResult.manifestHash !== localEvidenceHash) {
        throw new Error(
          `Hash mismatch: local ${localEvidenceHash} !== server ${uploadResult.manifestHash}`
        );
      }

      setTxState(TX_STATES.SUBMITTING_TO_MONAD);
      await attachEvidence(recordId, localEvidenceHash, uploadResult.uri);

      setSuccess(true);
      onEvidenceAttached({
        recordId,
        evidenceHash: localEvidenceHash,
        evidenceURI: uploadResult.uri,
        evidence: manifestData,
      });
      setTimeout(() => {
        onNavigate('receipt', recordId);
      }, 2200);
    } catch (err) {
      setError(err.message);
      setTxState(TX_STATES.ERROR);
    }

    setLoading(false);
  };

  if (!declaration) {
    return (
      <>
        <GlobalHeader mode={mode} />
        <div className="attach-evidence">
          <div className="container">
            <p className="error-message">No declaration found. Create a record first.</p>
            <button onClick={() => onNavigate('create', null)} className="back-button">
              ← Create Record
            </button>
          </div>
        </div>
      </>
    );
  }

  const declarationTitle = formatFieldLabel(
    declaration.project?.title,
    'No title recorded'
  );
  const declarationText = isEmptyOrMalformed(declaration.project?.promise)
    ? 'No meaningful declaration text was recorded.'
    : declaration.project.promise;

  return (
    <>
      <GlobalHeader mode={mode} />
      <div className="attach-evidence">
        <div className="container">
          <header className="page-header">
            <div className="page-eyebrow">STEP 04 — ATTACH</div>
            <h1 className="page-title">Clip Evidence to the Case File</h1>
            <p className="page-subtitle">Link the proof of your conditions to the public record.</p>
          </header>

          {error && (
            <div className="error-message" role="alert">
              <p>{error}</p>
            </div>
          )}

          {!networkState?.isMonad && (
            <div className="network-notice" role="status">
              <div className="network-notice-header">
                <span className="network-notice-icon" aria-hidden="true">◉</span>
                <span className="network-notice-title">Network Mismatch</span>
              </div>
              <p className="network-notice-text">
                This record is anchored on Monad Testnet.<br />
                Switch networks before attaching evidence.
              </p>
              {networkState?.switchNetwork && (
                <button
                  onClick={networkState.switchNetwork}
                  className="network-switch-button"
                  disabled={networkState?.loading}
                >
                  {networkState?.loading ? 'Switching...' : 'Switch to Monad Testnet'}
                </button>
              )}
            </div>
          )}

          <div className="evidence-layout">
            <section className="declared-panel" aria-labelledby="declared-heading">
              <div className="panel-tab">WHAT WAS STATED</div>
              <div className="stated-box">
                <div className="document-code" aria-hidden="true">
                  <span className="doc-code-label">REC</span>
                  <span className="doc-code-value">#{recordId}</span>
                </div>

                <div className="declaration-field">
                  <label className="field-label" id="declared-heading">Declaration Title</label>
                  <p className="field-value title-value">{declarationTitle}</p>
                </div>

                <div className="declaration-field">
                  <label className="field-label">Declaration Text</label>
                  <p className={`field-value text-value ${isEmptyOrMalformed(declaration.project?.promise) ? 'missing-value' : ''}`}>
                    {declarationText}
                  </p>
                </div>

                {declaration.deadline && (
                  <div className="declaration-field">
                    <label className="field-label">Due</label>
                    <p className="field-value mono-value">
                      {new Date(declaration.deadline).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZoneName: 'short',
                      })}
                    </p>
                  </div>
                )}

                <div className="declaration-field conditions-field">
                  <label className="field-label">Conditions of Completion</label>
                  <div className="conditions-list" role="list">
                    {declaration.conditions.map((c, i) => (
                      <div key={c.id} className="condition-entry" role="listitem">
                        <span className="condition-entry-label">Condition {String(i + 1).padStart(2, '0')}</span>
                        <span className="condition-entry-text">
                          {isEmptyOrMalformed(c.text) ? '—' : c.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="stated-seal" aria-hidden="true">
                <span className="seal-lock">🔒</span>
                <span>LOCKED ON MONAD</span>
              </div>
            </section>

            <form onSubmit={handleSubmit} className="evidence-form" aria-label="Attach evidence">
              <div className="form-header">
                <div className="paper-clip" aria-hidden="true">🖇</div>
                <h2>Evidence Items</h2>
                <p className="form-hint">Each item can be linked to one or more conditions.</p>
              </div>

              <div className="evidence-items-stack">
                {evidence.items.map((item, idx) => (
                  <div key={idx} className="evidence-slip">
                    <div className="evidence-slip-header">
                      <span className="evidence-slip-number">ITEM {String(idx + 1).padStart(2, '0')}</span>
                      {evidence.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="remove-button"
                          disabled={loading}
                          aria-label={`Remove evidence item ${idx + 1}`}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="form-subgroup">
                      <label htmlFor={`evidence-${idx}-label`}>Label</label>
                      <input
                        id={`evidence-${idx}-label`}
                        type="text"
                        placeholder="e.g., GitHub repository"
                        value={item.label}
                        onChange={(e) => handleItemChange(idx, 'label', e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div className="form-subgroup">
                      <label htmlFor={`evidence-${idx}-uri`}>URL / URI</label>
                      <input
                        id={`evidence-${idx}-uri`}
                        type="text"
                        placeholder="https://github.com/user/repo"
                        value={item.uri}
                        onChange={(e) => handleItemChange(idx, 'uri', e.target.value)}
                        disabled={loading}
                        aria-describedby={`evidence-${idx}-uri-note`}
                      />
                      <p id={`evidence-${idx}-uri-note`} className="input-note">
                        Records what you chose to present. Does not verify authenticity.
                      </p>
                    </div>

                    <div className="form-subgroup">
                      <span className="fieldset-label">Link to Conditions</span>
                      <div className="condition-checkboxes" role="group" aria-label="Linked conditions">
                        {declaration.conditions.map((condition) => (
                          <label key={condition.id} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={item.conditionIds.includes(condition.id)}
                              onChange={() => handleConditionToggle(idx, condition.id)}
                              disabled={loading}
                            />
                            <span className="checkbox-check" aria-hidden="true"></span>
                            <span className="checkbox-text">
                              <span className="checkbox-condition-label">
                                Condition {String(declaration.conditions.findIndex((c) => c.id === condition.id) + 1).padStart(2, '0')}
                              </span>
                              <span className="checkbox-condition-text">
                                {isEmptyOrMalformed(condition.text) ? '—' : condition.text}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                      {item.conditionIds.length === 0 && (
                        <p className="conditions-unlinked" role="status">
                          No condition selected — this item will not map to the declaration.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="add-button"
                disabled={loading}
              >
                + Add Evidence Item
              </button>

              <div className="warning-notice" role="note">
                <p className="warning-title">Attaching evidence does not mark a condition as fulfilled.</p>
                <p className="warning-text">
                  It only records what you chose to present.<br />
                  Once attached, the evidence manifest cannot be replaced.<br />
                  Its hash is recorded permanently.
                </p>
              </div>

              {unmetRequirements.length > 0 && (
                <div className="requirements-panel" role="status">
                  <p className="requirements-title">To attach this evidence pack:</p>
                  <ul className="requirements-list">
                    {unmetRequirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="submit"
                className={`submit-button tactile-press ${!isReadyToAttach ? 'submit-disabled' : ''}`}
                disabled={!isReadyToAttach}
                aria-live="polite"
              >
                {loading ? txState : txState === TX_STATES.READY_TO_ATTACH ? 'Attach This Evidence Pack' : txState}
              </button>
            </form>
          </div>

          {success && (
            <div className="success-message attach-success" role="status">
              ✓ Evidence attached! Generating receipt...
            </div>
          )}

          <nav className="nav-buttons">
            <button onClick={() => onNavigate('receipt', recordId)} className="back-button">
              ← View Public Record
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}

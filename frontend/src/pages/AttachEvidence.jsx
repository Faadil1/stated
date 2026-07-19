import React, { useState, useEffect } from 'react';
import { attachEvidence, getRecordPublic } from '../utils/contract';
import { hashManifest, validateEvidence, uploadManifest, fetchManifest } from '../utils/manifest';
import GlobalHeader from '../components/GlobalHeader';
import '../styles/AttachEvidence.css';

const IPFS_GATEWAY = 'https://ipfs.io';

export default function AttachEvidence({ declaration: propDeclaration, recordId, onNavigate, onEvidenceAttached, networkState }) {
  const [evidence, setEvidence] = useState({
    items: [
      { id: 'evidence-1', conditionIds: [], label: '', uri: '' },
    ],
  });

  const [declaration, setDeclaration] = useState(propDeclaration || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!declaration && recordId !== null && recordId !== undefined) {
      loadDeclarationFromContract();
    }
  }, [recordId, declaration]);

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
    setEvidence({
      items: [...evidence.items, newItem],
    });
  };

  const handleRemoveItem = (idx) => {
    if (evidence.items.length > 1) {
      setEvidence({
        items: evidence.items.filter((_, i) => i !== idx),
      });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
        evidence: evidence.items.filter((e) => e.label && e.uri),
      };

      validateEvidence(manifestData, declaration);

      const localEvidenceHash = hashManifest(manifestData);
      const uploadResult = await uploadManifest(manifestData, 'evidence');

      if (uploadResult.manifestHash !== localEvidenceHash) {
        throw new Error(
          `Hash mismatch: local ${localEvidenceHash} !== server ${uploadResult.manifestHash}`
        );
      }

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
    }

    setLoading(false);
  };

  if (!declaration) {
    return (
      <>
        <GlobalHeader />
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

  return (
    <>
      <GlobalHeader />
      <div className="attach-evidence">
        <div className="container">
          <header className="page-header">
            <div className="page-eyebrow">STEP 04 — ATTACH</div>
            <h1 className="page-title">Clip Evidence to the Case File</h1>
            <p className="page-subtitle">Link the proof of your conditions to the public record.</p>
          </header>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          {!networkState?.isMonad && (
            <div className="error-message">
              ⚠️ Switch MetaMask to Monad Testnet before continuing.
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
            <section className="declared-panel">
              <div className="panel-tab">WHAT WAS STATED</div>
              <div className="stated-box">
                <h3>{declaration.project.title}</h3>
                <p className="stated-promise">{declaration.project.promise}</p>
                {declaration.deadline && (
                  <div className="stated-deadline">
                    <span className="stated-label">DUE</span>
                    <span>{new Date(declaration.deadline).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="conditions">
                  <p className="label">Conditions of completion</p>
                  <ol>
                    {declaration.conditions.map((c, i) => (
                      <li key={c.id}>
                        <span className="condition-index">{i + 1}.</span>
                        {c.text}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
              <div className="stated-seal">🔒 LOCKED ON MONAD</div>
            </section>

            <form onSubmit={handleSubmit} className="evidence-form">
              <div className="form-header">
                <div className="paper-clip">🖇</div>
                <h2>EVIDENCE ITEMS</h2>
                <p className="form-hint">Each item can be linked to one or more conditions.</p>
              </div>

              <div className="evidence-items-stack">
                {evidence.items.map((item, idx) => (
                  <div key={idx} className="evidence-card">
                    <div className="evidence-card-header">
                      <span className="evidence-card-number">{idx + 1}</span>
                      {evidence.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="remove-button"
                          disabled={loading}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="form-subgroup">
                      <label>Label</label>
                      <input
                        type="text"
                        placeholder="e.g., GitHub repository"
                        value={item.label}
                        onChange={(e) => handleItemChange(idx, 'label', e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div className="form-subgroup">
                      <label>URL / URI</label>
                      <input
                        type="text"
                        placeholder="https://github.com/user/repo"
                        value={item.uri}
                        onChange={(e) => handleItemChange(idx, 'uri', e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div className="form-subgroup">
                      <label>Link to Conditions</label>
                      <div className="condition-checkboxes">
                        {declaration.conditions.map((condition) => (
                          <label key={condition.id} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={item.conditionIds.includes(condition.id)}
                              onChange={() => handleConditionToggle(idx, condition.id)}
                              disabled={loading}
                            />
                            <span>{condition.text}</span>
                          </label>
                        ))}
                      </div>
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

              <div className="warning-stamp">
                <p className="warning-title">EVIDENCE ATTACHES ONCE</p>
                <p className="warning-text">Once attached, your evidence cannot be changed. The hash will be recorded permanently.</p>
              </div>

              <button
                type="submit"
                className="submit-button tactile-press"
                disabled={loading || evidence.items.filter((e) => e.label && e.uri).length === 0 || !networkState?.isMonad}
              >
                {loading ? 'ATTACHING EVIDENCE...' : 'ATTACH EVIDENCE TO RECORD'}
              </button>
            </form>
          </div>

          {success && (
            <div className="success-message attach-success">
              ✓ Evidence attached! Generating receipt...
            </div>
          )}

          <nav className="nav-buttons">
            <button onClick={() => onNavigate('create', null)} className="back-button">
              ← Back to Create Record
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}

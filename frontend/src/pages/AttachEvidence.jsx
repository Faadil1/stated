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

  // Load declaration from contract if not provided via props
  useEffect(() => {
    if (!declaration && recordId !== null && recordId !== undefined) {
      loadDeclarationFromContract();
    }
  }, [recordId, declaration]);

  const loadDeclarationFromContract = async () => {
    try {
      setLoading(true);
      // Use read-only provider for initial load (no wallet required)
      const record = await getRecordPublic(recordId);

      if (!record.declarationURI) {
        throw new Error('No declaration URI in record');
      }

      const decl = await fetchManifest(record.declarationURI, IPFS_GATEWAY);

      // Verify integrity
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

      // Validate at least one item
      if (evidence.items.length === 0) {
        throw new Error('Add at least one evidence item');
      }

      // Create evidence manifest
      const manifestData = {
        schema: 'stated/evidence/v1',
        recordId: String(recordId),
        evidence: evidence.items.filter((e) => e.label && e.uri),
      };

      // Validate
      validateEvidence(manifestData, declaration);

      // Hash locally
      const localEvidenceHash = hashManifest(manifestData);

      // Upload to IPFS via server endpoint
      setError(null);
      const uploadResult = await uploadManifest(manifestData, 'evidence');

      // Verify hash consistency
      if (uploadResult.manifestHash !== localEvidenceHash) {
        throw new Error(
          `Hash mismatch: local ${localEvidenceHash} !== server ${uploadResult.manifestHash}`
        );
      }

      // Attach to contract with real IPFS URI
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
      }, 2000);
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
            <p className="error">No declaration found. Create a record first.</p>
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
          <h1>Attach Evidence to Prove Your Promise</h1>
          <p>Link the proof of your conditions to the public record</p>
        </header>

        <div className="evidence-layout">
          <section className="declared">
            <h2>What You Stated</h2>
            <div className="stated-box">
              <h3>{declaration.project.title}</h3>
              <p>{declaration.project.promise}</p>
              <div className="conditions">
                <p className="label">Conditions:</p>
                <ul>
                  {declaration.conditions.map((c) => (
                    <li key={c.id}>{c.text}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Evidence Items</label>
            <p className="hint">Each item can be linked to one or more conditions.</p>

            {evidence.items.map((item, idx) => (
              <div key={idx} className="evidence-item">
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
                  <label>URL/URI</label>
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
                        {condition.text}
                      </label>
                    ))}
                  </div>
                </div>

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

          <div className="warning">
            <h3>⚠️ Evidence attaches once</h3>
            <p>Once attached, your evidence cannot be changed. The hash will be recorded permanently.</p>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={loading || evidence.items.filter((e) => e.label && e.uri).length === 0 || !networkState?.isMonad}
          >
            {loading ? 'Attaching Evidence...' : 'Attach Evidence'}
          </button>
          </form>
        </div>

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
        {success && (
          <div className="success-message">
            ✓ Evidence attached! Generating receipt...
          </div>
        )}
        {error && <div className="error-message">{error}</div>}

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

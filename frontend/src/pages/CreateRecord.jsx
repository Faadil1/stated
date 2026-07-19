import React, { useState } from 'react';
import { createRecord, extractRecordIdFromReceipt } from '../utils/contract';
import { hashManifest, validateDeclaration, uploadManifest } from '../utils/manifest';
import GlobalHeader from '../components/GlobalHeader';
import '../styles/CreateRecord.css';

export default function CreateRecord({ walletAddress, onNavigate, onRecordCreated, networkState }) {
  const [formData, setFormData] = useState({
    title: '',
    promise: '',
    deadline: '',
    conditions: [
      { id: 'condition-1', text: '' },
      { id: 'condition-2', text: '' },
      { id: 'condition-3', text: '' },
    ],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleConditionChange = (index, text) => {
    const newConditions = [...formData.conditions];
    newConditions[index].text = text;
    setFormData({ ...formData, conditions: newConditions });
  };

  const activeConditions = formData.conditions.filter((c) => c.text.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      if (!formData.promise.trim()) {
        throw new Error('Promise is required');
      }
      if (!formData.deadline) {
        throw new Error('Deadline is required');
      }
      if (activeConditions.length === 0) {
        throw new Error('At least one condition is required');
      }

      const deadlineDate = new Date(formData.deadline);
      const declaration = {
        schema: 'stated/declaration/v1',
        project: {
          title: formData.title,
          promise: formData.promise,
        },
        deadline: deadlineDate.toISOString(),
        conditions: activeConditions,
      };

      validateDeclaration(declaration);

      const localDeclarationHash = hashManifest(declaration);
      const uploadResult = await uploadManifest(declaration, 'declaration');

      if (uploadResult.manifestHash !== localDeclarationHash) {
        throw new Error(
          `Hash mismatch: local ${localDeclarationHash} !== server ${uploadResult.manifestHash}`
        );
      }

      const deadlineUnix = Math.floor(deadlineDate.getTime() / 1000);

      const receipt = await createRecord(
        deadlineUnix,
        localDeclarationHash,
        uploadResult.uri
      );

      const recordId = extractRecordIdFromReceipt(receipt);
      if (recordId === null) {
        throw new Error('BuildRecordCreated event not found in transaction receipt');
      }

      setSuccess(true);
      onRecordCreated({
        recordId,
        declaration,
        declarationHash: localDeclarationHash,
        declarationURI: uploadResult.uri,
      });
      setTimeout(() => {
        onNavigate('attach', recordId);
      }, 2200);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <>
        <GlobalHeader />
        <div className="create-record">
          <div className="create-container">
            <div className="anchoring-state">
              <div className="anchoring-seal seal-stamp">LOCKED</div>
              <p className="anchoring-label">ANCHORED ON MONAD</p>
              <p className="anchoring-note">Redirecting to evidence...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalHeader />
      <div className="create-record">
        <div className="create-container">
          <div className="create-header">
            <div className="create-eyebrow">STEP 01 — DECLARE</div>
            <h1 className="create-title">Write the Record<br />Before the Work Begins</h1>
            <p className="create-subtitle">
              What are you building? What are you promising? When is it due? What will count as done?
            </p>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          {!networkState?.isMonad && (
            <div className="error-message">
              <p>⚠️ Switch MetaMask to Monad Testnet before continuing.</p>
              {networkState?.switchNetwork && (
                <button
                  onClick={networkState.switchNetwork}
                  disabled={networkState?.loading}
                  className="network-switch-button"
                >
                  {networkState?.loading ? 'Switching...' : 'Switch to Monad Testnet'}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="create-form">
            {/* Section 01: Title */}
            <div className="form-section">
              <div className="section-header">
                <div className="section-number">01</div>
                <div className="section-label">What are you building?</div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="title">Project Title</label>
                <input
                  id="title"
                  className="form-input"
                  type="text"
                  placeholder="My Project"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Section 02: Promise */}
            <div className="form-section">
              <div className="section-header">
                <div className="section-number">02</div>
                <div className="section-label">What are you promising?</div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="promise">Your Promise (1-2 sentences)</label>
                <textarea
                  id="promise"
                  className="form-textarea form-handwriting"
                  placeholder="I will build and ship..."
                  value={formData.promise}
                  onChange={(e) => setFormData({ ...formData, promise: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Section 03: Deadline */}
            <div className="form-section">
              <div className="section-header">
                <div className="section-number">03</div>
                <div className="section-label">When is it due?</div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="deadline">Deadline</label>
                <input
                  id="deadline"
                  className="form-input form-mono"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Section 04: Conditions */}
            <div className="form-section">
              <div className="section-header">
                <div className="section-number">04</div>
                <div className="section-label">What will count as done?</div>
              </div>
              <div className="conditions-list">
                {formData.conditions.map((condition, idx) => (
                  <div key={idx} className="condition-input-group">
                    <div className="condition-number">{idx + 1}</div>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g., Working prototype deployed"
                      value={condition.text}
                      onChange={(e) => handleConditionChange(idx, e.target.value)}
                      disabled={loading}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Warning Stamp */}
            <div className="warning-stamp">
              <p className="warning-title">PERMANENT RECORD</p>
              <p className="warning-text">Once anchored, this declaration cannot be rewritten.</p>
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button
                type="submit"
                className="btn-anchor tactile-press"
                disabled={loading || activeConditions.length === 0 || !networkState?.isMonad}
              >
                {loading ? 'ANCHORING...' : 'ANCHOR THIS DECLARATION'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('landing', null)}
                className="btn-cancel"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

import React, { useState } from 'react';
import { createRecord, extractRecordIdFromReceipt } from '../utils/contract';
import { hashManifest, validateDeclaration, uploadManifest } from '../utils/manifest';
import GlobalHeader from '../components/GlobalHeader';
import '../styles/CreateRecord.css';

const STEPS = [
  { key: 'declaration', label: 'DECLARATION', num: '01' },
  { key: 'conditions', label: 'CONDITIONS', num: '02' },
  { key: 'deadline', label: 'DEADLINE', num: '03' },
  { key: 'review', label: 'REVIEW', num: '04' },
];

export default function CreateRecord({ walletAddress, onNavigate, onRecordCreated, networkState, mode }) {
  const [stepIndex, setStepIndex] = useState(0);
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

  const canProceed = () => {
    if (stepIndex === 0) return formData.title.trim() && formData.promise.trim();
    if (stepIndex === 1) return activeConditions.length > 0;
    if (stepIndex === 2) return !!formData.deadline;
    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();
    setError(null);
    if (!canProceed()) {
      if (stepIndex === 0) setError('Title and declaration text are required.');
      if (stepIndex === 1) setError('At least one condition is required.');
      if (stepIndex === 2) setError('A deadline is required.');
      return;
    }
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const handleSubmit = async () => {
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
        <GlobalHeader mode={mode} />
        <div className="create-record paper-shell">
          <div className="create-container">
            <div className="anchoring-state">
              <div className="anchoring-seal seal-stamp" aria-hidden="true">LOCKED</div>
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
      <GlobalHeader mode={mode} />
      <div className="create-record paper-shell">
        <div className="create-container">
          <div className="stepper">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.key}>
                <div
                  className={`stepper-step ${
                    index === stepIndex ? 'active' : index < stepIndex ? 'completed' : ''
                  }`}
                >
                  <span className="step-number">{step.num}</span>
                  <span className="step-label">{step.label}</span>
                </div>
                {index < STEPS.length - 1 && <div className="stepper-connector"></div>}
              </React.Fragment>
            ))}
          </div>

          {error && (
            <div className="error-message" role="alert">
              <p>{error}</p>
            </div>
          )}

          {!networkState?.isMonad && (
            <div className="network-notice-create" role="status">
              <div className="network-notice-header">
                <span className="network-notice-icon" aria-hidden="true">◉</span>
                <span className="network-notice-title">Network Mismatch</span>
              </div>
              <p className="network-notice-text">
                Declarations are anchored on Monad Testnet.<br />
                Switch networks before continuing.
              </p>
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

          <form onSubmit={handleNext} className="create-form">
            <div className="tape-strip" aria-hidden="true"></div>

            {stepIndex === 0 && (
              <div className="form-section">
                <div className="section-header">
                  <span className="section-label-pill">01 — DECLARATION</span>
                </div>
                <p className="section-hint">Write clearly what you intend to build or complete.</p>
                <div className="form-group">
                  <label className="form-label" htmlFor="title">DECLARATION TITLE</label>
                  <input
                    id="title"
                    className="form-input"
                    type="text"
                    placeholder="e.g. Q3 Transparency Dashboard"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="promise">DECLARATION TEXT</label>
                  <textarea
                    id="promise"
                    className="form-textarea"
                    placeholder="Describe your intent in detail..."
                    value={formData.promise}
                    onChange={(e) => setFormData({ ...formData, promise: e.target.value })}
                    disabled={loading}
                    maxLength={3000}
                  />
                  <div className="char-counter">{formData.promise.length} / 3000</div>
                </div>

                <div className="warning-stamp" role="note">
                  <span className="warning-icon" aria-hidden="true">!</span>
                  <p>ONCE ANCHORED, THIS DECLARATION CANNOT BE CHANGED.</p>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-primary tactile-press"
                    disabled={loading || !networkState?.isMonad}
                  >
                    CONTINUE TO CONDITIONS →
                  </button>
                </div>
              </div>
            )}

            {stepIndex === 1 && (
              <div className="form-section">
                <div className="section-header">
                  <span className="section-label-pill">02 — CONDITIONS</span>
                </div>
                <p className="section-hint">What will count as done?</p>
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
                        aria-label={`Condition ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="form-actions">
                  <button type="button" onClick={handleBack} className="btn-secondary" disabled={loading}>
                    ← BACK
                  </button>
                  <button type="submit" className="btn-primary tactile-press" disabled={loading || !networkState?.isMonad}>
                    CONTINUE TO DEADLINE →
                  </button>
                </div>
              </div>
            )}

            {stepIndex === 2 && (
              <div className="form-section">
                <div className="section-header">
                  <span className="section-label-pill">03 — DEADLINE</span>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="deadline">DUE DATE</label>
                  <input
                    id="deadline"
                    className="form-input form-mono"
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="form-actions">
                  <button type="button" onClick={handleBack} className="btn-secondary" disabled={loading}>
                    ← BACK
                  </button>
                  <button type="submit" className="btn-primary tactile-press" disabled={loading || !networkState?.isMonad}>
                    CONTINUE TO REVIEW →
                  </button>
                </div>
              </div>
            )}

            {stepIndex === 3 && (
              <div className="form-section review-section">
                <div className="section-header">
                  <span className="section-label-pill">04 — REVIEW</span>
                </div>
                <div className="review-summary">
                  <div className="review-row">
                    <span className="review-key">Declaration</span>
                    <span className="review-value">{formData.title.trim() || '—'}</span>
                  </div>
                  <div className="review-row">
                    <span className="review-key">Conditions</span>
                    <span className="review-value">{activeConditions.length === 0 ? 'None defined' : `${activeConditions.length} defined`}</span>
                  </div>
                  <div className="review-row">
                    <span className="review-key">Deadline</span>
                    <span className="review-value">{formData.deadline ? new Date(formData.deadline).toLocaleString() : '—'}</span>
                  </div>
                </div>

                <div className="warning-stamp" role="note">
                  <span className="warning-icon" aria-hidden="true">!</span>
                  <p>ONCE ANCHORED, THIS DECLARATION CANNOT BE CHANGED.</p>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={handleBack} className="btn-secondary" disabled={loading}>
                    ← BACK
                  </button>
                  <button
                    type="submit"
                    className="btn-primary tactile-press"
                    disabled={loading || activeConditions.length === 0 || !networkState?.isMonad}
                  >
                    {loading ? 'ANCHORING...' : 'ANCHOR THIS DECLARATION'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}

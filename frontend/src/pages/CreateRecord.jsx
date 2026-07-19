import React, { useState } from 'react';
import { createRecord, getOwnerRecords, extractRecordIdFromReceipt } from '../utils/contract';
import { hashManifest, validateDeclaration, uploadManifest } from '../utils/manifest';
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

      // Create declaration manifest
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

      // Validate
      validateDeclaration(declaration);

      // Hash locally
      const localDeclarationHash = hashManifest(declaration);

      // Upload to IPFS via server endpoint
      setError(null);
      const uploadResult = await uploadManifest(declaration, 'declaration');

      // Verify hash consistency
      if (uploadResult.manifestHash !== localDeclarationHash) {
        throw new Error(
          `Hash mismatch: local ${localDeclarationHash} !== server ${uploadResult.manifestHash}`
        );
      }

      // Prepare deadline as Unix timestamp
      const deadlineUnix = Math.floor(deadlineDate.getTime() / 1000);

      // Create record with real IPFS URI
      const receipt = await createRecord(
        deadlineUnix,
        localDeclarationHash,
        uploadResult.uri
      );

      // Parse record ID from BuildRecordCreated event
      const recordId = extractRecordIdFromReceipt(receipt);
      if (recordId === null) {
        throw new Error('BuildRecordCreated event not found in transaction receipt');
      }

      setSuccess(true);
      // Store receipt data but NOT the manifest (it's on IPFS now)
      onRecordCreated({
        recordId,
        declaration,
        declarationHash: localDeclarationHash,
        declarationURI: uploadResult.uri,
      });
      setTimeout(() => {
        onNavigate('attach', recordId);
      }, 2000);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="create-record">
      <div className="container">
        <header className="page-header">
          <h1>Create a Build Record</h1>
          <p>What did you promise to build?</p>
        </header>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="title">Project Title</label>
            <input
              id="title"
              type="text"
              placeholder="My Project"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="promise">Promise (1-2 sentences)</label>
            <textarea
              id="promise"
              placeholder="I will build and ship..."
              value={formData.promise}
              onChange={(e) => setFormData({ ...formData, promise: e.target.value })}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="deadline">Deadline</label>
            <input
              id="deadline"
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Conditions of Completion (1-3)</label>
            <p className="hint">Define what "done" means to you. Be specific.</p>
            {formData.conditions.map((condition, idx) => (
              <div key={idx} className="condition-input">
                <label>{idx + 1}.</label>
                <input
                  type="text"
                  placeholder="e.g., Working prototype deployed"
                  value={condition.text}
                  onChange={(e) => handleConditionChange(idx, e.target.value)}
                  disabled={loading}
                />
              </div>
            ))}
            {activeConditions.length === 0 && (
              <div className="error-message">At least one condition is required</div>
            )}
          </div>

          <div className="warning">
            <h3>⚠️ This record is permanent</h3>
            <p>Once you create this record, it cannot be changed. Your declaration will be recorded on the blockchain forever.</p>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={loading || activeConditions.length === 0 || !networkState?.isMonad}
          >
            {loading ? 'Creating Record...' : 'Create Record'}
          </button>
        </form>

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
            ✓ Record created! Redirecting to attach evidence...
          </div>
        )}
        {error && <div className="error-message">{error}</div>}

        <nav className="nav-buttons">
          <button onClick={() => onNavigate('landing', null)} className="back-button">
            ← Back to Landing
          </button>
        </nav>
      </div>
    </div>
  );
}

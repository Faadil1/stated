import React from 'react';
import '../styles/components/RegistryMetadata.css';

export default function RegistryMetadata({ record, declarationHash, evidenceHash }) {
  if (!record) {
    return null;
  }

  const safeDate = (value) => {
    if (value === undefined || value === null) return null;
    const num = typeof value === 'bigint' ? Number(value) : Number(value);
    if (!Number.isFinite(num) || num <= 0) return null;
    const date = new Date(num * 1000);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  };

  const declaredTime = safeDate(record.declaredAt);
  const deadlineTime = safeDate(record.deadline);
  const evidenceTime = safeDate(record.evidenceAttachedAt);

  return (
    <section className="registry-metadata">
      <div className="metadata-header">
        <h2 className="metadata-title">ON-CHAIN RECORD</h2>
      </div>

      <div className="metadata-grid">
        <div className="metadata-item">
          <label className="metadata-label">RECORD ID</label>
          <code className="metadata-value">{record.recordId ?? 'Loading...'}</code>
        </div>

        <div className="metadata-item">
          <label className="metadata-label">OWNER</label>
          <code className="metadata-value">
            {record.owner?.slice(0, 6)}...{record.owner?.slice(-4)}
          </code>
        </div>

        {declaredTime && (
          <div className="metadata-item">
            <label className="metadata-label">DECLARED</label>
            <code className="metadata-value">{declaredTime.toISOString()}</code>
          </div>
        )}

        {deadlineTime && (
          <div className="metadata-item">
            <label className="metadata-label">DEADLINE</label>
            <code className="metadata-value">{deadlineTime.toISOString()}</code>
          </div>
        )}

        {evidenceTime && (
          <div className="metadata-item">
            <label className="metadata-label">EVIDENCE ATTACHED</label>
            <code className="metadata-value">{evidenceTime.toISOString()}</code>
          </div>
        )}

        {declarationHash && (
          <div className="metadata-item hash-item">
            <label className="metadata-label">DECLARATION HASH</label>
            <code className="metadata-value hash-value" title={declarationHash}>
              {declarationHash.slice(0, 16)}...
            </code>
          </div>
        )}

        {record.declarationURI && (
          <div className="metadata-item uri-item">
            <label className="metadata-label">DECLARATION URI</label>
            <code className="metadata-value uri-value" title={record.declarationURI}>
              {record.declarationURI.slice(0, 24)}...
            </code>
          </div>
        )}

        {record.evidenceHash && record.evidenceHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
          <>
            <div className="metadata-item hash-item">
              <label className="metadata-label">EVIDENCE HASH</label>
              <code className="metadata-value hash-value" title={record.evidenceHash}>
                {record.evidenceHash.slice(0, 16)}...
              </code>
            </div>

            <div className="metadata-item uri-item">
              <label className="metadata-label">EVIDENCE URI</label>
              <code className="metadata-value uri-value" title={record.evidenceURI}>
                {record.evidenceURI?.slice(0, 24)}...
              </code>
            </div>
          </>
        )}
      </div>

      <div className="registry-footer">
        <p className="footer-text">
          All data stored and verified on Monad blockchain.
        </p>
      </div>
    </section>
  );
}

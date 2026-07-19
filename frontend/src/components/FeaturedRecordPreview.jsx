import React from 'react';
import '../styles/components/FeaturedRecordPreview.css';

export default function FeaturedRecordPreview({ record }) {
  if (!record) return null;

  const accountedConditions = record.conditions?.filter(c =>
    record.evidenceByCondition?.[c.id]?.length > 0
  ) || [];

  const unaccountedConditions = record.conditions?.filter(c =>
    !record.evidenceByCondition?.[c.id]?.length
  ) || [];

  return (
    <div className="featured-record-preview">
      <div className="preview-header">
        <div className="preview-meta">
          <span className="preview-record-id">Record #{record.recordId || '–'}</span>
          <span className="preview-status">ANCHORED</span>
        </div>
      </div>

      <div className="preview-content">
        <div className="preview-declaration">
          <h2 className="preview-title">{record.title || 'Project Declaration'}</h2>
          <p className="preview-promise">{record.promise || 'A promise made public.'}</p>

          <div className="preview-conditions-section">
            <h3 className="preview-section-label">CONDITIONS FOR COMPLETION</h3>
            <ol className="preview-conditions-list">
              {record.conditions?.map((condition, idx) => (
                <li key={idx} className="preview-condition">
                  {condition.text || condition}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="preview-evidence-section">
          <div className="preview-accounted">
            <div className="preview-accounted-label">WHAT WAS SHOWN</div>
            {accountedConditions.length > 0 ? (
              <div className="preview-evidence-items">
                {accountedConditions.map((condition, idx) => (
                  <div key={idx} className="preview-evidence-item">
                    <span className="evidence-marker">■</span>
                    <span className="evidence-text">{condition.text || condition}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="preview-empty-state">No evidence attached yet</p>
            )}
          </div>

          <div className="preview-unaccounted">
            <div className="preview-unaccounted-label">UNACCOUNTED FOR</div>
            {unaccountedConditions.length > 0 ? (
              <div className="preview-unaccounted-items">
                {unaccountedConditions.map((condition, idx) => (
                  <div key={idx} className="preview-unaccounted-item">
                    <span className="unaccounted-marker">○</span>
                    <span className="unaccounted-text">{condition.text || condition}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="preview-complete">All conditions accounted for</p>
            )}
          </div>
        </div>
      </div>

      <div className="preview-footer">
        <p className="preview-seal-text">This is the gap STATED reveals.</p>
      </div>
    </div>
  );
}

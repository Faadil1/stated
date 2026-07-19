import React, { useState, useEffect } from 'react';
import '../styles/components/ConditionEvidenceMap.css';

export default function ConditionEvidenceMap({ declaration, evidence, evidenceByCondition }) {
  const [isRevealing, setIsRevealing] = useState(false);

  useEffect(() => {
    setIsRevealing(true);
  }, []);

  if (!declaration || !declaration.conditions || declaration.conditions.length === 0) {
    return null;
  }

  const unaccountedCount = declaration.conditions.filter(
    c => !evidenceByCondition || !evidenceByCondition[c.id]
  ).length;

  return (
    <section className={`condition-evidence-map ${isRevealing ? 'revealing' : ''}`}>
      <div className="map-header">
        <div>
          <h2 className="map-title">WHAT WAS SHOWN</h2>
          <p className="map-subtitle">Evidence attached to the public record</p>
        </div>
        {unaccountedCount > 0 && (
          <p className="map-gap-count">
            {unaccountedCount} condition{unaccountedCount !== 1 ? 's' : ''} unaccounted for
          </p>
        )}
      </div>

      {evidence && evidence.length > 0 && (
        <div className="evidence-manifest">
          <h3 className="manifest-title">EVIDENCE MANIFEST</h3>
          <ul className="manifest-list">
            {evidence.map((item, index) => (
              <li key={item.id || index} className="manifest-item">
                <span className="manifest-index">{index + 1}.</span>
                <a
                  href={item.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="manifest-link"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {unaccountedCount > 0 && (
        <div className="gap-signature" role="status">
          <span className="gap-signature-label">THE GAP</span>
          <span className="gap-signature-count">
            {unaccountedCount} condition{unaccountedCount !== 1 ? 's' : ''} without evidence
          </span>
        </div>
      )}

      <div className="conditions-examination">
        {declaration.conditions.map((condition, index) => {
          const hasEvidence = evidenceByCondition && evidenceByCondition[condition.id];

          return (
            <div
              key={condition.id}
              className={`condition-row ${hasEvidence ? 'accounted-for' : 'unaccounted-for'}`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="condition-marker">
                {hasEvidence ? (
                  <span className="marker-accounted ink-check">✓</span>
                ) : (
                  <span className="marker-unaccounted gap-highlight">○</span>
                )}
              </div>

              <div className="condition-name">
                <p className="condition-label">{condition.text}</p>
              </div>

              <div className="evidence-list-inline">
                {hasEvidence ? (
                  <ul className="evidence-items">
                    {evidenceByCondition[condition.id].map((evid, idx) => (
                      <li key={evid.id || idx} className="evidence-item-inline">
                        <a
                          href={evid.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {evid.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="unaccounted-label">UNACCOUNTED FOR</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

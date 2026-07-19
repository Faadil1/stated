import React from 'react';
import '../styles/components/ConditionEvidenceMap.css';

export default function ConditionEvidenceMap({ declaration, evidence, evidenceByCondition }) {
  if (!declaration || !declaration.conditions || declaration.conditions.length === 0) {
    return null;
  }

  return (
    <section className="condition-evidence-map">
      <div className="map-header">
        <h2 className="map-title">EXAMINATION</h2>
        <p className="map-subtitle">What was shown against what was promised</p>
      </div>

      <div className="conditions-examination">
        {declaration.conditions.map((condition) => {
          const hasEvidence = evidenceByCondition && evidenceByCondition[condition.id];

          return (
            <div
              key={condition.id}
              className={`condition-row ${hasEvidence ? 'accounted-for' : 'unaccounted-for'}`}
            >
              <div className="condition-marker">
                {hasEvidence ? (
                  <span className="marker-accounted">■</span>
                ) : (
                  <span className="marker-unaccounted">○</span>
                )}
              </div>

              <div className="condition-name">
                <p className="condition-label">{condition.text}</p>
              </div>

              <div className="evidence-list-inline">
                {hasEvidence ? (
                  <ul className="evidence-items">
                    {evidenceByCondition[condition.id].map((evid) => (
                      <li key={evid.id} className="evidence-item-inline">
                        <span className="evidence-label">{evid.label}</span>
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

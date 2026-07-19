import React from 'react';
import '../styles/components/DeclarationDocument.css';

export default function DeclarationDocument({ declaration, sealed = false, status = 'DRAFT' }) {
  if (!declaration) {
    return null;
  }

  return (
    <section className="declaration-document">
      <div className="document-status">
        <span className={`status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}`}>
          {status}
        </span>
      </div>

      <div className="document-header">
        <h2 className="document-title">WHAT WAS STATED</h2>
      </div>

      <div className="declaration-content">
        <div className="declaration-field">
          <h3 className="project-title">{declaration.project?.title || 'Untitled Project'}</h3>
        </div>

        <div className="declaration-field">
          <p className="project-promise">{declaration.project?.promise || 'No promise recorded'}</p>
        </div>

        {declaration.deadline && (
          <div className="declaration-field">
            <label className="field-label">DUE</label>
            <p className="field-value">{new Date(declaration.deadline).toLocaleDateString()}</p>
          </div>
        )}

        {declaration.conditions && declaration.conditions.length > 0 && (
          <div className="declaration-field conditions-group">
            <label className="field-label">CONDITIONS OF COMPLETION</label>
            <ol className="conditions-list">
              {declaration.conditions.map((condition) => (
                <li key={condition.id} className="condition-item">
                  <span className="condition-text">{condition.text}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {sealed && (
        <div className="document-seal">
          <div className="seal-mark">🔒</div>
        </div>
      )}
    </section>
  );
}

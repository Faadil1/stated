import React from 'react';
import '../styles/components/DeclarationDocument.css';

export default function DeclarationDocument({ declaration, sealed = false, status = 'DRAFT', declaredAt, deadline }) {
  if (!declaration) {
    return null;
  }

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <section className="declaration-document">
      <div className="document-status">
        <span className={`status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}`}>
          {status}
        </span>
      </div>

      <div className="document-layout">
        <div className="document-main">
          <div className="document-header">
            <h2 className="document-title">WHAT WAS STATED</h2>
          </div>

          <div className="declaration-content">
            <div className="declaration-field">
              <label className="field-label">PROJECT</label>
              <h3 className="project-title">{declaration.project?.title || 'Untitled Project'}</h3>
            </div>

            <div className="declaration-field">
              <label className="field-label">PROMISE</label>
              <p className="project-promise">{declaration.project?.promise || 'No promise recorded'}</p>
            </div>

            {declaration.conditions && declaration.conditions.length > 0 && (
              <div className="declaration-field conditions-group">
                <label className="field-label">CONDITIONS OF COMPLETION</label>
                <div className="conditions-list" role="list">
                  {declaration.conditions.map((condition, index) => (
                    <div key={condition.id} className="condition-item" role="listitem">
                      <span className="condition-item-label">Condition {String(index + 1).padStart(2, '0')}</span>
                      <span className="condition-text">
                        {condition.text && String(condition.text).trim() ? condition.text : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="document-sidebar">
          {declaredAt && (
            <div className="sidebar-field">
              <label className="sidebar-label">DECLARED</label>
              <p className="sidebar-value">{formatDate(declaredAt)}</p>
            </div>
          )}
          {deadline && (
            <div className="sidebar-field">
              <label className="sidebar-label">DUE</label>
              <p className="sidebar-value">{formatDate(deadline)}</p>
            </div>
          )}
          {sealed && (
            <div className="document-seal seal-stamp">
              <div className="seal-ring">
                <span className="seal-text">LOCKED</span>
                <span className="seal-subtext">ON MONAD</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

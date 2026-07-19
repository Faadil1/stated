import React from 'react';
import '../styles/components/CaseFileShell.css';

export default function CaseFileShell({ children, className = '' }) {
  return (
    <div className={`case-file-shell ${className}`}>
      <div className="examination-surface">
        <div className="case-file-container">
          {children}
        </div>
      </div>
    </div>
  );
}

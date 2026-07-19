import React from 'react';
import '../styles/components/CaseFileShell.css';

export default function CaseFileShell({ children, className = '' }) {
  return (
    <div className={`case-file-shell ${className}`}>
      <div className="case-folder">
        <div className="folder-tab"></div>
        <div className="case-file-paper">
          {children}
        </div>
      </div>
    </div>
  );
}

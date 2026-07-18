import React, { useState } from 'react';
import Landing from './pages/Landing';
import CreateRecord from './pages/CreateRecord';
import AttachEvidence from './pages/AttachEvidence';
import PublicReceipt from './pages/PublicReceipt';
import './App.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [walletAddress, setWalletAddress] = useState(null);
  const [recordData, setRecordData] = useState(null);
  const [evidenceData, setEvidenceData] = useState(null);

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleRecordCreated = (data) => {
    setRecordData(data);
  };

  const handleEvidenceAttached = (data) => {
    setEvidenceData(data);
  };

  return (
    <div className="app">
      {currentPage === 'landing' && (
        <Landing
          onNavigate={handleNavigate}
          setWalletAddress={setWalletAddress}
        />
      )}
      {currentPage === 'create' && (
        <CreateRecord
          walletAddress={walletAddress}
          onNavigate={handleNavigate}
          onRecordCreated={handleRecordCreated}
        />
      )}
      {currentPage === 'attach' && (
        <AttachEvidence
          declaration={recordData?.declaration}
          recordId={recordData?.recordId}
          onNavigate={handleNavigate}
          onEvidenceAttached={handleEvidenceAttached}
        />
      )}
      {currentPage === 'receipt' && (
        <PublicReceipt
          recordId={recordData?.recordId}
          declaration={recordData?.declaration}
          evidenceManifest={evidenceData?.evidence}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import CreateRecord from './pages/CreateRecord';
import AttachEvidence from './pages/AttachEvidence';
import PublicReceipt from './pages/PublicReceipt';
import { useNetwork } from './hooks/useNetwork';
import { useInitialRoute, pushRoute } from './utils/routing';
import './App.css';

export default function App() {
  // Initialize from URL or default to landing
  const { initialPage, initialRecordId } = useInitialRoute();
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [walletAddress, setWalletAddress] = useState(null);
  const [recordData, setRecordData] = useState(null);
  const [evidenceData, setEvidenceData] = useState(null);
  const [currentRecordId, setCurrentRecordId] = useState(initialRecordId);
  const networkState = useNetwork();

  const handleNavigate = (page, recordId = null) => {
    setCurrentPage(page);
    if (recordId !== null) {
      setCurrentRecordId(recordId);
    }
    // Update browser URL
    pushRoute(page, recordId);
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
          networkState={networkState}
        />
      )}
      {currentPage === 'create' && (
        <CreateRecord
          walletAddress={walletAddress}
          onNavigate={handleNavigate}
          onRecordCreated={handleRecordCreated}
          networkState={networkState}
        />
      )}
      {currentPage === 'attach' && (
        <AttachEvidence
          declaration={recordData?.declaration}
          recordId={recordData?.recordId || currentRecordId}
          onNavigate={handleNavigate}
          onEvidenceAttached={handleEvidenceAttached}
          networkState={networkState}
        />
      )}
      {currentPage === 'receipt' && (
        <PublicReceipt
          recordId={recordData?.recordId || currentRecordId}
          declaration={recordData?.declaration}
          evidenceManifest={evidenceData?.evidence}
          onNavigate={handleNavigate}
          networkState={networkState}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { getRecordPublic } from '../utils/contract';
import { hashManifest, fetchManifest } from '../utils/manifest';
import GlobalHeader from '../components/GlobalHeader';
import CaseFileShell from '../components/CaseFileShell';
import DeclarationDocument from '../components/DeclarationDocument';
import ConditionEvidenceMap from '../components/ConditionEvidenceMap';
import RegistryMetadata from '../components/RegistryMetadata';
import TruthBoundary from '../components/TruthBoundary';
import '../styles/PublicReceipt.css';

const IPFS_GATEWAY = 'https://ipfs.io';

export default function PublicReceipt({ recordId, declaration, evidenceManifest, onNavigate, mode }) {
  const [record, setRecord] = useState(null);
  const [fetchedDeclaration, setFetchedDeclaration] = useState(null);
  const [fetchedEvidence, setFetchedEvidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [declarationStatus, setDeclarationStatus] = useState('LOADING');
  const [evidenceStatus, setEvidenceStatus] = useState('LOADING');
  const [integrityStatus, setIntegrityStatus] = useState('UNKNOWN');

  useEffect(() => {
    loadReceipt();
  }, [recordId]);

  const loadReceipt = async () => {
    try {
      setLoading(true);
      setError(null);

      if (recordId === null && recordId !== 0) {
        throw new Error('No record ID provided');
      }

      const rec = await getRecordPublic(recordId);
      setRecord(rec);

      await loadDeclaration(rec);

      if (rec.evidenceHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        await loadEvidence(rec);
      } else {
        setEvidenceStatus('NO_EVIDENCE_ATTACHED');
      }
    } catch (err) {
      setError(err.message);
      setDeclarationStatus('ERROR');
      setEvidenceStatus('ERROR');
    } finally {
      setLoading(false);
    }
  };

  const loadDeclaration = async (rec) => {
    try {
      if (!rec.declarationURI) {
        throw new Error('No declaration URI in record');
      }

      const decl = await fetchManifest(rec.declarationURI, IPFS_GATEWAY);

      if (!decl || typeof decl !== 'object') {
        throw new Error('Declaration is not a valid object');
      }
      if (!decl.project || !decl.project.title || !decl.project.promise) {
        console.error('Invalid declaration structure:', decl);
        throw new Error('Declaration missing required fields: project.title and project.promise');
      }

      const computedHash = hashManifest(decl);
      if (computedHash !== rec.declarationHash) {
        setDeclarationStatus('INTEGRITY_MISMATCH');
        throw new Error(
          `Declaration hash mismatch: computed ${computedHash} !== stored ${rec.declarationHash}`
        );
      }

      setFetchedDeclaration(decl);
      setDeclarationStatus('LOADED');
    } catch (err) {
      setDeclarationStatus('MANIFEST_NOT_LOADED');
      throw err;
    }
  };

  const loadEvidence = async (rec) => {
    try {
      if (!rec.evidenceURI) {
        setEvidenceStatus('NO_EVIDENCE_ATTACHED');
        return;
      }

      const evidence = await fetchManifest(rec.evidenceURI, IPFS_GATEWAY);

      const computedHash = hashManifest(evidence);
      if (computedHash !== rec.evidenceHash) {
        setIntegrityStatus('INTEGRITY_MISMATCH');
        setEvidenceStatus('INTEGRITY_MISMATCH');
        throw new Error(
          `Evidence hash mismatch: computed ${computedHash} !== stored ${rec.evidenceHash}`
        );
      }

      setFetchedEvidence(evidence);
      setIntegrityStatus('INTEGRITY_MATCH');
      setEvidenceStatus('LOADED');
    } catch (err) {
      setEvidenceStatus('MANIFEST_NOT_LOADED');
      throw err;
    }
  };

  if (loading) {
    return (
      <>
        <GlobalHeader mode={mode} />
        <div className="receipt-loading">
          <div className="loading-paper">
            <p>Opening case file...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !record || !fetchedDeclaration) {
    return (
      <>
        <GlobalHeader mode={mode} />
        <div className="receipt-error">
          <div className="error-paper">
            <p className="error-text">
              {error || 'Receipt not found'}
              {declarationStatus === 'MANIFEST_NOT_LOADED' && ' (declaration not found on IPFS)'}
            </p>
            <button onClick={() => onNavigate('landing', null)} className="back-button">
              ← Start Over
            </button>
          </div>
        </div>
      </>
    );
  }

  const declaredAt = new Date(Number(record.declaredAt) * 1000);
  const deadline = new Date(Number(record.deadline) * 1000);
  const evidenceAttachedAt =
    record.evidenceAttachedAt === 0n ? null : new Date(Number(record.evidenceAttachedAt) * 1000);

  const evidenceByCondition = {};
  if (fetchedEvidence && fetchedEvidence.evidence) {
    fetchedEvidence.evidence.forEach((e) => {
      e.conditionIds.forEach((cId) => {
        if (!evidenceByCondition[cId]) {
          evidenceByCondition[cId] = [];
        }
        evidenceByCondition[cId].push(e);
      });
    });
  }

  const unaccountedConditions = fetchedDeclaration.conditions.filter(
    (c) => !evidenceByCondition[c.id]
  );

  return (
    <>
      <GlobalHeader mode={mode} />
      <CaseFileShell>
        <div className="case-file-header">
          <div className="case-file-title-group">
            <h1 className="case-file-title">STATED</h1>
            {recordId !== null && <p className="record-number">Record #{recordId}</p>}
          </div>
          <div className="case-file-status">
            <span className="status-stamp">PUBLIC RECORD</span>
            {integrityStatus === 'INTEGRITY_MATCH' && (
              <span className="integrity-badge ink-check">INTEGRITY MATCH</span>
            )}
            {evidenceStatus === 'NO_EVIDENCE_ATTACHED' && (
              <span className="integrity-badge gap-highlight">EVIDENCE PENDING</span>
            )}
          </div>
        </div>

        <div className="case-file-tabs" role="tablist" aria-label="Case file sections">
          <div className="case-tab active" role="tab" aria-selected="true">WHAT WAS STATED</div>
          <div className="case-tab active" role="tab" aria-selected="true">WHAT WAS SHOWN</div>
          <div className={`case-tab ${unaccountedConditions.length > 0 ? 'gap-tab' : ''}`} role="tab" aria-selected="false">
            UNACCOUNTED CONDITIONS {unaccountedConditions.length > 0 && `(${unaccountedConditions.length})`}
          </div>
          <div className="case-tab" role="tab" aria-selected="false">WHAT THIS ESTABLISHES</div>
          <div className="case-tab" role="tab" aria-selected="false">WHAT THIS CANNOT ESTABLISH</div>
        </div>

        <DeclarationDocument
          declaration={fetchedDeclaration}
          sealed={true}
          status="ANCHORED ON MONAD"
          declaredAt={declaredAt}
          deadline={deadline}
        />

        <ConditionEvidenceMap
          declaration={fetchedDeclaration}
          evidence={fetchedEvidence?.evidence}
          evidenceByCondition={evidenceByCondition}
        />

        <TruthBoundary />

        <RegistryMetadata
          record={{ ...record, recordId }}
          declarationHash={record.declarationHash}
          evidenceHash={record.evidenceHash}
        />

        <nav className="receipt-footer">
          <button onClick={() => onNavigate('landing', null)} className="footer-button">
            ← Return to Landing
          </button>
          <button onClick={() => onNavigate('create', null)} className="footer-button secondary">
            Create New Record
          </button>
        </nav>
      </CaseFileShell>
    </>
  );
}

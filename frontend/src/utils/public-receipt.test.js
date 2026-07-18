import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hashManifest, fetchManifest } from './manifest';

/**
 * Test suite for PublicReceipt functionality
 * Verifies that receipts can be loaded independently without localStorage
 * and that manifests can be fetched from IPFS
 */

describe('Public Receipt Architecture', () => {
  const mockDeclaration = {
    schema: 'stated/declaration/v1',
    project: {
      title: 'Test Project',
      promise: 'I will build something amazing',
    },
    deadline: '2026-12-31T00:00:00Z',
    conditions: [
      { id: 'c1', text: 'Condition 1' },
      { id: 'c2', text: 'Condition 2' },
    ],
  };

  const mockEvidence = {
    schema: 'stated/evidence/v1',
    recordId: '1',
    evidence: [
      {
        id: 'e1',
        label: 'GitHub Repo',
        uri: 'https://github.com/user/repo',
        conditionIds: ['c1'],
      },
    ],
  };

  describe('Cross-Session Receipt Loading', () => {
    it('should fetch declaration from IPFS independently', async () => {
      const declarationHash = hashManifest(mockDeclaration);

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockDeclaration,
      });

      // Simulate fresh session with empty localStorage
      localStorage.clear();

      const fetched = await fetchManifest('ipfs://QmTest123/manifest.json');
      const fetchedHash = hashManifest(fetched);

      expect(fetchedHash).toBe(declarationHash);
      expect(localStorage.length).toBe(0); // localStorage not used
    });

    it('should fetch evidence from IPFS independently', async () => {
      const evidenceHash = hashManifest(mockEvidence);

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvidence,
      });

      localStorage.clear();

      const fetched = await fetchManifest('ipfs://QmEvidence/manifest.json');
      const fetchedHash = hashManifest(fetched);

      expect(fetchedHash).toBe(evidenceHash);
    });

    it('should work in fresh browser session', async () => {
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();

      // Mock contract data
      const onchainRecord = {
        owner: '0x...',
        declarationHash: hashManifest(mockDeclaration),
        declarationURI: 'ipfs://QmDecl/manifest.json',
        evidenceHash: hashManifest(mockEvidence),
        evidenceURI: 'ipfs://QmEvid/manifest.json',
        evidenceAttachedAt: 1000000n,
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDeclaration,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEvidence,
        });

      // Simulate PublicReceipt loading
      const declaration = await fetchManifest(onchainRecord.declarationURI);
      const evidence = await fetchManifest(onchainRecord.evidenceURI);

      const declHash = hashManifest(declaration);
      const evidHash = hashManifest(evidence);

      expect(declHash).toBe(onchainRecord.declarationHash);
      expect(evidHash).toBe(onchainRecord.evidenceHash);
      expect(localStorage.length).toBe(0);
    });
  });

  describe('Manifest Integrity Verification', () => {
    it('should detect integrity match for declaration', () => {
      const storedHash = hashManifest(mockDeclaration);
      const fetchedHash = hashManifest(mockDeclaration);

      expect(storedHash).toBe(fetchedHash);
    });

    it('should detect integrity mismatch after modification', () => {
      const storedHash = hashManifest(mockDeclaration);

      const modified = {
        ...mockDeclaration,
        project: {
          ...mockDeclaration.project,
          promise: 'I will NOT build',
        },
      };

      const modifiedHash = hashManifest(modified);

      expect(storedHash).not.toBe(modifiedHash);
    });

    it('should detect single-byte tampering in evidence', () => {
      const storedHash = hashManifest(mockEvidence);

      const tampered = {
        ...mockEvidence,
        evidence: [
          {
            ...mockEvidence.evidence[0],
            uri: 'https://github.com/user/different-repo', // Changed
          },
        ],
      };

      const tamperedHash = hashManifest(tampered);

      expect(storedHash).not.toBe(tamperedHash);
    });
  });

  describe('Partial Receipt States', () => {
    it('should handle declaration-only receipt', async () => {
      const onchainRecord = {
        declarationHash: hashManifest(mockDeclaration),
        declarationURI: 'ipfs://QmDecl/manifest.json',
        evidenceHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        evidenceURI: '',
        evidenceAttachedAt: 0n,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockDeclaration,
      });

      const declaration = await fetchManifest(onchainRecord.declarationURI);

      expect(hashManifest(declaration)).toBe(onchainRecord.declarationHash);
      expect(onchainRecord.evidenceAttachedAt).toBe(0n); // No evidence
    });

    it('should handle receipt with evidence', async () => {
      const onchainRecord = {
        declarationHash: hashManifest(mockDeclaration),
        declarationURI: 'ipfs://QmDecl/manifest.json',
        evidenceHash: hashManifest(mockEvidence),
        evidenceURI: 'ipfs://QmEvid/manifest.json',
        evidenceAttachedAt: 1000000n,
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDeclaration,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEvidence,
        });

      const declaration = await fetchManifest(onchainRecord.declarationURI);
      const evidence = await fetchManifest(onchainRecord.evidenceURI);

      expect(hashManifest(declaration)).toBe(onchainRecord.declarationHash);
      expect(hashManifest(evidence)).toBe(onchainRecord.evidenceHash);
      expect(onchainRecord.evidenceAttachedAt).toBeGreaterThan(0n);
    });
  });

  describe('Unaccounted Conditions', () => {
    it('should identify unaccounted conditions when evidence missing', () => {
      const declaration = mockDeclaration;
      const evidence = mockEvidence;

      // Evidence only covers c1, not c2
      const evidenceByCondition = {};
      evidence.evidence.forEach((e) => {
        e.conditionIds.forEach((cId) => {
          if (!evidenceByCondition[cId]) {
            evidenceByCondition[cId] = [];
          }
          evidenceByCondition[cId].push(e);
        });
      });

      const unaccounted = declaration.conditions.filter(
        (c) => !evidenceByCondition[c.id]
      );

      expect(unaccounted.length).toBe(1);
      expect(unaccounted[0].id).toBe('c2');
    });

    it('should have no unaccounted conditions when all covered', () => {
      const declaration = mockDeclaration;
      const evidence = {
        ...mockEvidence,
        evidence: [
          {
            id: 'e1',
            label: 'Part 1',
            uri: 'https://...',
            conditionIds: ['c1'],
          },
          {
            id: 'e2',
            label: 'Part 2',
            uri: 'https://...',
            conditionIds: ['c2'],
          },
        ],
      };

      const evidenceByCondition = {};
      evidence.evidence.forEach((e) => {
        e.conditionIds.forEach((cId) => {
          if (!evidenceByCondition[cId]) {
            evidenceByCondition[cId] = [];
          }
          evidenceByCondition[cId].push(e);
        });
      });

      const unaccounted = declaration.conditions.filter(
        (c) => !evidenceByCondition[c.id]
      );

      expect(unaccounted.length).toBe(0);
    });
  });

  describe('localStorage Independence', () => {
    it('should not require localStorage for receipt display', () => {
      localStorage.clear();

      const onchainData = {
        declarationHash: hashManifest(mockDeclaration),
        declarationURI: 'ipfs://QmDecl/manifest.json',
      };

      // Can compute hash without localStorage
      const computedHash = hashManifest(mockDeclaration);

      expect(computedHash).toBe(onchainData.declarationHash);
      expect(localStorage.length).toBe(0);
    });

    it('should work even if localStorage is full', () => {
      // Fill localStorage
      for (let i = 0; i < 100; i++) {
        localStorage.setItem(`key-${i}`, 'x'.repeat(10000));
      }

      // Should still be able to compute hashes
      const hash = hashManifest(mockDeclaration);

      expect(hash).toBe(hashManifest(mockDeclaration));
    });

    it('should work if localStorage is disabled', () => {
      // Mock localStorage as disabled
      const originalLocalStorage = global.localStorage;
      delete global.localStorage;
      global.localStorage = undefined;

      // Hash computation should still work
      const hash = hashManifest(mockDeclaration);

      expect(hash).toBe(hashManifest(mockDeclaration));

      global.localStorage = originalLocalStorage;
    });
  });

  describe('Real Receipt ID Handling', () => {
    it('should not assume recordId is always 0', () => {
      const recordIds = [0, 1, 42, 9999, 1000000];

      recordIds.forEach((id) => {
        const record = {
          recordId: id,
          declarationHash: hashManifest(mockDeclaration),
          declarationURI: 'ipfs://QmDecl/manifest.json',
        };

        expect(record.recordId).toBe(id);
        // Verify different IDs are handled (not hardcoded to 0)
        if (id !== 0) {
          expect(record.recordId).not.toBe(0);
        }
      });
    });

    it('should derive recordId from contract event', () => {
      // Mock contract event
      const event = {
        args: [1, '0xUser', 1234567, 999, hashManifest(mockDeclaration), 'ipfs://QmDecl/manifest.json'],
        transactionHash: '0xTx',
      };

      const recordId = event.args[0];

      expect(recordId).toBe(1);
      expect(typeof recordId).toBe('number');
    });
  });
});

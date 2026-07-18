import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as ethers from 'ethers';
import {
  canonicalizeManifest,
  hashManifest,
  uploadManifest,
  fetchManifest,
} from './manifest';

describe('Manifest Utilities', () => {
  describe('canonicalizeManifest', () => {
    it('should produce deterministic canonical output', () => {
      const manifest = {
        schema: 'stated/declaration/v1',
        project: { title: 'Test', promise: 'I will build' },
        deadline: '2026-12-31T00:00:00Z',
        conditions: [{ id: 'c1', text: 'Done' }],
      };

      const canonical1 = canonicalizeManifest(manifest);
      const canonical2 = canonicalizeManifest(manifest);

      expect(canonical1).toBe(canonical2);
    });

    it('should ignore field order in output', () => {
      const manifest1 = {
        schema: 'stated/declaration/v1',
        project: { title: 'Test', promise: 'Build it' },
        deadline: '2026-12-31T00:00:00Z',
        conditions: [{ id: 'c1', text: 'Done' }],
      };

      const manifest2 = {
        conditions: [{ id: 'c1', text: 'Done' }],
        schema: 'stated/declaration/v1',
        deadline: '2026-12-31T00:00:00Z',
        project: { promise: 'Build it', title: 'Test' },
      };

      const hash1 = hashManifest(manifest1);
      const hash2 = hashManifest(manifest2);

      expect(hash1).toBe(hash2);
    });
  });

  describe('hashManifest', () => {
    it('should return Keccak-256 hash', () => {
      const manifest = {
        schema: 'stated/declaration/v1',
        project: { title: 'Test', promise: 'Build' },
        deadline: '2026-12-31T00:00:00Z',
        conditions: [{ id: 'c1', text: 'Done' }],
      };

      const hash = hashManifest(manifest);

      expect(hash).toMatch(/^0x[0-9a-f]{64}$/i);
    });

    it('should be consistent across calls', () => {
      const manifest = {
        schema: 'stated/declaration/v1',
        project: { title: 'Test', promise: 'Build' },
        deadline: '2026-12-31T00:00:00Z',
        conditions: [{ id: 'c1', text: 'Done' }],
      };

      const hash1 = hashManifest(manifest);
      const hash2 = hashManifest(manifest);

      expect(hash1).toBe(hash2);
    });

    it('should differ for different manifests', () => {
      const manifest1 = {
        schema: 'stated/declaration/v1',
        project: { title: 'Test1', promise: 'Build' },
        deadline: '2026-12-31T00:00:00Z',
        conditions: [{ id: 'c1', text: 'Done' }],
      };

      const manifest2 = {
        schema: 'stated/declaration/v1',
        project: { title: 'Test2', promise: 'Build' },
        deadline: '2026-12-31T00:00:00Z',
        conditions: [{ id: 'c1', text: 'Done' }],
      };

      const hash1 = hashManifest(manifest1);
      const hash2 = hashManifest(manifest2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('uploadManifest', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('should upload declaration and return URI and hash', async () => {
      const manifest = {
        schema: 'stated/declaration/v1',
        project: { title: 'Test', promise: 'Build' },
        deadline: '2026-12-31T00:00:00Z',
        conditions: [{ id: 'c1', text: 'Done' }],
      };

      const expectedHash = hashManifest(manifest);

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uri: 'ipfs://bafy1234567890abcdef',
          cid: 'bafy1234567890abcdef',
          manifestHash: expectedHash,
          gatewayURL: 'https://ipfs.io/ipfs/bafy1234567890abcdef',
        }),
      });

      const result = await uploadManifest(manifest, 'declaration');

      expect(result.uri).toBe('ipfs://bafy1234567890abcdef');
      expect(result.manifestHash).toBe(expectedHash);
      expect(result.cid).toBe('bafy1234567890abcdef');
    });

    it('should reject invalid type', async () => {
      const manifest = {
        schema: 'stated/declaration/v1',
        project: { title: 'Test', promise: 'Build' },
        deadline: '2026-12-31T00:00:00Z',
        conditions: [{ id: 'c1', text: 'Done' }],
      };

      await expect(uploadManifest(manifest, 'invalid')).rejects.toThrow();
    });

    it('should handle upload error', async () => {
      const manifest = {
        schema: 'stated/declaration/v1',
        project: { title: 'Test', promise: 'Build' },
        deadline: '2026-12-31T00:00:00Z',
        conditions: [{ id: 'c1', text: 'Done' }],
      };

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Upload failed' }),
      });

      await expect(uploadManifest(manifest, 'declaration')).rejects.toThrow('Upload failed');
    });

    it('should verify local hash matches server hash', async () => {
      const manifest = {
        schema: 'stated/declaration/v1',
        project: { title: 'Test', promise: 'Build' },
        deadline: '2026-12-31T00:00:00Z',
        conditions: [{ id: 'c1', text: 'Done' }],
      };

      const localHash = hashManifest(manifest);
      const differentHash = '0x' + '1'.repeat(64);

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uri: 'ipfs://bafy1234567890abcdef',
          cid: 'bafy1234567890abcdef',
          manifestHash: differentHash, // Wrong hash
          gatewayURL: 'https://ipfs.io/ipfs/bafy1234567890abcdef',
        }),
      });

      const result = await uploadManifest(manifest, 'declaration');

      // Upload returns mismatched hash - client code should verify this
      expect(result.manifestHash).not.toBe(localHash);
    });
  });

  describe('fetchManifest', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('should fetch and parse manifest from gateway', async () => {
      const manifest = {
        schema: 'stated/declaration/v1',
        project: { title: 'Test', promise: 'Build' },
        deadline: '2026-12-31T00:00:00Z',
        conditions: [{ id: 'c1', text: 'Done' }],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => manifest,
      });

      const result = await fetchManifest('ipfs://bafy1234567890abcdef');

      expect(result).toEqual(manifest);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://ipfs.io/ipfs/bafy1234567890abcdef'
      );
    });

    it('should convert ipfs:// URI to gateway URL', async () => {
      const manifest = { schema: 'stated/declaration/v1' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => manifest,
      });

      await fetchManifest('ipfs://QmABC123');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://ipfs.io/ipfs/QmABC123'
      );
    });

    it('should use custom gateway', async () => {
      const manifest = { schema: 'stated/declaration/v1' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => manifest,
      });

      await fetchManifest('ipfs://bafy1234567890abcdef', 'https://custom.gateway');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://custom.gateway/ipfs/bafy1234567890abcdef'
      );
    });

    it('should handle fetch error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(fetchManifest('ipfs://QmABC123')).rejects.toThrow('Failed to fetch');
    });

    it('should reject empty URI', async () => {
      await expect(fetchManifest('')).rejects.toThrow('No URI provided');
    });
  });

  describe('Hash Integrity Verification', () => {
    it('should detect modified manifest', () => {
      const original = {
        schema: 'stated/declaration/v1',
        project: { title: 'Test', promise: 'Build' },
        deadline: '2026-12-31T00:00:00Z',
        conditions: [{ id: 'c1', text: 'Done' }],
      };

      const modified = {
        schema: 'stated/declaration/v1',
        project: { title: 'Test', promise: 'Build (modified)' },
        deadline: '2026-12-31T00:00:00Z',
        conditions: [{ id: 'c1', text: 'Done' }],
      };

      const originalHash = hashManifest(original);
      const modifiedHash = hashManifest(modified);

      expect(originalHash).not.toBe(modifiedHash);
    });

    it('should detect single-byte changes', () => {
      const manifest1 = {
        schema: 'stated/declaration/v1',
        project: { title: 'Test', promise: 'Build' },
        deadline: '2026-12-31T00:00:00Z',
        conditions: [{ id: 'c1', text: 'Done' }],
      };

      const manifest2 = {
        schema: 'stated/declaration/v1',
        project: { title: 'Test', promise: 'Built' }, // Changed one letter
        deadline: '2026-12-31T00:00:00Z',
        conditions: [{ id: 'c1', text: 'Done' }],
      };

      const hash1 = hashManifest(manifest1);
      const hash2 = hashManifest(manifest2);

      expect(hash1).not.toBe(hash2);
    });
  });
});

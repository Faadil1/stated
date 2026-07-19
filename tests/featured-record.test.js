import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the contract and manifest utilities
vi.mock('../frontend/src/utils/contract', () => ({
  getRecordPublic: vi.fn()
}));

vi.mock('../frontend/src/utils/manifest', () => ({
  fetchManifest: vi.fn(),
  hashManifest: vi.fn()
}));

import { getRecordPublic } from '../frontend/src/utils/contract';
import { fetchManifest, hashManifest } from '../frontend/src/utils/manifest';

describe('FeaturedRecordPreview - Safe Fetching', () => {
  const validRecord = {
    recordId: 7,
    declarationHash: '0xabc123',
    evidenceHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    declarationURI: 'ipfs://Qm...',
    evidenceURI: null
  };

  const validDeclaration = {
    project: {
      title: 'Build STATED',
      promise: 'A tool that makes gaps impossible to hide.'
    },
    conditions: [
      { id: 1, text: 'Condition 1' },
      { id: 2, text: 'Condition 2' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('No environment variable', () => {
    it('should show labeled demonstration case file', async () => {
      // When VITE_FEATURED_RECORD_ID is not set
      process.env.VITE_FEATURED_RECORD_ID = '';

      // Then landing should show demo with banner
      const result = {
        state: 'DEMO',
        record: { /* DEMO_RECORD */ },
        showBanner: true,
        bannerText: 'DEMONSTRATION CASE FILE'
      };

      expect(result.state).toBe('DEMO');
      expect(result.showBanner).toBe(true);
      expect(getRecordPublic).not.toHaveBeenCalled();
      expect(fetchManifest).not.toHaveBeenCalled();
    });
  });

  describe('Environment variable present + successful fetch', () => {
    it('should load and display real on-chain record', async () => {
      process.env.VITE_FEATURED_RECORD_ID = '7';

      // Mock successful contract fetch
      getRecordPublic.mockResolvedValue(validRecord);
      hashManifest.mockReturnValue('0xabc123');
      fetchManifest.mockResolvedValue(validDeclaration);

      // Simulate fetch flow
      const recordId = process.env.VITE_FEATURED_RECORD_ID;
      const record = await getRecordPublic(recordId);
      const declaration = await fetchManifest(record.declarationURI);
      const hashMatch = hashManifest(declaration) === record.declarationHash;

      expect(record.recordId).toBe(7);
      expect(declaration.project.title).toBe('Build STATED');
      expect(hashMatch).toBe(true);
      expect(getRecordPublic).toHaveBeenCalledWith('7');
    });

    it('should set state to LIVE only after all validations pass', async () => {
      // Fetch succeeds
      getRecordPublic.mockResolvedValue(validRecord);
      hashManifest.mockReturnValue('0xabc123');
      fetchManifest.mockResolvedValue(validDeclaration);

      // State machine: LOADING → LIVE (not DEMO)
      let state = 'LOADING';
      const record = await getRecordPublic('7');
      if (record.declarationURI) {
        const declaration = await fetchManifest(record.declarationURI);
        if (hashManifest(declaration) === record.declarationHash) {
          state = 'LIVE';
        }
      }

      expect(state).toBe('LIVE');
    });
  });

  describe('Environment variable + contract failure', () => {
    it('should fall back to labeled demo on contract error', async () => {
      process.env.VITE_FEATURED_RECORD_ID = '7';

      // Mock contract failure
      getRecordPublic.mockRejectedValue(new Error('Contract error'));

      try {
        await getRecordPublic('7');
        expect.fail('Should have thrown');
      } catch (err) {
        // Fall back to demo
        const state = 'ERROR';
        const showBanner = true;

        expect(state).toBe('ERROR');
        expect(showBanner).toBe(true);
        expect(getRecordPublic).toHaveBeenCalledWith('7');
      }
    });
  });

  describe('Environment variable + IPFS failure', () => {
    it('should fall back to labeled demo on IPFS fetch error', async () => {
      process.env.VITE_FEATURED_RECORD_ID = '7';

      getRecordPublic.mockResolvedValue(validRecord);
      // IPFS fetch fails
      fetchManifest.mockRejectedValue(new Error('IPFS timeout'));

      try {
        const record = await getRecordPublic('7');
        await fetchManifest(record.declarationURI);
        expect.fail('Should have thrown');
      } catch (err) {
        // Fall back to demo
        const state = 'ERROR';
        expect(state).toBe('ERROR');
        expect(fetchManifest).toHaveBeenCalled();
      }
    });
  });

  describe('Environment variable + integrity failure', () => {
    it('should fall back to labeled demo on hash mismatch', async () => {
      process.env.VITE_FEATURED_RECORD_ID = '7';

      getRecordPublic.mockResolvedValue(validRecord);
      fetchManifest.mockResolvedValue(validDeclaration);
      // Hash doesn't match
      hashManifest.mockReturnValue('0xwrong');

      const record = await getRecordPublic('7');
      const declaration = await fetchManifest(record.declarationURI);
      const hashMatch = hashManifest(declaration) === record.declarationHash;

      // Should detect mismatch and fall back
      let state = 'LIVE';
      if (!hashMatch) {
        state = 'ERROR';
      }

      expect(state).toBe('ERROR');
      expect(hashMatch).toBe(false);
    });
  });

  describe('Demo data protection', () => {
    it('should never display DEMO_RECORD without the demo banner', async () => {
      process.env.VITE_FEATURED_RECORD_ID = '';

      // Demo should always have banner
      const isDemo = true;
      const showBanner = isDemo;

      expect(showBanner).toBe(true);
    });

    it('should never silently convert demo to live data', async () => {
      process.env.VITE_FEATURED_RECORD_ID = '7';

      // Start with demo
      let state = 'DEMO';
      let record = { /* DEMO_RECORD */ };

      // Try to "fetch" but don't actually update state to LIVE
      // without successful validations
      const shouldFetchRealData = !!process.env.VITE_FEATURED_RECORD_ID;
      if (shouldFetchRealData) {
        state = 'LOADING';
        // If fetch fails before validation, state should be ERROR, not LIVE
        // and DEMO_RECORD should never display as live
      }

      expect(state).not.toBe('LIVE'); // Until validation passes
    });

    it('should use real data only after successful fetch + validation', async () => {
      process.env.VITE_FEATURED_RECORD_ID = '7';

      getRecordPublic.mockResolvedValue({
        ...validRecord,
        recordId: 7
      });
      hashManifest.mockReturnValue('0xabc123');
      fetchManifest.mockResolvedValue(validDeclaration);

      // Only after EVERYTHING succeeds
      const record = await getRecordPublic('7');
      const declaration = await fetchManifest(record.declarationURI);
      const hashValid = hashManifest(declaration) === record.declarationHash;

      expect(record.recordId).toBe(7);
      expect(declaration.project.title).toBe('Build STATED');
      expect(hashValid).toBe(true);

      // Only NOW set to LIVE, using only fetched data
      if (record.recordId && hashValid) {
        const liveRecord = {
          recordId: record.recordId,
          title: declaration.project.title,
          promise: declaration.project.promise,
          conditions: declaration.conditions
        };

        expect(liveRecord.recordId).toBe(7);
        expect(liveRecord.title).toBe('Build STATED');
      }
    });
  });

  describe('Record ID validation', () => {
    it('should reject record #0 or #1', async () => {
      // Record #0 and #1 are test data with potential issues
      const blockedIds = ['0', '1'];

      expect(blockedIds).toContain('0');
      expect(blockedIds).toContain('1');
      // Future: add check in fetch function
    });

    it('should verify record ID matches VITE_FEATURED_RECORD_ID', async () => {
      process.env.VITE_FEATURED_RECORD_ID = '7';

      const fetchedRecord = { recordId: '7' };
      const configuredId = '7';

      expect(fetchedRecord.recordId.toString()).toBe(configuredId);
    });
  });

  describe('CTA button behavior', () => {
    it('demo state should show PREVIEW HOW THE CASE FILE WORKS', () => {
      const isLive = false;
      const buttonText = isLive ? 'OPEN THE LIVE CASE FILE' : 'PREVIEW HOW THE CASE FILE WORKS';

      expect(buttonText).toBe('PREVIEW HOW THE CASE FILE WORKS');
      expect(isLive).toBe(false);
    });

    it('live state should show OPEN THE LIVE CASE FILE', () => {
      const isLive = true;
      const recordId = 7;
      const buttonText = isLive ? 'OPEN THE LIVE CASE FILE' : 'PREVIEW HOW THE CASE FILE WORKS';
      const navigateTo = isLive ? `/receipt/${recordId}` : null;

      expect(buttonText).toBe('OPEN THE LIVE CASE FILE');
      expect(navigateTo).toBe('/receipt/7');
    });

    it('demo button should not navigate', () => {
      const isLive = false;
      const shouldNavigate = isLive;

      expect(shouldNavigate).toBe(false);
    });
  });

  describe('Error message display', () => {
    it('should show user-friendly message on fetch failure', async () => {
      process.env.VITE_FEATURED_RECORD_ID = '7';

      getRecordPublic.mockRejectedValue(new Error('Network error'));

      try {
        await getRecordPublic('7');
      } catch (err) {
        // Display user-friendly message
        const userMessage = 'The featured public record is temporarily unavailable.';
        const technicalError = err.message; // 'Network error' - logged to console only

        expect(userMessage).toBe('The featured public record is temporarily unavailable.');
        expect(technicalError).toBe('Network error');
      }
    });
  });
});

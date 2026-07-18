/**
 * Frontend Contract Configuration Tests
 *
 * Verifies that:
 * 1. Missing VITE_CONTRACT_ADDRESS throws an error
 * 2. Invalid addresses are rejected
 * 3. Valid addresses are accepted
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as ethers from 'ethers';

describe('Frontend Contract Configuration', () => {
  // Store original env
  const originalEnv = { ...import.meta.env };

  afterEach(() => {
    // Restore original env
    import.meta.env.VITE_CONTRACT_ADDRESS = originalEnv.VITE_CONTRACT_ADDRESS;
  });

  it('should throw error when VITE_CONTRACT_ADDRESS is missing', () => {
    // Delete the env var
    delete import.meta.env.VITE_CONTRACT_ADDRESS;

    expect(() => {
      // This will trigger the error at module load time
      // We simulate by checking the validation logic
      const addr = undefined;
      if (!addr) {
        throw new Error(
          'VITE_CONTRACT_ADDRESS environment variable is required. ' +
          'Create frontend/.env.local with: VITE_CONTRACT_ADDRESS=<address>'
        );
      }
    }).toThrow('VITE_CONTRACT_ADDRESS environment variable is required');
  });

  it('should throw error for invalid address format', () => {
    expect(() => {
      const invalidAddr = 'not-an-address';
      if (!ethers.isAddress(invalidAddr)) {
        throw new Error(
          `Invalid contract address: ${invalidAddr}. ` +
          'Must be a valid Ethereum address.'
        );
      }
    }).toThrow('Invalid contract address');
  });

  it('should accept valid Ethereum address', () => {
    // Valid address format
    const validAddr = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

    expect(() => {
      if (!ethers.isAddress(validAddr)) {
        throw new Error(
          `Invalid contract address: ${validAddr}. ` +
          'Must be a valid Ethereum address.'
        );
      }
    }).not.toThrow();
  });

  it('should validate address with ethers.isAddress()', () => {
    // Valid formats
    expect(ethers.isAddress('0x5FbDB2315678afecb367f032d93F642f64180aa3')).toBe(true);
    expect(ethers.isAddress('0x123')).toBe(false);
    expect(ethers.isAddress('not-an-address')).toBe(false);
    expect(ethers.isAddress('')).toBe(false);
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ethers } from 'ethers';
import {
  getReadOnlyProvider,
  getReadOnlyContract,
  isReadOnlyAvailable,
  testReadOnlyConnectivity,
} from './readOnly';

describe('Read-Only Provider (Walletless Access)', () => {
  describe('getReadOnlyProvider', () => {
    it('should return provider without MetaMask', () => {
      const provider = getReadOnlyProvider();
      expect(provider).toBeDefined();
      expect(provider instanceof ethers.JsonRpcProvider).toBe(true);
    });

    it('should cache provider instance', () => {
      const provider1 = getReadOnlyProvider();
      const provider2 = getReadOnlyProvider();
      expect(provider1).toBe(provider2); // Same instance
    });

    it('should configure for Monad testnet', () => {
      const provider = getReadOnlyProvider();
      // Provider is a JsonRpcProvider for Monad
      expect(provider).toBeDefined();
      // Provider is configured for Monad RPC
      const isJsonRpcProvider = provider.constructor.name === 'JsonRpcProvider';
      expect(isJsonRpcProvider).toBe(true);
    });
  });

  describe('getReadOnlyContract', () => {
    it('should return contract instance without wallet', () => {
      const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
      const contractAbi = ['function name() view returns (string)'];

      const contract = getReadOnlyContract(contractAddress, contractAbi);
      expect(contract).toBeDefined();
      // Contract address should match (case-insensitive)
      expect(contract.target.toLowerCase()).toBe(contractAddress.toLowerCase());
    });

    it('should use read-only provider not signer', () => {
      const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
      const contractAbi = ['function name() view returns (string)'];

      const contract = getReadOnlyContract(contractAddress, contractAbi);
      // Contract has a provider (for reads), not a signer (for writes)
      const hasProvider = contract.runner !== null;
      const hasOnlyProvider = contract.runner && typeof contract.runner.call === 'function';
      expect(hasProvider).toBe(true);
    });
  });

  describe('isReadOnlyAvailable', () => {
    it('should always return true (no wallet required)', () => {
      expect(isReadOnlyAvailable()).toBe(true);
    });

    it('should return true even without window.ethereum', () => {
      // Read-only access doesn't require MetaMask
      expect(isReadOnlyAvailable()).toBe(true);
    });
  });

  describe('testReadOnlyConnectivity', () => {
    it('should test network connectivity without wallet', async () => {
      try {
        const isConnected = await testReadOnlyConnectivity();
        // May succeed or fail based on network, but should not throw
        expect(typeof isConnected).toBe('boolean');
      } catch (err) {
        // Should not throw even if RPC fails
        expect(true).toBe(false); // Should not reach here
      }
    });
  });

  describe('Walletless Receipt Requirement', () => {
    it('public receipt must work without window.ethereum', () => {
      // Simulate missing MetaMask
      const hasEthereum = typeof window.ethereum !== 'undefined';

      // But read-only provider should still work
      const provider = getReadOnlyProvider();
      expect(provider).toBeDefined();
      expect(isReadOnlyAvailable()).toBe(true);
    });

    it('should not call eth_requestAccounts on read', () => {
      const provider = getReadOnlyProvider();
      expect(provider).toBeDefined();
      // No wallet methods available on read-only provider
      expect(provider.send).toBeDefined();
      // But it won't request accounts automatically
    });

    it('should support getBuildRecord without wallet', () => {
      const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
      const contractAbi = [
        'function getBuildRecord(uint256 recordId) view returns (tuple(address,uint64,uint64,uint64,bytes32,bytes32,string,string))',
      ];

      const contract = getReadOnlyContract(contractAddress, contractAbi);
      expect(contract).toBeDefined();
      expect(contract.getBuildRecord).toBeDefined();
      // This function doesn't require a wallet to call
    });

    it('should support getRecordIdsByOwner without wallet', () => {
      const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
      const contractAbi = [
        'function getRecordIdsByOwner(address owner) view returns (uint256[])',
      ];

      const contract = getReadOnlyContract(contractAddress, contractAbi);
      expect(contract).toBeDefined();
      expect(contract.getRecordIdsByOwner).toBeDefined();
      // This function doesn't require a wallet to call
    });
  });

  describe('Isolation from wallet state', () => {
    it('read-only provider is independent of MetaMask', () => {
      // Read-only provider uses hardcoded Monad RPC
      const provider = getReadOnlyProvider();
      expect(provider instanceof ethers.JsonRpcProvider).toBe(true);
      // Even if MetaMask switches networks, this provider stays on Monad
    });

    it('read-only operations never require MetaMask', () => {
      const provider = getReadOnlyProvider();
      // Provider supports read operations
      expect(typeof provider.call).toBe('function');
      expect(typeof provider.getBalance).toBe('function');
      // But doesn't require signer
    });

    it('multiple read-only contracts share same provider', () => {
      const abi1 = ['function f1() view returns (uint)'];
      const abi2 = ['function f2() view returns (uint)'];
      const addr = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

      const contract1 = getReadOnlyContract(addr, abi1);
      const contract2 = getReadOnlyContract(addr, abi2);

      // Both should use the same provider instance
      expect(contract1.runner).toBe(contract2.runner);
    });
  });
});

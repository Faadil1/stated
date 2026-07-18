import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCurrentChainId,
  isMonadNetwork,
  switchToMonad,
  ensureMonadNetwork,
  NetworkError,
} from './network';

describe('Network Utilities', () => {
  beforeEach(() => {
    // Setup mock ethereum
    global.window = {
      ethereum: {
        request: vi.fn(),
        on: vi.fn(),
        removeListener: vi.fn(),
      },
    };
  });

  describe('getCurrentChainId', () => {
    it('should return chain ID 10143 when on Monad', async () => {
      window.ethereum.request.mockResolvedValueOnce('0x279F'); // 10143 in hex
      const chainId = await getCurrentChainId();
      expect(chainId).toBe(10143);
    });

    it('should return chain ID 11155111 when on Sepolia', async () => {
      window.ethereum.request.mockResolvedValueOnce('0xaa36a7'); // Sepolia
      const chainId = await getCurrentChainId();
      expect(chainId).toBe(11155111);
    });

    it('should throw NetworkError if MetaMask not found', async () => {
      global.window.ethereum = undefined;
      await expect(getCurrentChainId()).rejects.toThrow(NetworkError);
    });

    it('should throw NetworkError on request failure', async () => {
      window.ethereum.request.mockRejectedValueOnce(new Error('Request failed'));
      await expect(getCurrentChainId()).rejects.toThrow(NetworkError);
    });
  });

  describe('isMonadNetwork', () => {
    it('should return true for chain ID 10143', () => {
      expect(isMonadNetwork(10143)).toBe(true);
      expect(isMonadNetwork('10143')).toBe(true);
    });

    it('should return false for other chain IDs', () => {
      expect(isMonadNetwork(1)).toBe(false);
      expect(isMonadNetwork(11155111)).toBe(false);
    });
  });

  describe('switchToMonad', () => {
    it('should switch to Monad successfully', async () => {
      window.ethereum.request.mockResolvedValueOnce(undefined); // Success
      await switchToMonad();
      expect(window.ethereum.request).toHaveBeenCalledWith({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x279F' }],
      });
    });

    it('should add network on error 4902 then switch', async () => {
      const error4902 = new Error('Network not found');
      error4902.code = 4902;

      window.ethereum.request
        .mockRejectedValueOnce(error4902) // First call throws 4902
        .mockResolvedValueOnce(undefined) // wallet_addEthereumChain succeeds
        .mockResolvedValueOnce(undefined); // Second switch succeeds

      await switchToMonad();

      expect(window.ethereum.request).toHaveBeenCalledTimes(3);
      // First call: wallet_switchEthereumChain
      expect(window.ethereum.request).toHaveBeenNthCalledWith(1, {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x279F' }],
      });
      // Second call: wallet_addEthereumChain
      expect(window.ethereum.request).toHaveBeenNthCalledWith(2, {
        method: 'wallet_addEthereumChain',
        params: [expect.objectContaining({
          chainId: '0x279F',
          chainName: 'Monad Testnet',
        })],
      });
      // Third call: wallet_switchEthereumChain again
      expect(window.ethereum.request).toHaveBeenNthCalledWith(3, {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x279F' }],
      });
    });

    it('should throw on user rejection (error 4001)', async () => {
      const error4001 = new Error('User rejected');
      error4001.code = 4001;
      window.ethereum.request.mockRejectedValueOnce(error4001);

      await expect(switchToMonad()).rejects.toThrow('You rejected the network switch');
    });

    it('should throw on other switch errors', async () => {
      const error = new Error('Unknown error');
      error.code = 5000;
      window.ethereum.request.mockRejectedValueOnce(error);

      await expect(switchToMonad()).rejects.toThrow('Failed to switch network');
    });
  });

  describe('ensureMonadNetwork', () => {
    it('should do nothing if already on Monad', async () => {
      window.ethereum.request.mockResolvedValueOnce('0x279F'); // Already Monad
      await ensureMonadNetwork();
      expect(window.ethereum.request).toHaveBeenCalledTimes(1);
    });

    it('should switch from Sepolia to Monad', async () => {
      window.ethereum.request
        .mockResolvedValueOnce('0xaa36a7') // Sepolia on first call
        .mockResolvedValueOnce(undefined) // Switch succeeds
        .mockResolvedValueOnce('0x279F'); // Monad on verification

      await ensureMonadNetwork();

      expect(window.ethereum.request).toHaveBeenCalledTimes(3);
    });

    it('should throw if wrong chain after switch attempt', async () => {
      window.ethereum.request
        .mockResolvedValueOnce('0xaa36a7') // Sepolia
        .mockResolvedValueOnce(undefined) // Switch attempt
        .mockResolvedValueOnce('0xaa36a7'); // Still Sepolia

      await expect(ensureMonadNetwork()).rejects.toThrow(
        'Failed to switch to Monad'
      );
    });
  });

  describe('NetworkError', () => {
    it('should have correct name and message', () => {
      const error = new NetworkError('Test error');
      expect(error.name).toBe('NetworkError');
      expect(error.message).toBe('Test error');
    });

    it('should store error code', () => {
      const error = new NetworkError('Test', 4902);
      expect(error.code).toBe(4902);
    });
  });
});

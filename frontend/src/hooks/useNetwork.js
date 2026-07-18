import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentChainId,
  isMonadNetwork,
  switchToMonad,
  listenForNetworkChanges,
} from '../utils/network';

export function useNetwork() {
  const [chainId, setChainId] = useState(null);
  const [isMonad, setIsMonad] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [walletAvailable, setWalletAvailable] = useState(false);

  // Check current network on mount
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const currentChainId = await getCurrentChainId();
        setChainId(currentChainId);
        setIsMonad(isMonadNetwork(currentChainId));
        setWalletAvailable(true);
        setError(null);
      } catch (err) {
        // No wallet available (MetaMask not installed)
        // This is not an error for read-only pages
        setError(null);
        setChainId(null);
        setIsMonad(false);
        setWalletAvailable(false);
      }
    };

    checkNetwork();
  }, []);

  // Listen for network changes
  useEffect(() => {
    const unsubscribe = listenForNetworkChanges((newChainId) => {
      setChainId(newChainId);
      setIsMonad(isMonadNetwork(newChainId));
      setError(null);
    }).catch(() => {
      // listenForNetworkChanges might throw if no ethereum
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const switchNetwork = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await switchToMonad();
      const newChainId = await getCurrentChainId();
      setChainId(newChainId);
      setIsMonad(isMonadNetwork(newChainId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    chainId,
    isMonad,
    loading,
    error,
    walletAvailable,
    switchNetwork,
  };
}

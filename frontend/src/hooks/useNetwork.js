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

  // Check current network on mount
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const currentChainId = await getCurrentChainId();
        setChainId(currentChainId);
        setIsMonad(isMonadNetwork(currentChainId));
        setError(null);
      } catch (err) {
        setError(err.message);
        setChainId(null);
        setIsMonad(false);
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
    switchNetwork,
  };
}

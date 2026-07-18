import { ethers } from 'ethers';

const MONAD_CHAIN_ID = 10143;
const MONAD_CHAIN_ID_HEX = '0x279F';

const MONAD_NETWORK_CONFIG = {
  chainId: MONAD_CHAIN_ID_HEX,
  chainName: 'Monad Testnet',
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: ['https://testnet-rpc.monad.xyz'],
  blockExplorerUrls: ['https://testnet.monadscan.com'],
};

export class NetworkError extends Error {
  constructor(message, code = null) {
    super(message);
    this.name = 'NetworkError';
    this.code = code;
  }
}

export async function getCurrentChainId() {
  if (!window.ethereum) {
    throw new NetworkError('MetaMask not found');
  }

  try {
    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    });
    return parseInt(chainId, 16);
  } catch (err) {
    throw new NetworkError(`Failed to get chain ID: ${err.message}`);
  }
}

export async function switchToMonad() {
  if (!window.ethereum) {
    throw new NetworkError('MetaMask not found');
  }

  try {
    // Try to switch to Monad
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: MONAD_CHAIN_ID_HEX }],
    });
  } catch (err) {
    // Error 4902 means the chain doesn't exist yet
    if (err.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [MONAD_NETWORK_CONFIG],
        });
        // After adding, switch to it
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: MONAD_CHAIN_ID_HEX }],
        });
      } catch (addErr) {
        throw new NetworkError(`Failed to add Monad network: ${addErr.message}`, addErr.code);
      }
    } else if (err.code === 4001) {
      // User rejected the request
      throw new NetworkError('You rejected the network switch', 4001);
    } else {
      throw new NetworkError(`Failed to switch network: ${err.message}`, err.code);
    }
  }
}

export async function ensureMonadNetwork() {
  const currentChainId = await getCurrentChainId();

  if (currentChainId !== MONAD_CHAIN_ID) {
    await switchToMonad();

    // Re-check after switch
    const chainIdAfterSwitch = await getCurrentChainId();
    if (chainIdAfterSwitch !== MONAD_CHAIN_ID) {
      throw new NetworkError(
        `Failed to switch to Monad. Current chain ID: ${chainIdAfterSwitch}. Expected: ${MONAD_CHAIN_ID}`
      );
    }
  }

  return true;
}

export function isMonadNetwork(chainId) {
  return Number(chainId) === MONAD_CHAIN_ID;
}

export async function getNetworkProvider() {
  if (!window.ethereum) {
    throw new NetworkError('MetaMask not found');
  }

  // Create a fresh provider after network switch
  return new ethers.BrowserProvider(window.ethereum);
}

export async function getNetworkSigner() {
  // Ensure we're on Monad first
  await ensureMonadNetwork();

  // Create a fresh provider after ensuring network
  const provider = await getNetworkProvider();

  // Verify the network one more time
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== MONAD_CHAIN_ID) {
    throw new NetworkError(
      `Provider shows wrong chain ID. Expected: ${MONAD_CHAIN_ID}, Got: ${network.chainId}`
    );
  }

  return provider.getSigner();
}

export async function listenForNetworkChanges(callback) {
  if (!window.ethereum) {
    return () => {};
  }

  const handleChainChanged = (chainId) => {
    const newChainId = parseInt(chainId, 16);
    callback(newChainId);
  };

  window.ethereum.on('chainChanged', handleChainChanged);

  return () => {
    window.ethereum.removeListener('chainChanged', handleChainChanged);
  };
}

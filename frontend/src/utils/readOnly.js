import { ethers } from 'ethers';

const MONAD_TESTNET_RPC = 'https://testnet-rpc.monad.xyz';
const MONAD_CHAIN_ID = 10143;

// Cached read-only provider (no wallet, no signing capability)
let cachedReadProvider = null;

/**
 * Get read-only provider for public blockchain reads
 * Does not require MetaMask or any wallet extension
 * Used for: getBuildRecord, getRecordIdsByOwner, etc.
 */
export function getReadOnlyProvider() {
  if (!cachedReadProvider) {
    cachedReadProvider = new ethers.JsonRpcProvider(
      MONAD_TESTNET_RPC,
      MONAD_CHAIN_ID
    );
  }
  return cachedReadProvider;
}

/**
 * Get contract with read-only provider
 * Safe for public reads without wallet
 */
export function getReadOnlyContract(contractAddress, contractAbi) {
  const provider = getReadOnlyProvider();
  return new ethers.Contract(contractAddress, contractAbi, provider);
}

/**
 * Check if read-only provider is available
 * Always returns true since it doesn't require MetaMask
 */
export function isReadOnlyAvailable() {
  return true;
}

/**
 * Test read-only connectivity
 * Useful for health checks
 */
export async function testReadOnlyConnectivity() {
  try {
    const provider = getReadOnlyProvider();
    const network = await provider.getNetwork();
    return network.chainId === MONAD_CHAIN_ID;
  } catch (err) {
    return false;
  }
}

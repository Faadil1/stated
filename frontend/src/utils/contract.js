import { ethers } from 'ethers';
import { getNetworkSigner, ensureMonadNetwork, getNetworkProvider } from './network';
import { getReadOnlyContract } from './readOnly';

// Contract address must be configured via environment variable
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

if (!CONTRACT_ADDRESS) {
  throw new Error(
    'VITE_CONTRACT_ADDRESS environment variable is required. ' +
    'Create frontend/.env.local with: VITE_CONTRACT_ADDRESS=<address>'
  );
}

// Validate address format
if (!ethers.isAddress(CONTRACT_ADDRESS)) {
  throw new Error(
    `Invalid contract address: ${CONTRACT_ADDRESS}. ` +
    'Must be a valid Ethereum address.'
  );
}
const CONTRACT_ABI = [
  'function createBuildRecord(uint64 deadline, bytes32 declarationHash, string calldata declarationURI) external returns (uint256 recordId)',
  'function attachEvidence(uint256 recordId, bytes32 evidenceHash, string calldata evidenceURI) external',
  'function getBuildRecord(uint256 recordId) external view returns (tuple(address owner, uint64 declaredAt, uint64 deadline, uint64 evidenceAttachedAt, bytes32 declarationHash, bytes32 evidenceHash, string declarationURI, string evidenceURI))',
  'function getRecordIdsByOwner(address owner) external view returns (uint256[])',
  'event BuildRecordCreated(uint256 indexed recordId, address indexed owner, uint64 declaredAt, uint64 deadline, bytes32 declarationHash, string declarationURI)',
  'event EvidenceAttached(uint256 indexed recordId, address indexed owner, uint64 attachedAt, bytes32 evidenceHash, string evidenceURI)',
];

export async function getProvider() {
  if (!window.ethereum) {
    throw new Error('MetaMask not found');
  }
  return new ethers.BrowserProvider(window.ethereum);
}

export async function getReadOnlyProvider() {
  // For read-only calls, use a provider without network enforcement
  return getProvider();
}

export async function getSigner() {
  // Use network-aware signer that enforces Monad
  return getNetworkSigner();
}

export async function getContract(signer) {
  if (!signer) {
    const provider = await getProvider();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

export async function createRecord(deadline, declarationHash, declarationURI) {
  // Enforce Monad network before transaction
  await ensureMonadNetwork();

  const signer = await getSigner();
  const contract = await getContract(signer);
  const tx = await contract.createBuildRecord(deadline, declarationHash, declarationURI);
  const receipt = await tx.wait();
  return receipt;
}

export async function attachEvidence(recordId, evidenceHash, evidenceURI) {
  // Enforce Monad network before transaction
  await ensureMonadNetwork();

  const signer = await getSigner();
  const contract = await getContract(signer);
  const tx = await contract.attachEvidence(recordId, evidenceHash, evidenceURI);
  const receipt = await tx.wait();
  return receipt;
}

export async function getRecord(recordId) {
  const provider = await getProvider();
  const contract = await getContract();
  return contract.getBuildRecord(recordId);
}

export async function getOwnerRecords(address) {
  const provider = await getProvider();
  const contract = await getContract();
  return contract.getRecordIdsByOwner(address);
}

/**
 * Get record without requiring MetaMask
 * Uses read-only public RPC provider
 * Safe for public receipt pages
 */
export async function getRecordPublic(recordId) {
  const contract = getReadOnlyContract(CONTRACT_ADDRESS, CONTRACT_ABI);
  return contract.getBuildRecord(recordId);
}

/**
 * Get owner records without requiring MetaMask
 * Uses read-only public RPC provider
 */
export async function getOwnerRecordsPublic(address) {
  const contract = getReadOnlyContract(CONTRACT_ADDRESS, CONTRACT_ABI);
  return contract.getRecordIdsByOwner(address);
}

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask not found');
  }
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });
  return accounts[0];
}

/**
 * Extract recordId from transaction receipt's BuildRecordCreated event
 * Expects BuildRecordCreated event signature:
 * event BuildRecordCreated(uint256 indexed recordId, address indexed owner, uint64 declaredAt, uint64 deadline, bytes32 declarationHash, string declarationURI)
 * @param {Object} receipt - Transaction receipt object
 * @returns {number|null} Record ID or null if event not found
 */
export function extractRecordIdFromReceipt(receipt) {
  if (!receipt || !receipt.logs || receipt.logs.length === 0) {
    return null;
  }

  // BuildRecordCreated event topic (Keccak256 hash of event signature)
  // This is deterministic and matches the Solidity emit
  const buildRecordCreatedTopic = ethers.id('BuildRecordCreated(uint256,address,uint64,uint64,bytes32,string)');

  // Parse each log to find BuildRecordCreated event
  for (const log of receipt.logs) {
    // Check if this log is from our contract and is the BuildRecordCreated event
    if (log.address && log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase() && log.topics && log.topics[0] === buildRecordCreatedTopic) {
      try {
        // Parse the indexed parameters from topics
        // topics[0] = event signature
        // topics[1] = recordId (indexed, uint256)
        // topics[2] = owner (indexed, address)
        const recordIdTopic = log.topics[1];
        if (recordIdTopic) {
          // recordId is encoded as uint256 in the topic, convert from hex
          const recordId = BigInt(recordIdTopic);
          return Number(recordId);
        }
      } catch (e) {
        // Failed to parse this log, continue
        continue;
      }
    }
  }

  return null;
}

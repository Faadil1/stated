/**
 * Serverless endpoint: POST /api/upload-manifest
 *
 * Accepts a JSON manifest, canonicalizes it, computes hash,
 * uploads to IPFS, and returns real resolvable URI.
 *
 * Server-side credential required: PINATA_JWT or Web3.Storage token
 * (stored in environment, never exposed to client)
 */

const { ethers } = require('ethers');
const { canonicalize } = require('json-canonicalize');
const { validateManifest } = require('../shared/manifest-utils');

const MAX_MANIFEST_SIZE = 1024 * 100; // 100 KB limit
const GATEWAY_URL = 'https://ipfs.io';

/**
 * Hash manifest using Keccak-256 (same as Solidity)
 * Returns bytes32 hex string
 */
function hashManifest(canonical) {
  // Use ethers.js for Keccak-256 to match frontend implementation
  const utf8Bytes = ethers.toUtf8Bytes(canonical);
  return ethers.keccak256(utf8Bytes);
}

/**
 * Upload to IPFS via Pinata (v3 API, authenticated only)
 */
async function uploadToIPFS(canonicalBytes) {
  const pinataToken = process.env.PINATA_JWT;

  if (!pinataToken) {
    throw new Error('PINATA_JWT environment variable is not configured');
  }

  return uploadToAuthenticatedPinata(canonicalBytes, pinataToken);
}

/**
 * Upload to Pinata using server-side authentication (v3 API)
 */
async function uploadToAuthenticatedPinata(canonicalBytes, token) {
  try {
    // Create FormData with file and network field
    const formData = new FormData();

    // Create a Blob from canonical bytes
    const blob = new Blob([canonicalBytes], { type: 'application/json' });

    // Append file with name "manifest.json"
    formData.append('file', blob, 'manifest.json');

    // Append network field for public upload
    formData.append('network', 'public');

    // POST to Pinata v3 endpoint
    const response = await fetch('https://uploads.pinata.cloud/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
      timeout: 30000,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Pinata v3 response format: {data: {cid: "bafy..."}}
    const cid = data?.data?.cid;

    if (!cid) {
      throw new Error('No CID returned from Pinata (missing data.data.cid)');
    }

    return {
      cid,
      gateway: `${GATEWAY_URL}/ipfs/${cid}`,
    };
  } catch (err) {
    throw err;
  }
}

/**
 * Main handler
 */
module.exports = async (req, res) => {
  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { manifest, type } = req.body;

    // Validate input
    if (!manifest || !type) {
      return res.status(400).json({
        error: 'Missing manifest or type in request body'
      });
    }

    if (!['declaration', 'evidence'].includes(type)) {
      return res.status(400).json({
        error: 'Type must be "declaration" or "evidence"'
      });
    }

    // Validate manifest structure
    try {
      validateManifest(manifest, type);
    } catch (validationErr) {
      return res.status(400).json({
        error: validationErr.message
      });
    }

    // Canonicalize
    const canonical = canonicalize(manifest);

    if (canonical.length > MAX_MANIFEST_SIZE) {
      return res.status(413).json({
        error: `Manifest exceeds maximum size of ${MAX_MANIFEST_SIZE} bytes`
      });
    }

    // Hash
    const manifestHash = hashManifest(canonical);

    // Upload to IPFS
    const { cid, gateway } = await uploadToIPFS(canonical);

    // Return results
    return res.status(200).json({
      uri: `ipfs://${cid}`,
      cid,
      manifestHash,
      gatewayURL: gateway,
      canonical: canonical.toString('base64'), // For verification if needed
    });

  } catch (err) {
    console.error('Upload error:', err);

    if (err.message.includes('exceeds')) {
      return res.status(413).json({ error: err.message });
    }

    if (err.message.includes('Invalid')) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({
      error: 'Failed to upload manifest',
      details: err.message,
    });
  }
};

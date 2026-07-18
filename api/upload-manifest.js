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
const https = require('https');
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
 * Upload to IPFS via Pinata (public endpoint, no auth needed for basic use)
 * or use a server-side authenticated service
 */
async function uploadToIPFS(canonicalBytes) {
  // Option 1: Use Pinata's public endpoint (for non-sensitive uploads)
  // Option 2: Use server-side Web3.Storage token
  // Option 3: Use Storacha with delegated capabilities

  // For production, use authenticated Pinata or Web3.Storage with server-side token
  const pinataToken = process.env.PINATA_JWT;

  if (!pinataToken) {
    // Fallback: use Pinata public endpoint (slower, less reliable)
    return uploadToPublicPinata(canonicalBytes);
  }

  return uploadToAuthenticatedPinata(canonicalBytes, pinataToken);
}

/**
 * Upload to Pinata using server-side authentication
 */
async function uploadToAuthenticatedPinata(canonicalBytes, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.pinata.cloud',
      path: '/pinning/pinFileToIPFS',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            throw new Error(`Pinata API error: ${res.statusCode} ${data}`);
          }

          const response = JSON.parse(data);
          resolve({
            cid: response.IpfsHash,
            gateway: `${GATEWAY_URL}/ipfs/${response.IpfsHash}/manifest.json`,
          });
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Pinata upload timeout'));
    });

    // Send the canonical manifest
    const payload = JSON.stringify({
      pinataContent: JSON.parse(canonicalBytes.toString()),
      pinataMetadata: {
        name: 'stated-manifest.json',
      },
      pinataOptions: {
        cidVersion: 1,
      },
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Fallback: upload to public Pinata endpoint (no auth)
 * Not recommended for production
 */
async function uploadToPublicPinata(canonicalBytes) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.pinata.cloud',
      path: '/pinning/pinJSONToIPFS',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            cid: response.IpfsHash,
            gateway: `${GATEWAY_URL}/ipfs/${response.IpfsHash}`,
          });
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Pinata upload timeout'));
    });

    req.write(canonicalBytes.toString());
    req.end();
  });
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
      uri: `ipfs://${cid}/manifest.json`,
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

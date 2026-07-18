/**
 * Shared manifest utilities for both frontend and backend
 * Ensures consistent canonicalization and hashing
 */

const { canonicalize } = require('json-canonicalize');

/**
 * Canonicalize a manifest using RFC 8785
 * Returns a canonical JSON string
 */
function canonicalizeManifest(manifest) {
  return canonicalize(manifest);
}

/**
 * Validate manifest structure
 */
function validateManifest(manifest, type) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Manifest must be an object');
  }

  if (type === 'declaration') {
    if (manifest.schema !== 'stated/declaration/v1') {
      throw new Error('Invalid schema for declaration');
    }
    if (!manifest.project || typeof manifest.project !== 'object') {
      throw new Error('Missing or invalid project');
    }
    if (!manifest.project.title || typeof manifest.project.title !== 'string') {
      throw new Error('Missing or invalid project.title');
    }
    if (!manifest.project.promise || typeof manifest.project.promise !== 'string') {
      throw new Error('Missing or invalid project.promise');
    }
    if (!manifest.deadline || typeof manifest.deadline !== 'string') {
      throw new Error('Missing or invalid deadline');
    }
    if (!Array.isArray(manifest.conditions)) {
      throw new Error('conditions must be an array');
    }
    if (manifest.conditions.length < 1 || manifest.conditions.length > 3) {
      throw new Error('Must have 1-3 conditions');
    }
    for (const condition of manifest.conditions) {
      if (!condition.id || typeof condition.id !== 'string') {
        throw new Error('Each condition must have a string id');
      }
      if (!condition.text || typeof condition.text !== 'string') {
        throw new Error('Each condition must have a string text');
      }
    }
  } else if (type === 'evidence') {
    if (manifest.schema !== 'stated/evidence/v1') {
      throw new Error('Invalid schema for evidence');
    }
    if (manifest.recordId === undefined) {
      throw new Error('Missing recordId');
    }
    if (!Array.isArray(manifest.evidence)) {
      throw new Error('evidence must be an array');
    }
    for (const item of manifest.evidence) {
      if (!item.id || typeof item.id !== 'string') {
        throw new Error('Each evidence item must have a string id');
      }
      if (!Array.isArray(item.conditionIds)) {
        throw new Error('Each evidence item must have conditionIds array');
      }
      if (!item.label || typeof item.label !== 'string') {
        throw new Error('Each evidence item must have a string label');
      }
      if (!item.uri || typeof item.uri !== 'string') {
        throw new Error('Each evidence item must have a string uri');
      }
    }
  }

  return true;
}

module.exports = {
  canonicalizeManifest,
  validateManifest,
};

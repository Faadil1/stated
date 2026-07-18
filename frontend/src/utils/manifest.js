import { ethers } from 'ethers';
import { canonicalize } from 'json-canonicalize';

export function canonicalizeManifest(manifest) {
  return canonicalize(manifest);
}

export function hashManifest(manifest) {
  const canonical = canonicalizeManifest(manifest);
  const utf8Bytes = ethers.toUtf8Bytes(canonical);
  return ethers.keccak256(utf8Bytes);
}

export function validateDeclaration(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Manifest must be an object');
  }

  if (manifest.schema !== 'stated/declaration/v1') {
    throw new Error(
      `Invalid schema. Expected "stated/declaration/v1", got "${manifest.schema}"`
    );
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

  const conditionIds = new Set();
  for (const condition of manifest.conditions) {
    if (!condition.id || typeof condition.id !== 'string') {
      throw new Error('Each condition must have a string id');
    }
    if (!condition.text || typeof condition.text !== 'string') {
      throw new Error('Each condition must have a string text');
    }
    if (conditionIds.has(condition.id)) {
      throw new Error(`Duplicate condition id: ${condition.id}`);
    }
    conditionIds.add(condition.id);
  }

  return true;
}

export function validateEvidence(manifest, declaration) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Manifest must be an object');
  }

  if (manifest.schema !== 'stated/evidence/v1') {
    throw new Error(
      `Invalid schema. Expected "stated/evidence/v1", got "${manifest.schema}"`
    );
  }

  if (manifest.recordId === undefined) {
    throw new Error('Missing recordId');
  }

  if (!Array.isArray(manifest.evidence)) {
    throw new Error('evidence must be an array');
  }

  const validConditionIds = new Set(
    declaration.conditions.map((c) => c.id)
  );

  for (const item of manifest.evidence) {
    if (!item.id || typeof item.id !== 'string') {
      throw new Error('Each evidence item must have a string id');
    }

    if (!Array.isArray(item.conditionIds)) {
      throw new Error('Each evidence item must have conditionIds array');
    }

    for (const condId of item.conditionIds) {
      if (!validConditionIds.has(condId)) {
        throw new Error(`Unknown condition ID in evidence: ${condId}`);
      }
    }

    if (!item.label || typeof item.label !== 'string') {
      throw new Error('Each evidence item must have a string label');
    }

    if (!item.uri || typeof item.uri !== 'string') {
      throw new Error('Each evidence item must have a string uri');
    }
  }

  return true;
}

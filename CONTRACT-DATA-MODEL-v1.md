# STATED — Contract Data Model v1.0

## Design goals
Minimal, append-only, independently readable, owner-controlled, and honest about what it proves.

## BuildRecord

```solidity
struct BuildRecord {
    address owner;
    uint64 declaredAt;
    uint64 deadline;
    uint64 evidenceAttachedAt;
    bytes32 declarationHash;
    bytes32 evidenceHash;
    string declarationURI;
    string evidenceURI;
}
```

Rules:
- declaredAt comes from block.timestamp.
- evidenceAttachedAt == 0 means no attachment.
- declarationHash must be nonzero.
- evidenceHash must be nonzero when attached.
- URIs are references only.
- the contract never parses manifests.

## Storage

```solidity
uint256 public nextRecordId;
mapping(uint256 => BuildRecord) private records;
mapping(address => uint256[]) private recordsByOwner;
```

One wallet may create multiple records.

## Write functions

```solidity
function createBuildRecord(
    uint64 deadline,
    bytes32 declarationHash,
    string calldata declarationURI
) external returns (uint256 recordId);
```

Requirements:
- deadline > block.timestamp
- declarationHash != bytes32(0)
- bounded URI length
- owner = msg.sender

```solidity
function attachEvidence(
    uint256 recordId,
    bytes32 evidenceHash,
    string calldata evidenceURI
) external;
```

Requirements:
- record exists
- msg.sender is owner
- evidence not previously attached
- evidenceHash != bytes32(0)
- bounded URI length

Late attachment is allowed.

## Read functions

```solidity
function getBuildRecord(uint256 recordId)
    external
    view
    returns (BuildRecord memory);

function getRecordIdsByOwner(address owner)
    external
    view
    returns (uint256[] memory);
```

## Events

```solidity
event BuildRecordCreated(
    uint256 indexed recordId,
    address indexed owner,
    uint64 declaredAt,
    uint64 deadline,
    bytes32 declarationHash,
    string declarationURI
);

event EvidenceAttached(
    uint256 indexed recordId,
    address indexed owner,
    uint64 attachedAt,
    bytes32 evidenceHash,
    string evidenceURI
);
```

## Custom errors

```solidity
error RecordNotFound();
error InvalidDeadline();
error ZeroHash();
error NotRecordOwner();
error EvidenceAlreadyAttached();
error UriTooLong();
```

## Derived frontend states

```text
NO_EVIDENCE_ATTACHED if evidenceAttachedAt == 0
ATTACHED_ON_TIME if evidenceAttachedAt <= deadline
ATTACHED_LATE if evidenceAttachedAt > deadline
```

Integrity is calculated offchain:

```text
computedHash(canonicalManifest) == evidenceHash
```

## Declaration manifest

```json
{
  "schema": "stated/declaration/v1",
  "project": {
    "title": "STATED",
    "promise": "Ship a public promise-versus-proof receipt for builders."
  },
  "deadline": "2026-07-19T21:59:00Z",
  "conditions": [
    {"id": "condition-1", "text": "A deployed and verified Monad contract"},
    {"id": "condition-2", "text": "Three working product flows"},
    {"id": "condition-3", "text": "A public receipt"}
  ]
}
```

Rules:
- fixed schema string
- one to three conditions
- stable unique condition IDs
- manifest deadline must match contract input

## Evidence manifest

```json
{
  "schema": "stated/evidence/v1",
  "recordId": "1",
  "evidence": [
    {
      "id": "evidence-1",
      "conditionIds": ["condition-1"],
      "label": "Verified contract",
      "uri": "https://explorer.example/address/0x...",
      "type": "contract"
    }
  ]
}
```

Rules:
- zero or more evidence items
- each item may reference one or more declared conditions
- unknown condition IDs are invalid manifest data
- no completion score
- labels must be factual

## Canonicalization and hashing
Use RFC 8785 JSON Canonicalization Scheme.

Pipeline:
1. parse JSON;
2. validate schema;
3. canonicalize;
4. UTF-8 encode;
5. hash;
6. use the same representation everywhere.

Recommended:
```text
keccak256(UTF8(RFC8785(manifest)))
```

Do not mix SHA-256 and Keccak-256.

## Golden tests
- reordered object keys -> same hash
- whitespace changes -> same hash
- changed content -> different hash
- changed array order -> different hash
- changed Unicode character -> different hash

## Required contract tests
Creation:
- valid creation
- correct event
- correct owner and timestamps
- past deadline rejected
- zero hash rejected
- multiple records per wallet

Evidence:
- owner attachment succeeds
- non-owner reverts
- zero hash rejected
- nonexistent record rejected
- second attachment reverts
- before-deadline attachment succeeds
- after-deadline attachment succeeds
- events and storage agree

Invariants:
- declaration never changes
- owner never changes
- evidence hash changes only once from zero
- attachment timestamp changes only once from zero

## Deployment gate
Do not deploy until:
- Solidity tests pass independently
- utility/hash tests pass independently
- .env is ignored
- no private key is staged
- current official Monad deployment configuration is used

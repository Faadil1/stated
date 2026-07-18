# Claude Code Implementation Prompt — STATED / Google Cloud Shell

You are implementing STATED in the current Google Cloud Shell workspace.

## Operating policy
Work autonomously inside the project directory.

Do not repeatedly request permission for safe, reversible actions:
- reading and editing project files
- installing project dependencies
- running tests and compilation
- formatting and linting
- starting local servers
- inspecting git status and diffs

Ask before:
- deleting important files
- writing outside the workspace
- accessing or exposing secrets
- deploying to a paid or production network
- pushing commits
- force operations
- irreversible external actions

Never fabricate tests, transactions, verification, or deployment results.

## Read first
1. PRODUCT-DEFINITION-v1.md
2. CONTRACT-DATA-MODEL-v1.md
3. DEMO-STORYBOARD-v1.md

Treat them as frozen requirements.

## Phase 0 — Inspect
- print working directory
- inspect tree
- read package manifests, Hardhat config, contracts, tests, scripts, and git status
- identify reusable spike code
- report useful components, blockers, and spec mismatches only
- do not stage files

## Phase 1 — Repair environment
Follow current official Monad Hardhat documentation.

Requirements:
- consistent module system
- correct Hardhat plugins
- Solidity tests separate from schema/hash tests
- .env.example
- .env ignored
- no secrets printed
- deterministic install
- useful npm scripts

Do not deploy.

## Phase 2 — Implement contract
Implement the minimal append-only contract from the data model.

Must support:
- multiple records per wallet
- immutable declarations
- future deadlines
- one evidence attachment
- owner-only attachment
- late attachment allowed
- bounded URI length
- events matching storage
- custom errors

Do not add:
- payments
- escrow
- scoring
- disputes
- roles
- upgradeability
- third-party validation
- multiple evidence attachments

## Phase 3 — Contract tests
Run focused Hardhat tests.

Gate:
- compile succeeds
- all Solidity tests run
- utility tests are reported separately
- second attachment reverts
- non-owner attachment reverts
- late attachment succeeds
- multiple records per wallet succeed
- events match storage
- declaration remains unchanged

Do not claim all tests passed unless both groups actually ran.

## Phase 4 — Manifest package
Implement:
- declaration validation
- evidence validation
- RFC 8785 canonicalization
- UTF-8 encoding
- one consistent hash algorithm
- golden fixtures and vectors

Prefer:
keccak256(UTF8(RFC8785(JSON)))

Tests:
- key order unchanged hash
- whitespace unchanged hash
- content change changes hash
- array order change changes hash
- frontend and scripts agree

Do not use TweetNaCl for canonicalization.

## Phase 5 — Frontend
Build only:
1. landing
2. create record
3. attach evidence
4. public receipt

User-facing states:
- WHAT WAS STATED
- WHAT WAS SHOWN
- NO EVIDENCE ATTACHED
- ATTACHED ON TIME
- ATTACHED LATE
- INTEGRITY MATCH
- INTEGRITY MISMATCH
- CONDITION UNACCOUNTED FOR

Never use completion or quality claims.

The receipt must read contract state directly. No database is the source of truth.

## Phase 6 — Local validation
Before Monad deployment:
1. run all tests
2. start local chain
3. deploy locally
4. create multiple records
5. attach evidence
6. attempt forbidden second attachment
7. test late attachment
8. load receipt
9. modify manifest and show mismatch
10. restore and show match

Record commands and outputs in docs/VALIDATION-REPORT.md.

## Phase 7 — Monad readiness gate
Stop before deployment and provide:
- test summary
- git diff summary
- bytecode size
- required environment variables
- current official deployment command
- current official verification command
- blockers
- deploy-safety verdict

Do not deploy until explicitly instructed.

## Reporting
At each phase report only:
- completed
- exact tests and results
- important files changed
- blockers
- next action

## Final constraint
Preserve the difference between what was declared and what evidence was attached. Never convert evidence presence into an objective completion claim.

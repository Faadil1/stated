# STATED — Product Definition v1.0

## Product identity
- Brand: STATED
- Descriptor: A promise-versus-proof receipt for builders
- Primary line: State it before you build.
- Receipt headline: What was stated. What was shown.
- Supporting line: See what was promised. See what was proved.

## Personal problem
Solo builders often start under deadline pressure, change scope while building, and finish with no trustworthy record of what they originally defined as “done.” STATED preserves two separate moments: what was declared before the outcome existed, and what was later shown as evidence.

## Core promise
Before building, a user records:
- a short project promise;
- a deadline;
- one to three conditions defining “done.”

Later, the same wallet may attach exactly one evidence manifest.

The public receipt shows:
- what was stated;
- what was shown;
- conditions with linked evidence;
- conditions still unaccounted for;
- whether evidence arrived on time or late;
- whether the presented manifest matches its onchain hash.

## Truth boundary
STATED proves:
- the declaration existed at an onchain time;
- the declaration was not rewritten;
- one final evidence-manifest hash was attached;
- the attachment occurred at an onchain time;
- a presented manifest matches or does not match the recorded hash.

STATED does not prove:
- objective completion;
- quality;
- truthfulness;
- artifact authenticity;
- client acceptance;
- authorship of every artifact.

## Primary user
A solo builder who ships hackathon, portfolio, or independent projects under deadlines.

## MVP workflow
1. Connect wallet.
2. Create a record.
3. Enter title, promise, deadline, and one to three conditions.
4. Review the irreversible declaration.
5. Submit it onchain.
6. Build outside STATED.
7. Create a canonical evidence manifest.
8. Attach its hash exactly once with the same wallet.
9. Open the public receipt.
10. Verify manifest integrity.
11. Compare each condition with linked evidence.

## Honest states
Record:
- DECLARED
- EVIDENCE_ATTACHED

Timing:
- NO_EVIDENCE_ATTACHED
- ATTACHED_ON_TIME
- ATTACHED_LATE

Integrity:
- MANIFEST_NOT_LOADED
- INTEGRITY_MATCH
- INTEGRITY_MISMATCH

Condition display:
- EVIDENCE_LINKED
- NO_EVIDENCE_LINKED

Never use COMPLETED, VERIFIED_COMPLETE, PASSED, or FAILED as product judgments.

## Required screens
1. Landing / explanation
2. Create Record
3. Attach Evidence
4. Public Receipt

## Receipt hierarchy
1. Brand and record ID
2. WHAT WAS STATED
3. WHAT WAS SHOWN
4. Unaccounted-for conditions
5. Declared timestamp and deadline
6. Evidence attachment timestamp
7. On-time or late status
8. Integrity result
9. Contract and transaction links
10. Truth-boundary note

## Signature behavior
The receipt must never hide a gap. If one declared condition lacks linked evidence, show:

> 1 condition remains unaccounted for.

Do not calculate a completion score.

## Signature demo
1. Create a declaration for STATED itself.
2. Promise:
   - deployed Monad contract;
   - three working flows;
   - public receipt.
3. Attach evidence for only two conditions.
4. Show the missing condition.
5. Show ATTACHED_ON_TIME.
6. Modify one byte in the evidence manifest.
7. Show INTEGRITY_MISMATCH.
8. Restore the original.
9. Show INTEGRITY_MATCH.

## In scope
- Solidity contract
- contract tests
- Monad deployment
- canonical JSON schemas
- deterministic hashing
- create flow
- attach-once flow
- public receipt
- mismatch demo
- contract verification
- README and limitations

## Out of scope
- AI
- escrow
- staking
- payments
- disputes
- client approval
- leaderboard
- social graph
- portfolio dashboard
- GitHub API
- quality scoring
- completion judgment
- editing
- deletion
- multiple evidence attachments

## Acceptance gates
The MVP passes only when:
1. one wallet can create multiple records;
2. declarations cannot be altered;
3. only the owner can attach evidence;
4. evidence attaches exactly once;
5. late attachment is allowed and labelled late;
6. the receipt reads contract state directly;
7. hashing is deterministic across scripts and frontend;
8. changed manifests visibly fail verification;
9. user-facing copy never overclaims;
10. the deployed contract source is verified.

## Environment
- Primary environment: Google Cloud Shell
- Contract workflow: Hardhat
- Frontend: React + Vite or similarly minimal static app
- EVM client: viem preferred
- Secrets: .env only; never commit private keys
- Monad network values: follow the current official Monad documentation rather than hard-coding stale values.

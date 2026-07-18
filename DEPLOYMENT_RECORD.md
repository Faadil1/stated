# STATED Smart Contract Deployment Record

## Monad Testnet Deployment (2026-07-18)

### Contract Details
- **Contract Address**: `0x6072f291Ab7349295BD975edb0c5abdd84F218Ed`
- **Deployer Address**: `0xda2B108ce7A5E44f118B4724BAA81FEe8704Fa62`
- **Network**: Monad testnet
- **Chain ID**: 10143
- **Deployment Timestamp**: 2026-07-18T16:55:24.696Z

### Verification
- **Bytecode Size**: 3,254 bytes ✅
- **State Verification**: `nextRecordId()` returns 0 ✅
- **RPC Endpoint**: https://testnet-rpc.monad.xyz
- **Block Explorer**: https://testnet-explorer.monad.xyz/address/0x6072f291Ab7349295BD975edb0c5abdd84F218Ed
- **Current Block**: 46,034,820

### Contract Functions Verified
```
✅ createBuildRecord(uint64 deadline, bytes32 declarationHash, string calldata declarationURI)
✅ attachEvidence(uint256 recordId, bytes32 evidenceHash, string calldata evidenceURI)
✅ getBuildRecord(uint256 recordId)
✅ getRecordIdsByOwner(address owner)
✅ nextRecordId()
```

### Environment Configuration
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Explorer URL**: https://testnet-explorer.monad.xyz
- **Deployer Balance at Deployment**: 5 MON (after testnet faucet)
- **Gas Used**: Standard Monad deployment gas (contract deployed successfully)

### Deployment Process
1. ✅ Fixed ethers.js v6 compatibility in `scripts/deploy.js`
2. ✅ Resolved chai peer dependency (^4.5.0)
3. ✅ Fixed frontend configuration to require VITE_CONTRACT_ADDRESS
4. ✅ Implemented RFC 8785 JSON canonicalization
5. ✅ Ran full test suite (59 tests passing)
6. ✅ Verified wallet balance on Monad testnet
7. ✅ Deployed contract once to Monad testnet
8. ✅ Verified bytecode exists on chain
9. ✅ Confirmed state initialization (nextRecordId = 0)

### Frontend Configuration (Ready for Next Step)
To connect frontend to deployed contract:
```bash
# Create frontend/.env.local with:
VITE_CONTRACT_ADDRESS=0x6072f291Ab7349295BD975edb0c5abdd84F218Ed
VITE_CHAIN_ID=10143
```

### Security Notes
- Private key stored securely in `.env` (added to `.gitignore`)
- Contract deployment is immutable
- All critical fixes applied before deployment
- Dependency reproducibility verified (all 59 tests pass)

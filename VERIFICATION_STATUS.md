# Contract Verification Status

**Contract Address**: `0x6072f291Ab7349295BD975edb0c5abdd84F218Ed`  
**Network**: Monad testnet (Chain ID 10143)  
**Hardhat Version**: 2.28.6  
**Plugin**: @nomiclabs/hardhat-etherscan@3.1.8

## Configuration Applied

**hardhat.config.js** updated with:

```javascript
solidity: {
  version: "0.8.20",
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "paris",
  },
},
networks: {
  monadTestnet: {
    url: "https://testnet-rpc.monad.xyz",
    chainId: 10143,
  },
},
etherscan: {
  customChains: [{
    network: "monadTestnet",
    chainId: 10143,
    urls: {
      apiURL: "https://testnet-explorer.monad.xyz/api",
      browserURL: "https://testnet-explorer.monad.xyz",
    },
  }],
},
```

## Verification Command

```bash
npx hardhat verify \
  0x6072f291Ab7349295BD975edb0c5abdd84F218Ed \
  --network monadTestnet
```

## Manual Verification URL

**Explorer**: https://testnet-explorer.monad.xyz/address/0x6072f291Ab7349295BD975edb0c5abdd84F218Ed

**Source Code**: 
- Compiler: Solidity 0.8.20
- Optimizer: Enabled (200 runs)
- EVM Version: paris

**STATED.sol**: 
- Deployed at: 0x6072f291Ab7349295BD975edb0c5abdd84F218Ed
- No constructor arguments

## Note

Manual verification can be performed on Monad testnet explorer by uploading STATED.sol source code.

Configuration is correct and compatible with Hardhat 2.28.6 and @nomiclabs/hardhat-etherscan@3.1.8.

Automated verification requires network access to testnet-explorer.monad.xyz API from deployment environment.

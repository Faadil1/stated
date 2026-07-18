/**
 * Setup script for local E2E testing
 *
 * Uses Hardhat's native getSigners() to deploy contract and save
 * public account info (no private keys written).
 *
 * Output: .test-fixture.json (ephemeral, not checked in)
 */

const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("=== LOCAL TEST SETUP ===\n");

  // Get signers from Hardhat (funded accounts)
  const signers = await ethers.getSigners();
  console.log(`✓ Hardhat accounts available: ${signers.length}`);

  if (signers.length < 2) {
    throw new Error("Expected at least 2 Hardhat accounts");
  }

  const account0 = signers[0];
  const account1 = signers[1];

  // Check balances
  const balance0 = await ethers.provider.getBalance(account0.address);
  const balance1 = await ethers.provider.getBalance(account1.address);

  console.log(`✓ Account 0: ${account0.address}`);
  console.log(`  Balance: ${ethers.formatEther(balance0)} ETH\n`);

  console.log(`✓ Account 1: ${account1.address}`);
  console.log(`  Balance: ${ethers.formatEther(balance1)} ETH\n`);

  // Deploy contract using account 0
  console.log("Deploying STATED contract...");
  const STATED = await ethers.getContractFactory("STATED", account0);
  const stated = await STATED.deploy();
  const contractAddr = stated.target || stated.address;

  console.log(`✓ Deployed to: ${contractAddr}\n`);

  // Verify nextRecordId is initialized
  const nextId = await stated.nextRecordId();
  console.log(`✓ Contract state verified: nextRecordId = ${nextId}\n`);

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`✓ Network: ${network.name} (chainId: ${network.chainId})\n`);

  // Save ephemeral fixture (public info only)
  const fixture = {
    contractAddress: contractAddr,
    chainId: Number(network.chainId),
    rpcUrl: "http://localhost:8545",
    account0: account0.address,
    account1: account1.address,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(".test-fixture.json", JSON.stringify(fixture, null, 2));
  console.log("✓ Test fixture saved to .test-fixture.json\n");

  console.log("=== SETUP COMPLETE ===");
  console.log("\nNext: Start frontend dev server and run Playwright tests\n");
}

main().catch((error) => {
  console.error("SETUP FAILED:", error.message);
  process.exitCode = 1;
});

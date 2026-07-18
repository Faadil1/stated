const { ethers } = require("hardhat");

async function deploy() {
  console.log("=== STATED Contract Deployment ===\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying from address: ${deployer.address}\n`);

  // Get contract factory
  const STATED = await ethers.getContractFactory("STATED");

  // Deploy with ethers v6
  console.log("Deploying STATED contract...");
  const stated = await STATED.deploy();

  // Wait for deployment transaction to be mined
  console.log("Waiting for deployment transaction to be mined...");
  await stated.waitForDeployment();

  // Get contract address after deployment completes
  const contractAddress = await stated.getAddress();
  console.log(`✓ Contract deployed to: ${contractAddress}`);

  // Verify it's working (only after waitForDeployment succeeds)
  const nextId = await stated.nextRecordId();
  console.log(`✓ nextRecordId initialized to: ${nextId}\n`);

  // Verify contract address consistency
  const retrievedAddress = await stated.getAddress();
  console.log(`✓ Address verification: ${contractAddress === retrievedAddress}\n`);

  // Output deployment info
  const network = await ethers.provider.getNetwork();
  console.log("=== Deployment Complete ===");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Network: ${network.name} (chainId: ${network.chainId})`);

  // Save deployment info
  const deploymentInfo = {
    contract: "STATED",
    address: contractAddress,
    deployer: deployer.address,
    network: Number(network.chainId),
    timestamp: new Date().toISOString(),
  };

  console.log(
    "\nDeployment info:\n" + JSON.stringify(deploymentInfo, null, 2)
  );

  return stated;
}

if (require.main === module) {
  deploy().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { deploy };

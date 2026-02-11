import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("\n🚀 Deploying AbilityTokenFactory_BondingCurve...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const Factory = await ethers.getContractFactory("AbilityTokenFactory_BondingCurve");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("✅ AbilityTokenFactory_BondingCurve deployed to:", factoryAddress);

  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    factoryAddress: factoryAddress,
    type: "bonding-curve",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${network.name}-bonding-curve-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );
  fs.writeFileSync(
    path.join(deploymentsDir, `${network.name}-bonding-curve-latest.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n📝 Deployment info saved to:", filename);
  console.log("\n⏳ Waiting for block confirmations...\n");

  await factory.deploymentTransaction()?.wait(5);

  console.log("\n✅ Deployment complete!\n");
  console.log("Factory Address:", factoryAddress);
  console.log("\nTo verify on Basescan, run:");
  console.log(`npx hardhat verify --network ${network.name} ${factoryAddress}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

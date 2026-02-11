import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  // Read latest deployment
  const network = process.env.HARDHAT_NETWORK || "baseSepolia";
  const deploymentPath = path.join(__dirname, `../deployments/${network}-latest.json`);

  if (!fs.existsSync(deploymentPath)) {
    console.error(`No deployment found for network: ${network}`);
    console.error(`Please deploy first: npm run deploy:${network}`);
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("\n🔍 Verifying contract on Basescan...\n");
  console.log("Factory Address:", deployment.factoryAddress);

  try {
    await run("verify:verify", {
      address: deployment.factoryAddress,
      constructorArguments: [],
    });
    console.log("\n✅ Contract verified successfully!\n");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("\n✅ Contract already verified!\n");
    } else {
      console.error("\n❌ Verification failed:", error.message, "\n");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
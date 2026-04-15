import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "META");

  // 1. Deploy AgentRegistry
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("AgentRegistry deployed:", registryAddr);

  // 2. Deploy TradeLog (server = deployer for now)
  const TradeLog = await ethers.getContractFactory("TradeLog");
  const tradeLog = await TradeLog.deploy(deployer.address);
  await tradeLog.waitForDeployment();
  const tradeLogAddr = await tradeLog.getAddress();
  console.log("TradeLog deployed:", tradeLogAddr);

  console.log("\n=== Deployment Summary ===");
  console.log(`AgentRegistry: ${registryAddr}`);
  console.log(`TradeLog:      ${tradeLogAddr}`);
  console.log(`Server (trade recorder): ${deployer.address}`);
  console.log(`Network: ${(await ethers.provider.getNetwork()).chainId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

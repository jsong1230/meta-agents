import { ethers } from "hardhat";

/**
 * Deploys v0.3 contracts to Metadium testnet:
 *   - DelegationRegistry  (patent claims 6-7, 20)
 *   - AgentEventLog       (patent claims 2-3)
 *   - TradeLogV2          (v1 compatible + delegationId)
 *
 * Server role (= deployer for now) can be rotated later via setServer.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Network:  chainId=${net.chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${ethers.formatEther(balance)} META`);

  if (balance === 0n) {
    throw new Error("Deployer has zero META balance");
  }

  console.log("\n[1/3] Deploying DelegationRegistry...");
  const DelegationRegistry = await ethers.getContractFactory("DelegationRegistry");
  const dr = await DelegationRegistry.deploy(deployer.address);
  await dr.waitForDeployment();
  const drAddr = await dr.getAddress();
  console.log(`  → ${drAddr}`);

  console.log("\n[2/3] Deploying AgentEventLog...");
  const AgentEventLog = await ethers.getContractFactory("AgentEventLog");
  const el = await AgentEventLog.deploy(deployer.address);
  await el.waitForDeployment();
  const elAddr = await el.getAddress();
  console.log(`  → ${elAddr}`);

  console.log("\n[3/3] Deploying TradeLogV2...");
  const TradeLogV2 = await ethers.getContractFactory("TradeLogV2");
  const tl = await TradeLogV2.deploy(deployer.address);
  await tl.waitForDeployment();
  const tlAddr = await tl.getAddress();
  console.log(`  → ${tlAddr}`);

  console.log("\n=== v0.3 Deployment Summary ===");
  console.log(`DelegationRegistry: ${drAddr}`);
  console.log(`AgentEventLog:      ${elAddr}`);
  console.log(`TradeLogV2:         ${tlAddr}`);
  console.log(`Server:             ${deployer.address}`);
  console.log(`ChainId:            ${net.chainId}`);

  console.log("\n--- Paste into SDK config.ts (v0.3 section) ---");
  console.log(`DELEGATION_REGISTRY_ADDRESS = "${drAddr}";`);
  console.log(`AGENT_EVENT_LOG_ADDRESS     = "${elAddr}";`);
  console.log(`TRADELOG_V2_ADDRESS         = "${tlAddr}";`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

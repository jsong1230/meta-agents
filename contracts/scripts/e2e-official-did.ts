/**
 * E2E test — verifies createAgentDID flow against the official Metadium testnet DID registry.
 *
 * Inlines the ABIs the SDK uses. Replicates MetaAgentClient.createAgentDID step-by-step.
 *
 * Flow:
 *   1. New wallet, fund with 0.1 META from deployer
 *   2. IdentityRegistry.createIdentity(recovery=self, [], [publicKeyResolver, serviceKeyResolver])
 *   3. ServiceKeyResolver.addKey(wallet, "meta-agents")
 *   4. AgentRegistry.register(wallet, model, version)
 *   5. Assertions: hasIdentity / getEIN / getServiceKeys contains "meta-agents" / AgentRegistry.getAgent
 */
import { ethers as hhEthers } from "hardhat";
import { ethers } from "ethers";

const TESTNET = {
  identityRegistry: "0xbe2bb3d7085ff04bde4b3f177a730a826f05cb70",
  publicKeyResolver: "0x81c638aec7d323d4cd0114a5d5407be241b25d0a",
  serviceKeyResolver: "0xf4f9790205ee559a379c519e04042b20560eefad",
  agentRegistry: "0x3418ce33ec4369268e86b6DEd2288248da3dD39d",
};

const IDENTITY_REGISTRY_ABI = [
  "function createIdentity(address recoveryAddress, address[] providers, address[] resolvers) external returns (uint)",
  "function getEIN(address addr) external view returns (uint)",
  "function hasIdentity(address addr) external view returns (bool)",
  "function getIdentity(uint ein) external view returns (address, address[], address[], address[])",
  "event IdentityCreated(address indexed initiator, uint ein, address recoveryAddress, address associatedAddress, address[] providers, address[] resolvers, bool delegated)",
];
const SERVICE_KEY_RESOLVER_ABI = [
  "function addKey(address key, string symbol) external",
  "function getSymbol(address key) external view returns (string)",
  "function getKeys(uint ein) external view returns (address[])",
];
const AGENT_REGISTRY_ABI = [
  "function register(address agent, string model, string version) external",
  "function getAgent(address agent) external view returns (tuple(address creator, string model, string version, uint256 registeredAt, bool active))",
  "function isRegistered(address agent) external view returns (bool)",
];

async function main() {
  const [deployer] = await hhEthers.getSigners();
  const provider = hhEthers.provider;

  console.log("=== E2E: createAgentDID against official Metadium registry ===\n");
  for (const [k, v] of Object.entries(TESTNET)) console.log(`  ${k.padEnd(20)} ${v}`);

  // 1. new wallet + funding
  const agent = ethers.Wallet.createRandom().connect(provider);
  console.log("\nNew agent wallet:", agent.address);
  console.log("Funding 0.1 META from deployer...");
  await (await deployer.sendTransaction({
    to: agent.address,
    value: ethers.parseEther("0.1"),
  })).wait();

  // 2. IdentityRegistry.createIdentity
  const idReg = new ethers.Contract(TESTNET.identityRegistry, IDENTITY_REGISTRY_ABI, agent);
  console.log("\n[1/3] IdentityRegistry.createIdentity()...");
  const tx1 = await idReg.createIdentity(
    agent.address,
    [],
    [TESTNET.publicKeyResolver, TESTNET.serviceKeyResolver]
  );
  const r1 = await tx1.wait();
  const createdEvent = r1!.logs
    .map((l: { topics: readonly string[]; data: string }) => { try { return idReg.interface.parseLog(l); } catch { return null; } })
    .find((e: { name?: string } | null) => e?.name === "IdentityCreated");
  const einFromEvent = createdEvent ? Number(createdEvent.args.ein) : 0;
  console.log(`  tx:  ${tx1.hash}`);
  console.log(`  ein: ${einFromEvent}`);

  // 3. ServiceKeyResolver.addKey
  const skRes = new ethers.Contract(TESTNET.serviceKeyResolver, SERVICE_KEY_RESOLVER_ABI, agent);
  console.log("\n[2/3] ServiceKeyResolver.addKey(self, \"meta-agents\")...");
  const tx2 = await skRes.addKey(agent.address, "meta-agents");
  await tx2.wait();
  console.log(`  tx: ${tx2.hash}`);

  // 4. AgentRegistry.register
  const agReg = new ethers.Contract(TESTNET.agentRegistry, AGENT_REGISTRY_ABI, agent);
  console.log("\n[3/3] AgentRegistry.register(self, \"Test Model\", \"e2e-0.3.0\")...");
  const tx3 = await agReg.register(agent.address, "Test Model", "e2e-0.3.0");
  await tx3.wait();
  console.log(`  tx: ${tx3.hash}`);

  // 5. Assertions via public reads
  console.log("\n=== Assertions ===");
  const idRegRead = new ethers.Contract(TESTNET.identityRegistry, IDENTITY_REGISTRY_ABI, provider);
  const skResRead = new ethers.Contract(TESTNET.serviceKeyResolver, SERVICE_KEY_RESOLVER_ABI, provider);
  const agRegRead = new ethers.Contract(TESTNET.agentRegistry, AGENT_REGISTRY_ABI, provider);

  const hasId = await idRegRead.hasIdentity(agent.address);
  const einOnChain = Number(await idRegRead.getEIN(agent.address));
  const keys: string[] = await skResRead.getKeys(einOnChain);
  const symbols: string[] = [];
  for (const k of keys) symbols.push(await skResRead.getSymbol(k));
  const agentInfo = await agRegRead.getAgent(agent.address);

  console.log(`  hasIdentity(wallet):     ${hasId}`);
  console.log(`  getEIN(wallet):          ${einOnChain}`);
  console.log(`  getServiceKeys.symbols:  [${symbols.join(", ")}]`);
  console.log(`  AgentRegistry.getAgent.model:   ${agentInfo.model}`);
  console.log(`  AgentRegistry.getAgent.version: ${agentInfo.version}`);

  if (!hasId) throw new Error("FAIL: hasIdentity=false");
  if (einOnChain <= 0) throw new Error("FAIL: EIN=0");
  if (!symbols.includes("meta-agents")) throw new Error("FAIL: meta-agents key missing");
  if (agentInfo.model !== "Test Model") throw new Error(`FAIL: model mismatch: ${agentInfo.model}`);
  if (agentInfo.version !== "e2e-0.3.0") throw new Error(`FAIL: version mismatch: ${agentInfo.version}`);

  console.log("\n✅ All assertions pass — official Metadium DID integration works end-to-end.");
  console.log(`   did:meta:testnet:${agent.address.toLowerCase()}`);
  console.log(`   Explorer: https://testnetexplorer.metadium.com/address/${agent.address}`);
}

main().catch((err) => {
  console.error("\n❌ E2E failed:", err.message || err);
  process.exitCode = 1;
});

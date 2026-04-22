import { ethers } from "hardhat";

/**
 * v0.3 demo seeder.
 *
 *   1. Creates (or loads) a user wallet via MOCK_USER_KEY env var — random if absent
 *   2. User registers a delegation to MOCK_AGENT address via DelegationRegistry.register()
 *   3. Runs 3 sample delegation-backed trades:
 *        - DelegationRegistry.consume(amount)
 *        - AgentEventLog.log(TRADE_EXECUTE)
 *        - TradeLogV2.recordTrade(agent, pair, amount, price, delegationId)
 *
 * ENV:
 *   DEPLOYER_KEY            — required (contract deployer, acts as server)
 *   MOCK_USER_KEY           — optional; random if missing
 *   MOCK_AGENT              — required (one of existing registered agent addresses)
 *   DELEGATION_REGISTRY     — required
 *   AGENT_EVENT_LOG         — required
 *   TRADE_LOG_V2            — required
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const provider = ethers.provider;
  const userKey = process.env.MOCK_USER_KEY || ethers.Wallet.createRandom().privateKey;
  const user = new ethers.Wallet(userKey, provider);

  const agentAddr = process.env.MOCK_AGENT;
  if (!agentAddr) throw new Error("MOCK_AGENT env var is required");

  const REG = process.env.DELEGATION_REGISTRY || "0xc1866e1f1ef84acB3DAf0224C81Bb3aa410aF09e";
  const EVT = process.env.AGENT_EVENT_LOG || "0xE25154d1173c6eE3B50cC7eb6EE1f145ba95102F";
  const TLV2 = process.env.TRADE_LOG_V2 || "0x2B5C8Ab3139B7A31381Dd487150Bb30699d0c1A2";

  console.log("User:   ", user.address);
  console.log("Agent:  ", agentAddr);
  console.log("Deployer (server):", deployer.address);

  // Fund user wallet so it can pay gas for register()
  const userBal = await provider.getBalance(user.address);
  if (userBal < ethers.parseEther("0.1")) {
    console.log("Funding user wallet with 0.2 META from deployer...");
    const fundTx = await deployer.sendTransaction({
      to: user.address,
      value: ethers.parseEther("0.2"),
    });
    await fundTx.wait();
  }

  const registry = await ethers.getContractAt("DelegationRegistry", REG, user);
  const eventLog = await ethers.getContractAt("AgentEventLog", EVT, deployer);
  const tradeLog = await ethers.getContractAt("TradeLogV2", TLV2, deployer);

  // Ensure agent is registered on TradeLogV2
  if (!(await tradeLog.registeredAgents(agentAddr))) {
    console.log("Registering agent on TradeLogV2...");
    const tx = await tradeLog.registerAgent(agentAddr);
    await tx.wait();
  }

  // 1. User registers a delegation
  const nonce = BigInt(ethers.hexlify(ethers.randomBytes(8)));
  const now = BigInt(Math.floor(Date.now() / 1000));
  const SCOPE_TRADE = 1;
  console.log(`\n[1/2] User registers delegation (nonce=${nonce})...`);
  const regTx = await registry.register(
    user.address,
    agentAddr,
    `did:meta:testnet:${user.address.toLowerCase()}`,
    `did:meta:testnet:${agentAddr.toLowerCase()}`,
    0n, 0n,
    SCOPE_TRADE,
    ethers.parseEther("10"),      // per-tx cap 10 MAG
    ethers.parseEther("100"),     // total cap 100 MAG
    now,
    now + 30n * 24n * 3600n,      // 30 days
    "https://meta-agents.example/api/delegation/revoke",
    "https://meta-agents.example/delegation/",
    nonce
  );
  const regReceipt = await regTx.wait();
  const chainId = Number((await provider.getNetwork()).chainId);
  const delegationId = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256", "uint256", "address"],
      [user.address, agentAddr, nonce, chainId, REG]
    )
  );
  console.log("  delegationId:", delegationId);
  console.log("  tx:", regTx.hash);

  // 2. Simulate 3 delegation-backed trades
  console.log(`\n[2/2] Running 3 delegation-backed trades...`);
  const BTC_USDT = ethers.encodeBytes32String("BTC/USDT").slice(0, 18);
  const PRICE_60K = ethers.parseEther("60000");
  const TRADE_EXECUTE = ethers.keccak256(ethers.toUtf8Bytes("TRADE_EXECUTE"));

  for (let i = 1; i <= 3; i++) {
    const amount = ethers.parseEther(`${i * 0.5}`);
    console.log(`  Trade #${i}: ${ethers.formatEther(amount)} BTC`);

    // Server (deployer) consumes on behalf of agent
    const registryAsServer = await ethers.getContractAt("DelegationRegistry", REG, deployer);
    await (await registryAsServer.consume(delegationId, amount)).wait();

    // Log event (deployer = service provider)
    const actionHash = ethers.keccak256(
      ethers.toUtf8Bytes(`trade-${i}-${Date.now()}`)
    );
    await (await eventLog.log(
      delegationId,
      `did:meta:testnet:${agentAddr.toLowerCase()}`,
      TRADE_EXECUTE,
      actionHash,
      "did:meta:testnet:serviceProvider"
    )).wait();

    // Record trade
    await (await tradeLog.recordTrade(
      agentAddr,
      BTC_USDT as any,
      amount,
      PRICE_60K,
      delegationId
    )).wait();
  }

  const used = await registryAsServerUsed(REG, delegationId, provider);
  console.log(`\nDone. usedAmount = ${ethers.formatEther(used)} MAG / 100 MAG cap`);
  console.log("View:", `http://100.126.168.26:3100/delegation/${delegationId}`);
}

async function registryAsServerUsed(
  addr: string,
  id: string,
  provider: ethers.Provider
): Promise<bigint> {
  const c = await ethers.getContractAt("DelegationRegistry", addr, provider);
  return BigInt(await c.usedAmount(id));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

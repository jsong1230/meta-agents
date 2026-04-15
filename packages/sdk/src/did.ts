/**
 * DID module — AI Agent Identity on Metadium
 *
 * DID format: did:meta:<network>:<address>
 * e.g. did:meta:testnet:0x1234...abcd
 */

import { ethers } from "ethers";
import type { AgentIdentity, AgentStats, VerifyResult, MetaAgentsConfig } from "./types.js";

// Minimal ABIs (only what we need)
const REGISTRY_ABI = [
  "function register(address agent, string model, string version) external",
  "function getAgent(address agent) external view returns (tuple(address creator, string model, string version, uint256 registeredAt, bool active))",
  "function isRegistered(address agent) external view returns (bool)",
  "function getAgentCount() external view returns (uint256)",
  "function getAgentByIndex(uint256 index) external view returns (address)",
];

const TRADELOG_ABI = [
  "function getAgentTradeCount(address agent) external view returns (uint256)",
  "function getAgentTrades(address agent, uint256 offset, uint256 limit) external view returns (tuple(address agent, bytes8 pair, int256 amount, uint256 price, uint256 timestamp)[])",
];

const NETWORK_PREFIX = "testnet"; // TODO: make configurable

export function addressToDid(address: string): string {
  return `did:meta:${NETWORK_PREFIX}:${address.toLowerCase()}`;
}

export function didToAddress(did: string): string {
  const parts = did.split(":");
  if (parts.length !== 4 || parts[0] !== "did" || parts[1] !== "meta") {
    throw new Error(`Invalid DID format: ${did}. Expected did:meta:<network>:<address>`);
  }
  const address = parts[3];
  if (!ethers.isAddress(address)) {
    throw new Error(`Invalid address in DID: ${address}`);
  }
  return ethers.getAddress(address); // checksum
}

/**
 * Create a new agent DID. Generates a wallet and registers on-chain.
 */
export async function createDID(
  config: MetaAgentsConfig,
  model: string,
  version: string,
  signer: ethers.Signer
): Promise<{ did: string; wallet: ethers.Wallet; txHash: string }> {
  const wallet = ethers.Wallet.createRandom();
  const registry = new ethers.Contract(config.registryAddress, REGISTRY_ABI, signer);

  const tx = await registry.register(wallet.address, model, version);
  await tx.wait();

  return {
    did: addressToDid(wallet.address),
    wallet: wallet,
    txHash: tx.hash,
  };
}

/**
 * Register an existing wallet as an agent DID.
 */
export async function registerAgent(
  config: MetaAgentsConfig,
  agentAddress: string,
  model: string,
  version: string,
  signer: ethers.Signer
): Promise<{ did: string; txHash: string }> {
  const registry = new ethers.Contract(config.registryAddress, REGISTRY_ABI, signer);
  const tx = await registry.register(agentAddress, model, version);
  await tx.wait();

  return {
    did: addressToDid(agentAddress),
    txHash: tx.hash,
  };
}

/**
 * Resolve a DID to its on-chain identity.
 */
export async function resolveDID(
  config: MetaAgentsConfig,
  did: string
): Promise<AgentIdentity> {
  const address = didToAddress(did);
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const registry = new ethers.Contract(config.registryAddress, REGISTRY_ABI, provider);

  const info = await registry.getAgent(address);

  return {
    did,
    address,
    creator: info.creator,
    model: info.model,
    version: info.version,
    registeredAt: Number(info.registeredAt),
    active: info.active,
  };
}

/**
 * Compute agent trading stats from on-chain trade log.
 */
export async function getAgentStats(
  config: MetaAgentsConfig,
  agentAddress: string
): Promise<AgentStats> {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const tradeLog = new ethers.Contract(config.tradeLogAddress, TRADELOG_ABI, provider);

  const tradeCount = Number(await tradeLog.getAgentTradeCount(agentAddress));

  if (tradeCount === 0) {
    return { totalTrades: 0, pnlPercent: 0, firstTradeAt: 0, lastTradeAt: 0 };
  }

  // Fetch all trades (paginate for large sets)
  const PAGE_SIZE = 100;
  let allTrades: any[] = [];
  for (let offset = 0; offset < tradeCount; offset += PAGE_SIZE) {
    const page = await tradeLog.getAgentTrades(agentAddress, offset, PAGE_SIZE);
    allTrades = allTrades.concat(page);
  }

  // Calculate PnL: sum of (sell_price - buy_price) / initial_portfolio
  // Simplified: track position value changes
  let totalPnl = 0n;
  let totalInvested = 0n;

  for (const trade of allTrades) {
    const amount = BigInt(trade.amount);
    const price = BigInt(trade.price);
    const value = amount * price / ethers.parseEther("1"); // normalize 18 decimals

    if (amount > 0n) {
      // Buy: add to invested
      totalInvested += value;
    } else {
      // Sell: compute PnL (simplified)
      totalPnl += -value; // negative amount * price = positive value
    }
  }

  const pnlPercent = totalInvested > 0n
    ? Number((totalPnl - totalInvested) * 10000n / totalInvested) / 100
    : 0;

  return {
    totalTrades: tradeCount,
    pnlPercent,
    firstTradeAt: Number(allTrades[0].timestamp),
    lastTradeAt: Number(allTrades[allTrades.length - 1].timestamp),
  };
}

/**
 * verifyAgent — THE KYA killer feature.
 * One API call: verify agent identity + get on-chain performance.
 * This is what makes DID better than a plain wallet address.
 */
export async function verifyAgent(
  config: MetaAgentsConfig,
  did: string
): Promise<VerifyResult> {
  const address = didToAddress(did);
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const registry = new ethers.Contract(config.registryAddress, REGISTRY_ABI, provider);

  const isRegistered = await registry.isRegistered(address);
  if (!isRegistered) {
    return {
      verified: false,
      agent: {
        did,
        address,
        creator: ethers.ZeroAddress,
        model: "",
        version: "",
        registeredAt: 0,
        active: false,
      },
      stats: { totalTrades: 0, pnlPercent: 0, firstTradeAt: 0, lastTradeAt: 0 },
      proof: {
        registryAddress: config.registryAddress,
        tradeLogAddress: config.tradeLogAddress,
        chainId: config.chainId || 12,
      },
    };
  }

  const agent = await resolveDID(config, did);
  const stats = await getAgentStats(config, address);

  return {
    verified: true,
    agent,
    stats,
    proof: {
      registryAddress: config.registryAddress,
      tradeLogAddress: config.tradeLogAddress,
      chainId: config.chainId || 12,
    },
  };
}

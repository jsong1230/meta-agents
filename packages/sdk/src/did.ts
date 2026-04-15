/**
 * DID module — Real Metadium DID (ERC-1484) integration
 *
 * DID format: did:meta:<network>:<address>
 *
 * Flow:
 *   createAgentDID()
 *     1. IdentityRegistry.createIdentity() → EIN assigned
 *     2. ServiceKeyResolver.addKey(agentWallet, "meta-agents")
 *     3. AgentRegistry.register(agentWallet, model, version)
 *
 *   verifyAgent()
 *     1. IdentityRegistry.getEIN(address) → EIN
 *     2. IdentityRegistry.getIdentity(ein) → resolvers, providers
 *     3. ServiceKeyResolver.getKeys(ein) → service keys
 *     4. AgentRegistry.getAgent(address) → model, version
 *     5. TradeLog stats → PnL, trade count
 */

import { ethers } from "ethers";
import type { AgentIdentity, AgentStats, VerifyResult, MetaAgentsConfig } from "./types.js";
import { IDENTITY_REGISTRY_ABI, PUBLIC_KEY_RESOLVER_ABI, SERVICE_KEY_RESOLVER_ABI, AGENT_REGISTRY_ABI, TRADE_LOG_ABI } from "./abi.js";
import { TESTNET_CONTRACTS, TESTNET_RPC, TESTNET_CHAIN_ID } from "./config.js";
import type { ContractAddresses } from "./config.js";

const NETWORK_PREFIX = "testnet";

// ── Helpers ──

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
  return ethers.getAddress(address);
}

// ── Client ──

export class MetaAgentClient {
  readonly provider: ethers.JsonRpcProvider;
  readonly contracts: ContractAddresses;
  readonly chainId: number;

  constructor(
    rpcUrl: string = TESTNET_RPC,
    contracts: ContractAddresses = TESTNET_CONTRACTS,
    chainId: number = TESTNET_CHAIN_ID
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl, { chainId, name: "metadium" });
    this.contracts = contracts;
    this.chainId = chainId;
  }

  /**
   * Create a full agent DID on Metadium.
   *
   * 1. Creates ERC-1484 identity (IdentityRegistry)
   * 2. Adds "meta-agents" service key (ServiceKeyResolver)
   * 3. Registers agent metadata (AgentRegistry)
   * 4. Registers on TradeLog
   */
  async createAgentDID(
    signer: ethers.Wallet,
    model: string,
    version: string
  ): Promise<{
    did: string;
    ein: number;
    txHashes: string[];
  }> {
    const connected = signer.connect(this.provider);
    const txHashes: string[] = [];

    // 1. Create ERC-1484 identity
    const registry = new ethers.Contract(
      this.contracts.identityRegistry,
      IDENTITY_REGISTRY_ABI,
      connected
    );

    const resolvers = [
      this.contracts.publicKeyResolver,
      this.contracts.serviceKeyResolver,
    ];

    const tx1 = await registry.createIdentity(
      connected.address, // recovery = self
      [],                // no providers initially
      resolvers,
    );
    const receipt1 = await tx1.wait();
    txHashes.push(tx1.hash);

    // Get EIN from event
    const createEvent = receipt1.logs.find(
      (log: any) => log.fragment?.name === "IdentityCreated"
    );
    const ein = createEvent ? Number(createEvent.args[1]) : await this.getEIN(connected.address);

    // 2. Add service key "meta-agents"
    const skResolver = new ethers.Contract(
      this.contracts.serviceKeyResolver,
      SERVICE_KEY_RESOLVER_ABI,
      connected
    );
    const tx2 = await skResolver.addKey(connected.address, "meta-agents");
    await tx2.wait();
    txHashes.push(tx2.hash);

    // 3. Register on AgentRegistry
    if (this.contracts.agentRegistry) {
      const agentReg = new ethers.Contract(
        this.contracts.agentRegistry,
        AGENT_REGISTRY_ABI,
        connected
      );
      const tx3 = await agentReg.register(connected.address, model, version);
      await tx3.wait();
      txHashes.push(tx3.hash);
    }

    // 4. Register on TradeLog
    // Note: TradeLog.registerAgent is onlyServer, so this needs the server wallet.
    // Skip here — server does it via API.

    return {
      did: addressToDid(connected.address),
      ein,
      txHashes,
    };
  }

  /** Get EIN for an address */
  async getEIN(address: string): Promise<number> {
    const registry = new ethers.Contract(
      this.contracts.identityRegistry,
      IDENTITY_REGISTRY_ABI,
      this.provider
    );
    return Number(await registry.getEIN(address));
  }

  /** Check if address has a DID identity */
  async hasIdentity(address: string): Promise<boolean> {
    const registry = new ethers.Contract(
      this.contracts.identityRegistry,
      IDENTITY_REGISTRY_ABI,
      this.provider
    );
    try {
      return await registry.hasIdentity(address);
    } catch {
      return false;
    }
  }

  /** Get full on-chain identity for an EIN */
  async getIdentity(ein: number): Promise<{
    recovery: string;
    associatedAddresses: string[];
    providers: string[];
    resolvers: string[];
  }> {
    const registry = new ethers.Contract(
      this.contracts.identityRegistry,
      IDENTITY_REGISTRY_ABI,
      this.provider
    );
    const [recovery, addresses, providers, resolvers] = await registry.getIdentity(ein);
    return {
      recovery,
      associatedAddresses: [...addresses],
      providers: [...providers],
      resolvers: [...resolvers],
    };
  }

  /** Get service keys for an EIN */
  async getServiceKeys(ein: number): Promise<Array<{ key: string; symbol: string }>> {
    const skResolver = new ethers.Contract(
      this.contracts.serviceKeyResolver,
      SERVICE_KEY_RESOLVER_ABI,
      this.provider
    );
    const keys: string[] = await skResolver.getKeys(ein);
    const result = [];
    for (const key of keys) {
      const symbol = await skResolver.getSymbol(key);
      result.push({ key, symbol });
    }
    return result;
  }

  /** Get public key for an address */
  async getPublicKey(address: string): Promise<string | null> {
    const pkResolver = new ethers.Contract(
      this.contracts.publicKeyResolver,
      PUBLIC_KEY_RESOLVER_ABI,
      this.provider
    );
    try {
      const pk = await pkResolver.getPublicKey(address);
      return pk && pk !== "0x" ? pk : null;
    } catch {
      return null;
    }
  }

  /**
   * verifyAgent — THE KYA killer feature.
   * One call: DID identity + agent metadata + on-chain performance.
   */
  async verifyAgent(did: string): Promise<VerifyResult> {
    const address = didToAddress(did);

    // Check DID identity exists
    const hasDID = await this.hasIdentity(address);
    if (!hasDID) {
      return {
        verified: false,
        agent: {
          did, address,
          creator: ethers.ZeroAddress, model: "", version: "",
          registeredAt: 0, active: false,
        },
        stats: { totalTrades: 0, pnlPercent: 0, firstTradeAt: 0, lastTradeAt: 0 },
        proof: {
          registryAddress: this.contracts.identityRegistry,
          tradeLogAddress: this.contracts.tradeLog,
          chainId: this.chainId,
        },
      };
    }

    const ein = await this.getEIN(address);
    const identity = await this.getIdentity(ein);
    const serviceKeys = await this.getServiceKeys(ein);

    // Agent metadata from AgentRegistry
    let model = "";
    let version = "";
    let creator = ethers.ZeroAddress;
    let registeredAt = 0;
    let active = false;

    if (this.contracts.agentRegistry) {
      const agentReg = new ethers.Contract(
        this.contracts.agentRegistry,
        AGENT_REGISTRY_ABI,
        this.provider
      );
      try {
        const info = await agentReg.getAgent(address);
        creator = info.creator;
        model = info.model;
        version = info.version;
        registeredAt = Number(info.registeredAt);
        active = info.active;
      } catch {}
    }

    // Trade stats
    const stats = await this.getAgentStats(address);

    return {
      verified: true,
      agent: { did, address, creator, model, version, registeredAt, active },
      stats,
      proof: {
        registryAddress: this.contracts.identityRegistry,
        tradeLogAddress: this.contracts.tradeLog,
        chainId: this.chainId,
      },
    };
  }

  /** Compute agent trading stats from on-chain trade log */
  async getAgentStats(address: string): Promise<AgentStats> {
    if (!this.contracts.tradeLog) {
      return { totalTrades: 0, pnlPercent: 0, firstTradeAt: 0, lastTradeAt: 0 };
    }

    const tradeLog = new ethers.Contract(
      this.contracts.tradeLog,
      TRADE_LOG_ABI,
      this.provider
    );

    const count = Number(await tradeLog.getAgentTradeCount(address));
    if (count === 0) {
      return { totalTrades: 0, pnlPercent: 0, firstTradeAt: 0, lastTradeAt: 0 };
    }

    const PAGE = 100;
    let allTrades: any[] = [];
    for (let off = 0; off < count; off += PAGE) {
      const page = await tradeLog.getAgentTrades(address, off, PAGE);
      allTrades = allTrades.concat(page);
    }

    let totalPnl = BigInt(0);
    let totalInvested = BigInt(0);
    const unit = BigInt(10) ** BigInt(18);

    for (const t of allTrades) {
      const amount = BigInt(t.amount);
      const price = BigInt(t.price);
      const value = amount * price / unit;
      if (amount > BigInt(0)) totalInvested += value;
      else totalPnl += -value;
    }

    const pnlPercent = totalInvested > BigInt(0)
      ? Number((totalPnl - totalInvested) * BigInt(10000) / totalInvested) / 100
      : 0;

    return {
      totalTrades: count,
      pnlPercent,
      firstTradeAt: Number(allTrades[0].timestamp),
      lastTradeAt: Number(allTrades[allTrades.length - 1].timestamp),
    };
  }
}

// ── Convenience functions (backward-compatible) ──

export async function createDID(
  config: MetaAgentsConfig,
  model: string,
  version: string,
  signer: ethers.Signer
): Promise<{ did: string; wallet: ethers.Wallet; txHash: string }> {
  const wallet = ethers.Wallet.createRandom();
  const client = new MetaAgentClient(config.rpcUrl);
  // For backward compat, just register on AgentRegistry
  const agentReg = new ethers.Contract(config.registryAddress, AGENT_REGISTRY_ABI, signer);
  const tx = await agentReg.register(wallet.address, model, version);
  await tx.wait();
  return { did: addressToDid(wallet.address), wallet, txHash: tx.hash };
}

export async function resolveDID(
  config: MetaAgentsConfig,
  did: string
): Promise<AgentIdentity> {
  const address = didToAddress(did);
  const client = new MetaAgentClient(config.rpcUrl);
  const result = await client.verifyAgent(did);
  return result.agent;
}

export async function verifyAgent(
  config: MetaAgentsConfig,
  did: string
): Promise<VerifyResult> {
  const client = new MetaAgentClient(config.rpcUrl);
  return client.verifyAgent(did);
}

export async function getAgentStats(
  config: MetaAgentsConfig,
  agentAddress: string
): Promise<AgentStats> {
  const client = new MetaAgentClient(config.rpcUrl);
  return client.getAgentStats(agentAddress);
}

export async function registerAgent(
  config: MetaAgentsConfig,
  agentAddress: string,
  model: string,
  version: string,
  signer: ethers.Signer
): Promise<{ did: string; txHash: string }> {
  const agentReg = new ethers.Contract(config.registryAddress, AGENT_REGISTRY_ABI, signer);
  const tx = await agentReg.register(agentAddress, model, version);
  await tx.wait();
  return { did: addressToDid(agentAddress), txHash: tx.hash };
}

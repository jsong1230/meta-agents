/**
 * Delegation module — KR patent 10-2025-0074709 Smart Contract mode (claims 6-7, 20).
 *
 * Flow:
 *   1. User signs DelegationRegistry.register(...) — self-issue delegation
 *   2. Agent calls DelegationRegistry.isValid(id, scope, amount) before action
 *   3. Agent / Service Provider calls consume(id, amount) — enforces caps
 *   4. Agent appends AgentEventLog.log(delegationId, actionType, ...) after action
 *   5. User or issuer can revoke(id) at any time
 */

import { ethers } from "ethers";
import { DELEGATION_REGISTRY_ABI, AGENT_EVENT_LOG_ABI } from "./abi.js";

export enum Scope {
  TRADE = 1,
  FOLLOW = 2,
  TRANSFER = 4,
  WITHDRAW = 8,
}

export const SCOPE_MASK = Scope.TRADE | Scope.FOLLOW | Scope.TRANSFER | Scope.WITHDRAW;

export interface Delegation {
  delegationId: string;
  userDID: string;
  agentDID: string;
  userEIN: bigint;
  agentEIN: bigint;
  user: string;
  agent: string;
  scope: number;
  maxAmount: bigint;
  totalCap: bigint;
  validFrom: number;
  validUntil: number;
  revocationURL: string;
  trackingURL: string;
  issuer: string;
  revoked: boolean;
}

export interface CreateDelegationParams {
  user: string;
  agent: string;
  userDID: string;
  agentDID: string;
  userEIN?: bigint;
  agentEIN?: bigint;
  scope: number;                 // Scope bitmask
  maxAmount?: bigint;            // per-tx cap. 0 = no per-tx limit
  totalCap?: bigint;             // cumulative cap. 0 = unlimited
  validFrom?: number;            // unix seconds. default now
  validFor: number;              // seconds. validUntil = validFrom + validFor
  revocationURL?: string;
  trackingURL?: string;
  nonce?: bigint;                // default random
}

export interface IsValidResult {
  valid: boolean;
  reason: string;
}

export interface AgentEventRecord {
  delegationId: string;
  agent: string;
  agentDID: string;
  actionType: string;
  actionHash: string;
  serviceProviderDID: string;
  timestamp: number;
  blockNumber: number;
}

/**
 * Deterministic delegationId used by the registry: keccak256(abi.encode(user, agent, nonce, chainId, registry)).
 * Useful for off-chain pre-computation before the on-chain register() resolves.
 */
export function computeDelegationId(
  user: string,
  agent: string,
  nonce: bigint,
  chainId: number | bigint,
  registryAddress: string
): string {
  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256", "uint256", "address"],
      [user, agent, nonce, BigInt(chainId), registryAddress]
    )
  );
}

/** Convenience: common action-type hashes. */
export const ActionType = {
  TRADE_EXECUTE: ethers.keccak256(ethers.toUtf8Bytes("TRADE_EXECUTE")),
  FOLLOW_REQUEST: ethers.keccak256(ethers.toUtf8Bytes("FOLLOW_REQUEST")),
  TRANSFER_EXECUTE: ethers.keccak256(ethers.toUtf8Bytes("TRANSFER_EXECUTE")),
  WITHDRAW_EXECUTE: ethers.keccak256(ethers.toUtf8Bytes("WITHDRAW_EXECUTE")),
} as const;

export class DelegationManager {
  private registry: ethers.Contract;
  private eventLog: ethers.Contract | null;

  constructor(
    private signerOrProvider: ethers.Signer | ethers.Provider,
    registryAddress: string,
    eventLogAddress?: string
  ) {
    if (!registryAddress) throw new Error("DelegationManager: registryAddress is required");
    this.registry = new ethers.Contract(registryAddress, DELEGATION_REGISTRY_ABI, signerOrProvider);
    this.eventLog = eventLogAddress
      ? new ethers.Contract(eventLogAddress, AGENT_EVENT_LOG_ABI, signerOrProvider)
      : null;
  }

  get address(): string {
    return this.registry.target as string;
  }

  get eventLogAddress(): string | null {
    return this.eventLog ? (this.eventLog.target as string) : null;
  }

  /**
   * Create a new delegation. Caller = issuer.
   * For self-issue (v0.3.0 default), signer should be the user.
   */
  async create(params: CreateDelegationParams): Promise<{
    delegationId: string;
    tx: ethers.ContractTransactionResponse;
    nonce: bigint;
  }> {
    if ((params.scope | 0) === 0) throw new Error("Scope must be non-zero bitmask");
    if ((params.scope & ~SCOPE_MASK) !== 0) throw new Error("Scope contains unknown bits");

    const nonce = params.nonce ?? BigInt(ethers.hexlify(ethers.randomBytes(16)));
    const validFrom = BigInt(params.validFrom ?? Math.floor(Date.now() / 1000));
    const validUntil = validFrom + BigInt(params.validFor);

    const tx = await this.registry.register(
      params.user,
      params.agent,
      params.userDID,
      params.agentDID,
      params.userEIN ?? 0n,
      params.agentEIN ?? 0n,
      params.scope,
      params.maxAmount ?? 0n,
      params.totalCap ?? 0n,
      validFrom,
      validUntil,
      params.revocationURL ?? "",
      params.trackingURL ?? "",
      nonce
    );

    // Compute id off-chain — matches on-chain keccak256 scheme
    const chainId = Number(
      (await this._provider().getNetwork()).chainId
    );
    const delegationId = computeDelegationId(
      params.user,
      params.agent,
      nonce,
      chainId,
      this.address
    );
    return { delegationId, tx, nonce };
  }

  async revoke(delegationId: string): Promise<ethers.ContractTransactionResponse> {
    return this.registry.revoke(delegationId);
  }

  async isValid(
    delegationId: string,
    requiredScope: number,
    requestedAmount: bigint
  ): Promise<IsValidResult> {
    const [valid, reason] = await this.registry.isValid(delegationId, requiredScope, requestedAmount);
    return { valid: Boolean(valid), reason: String(reason) };
  }

  async consume(delegationId: string, amount: bigint): Promise<ethers.ContractTransactionResponse> {
    return this.registry.consume(delegationId, amount);
  }

  async get(delegationId: string): Promise<Delegation> {
    const d = await this.registry.getDelegation(delegationId);
    return {
      delegationId,
      userDID: d.userDID,
      agentDID: d.agentDID,
      userEIN: BigInt(d.userEIN),
      agentEIN: BigInt(d.agentEIN),
      user: d.user,
      agent: d.agent,
      scope: Number(d.scope),
      maxAmount: BigInt(d.maxAmount),
      totalCap: BigInt(d.totalCap),
      validFrom: Number(d.validFrom),
      validUntil: Number(d.validUntil),
      revocationURL: d.revocationURL,
      trackingURL: d.trackingURL,
      issuer: d.issuer,
      revoked: Boolean(d.revoked),
    };
  }

  async usedAmount(delegationId: string): Promise<bigint> {
    return BigInt(await this.registry.usedAmount(delegationId));
  }

  async listByAgent(agent: string): Promise<string[]> {
    const ids: string[] = await this.registry.getByAgent(agent);
    return ids;
  }

  async listByUser(user: string): Promise<string[]> {
    const ids: string[] = await this.registry.getByUser(user);
    return ids;
  }

  async getByAgentDetailed(agent: string): Promise<Delegation[]> {
    const ids = await this.listByAgent(agent);
    return Promise.all(ids.map((id) => this.get(id)));
  }

  async getByUserDetailed(user: string): Promise<Delegation[]> {
    const ids = await this.listByUser(user);
    return Promise.all(ids.map((id) => this.get(id)));
  }

  // ── AgentEventLog ──

  async logEvent(
    delegationId: string,
    agentDID: string,
    actionType: string,
    actionHash: string,
    serviceProviderDID: string
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.eventLog) throw new Error("DelegationManager: eventLog address not configured");
    return this.eventLog.log(delegationId, agentDID, actionType, actionHash, serviceProviderDID);
  }

  async queryEventsByDelegation(delegationId: string): Promise<AgentEventRecord[]> {
    if (!this.eventLog) throw new Error("DelegationManager: eventLog address not configured");
    const raw = await this.eventLog.queryByDelegation(delegationId);
    return raw.map(normalizeEvent);
  }

  async queryEventsByAgent(agent: string, fromTs = 0, toTs = 2 ** 31 - 1): Promise<AgentEventRecord[]> {
    if (!this.eventLog) throw new Error("DelegationManager: eventLog address not configured");
    const raw = await this.eventLog.queryByAgent(agent, fromTs, toTs);
    return raw.map(normalizeEvent);
  }

  private _provider(): ethers.Provider {
    if ("provider" in this.signerOrProvider && this.signerOrProvider.provider) {
      return this.signerOrProvider.provider;
    }
    return this.signerOrProvider as ethers.Provider;
  }
}

function normalizeEvent(e: any): AgentEventRecord {
  return {
    delegationId: e.delegationId,
    agent: e.agent,
    agentDID: e.agentDID,
    actionType: e.actionType,
    actionHash: e.actionHash,
    serviceProviderDID: e.serviceProviderDID,
    timestamp: Number(e.timestamp),
    blockNumber: Number(e.blockNumber),
  };
}

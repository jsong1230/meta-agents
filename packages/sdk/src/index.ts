export { decodeDynamicFeeTx, encodeFDUnsigned, encodeFDSigned, signAsFeePayer, delegateAndSend } from "./fee-delegation.js";
export type { FeeDelegateTx } from "./fee-delegation.js";

export { MetaAgentClient, addressToDid, didToAddress, createDID, registerAgent, resolveDID, getAgentStats, verifyAgent } from "./did.js";
export type { AgentIdentity, TradeRecord, AgentStats, VerifyResult, MetaAgentsConfig } from "./types.js";

export { TESTNET_CONTRACTS, MAINNET_CONTRACTS, TESTNET_RPC, MAINNET_RPC } from "./config.js";
export type { ContractAddresses } from "./config.js";

// v0.3 — Delegation Framework (patent 10-2025-0074709, claims 6-7, 20)
export { DelegationManager, Scope, ActionType, computeDelegationId, SCOPE_MASK } from "./delegation.js";
export type { Delegation, CreateDelegationParams, IsValidResult, AgentEventRecord } from "./delegation.js";

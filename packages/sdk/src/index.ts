export { decodeDynamicFeeTx, encodeFDUnsigned, encodeFDSigned, signAsFeePayer, delegateAndSend } from "./fee-delegation.js";
export type { FeeDelegateTx } from "./fee-delegation.js";

export { MetaAgentClient, addressToDid, didToAddress, createDID, registerAgent, resolveDID, getAgentStats, verifyAgent } from "./did.js";
export type { AgentIdentity, TradeRecord, AgentStats, VerifyResult, MetaAgentsConfig } from "./types.js";

export { TESTNET_CONTRACTS, MAINNET_CONTRACTS, TESTNET_RPC, MAINNET_RPC } from "./config.js";
export type { ContractAddresses } from "./config.js";

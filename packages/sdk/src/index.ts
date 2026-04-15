export { decodeDynamicFeeTx, encodeFDUnsigned, encodeFDSigned, signAsFeePayer, delegateAndSend } from "./fee-delegation.js";
export type { FeeDelegateTx } from "./fee-delegation.js";

export { addressToDid, didToAddress, createDID, registerAgent, resolveDID, getAgentStats, verifyAgent } from "./did.js";
export type { AgentIdentity, TradeRecord, AgentStats, VerifyResult, MetaAgentsConfig } from "./types.js";

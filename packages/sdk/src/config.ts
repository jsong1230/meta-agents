/**
 * Contract addresses — configurable, swap anytime.
 */

export interface ContractAddresses {
  identityRegistry: string;
  publicKeyResolver: string;
  serviceKeyResolver: string;
  agentRegistry: string;
  tradeLog: string;
  // v0.3 additions (optional — blank when not yet deployed)
  delegationRegistry?: string;
  agentEventLog?: string;
  tradeLogV2?: string;
}

export const TESTNET_CONTRACTS: ContractAddresses = {
  // Official Metadium testnet DID contracts (source: METADIUM/did-sdk-java, METADIUM/meta-did-resolver)
  identityRegistry: "0xbe2bb3d7085ff04bde4b3f177a730a826f05cb70",
  publicKeyResolver: "0x81c638aec7d323d4cd0114a5d5407be241b25d0a",
  serviceKeyResolver: "0xf4f9790205ee559a379c519e04042b20560eefad",
  // meta-agents own contracts
  agentRegistry: "0x3418ce33ec4369268e86b6DEd2288248da3dD39d",
  tradeLog: "0xB02239dEB85528a268f31a00EDFde682eFe268B6",
  // v0.3 — deployed 2026-04-22 by scripts/deploy-v03.ts
  delegationRegistry: process.env.DELEGATION_REGISTRY_ADDRESS || "0xc1866e1f1ef84acB3DAf0224C81Bb3aa410aF09e",
  agentEventLog: process.env.AGENT_EVENT_LOG_ADDRESS || "0xE25154d1173c6eE3B50cC7eb6EE1f145ba95102F",
  tradeLogV2: process.env.TRADELOG_V2_ADDRESS || "0x2B5C8Ab3139B7A31381Dd487150Bb30699d0c1A2",
};

export const MAINNET_CONTRACTS: ContractAddresses = {
  identityRegistry: "0x42bbff659772231bb63c7c175a1021e080a4cf9d",
  publicKeyResolver: "0xd9f39ab902f835400Cfb424529BB0423D7342331",
  serviceKeyResolver: "0x5D4B8C6c6aBecf9B5277747fa15980B964C40Ce3",
  agentRegistry: "", // not deployed yet
  tradeLog: "",      // not deployed yet
};

export const TESTNET_RPC = "https://api.metadium.com/dev";
export const MAINNET_RPC = "https://api.metadium.com/prod";

export const TESTNET_CHAIN_ID = 12;
export const MAINNET_CHAIN_ID = 11;

/**
 * Public meta-agents endpoints. Declared separately from the RPC URL so the
 * API can migrate to its own stack later without breaking existing consumers.
 */
export const TESTNET_WEB_URL =
  process.env.META_AGENTS_TESTNET_WEB ||
  "https://meta-agents-testnet.metadium.club";

export const TESTNET_API_BASE_URL =
  process.env.META_AGENTS_TESTNET_API ||
  "https://api.meta-agents-testnet.metadium.club";

// Mainnet endpoints will be added when the mainnet service is deployed.
// Naming rule: testnet = "*-testnet.metadium.club", mainnet = "*.metadium.club".

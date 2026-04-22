/**
 * Minimal v0.3 ABIs for the web app (mirror of packages/sdk/src/abi.ts).
 */

export const DELEGATION_REGISTRY_ABI = [
  "function register(address user, address agent, string userDID, string agentDID, uint256 userEIN, uint256 agentEIN, uint32 scope, uint256 maxAmount, uint256 totalCap, uint64 validFrom, uint64 validUntil, string revocationURL, string trackingURL, uint256 nonce) returns (bytes32)",
  "function revoke(bytes32 delegationId)",
  "function isValid(bytes32 delegationId, uint32 requiredScope, uint256 requestedAmount) view returns (bool valid, string reason)",
  "function consume(bytes32 delegationId, uint256 amount)",
  "function getDelegation(bytes32 delegationId) view returns (tuple(string userDID, string agentDID, uint256 userEIN, uint256 agentEIN, address user, address agent, uint32 scope, uint256 maxAmount, uint256 totalCap, uint64 validFrom, uint64 validUntil, string revocationURL, string trackingURL, address issuer, bool revoked, bool exists))",
  "function exists(bytes32 delegationId) view returns (bool)",
  "function usedAmount(bytes32 delegationId) view returns (uint256)",
  "function getByAgent(address agent) view returns (bytes32[])",
  "function getByUser(address user) view returns (bytes32[])",
  "event DelegationRegistered(bytes32 indexed delegationId, address indexed user, address indexed agent, uint32 scope, uint256 maxAmount, uint256 totalCap, uint64 validFrom, uint64 validUntil)",
  "event DelegationRevoked(bytes32 indexed delegationId, address indexed by)",
  "event DelegationConsumed(bytes32 indexed delegationId, address indexed consumer, uint256 amount, uint256 totalUsed)",
];

export const AGENT_EVENT_LOG_ABI = [
  "function log(bytes32 delegationId, string agentDID, bytes32 actionType, bytes32 actionHash, string serviceProviderDID) returns (uint256)",
  "function getEventAt(uint256 index) view returns (tuple(bytes32 delegationId, address agent, string agentDID, bytes32 actionType, bytes32 actionHash, string serviceProviderDID, uint64 timestamp, uint256 blockNumber))",
  "function getEventCount() view returns (uint256)",
  "function queryByDelegation(bytes32 delegationId) view returns (tuple(bytes32 delegationId, address agent, string agentDID, bytes32 actionType, bytes32 actionHash, string serviceProviderDID, uint64 timestamp, uint256 blockNumber)[])",
  "function queryByAgent(address agent, uint64 fromTs, uint64 toTs) view returns (tuple(bytes32 delegationId, address agent, string agentDID, bytes32 actionType, bytes32 actionHash, string serviceProviderDID, uint64 timestamp, uint256 blockNumber)[])",
];

export const TRADE_LOG_V2_ABI = [
  "function recordTrade(address agent, bytes8 pair, int256 amount, uint256 price, bytes32 delegationId)",
  "function getDelegationTradeCount(bytes32 delegationId) view returns (uint256)",
  "function getDelegationTrades(bytes32 delegationId, uint256 offset, uint256 limit) view returns (tuple(address agent, bytes8 pair, int256 amount, uint256 price, uint256 timestamp, bytes32 delegationId)[])",
];

// ActionType hashes are computed at runtime via ethers.keccak256(toUtf8Bytes(name))
export const ACTION_TYPE_NAMES = [
  "TRADE_EXECUTE",
  "FOLLOW_REQUEST",
  "TRANSFER_EXECUTE",
  "WITHDRAW_EXECUTE",
] as const;

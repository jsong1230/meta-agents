/**
 * Contract ABIs — minimal, only what the SDK needs.
 * Swap-friendly: if contracts change, update ABIs here.
 */

// ERC-1484 IdentityRegistry
export const IDENTITY_REGISTRY_ABI = [
  "function createIdentity(address recoveryAddress, address[] providers, address[] resolvers) external returns (uint)",
  "function createIdentityDelegated(address recoveryAddress, address associatedAddress, address[] providers, address[] resolvers, uint8 v, bytes32 r, bytes32 s, uint timestamp) external returns (uint)",
  "function getEIN(address addr) external view returns (uint)",
  "function identityExists(uint ein) external view returns (bool)",
  "function getIdentity(uint ein) external view returns (address, address[], address[], address[])",
  "function hasIdentity(address addr) external view returns (bool)",
  "function addResolvers(address[] resolvers) external",
  "function addProviders(address[] providers) external",
  "event IdentityCreated(address indexed initiator, uint ein, address recoveryAddress, address associatedAddress, address[] providers, address[] resolvers, bool delegated)",
];

// PublicKeyResolver
export const PUBLIC_KEY_RESOLVER_ABI = [
  "function addPublicKey(bytes publicKey) external",
  "function addPublicKeyDelegated(address associatedAddress, bytes publicKey, uint8 v, bytes32 r, bytes32 s, uint timestamp) external",
  "function removePublicKey() external",
  "function getPublicKey(address addr) external view returns (bytes)",
];

// ServiceKeyResolver
export const SERVICE_KEY_RESOLVER_ABI = [
  "function addKey(address key, string symbol) external",
  "function addKeyDelegated(address associatedAddress, address key, string symbol, uint8 v, bytes32 r, bytes32 s, uint timestamp) external",
  "function removeKey(address key) external",
  "function removeKeys() external",
  "function isKeyFor(address key, uint ein) external view returns (bool)",
  "function getSymbol(address key) external view returns (string)",
  "function getKeys(uint ein) external view returns (address[])",
  "event KeyAdded(address indexed key, uint indexed ein, string symbol)",
];

// meta-agents AgentRegistry
export const AGENT_REGISTRY_ABI = [
  "function register(address agent, string model, string version) external",
  "function getAgent(address agent) external view returns (tuple(address creator, string model, string version, uint256 registeredAt, bool active))",
  "function isRegistered(address agent) external view returns (bool)",
  "function getAgentCount() external view returns (uint256)",
];

// meta-agents TradeLog
export const TRADE_LOG_ABI = [
  "function registerAgent(address agent) external",
  "function recordTrade(address agent, bytes8 pair, int256 amount, uint256 price) external",
  "function getTradeCount() external view returns (uint256)",
  "function getAgentTradeCount(address agent) external view returns (uint256)",
  "function getAgentTrades(address agent, uint256 offset, uint256 limit) external view returns (tuple(address agent, bytes8 pair, int256 amount, uint256 price, uint256 timestamp)[])",
];

// v0.3 — DelegationRegistry (patent claims 6-7, 20)
export const DELEGATION_REGISTRY_ABI = [
  "function SCOPE_TRADE() view returns (uint32)",
  "function SCOPE_FOLLOW() view returns (uint32)",
  "function SCOPE_TRANSFER() view returns (uint32)",
  "function SCOPE_WITHDRAW() view returns (uint32)",
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

// v0.3 — AgentEventLog (patent claims 2-3)
export const AGENT_EVENT_LOG_ABI = [
  "function log(bytes32 delegationId, string agentDID, bytes32 actionType, bytes32 actionHash, string serviceProviderDID) returns (uint256)",
  "function getEventAt(uint256 index) view returns (tuple(bytes32 delegationId, address agent, string agentDID, bytes32 actionType, bytes32 actionHash, string serviceProviderDID, uint64 timestamp, uint256 blockNumber))",
  "function getEventCount() view returns (uint256)",
  "function queryByDelegation(bytes32 delegationId) view returns (tuple(bytes32 delegationId, address agent, string agentDID, bytes32 actionType, bytes32 actionHash, string serviceProviderDID, uint64 timestamp, uint256 blockNumber)[])",
  "function queryByAgent(address agent, uint64 fromTs, uint64 toTs) view returns (tuple(bytes32 delegationId, address agent, string agentDID, bytes32 actionType, bytes32 actionHash, string serviceProviderDID, uint64 timestamp, uint256 blockNumber)[])",
  "event ActionLogged(uint256 indexed eventIndex, bytes32 indexed delegationId, address indexed agent, bytes32 actionType, bytes32 actionHash, uint64 timestamp)",
];

// v0.3 — TradeLogV2 (adds delegationId)
export const TRADE_LOG_V2_ABI = [
  "function registerAgent(address agent)",
  "function recordTrade(address agent, bytes8 pair, int256 amount, uint256 price, bytes32 delegationId)",
  "function getTrade(uint256 tradeId) view returns (tuple(address agent, bytes8 pair, int256 amount, uint256 price, uint256 timestamp, bytes32 delegationId))",
  "function getTradeCount() view returns (uint256)",
  "function getAgentTradeCount(address agent) view returns (uint256)",
  "function getDelegationTradeCount(bytes32 delegationId) view returns (uint256)",
  "function getAgentTrades(address agent, uint256 offset, uint256 limit) view returns (tuple(address agent, bytes8 pair, int256 amount, uint256 price, uint256 timestamp, bytes32 delegationId)[])",
  "function getDelegationTrades(bytes32 delegationId, uint256 offset, uint256 limit) view returns (tuple(address agent, bytes8 pair, int256 amount, uint256 price, uint256 timestamp, bytes32 delegationId)[])",
  "event TradeRecorded(uint256 indexed tradeId, address indexed agent, bytes32 indexed delegationId, bytes8 pair, int256 amount, uint256 price, uint256 timestamp)",
];

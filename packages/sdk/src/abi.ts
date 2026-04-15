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

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TradeLog
 * @notice Append-only on-chain trade record for AI agents.
 *         Server stamps price (prevents agent gaming). Agent identity via DID Registry.
 *
 *   Agent bot                    Server (API)              This contract
 *     │  SDK.logTrade(pair,amt)     │                          │
 *     │  + DID signature            │                          │
 *     ├────────────────────────────▶│                          │
 *     │                             │  1. Verify DID sig       │
 *     │                             │  2. Fetch price          │
 *     │                             │  3. recordTrade()        │
 *     │                             ├─────────────────────────▶│
 *     │                             │  (Fee Delegation)        │
 */
contract TradeLog {
    struct TradeRecord {
        address agent;      // Agent wallet address (resolves via DID Registry)
        bytes8 pair;        // e.g. "BTC/USDT" encoded (gas-optimized)
        int256 amount;      // positive=buy, negative=sell
        uint256 price;      // Server-stamped price (18 decimals)
        uint256 timestamp;  // block.timestamp
    }

    address public owner;
    address public server; // Only server can record trades (price integrity)

    TradeRecord[] public trades;
    mapping(address => uint256[]) public agentTradeIds;
    mapping(address => bool) public registeredAgents;

    event TradeRecorded(
        uint256 indexed tradeId,
        address indexed agent,
        bytes8 pair,
        int256 amount,
        uint256 price,
        uint256 timestamp
    );

    event AgentRegistered(address indexed agent);
    event ServerUpdated(address indexed oldServer, address indexed newServer);

    modifier onlyOwner() {
        require(msg.sender == owner, "TradeLog: not owner");
        _;
    }

    modifier onlyServer() {
        require(msg.sender == server, "TradeLog: not server");
        _;
    }

    constructor(address _server) {
        owner = msg.sender;
        server = _server;
    }

    function registerAgent(address agent) external onlyServer {
        require(!registeredAgents[agent], "TradeLog: already registered");
        registeredAgents[agent] = true;
        emit AgentRegistered(agent);
    }

    function recordTrade(
        address agent,
        bytes8 pair,
        int256 amount,
        uint256 price
    ) external onlyServer {
        require(registeredAgents[agent], "TradeLog: agent not registered");
        require(amount != 0, "TradeLog: zero amount");
        require(price > 0, "TradeLog: zero price");

        uint256 tradeId = trades.length;
        trades.push(TradeRecord({
            agent: agent,
            pair: pair,
            amount: amount,
            price: price,
            timestamp: block.timestamp
        }));
        agentTradeIds[agent].push(tradeId);

        emit TradeRecorded(tradeId, agent, pair, amount, price, block.timestamp);
    }

    function getTradeCount() external view returns (uint256) {
        return trades.length;
    }

    function getAgentTradeCount(address agent) external view returns (uint256) {
        return agentTradeIds[agent].length;
    }

    function getAgentTrades(
        address agent,
        uint256 offset,
        uint256 limit
    ) external view returns (TradeRecord[] memory) {
        uint256[] storage ids = agentTradeIds[agent];
        uint256 end = offset + limit;
        if (end > ids.length) end = ids.length;
        if (offset >= ids.length) return new TradeRecord[](0);

        uint256 count = end - offset;
        TradeRecord[] memory result = new TradeRecord[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = trades[ids[offset + i]];
        }
        return result;
    }

    function setServer(address _server) external onlyOwner {
        emit ServerUpdated(server, _server);
        server = _server;
    }
}

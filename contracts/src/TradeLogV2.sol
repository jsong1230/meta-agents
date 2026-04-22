// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TradeLogV2
 * @notice Append-only trade record with delegationId field (v0.3).
 *
 *         Self-trade (v0.1 style):          delegationId = 0x0
 *         Delegation-backed trade:          delegationId = Keccak hash from DelegationRegistry
 *
 *         v1 (TradeLog.sol) remains deployed. v2 runs alongside.
 */
contract TradeLogV2 {
    struct TradeRecord {
        address agent;
        bytes8  pair;
        int256  amount;
        uint256 price;
        uint256 timestamp;
        bytes32 delegationId;   // 0x0 = self-trade
    }

    address public owner;
    address public server;

    TradeRecord[] private _trades;
    mapping(address => uint256[]) private _agentTradeIds;
    mapping(bytes32 => uint256[]) private _delegationTradeIds;
    mapping(address => bool) public registeredAgents;

    event TradeRecorded(
        uint256 indexed tradeId,
        address indexed agent,
        bytes32 indexed delegationId,
        bytes8 pair,
        int256 amount,
        uint256 price,
        uint256 timestamp
    );
    event AgentRegistered(address indexed agent);
    event ServerUpdated(address indexed oldServer, address indexed newServer);

    modifier onlyOwner() {
        require(msg.sender == owner, "TradeLogV2: not owner");
        _;
    }
    modifier onlyServer() {
        require(msg.sender == server, "TradeLogV2: not server");
        _;
    }

    constructor(address _server) {
        owner = msg.sender;
        server = _server;
    }

    function registerAgent(address agent) external onlyServer {
        require(!registeredAgents[agent], "TradeLogV2: already registered");
        registeredAgents[agent] = true;
        emit AgentRegistered(agent);
    }

    function recordTrade(
        address agent,
        bytes8 pair,
        int256 amount,
        uint256 price,
        bytes32 delegationId
    ) external onlyServer {
        require(registeredAgents[agent], "TradeLogV2: agent not registered");
        require(amount != 0, "TradeLogV2: zero amount");
        require(price > 0, "TradeLogV2: zero price");

        uint256 tradeId = _trades.length;
        _trades.push(TradeRecord({
            agent: agent,
            pair: pair,
            amount: amount,
            price: price,
            timestamp: block.timestamp,
            delegationId: delegationId
        }));
        _agentTradeIds[agent].push(tradeId);
        if (delegationId != bytes32(0)) {
            _delegationTradeIds[delegationId].push(tradeId);
        }

        emit TradeRecorded(tradeId, agent, delegationId, pair, amount, price, block.timestamp);
    }

    function getTrade(uint256 tradeId) external view returns (TradeRecord memory) {
        require(tradeId < _trades.length, "TradeLogV2: out of bounds");
        return _trades[tradeId];
    }

    function getTradeCount() external view returns (uint256) {
        return _trades.length;
    }

    function getAgentTradeCount(address agent) external view returns (uint256) {
        return _agentTradeIds[agent].length;
    }

    function getDelegationTradeCount(bytes32 delegationId) external view returns (uint256) {
        return _delegationTradeIds[delegationId].length;
    }

    function getAgentTrades(
        address agent,
        uint256 offset,
        uint256 limit
    ) external view returns (TradeRecord[] memory) {
        return _page(_agentTradeIds[agent], offset, limit);
    }

    function getDelegationTrades(
        bytes32 delegationId,
        uint256 offset,
        uint256 limit
    ) external view returns (TradeRecord[] memory) {
        return _page(_delegationTradeIds[delegationId], offset, limit);
    }

    function _page(
        uint256[] storage ids,
        uint256 offset,
        uint256 limit
    ) internal view returns (TradeRecord[] memory) {
        uint256 end = offset + limit;
        if (end > ids.length) end = ids.length;
        if (offset >= ids.length) return new TradeRecord[](0);

        uint256 count = end - offset;
        TradeRecord[] memory result = new TradeRecord[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = _trades[ids[offset + i]];
        }
        return result;
    }

    function setServer(address _server) external onlyOwner {
        emit ServerUpdated(server, _server);
        server = _server;
    }
}

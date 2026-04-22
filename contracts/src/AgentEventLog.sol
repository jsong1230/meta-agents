// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AgentEventLog
 * @notice Append-only on-chain log of AI agent actions.
 *         Implements KR patent 10-2025-0074709 claims 2-3
 *         ("AI 에이전트 행동 로그 등록 및 감사 조회").
 *
 *         Stored as hash + metadata (payload kept off-chain for privacy).
 */
contract AgentEventLog {
    struct Event {
        bytes32 delegationId;      // 0x0 if self-trade (v0.1 compat)
        address agent;
        string  agentDID;
        bytes32 actionType;        // e.g. keccak256("TRADE_EXECUTE")
        bytes32 actionHash;        // payload hash
        string  serviceProviderDID;
        uint64  timestamp;
        uint256 blockNumber;
    }

    address public owner;
    address public server;

    Event[] private _events;
    mapping(bytes32 => uint256[]) private _byDelegation;
    mapping(address => uint256[]) private _byAgent;

    event ActionLogged(
        uint256 indexed eventIndex,
        bytes32 indexed delegationId,
        address indexed agent,
        bytes32 actionType,
        bytes32 actionHash,
        uint64 timestamp
    );
    event ServerUpdated(address indexed oldServer, address indexed newServer);

    modifier onlyOwner() {
        require(msg.sender == owner, "EventLog: not owner");
        _;
    }

    constructor(address _server) {
        owner = msg.sender;
        server = _server;
    }

    function setServer(address _server) external onlyOwner {
        emit ServerUpdated(server, _server);
        server = _server;
    }

    /**
     * @notice Append a new event log entry.
     * @dev Open to agent or server. Agent can self-log; server logs on behalf.
     */
    function log(
        bytes32 delegationId,
        string calldata agentDID,
        bytes32 actionType,
        bytes32 actionHash,
        string calldata serviceProviderDID
    ) external returns (uint256 eventIndex) {
        require(actionType != bytes32(0), "EventLog: zero actionType");
        eventIndex = _events.length;
        _events.push(Event({
            delegationId: delegationId,
            agent: msg.sender,
            agentDID: agentDID,
            actionType: actionType,
            actionHash: actionHash,
            serviceProviderDID: serviceProviderDID,
            timestamp: uint64(block.timestamp),
            blockNumber: block.number
        }));
        if (delegationId != bytes32(0)) {
            _byDelegation[delegationId].push(eventIndex);
        }
        _byAgent[msg.sender].push(eventIndex);

        emit ActionLogged(eventIndex, delegationId, msg.sender, actionType, actionHash, uint64(block.timestamp));
    }

    function getEventAt(uint256 index) external view returns (Event memory) {
        require(index < _events.length, "EventLog: out of bounds");
        return _events[index];
    }

    function getEventCount() external view returns (uint256) {
        return _events.length;
    }

    function queryByDelegation(bytes32 delegationId) external view returns (Event[] memory) {
        uint256[] storage idx = _byDelegation[delegationId];
        Event[] memory out = new Event[](idx.length);
        for (uint256 i = 0; i < idx.length; i++) {
            out[i] = _events[idx[i]];
        }
        return out;
    }

    function queryByAgent(address agent, uint64 fromTs, uint64 toTs) external view returns (Event[] memory) {
        uint256[] storage idx = _byAgent[agent];
        // first pass: count matches
        uint256 count;
        for (uint256 i = 0; i < idx.length; i++) {
            uint64 t = _events[idx[i]].timestamp;
            if (t >= fromTs && t <= toTs) count++;
        }
        Event[] memory out = new Event[](count);
        uint256 k;
        for (uint256 i = 0; i < idx.length; i++) {
            uint64 t = _events[idx[i]].timestamp;
            if (t >= fromTs && t <= toTs) {
                out[k++] = _events[idx[i]];
            }
        }
        return out;
    }

    function getAgentEventCount(address agent) external view returns (uint256) {
        return _byAgent[agent].length;
    }

    function getDelegationEventCount(bytes32 delegationId) external view returns (uint256) {
        return _byDelegation[delegationId].length;
    }
}

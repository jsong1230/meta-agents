// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice AgentRegistry(v2)에서 어댑터가 호출하는 검증 상태 반영 함수
interface IAgentRegistry {
    function setVerified(address agent, bool status) external;
    function isRegistered(address agent) external view returns (bool);
}

/// @notice MetaStake OperatorRegistry의 operator 조회
interface IOperatorRegistry {
    function getOperator(uint256 serviceId, address operator)
        external
        view
        returns (uint256 stake, uint256 unstakeRequestTime, bool active);

    function operatorCount(uint256 serviceId) external view returns (uint256);
}

/// @title AgentVerifierAdapter — C3 통합 어댑터
/// @notice meta-agents의 AI agent 검증을 MetaStake OperatorRegistry의 active operator
///         (serviceId=2 "Agent Verifier")가 단순 majority(m-of-n) 투표로 판정한다.
///
///         agent 검증은 "이 agent가 신뢰할 만한가?"라는 *주관적* 판단이므로 C1(dispute)과
///         동일한 majority vote 패턴을 쓴다 (C2 zkBridge relay가 ZK로 객관 검증돼 1-of-n인 것과 대비).
///         operator는 열거 불가하므로 각자 tx를 제출하는 pull 방식이며, 전체 active operator 수의
///         과반(2*votes > operatorCount)이 모이면 AgentRegistry.setVerified를 자동 호출한다.
contract AgentVerifierAdapter {
    IAgentRegistry public immutable agentRegistry;
    IOperatorRegistry public immutable registry;
    uint256 public immutable serviceId;

    struct Tally {
        uint128 approveVotes; // 검증(verified=true) 찬성
        uint128 rejectVotes;  // 미검증(verified=false) 찬성
        bool executed;
    }

    mapping(address => Tally) public tally;                       // agent → 집계
    mapping(address => mapping(address => bool)) public voted;    // agent → operator → 투표 여부

    event VerifyVoteCast(address indexed agent, address indexed operator, bool approve);
    event VerificationExecuted(address indexed agent, bool verified);

    error NotActiveOperator(address caller);
    error AlreadyVoted();
    error AlreadyExecuted();
    error AgentNotRegistered(address agent);
    error NoOperators();

    constructor(address _agentRegistry, address _registry, uint256 _serviceId) {
        require(_agentRegistry != address(0) && _registry != address(0), "zero addr");
        agentRegistry = IAgentRegistry(_agentRegistry);
        registry = IOperatorRegistry(_registry);
        serviceId = _serviceId;
    }

    modifier onlyActiveOperator() {
        (, , bool active) = registry.getOperator(serviceId, msg.sender);
        if (!active) revert NotActiveOperator(msg.sender);
        _;
    }

    /// @notice 현재 active operator 수
    function operatorCount() public view returns (uint256) {
        return registry.operatorCount(serviceId);
    }

    function _isMajority(uint256 votes, uint256 total) internal pure returns (bool) {
        return total > 0 && (2 * votes) > total;
    }

    /// @notice operator가 특정 agent의 검증 여부에 투표.
    ///         approve=true(검증) 또는 false(미검증)가 과반 도달 시 AgentRegistry.setVerified 자동 호출.
    function voteVerify(address agent, bool approve) external onlyActiveOperator {
        if (!agentRegistry.isRegistered(agent)) revert AgentNotRegistered(agent);

        Tally storage t = tally[agent];
        if (t.executed) revert AlreadyExecuted();
        if (voted[agent][msg.sender]) revert AlreadyVoted();

        voted[agent][msg.sender] = true;
        if (approve) {
            t.approveVotes += 1;
        } else {
            t.rejectVotes += 1;
        }
        emit VerifyVoteCast(agent, msg.sender, approve);

        uint256 total = operatorCount();
        if (_isMajority(t.approveVotes, total)) {
            t.executed = true;
            agentRegistry.setVerified(agent, true);
            emit VerificationExecuted(agent, true);
        } else if (_isMajority(t.rejectVotes, total)) {
            t.executed = true;
            agentRegistry.setVerified(agent, false);
            emit VerificationExecuted(agent, false);
        }
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AgentRegistry
 * @notice On-chain DID registry for AI agents.
 *         Maps agent address → identity metadata.
 *         DID format: did:meta:testnet:<address>
 *
 *   createDID() → AgentRegistry.register()
 *   verifyAgent() → AgentRegistry.getAgent() + TradeLog stats
 */
contract AgentRegistry {
    struct AgentInfo {
        address creator;     // Who registered this agent
        string model;        // AI model name (e.g. "GPT-4", "Claude")
        string version;      // Agent version
        uint256 registeredAt;
        bool active;
    }

    address public owner;
    mapping(address => AgentInfo) public agents;
    address[] public agentList;

    // C3 어댑터 (AgentVerifierAdapter): operator 합의로 검증된 agent 표시
    address public verifier;                    // set이면 owner 외에 이 주소도 setVerified 가능
    mapping(address => bool) public verified;   // agent → 검증 여부

    event AgentCreated(
        address indexed agent,
        address indexed creator,
        string model,
        string version,
        uint256 registeredAt
    );

    event AgentDeactivated(address indexed agent);
    event VerifierUpdated(address indexed oldVerifier, address indexed newVerifier);
    event AgentVerificationUpdated(address indexed agent, bool verified);

    modifier onlyOwner() {
        require(msg.sender == owner, "AgentRegistry: not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function register(
        address agent,
        string calldata model,
        string calldata version
    ) external {
        require(agents[agent].registeredAt == 0, "AgentRegistry: already registered");
        require(bytes(model).length > 0, "AgentRegistry: empty model");
        require(bytes(model).length <= 64, "AgentRegistry: model too long");
        require(bytes(version).length <= 32, "AgentRegistry: version too long");

        agents[agent] = AgentInfo({
            creator: msg.sender,
            model: model,
            version: version,
            registeredAt: block.timestamp,
            active: true
        });
        agentList.push(agent);

        emit AgentCreated(agent, msg.sender, model, version, block.timestamp);
    }

    function deactivate(address agent) external {
        require(
            msg.sender == agents[agent].creator || msg.sender == owner,
            "AgentRegistry: not creator or owner"
        );
        require(agents[agent].active, "AgentRegistry: not active");
        agents[agent].active = false;
        emit AgentDeactivated(agent);
    }

    /// @notice C3: operator 합의 결과를 반영할 어댑터 주소 설정 (owner 전용)
    function setVerifier(address _verifier) external onlyOwner {
        emit VerifierUpdated(verifier, _verifier);
        verifier = _verifier;
    }

    /// @notice agent 검증 상태 설정. owner 또는 등록된 verifier(어댑터)만 호출 가능.
    function setVerified(address agent, bool status) external {
        require(msg.sender == owner || msg.sender == verifier, "AgentRegistry: not verifier");
        require(agents[agent].registeredAt != 0, "AgentRegistry: not found");
        verified[agent] = status;
        emit AgentVerificationUpdated(agent, status);
    }

    function getAgent(address agent) external view returns (AgentInfo memory) {
        require(agents[agent].registeredAt != 0, "AgentRegistry: not found");
        return agents[agent];
    }

    function isRegistered(address agent) external view returns (bool) {
        return agents[agent].registeredAt != 0;
    }

    function getAgentCount() external view returns (uint256) {
        return agentList.length;
    }

    function getAgentByIndex(uint256 index) external view returns (address) {
        require(index < agentList.length, "AgentRegistry: out of bounds");
        return agentList[index];
    }
}

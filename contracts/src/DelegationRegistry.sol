// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DelegationRegistry
 * @notice On-chain delegation registry for AI agents.
 *         Implements KR patent 10-2025-0074709 claims 6-7, 20
 *         ("Smart Contract 방식 위임장 등록·검증·철회").
 *
 *         User ──register(params)──▶ this contract ──▶ delegationId
 *         Agent ──isValid(id, scope, amount)──▶ pre-check
 *         ServiceProvider ──consume(id, amount)──▶ totalCap enforcement
 *         User ──revoke(id)──▶ permanent revocation
 */
contract DelegationRegistry {
    // Scope bitmask. Reserved for future expansion.
    uint32 public constant SCOPE_TRADE    = 1;
    uint32 public constant SCOPE_FOLLOW   = 2;
    uint32 public constant SCOPE_TRANSFER = 4;
    uint32 public constant SCOPE_WITHDRAW = 8;
    uint32 public constant SCOPE_MASK     = 15;

    struct Delegation {
        string  userDID;        // did:meta:testnet:0x...
        string  agentDID;
        uint256 userEIN;        // ERC-1484 EIN
        uint256 agentEIN;
        address user;           // wallet addr (for reverse lookup)
        address agent;
        uint32  scope;          // bitmask
        uint256 maxAmount;      // per-tx cap (0 = no per-tx limit)
        uint256 totalCap;       // cumulative cap (0 = unlimited)
        uint64  validFrom;
        uint64  validUntil;
        string  revocationURL;  // patent claim 20
        string  trackingURL;    // patent claim 20
        address issuer;         // msg.sender at registration (= user for self-issue)
        bool    revoked;
        bool    exists;
    }

    address public owner;
    address public server;

    mapping(bytes32 => Delegation) private _delegations;
    mapping(bytes32 => uint256)    public usedAmount;      // cumulative consumed
    mapping(address => bytes32[])  private _byAgent;
    mapping(address => bytes32[])  private _byUser;

    event DelegationRegistered(
        bytes32 indexed delegationId,
        address indexed user,
        address indexed agent,
        uint32 scope,
        uint256 maxAmount,
        uint256 totalCap,
        uint64 validFrom,
        uint64 validUntil
    );
    event DelegationRevoked(bytes32 indexed delegationId, address indexed by);
    event DelegationConsumed(
        bytes32 indexed delegationId,
        address indexed consumer,
        uint256 amount,
        uint256 totalUsed
    );
    event ServerUpdated(address indexed oldServer, address indexed newServer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Delegation: not owner");
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
     * @notice Register a new delegation. Caller = issuer (= user for self-issue).
     * @dev Agent address is derived from agentDID (parsed off-chain; here we accept it raw).
     */
    function register(
        address user,
        address agent,
        string calldata userDID,
        string calldata agentDID,
        uint256 userEIN,
        uint256 agentEIN,
        uint32  scope,
        uint256 maxAmount,
        uint256 totalCap,
        uint64  validFrom,
        uint64  validUntil,
        string calldata revocationURL,
        string calldata trackingURL,
        uint256 nonce
    ) external returns (bytes32 delegationId) {
        require(user != address(0), "Delegation: zero user");
        require(agent != address(0), "Delegation: zero agent");
        require(bytes(userDID).length > 0, "Delegation: empty userDID");
        require(bytes(agentDID).length > 0, "Delegation: empty agentDID");
        require(scope != 0 && (scope & ~SCOPE_MASK) == 0, "Delegation: bad scope");
        require(validUntil > block.timestamp, "Delegation: expired");
        require(validFrom < validUntil, "Delegation: bad window");

        delegationId = keccak256(
            abi.encode(user, agent, nonce, block.chainid, address(this))
        );
        require(!_delegations[delegationId].exists, "Delegation: duplicate");

        _delegations[delegationId] = Delegation({
            userDID: userDID,
            agentDID: agentDID,
            userEIN: userEIN,
            agentEIN: agentEIN,
            user: user,
            agent: agent,
            scope: scope,
            maxAmount: maxAmount,
            totalCap: totalCap,
            validFrom: validFrom,
            validUntil: validUntil,
            revocationURL: revocationURL,
            trackingURL: trackingURL,
            issuer: msg.sender,
            revoked: false,
            exists: true
        });

        _byAgent[agent].push(delegationId);
        _byUser[user].push(delegationId);

        emit DelegationRegistered(
            delegationId, user, agent, scope, maxAmount, totalCap, validFrom, validUntil
        );
    }

    /**
     * @notice Revoke a delegation. Only the original issuer or the user may call.
     */
    function revoke(bytes32 delegationId) external {
        Delegation storage d = _delegations[delegationId];
        require(d.exists, "Delegation: not found");
        require(!d.revoked, "Delegation: already revoked");
        require(
            msg.sender == d.issuer || msg.sender == d.user,
            "Delegation: not issuer or user"
        );
        d.revoked = true;
        emit DelegationRevoked(delegationId, msg.sender);
    }

    /**
     * @notice Check if a delegation is usable for the given action.
     * @return valid  true if all checks pass
     * @return reason empty if valid, else human-readable reason
     */
    function isValid(
        bytes32 delegationId,
        uint32  requiredScope,
        uint256 requestedAmount
    ) external view returns (bool valid, string memory reason) {
        Delegation storage d = _delegations[delegationId];
        if (!d.exists)                           return (false, "not found");
        if (d.revoked)                           return (false, "revoked");
        if (block.timestamp < d.validFrom)       return (false, "not yet valid");
        if (block.timestamp >= d.validUntil)     return (false, "expired");
        if ((d.scope & requiredScope) != requiredScope) return (false, "scope mismatch");
        if (d.maxAmount != 0 && requestedAmount > d.maxAmount) return (false, "amount exceeds per-tx cap");
        if (d.totalCap != 0) {
            uint256 newTotal = usedAmount[delegationId] + requestedAmount;
            if (newTotal > d.totalCap) return (false, "amount exceeds total cap");
        }
        return (true, "");
    }

    /**
     * @notice Record consumed amount. Enforces per-tx and cumulative caps.
     * @dev Callable by the registered agent or the server. Typical flow: server-side
     *      service provider calls this after executing the delegated action.
     */
    function consume(bytes32 delegationId, uint256 amount) external {
        Delegation storage d = _delegations[delegationId];
        require(d.exists, "Delegation: not found");
        require(!d.revoked, "Delegation: revoked");
        require(block.timestamp >= d.validFrom, "Delegation: not yet valid");
        require(block.timestamp < d.validUntil, "Delegation: expired");
        require(
            msg.sender == d.agent || msg.sender == server,
            "Delegation: not agent or server"
        );
        require(amount > 0, "Delegation: zero amount");
        if (d.maxAmount != 0) {
            require(amount <= d.maxAmount, "Delegation: exceeds per-tx cap");
        }

        uint256 newTotal = usedAmount[delegationId] + amount;
        if (d.totalCap != 0) {
            require(newTotal <= d.totalCap, "Delegation: exceeds total cap");
        }
        usedAmount[delegationId] = newTotal;

        emit DelegationConsumed(delegationId, msg.sender, amount, newTotal);
    }

    function getDelegation(bytes32 delegationId) external view returns (Delegation memory) {
        Delegation storage d = _delegations[delegationId];
        require(d.exists, "Delegation: not found");
        return d;
    }

    function exists(bytes32 delegationId) external view returns (bool) {
        return _delegations[delegationId].exists;
    }

    function getByAgent(address agent) external view returns (bytes32[] memory) {
        return _byAgent[agent];
    }

    function getByUser(address user) external view returns (bytes32[] memory) {
        return _byUser[user];
    }

    function getAgentDelegationCount(address agent) external view returns (uint256) {
        return _byAgent[agent].length;
    }

    function getUserDelegationCount(address user) external view returns (uint256) {
        return _byUser[user].length;
    }
}

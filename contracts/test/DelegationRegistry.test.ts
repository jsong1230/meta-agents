import { expect } from "chai";
import { ethers } from "hardhat";
import { DelegationRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

const SCOPE_TRADE    = 1;
const SCOPE_FOLLOW   = 2;
const SCOPE_TRANSFER = 4;
const SCOPE_WITHDRAW = 8;

describe("DelegationRegistry", function () {
  let reg: DelegationRegistry;
  let owner: SignerWithAddress;
  let server: SignerWithAddress;
  let user: SignerWithAddress;
  let agent: SignerWithAddress;
  let stranger: SignerWithAddress;

  const userDID  = "did:meta:testnet:0x0000000000000000000000000000000000000001";
  const agentDID = "did:meta:testnet:0x0000000000000000000000000000000000000002";
  const USER_EIN = 1n;
  const AGENT_EIN = 2n;

  const ONE_DAY = 24n * 60n * 60n;

  async function now(): Promise<bigint> {
    const b = await ethers.provider.getBlock("latest");
    return BigInt(b!.timestamp);
  }

  async function register(
    signer: SignerWithAddress,
    overrides: Partial<{
      scope: number;
      maxAmount: bigint;
      totalCap: bigint;
      validFrom: bigint;
      validUntil: bigint;
      nonce: bigint;
      user: string;
      agent: string;
    }> = {}
  ): Promise<string> {
    const t = await now();
    const tx = await reg.connect(signer).register(
      overrides.user ?? user.address,
      overrides.agent ?? agent.address,
      userDID,
      agentDID,
      USER_EIN,
      AGENT_EIN,
      overrides.scope ?? SCOPE_TRADE,
      overrides.maxAmount ?? ethers.parseEther("10"),
      overrides.totalCap ?? ethers.parseEther("100"),
      overrides.validFrom ?? t,
      overrides.validUntil ?? t + ONE_DAY,
      "https://meta-agents.example/revoke/",
      "https://meta-agents.example/track/",
      overrides.nonce ?? 1n
    );
    const receipt = await tx.wait();
    const event = receipt!.logs
      .map((l) => {
        try { return reg.interface.parseLog(l as any); } catch { return null; }
      })
      .find((e) => e?.name === "DelegationRegistered");
    return event!.args.delegationId as string;
  }

  beforeEach(async function () {
    [owner, server, user, agent, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("DelegationRegistry");
    reg = await Factory.deploy(server.address);
  });

  describe("Deployment", function () {
    it("sets owner and server", async function () {
      expect(await reg.owner()).to.equal(owner.address);
      expect(await reg.server()).to.equal(server.address);
    });

    it("exposes scope constants", async function () {
      expect(await reg.SCOPE_TRADE()).to.equal(SCOPE_TRADE);
      expect(await reg.SCOPE_FOLLOW()).to.equal(SCOPE_FOLLOW);
      expect(await reg.SCOPE_TRANSFER()).to.equal(SCOPE_TRANSFER);
      expect(await reg.SCOPE_WITHDRAW()).to.equal(SCOPE_WITHDRAW);
    });
  });

  describe("register", function () {
    it("emits event and returns deterministic id", async function () {
      const t = await now();
      const tx = await reg.connect(user).register(
        user.address, agent.address, userDID, agentDID,
        USER_EIN, AGENT_EIN, SCOPE_TRADE,
        ethers.parseEther("10"), ethers.parseEther("100"),
        t, t + ONE_DAY, "", "", 42n
      );
      await expect(tx).to.emit(reg, "DelegationRegistered");

      const receipt = await tx.wait();
      const event = receipt!.logs
        .map((l) => { try { return reg.interface.parseLog(l as any); } catch { return null; } })
        .find((e) => e?.name === "DelegationRegistered");
      const id = event!.args.delegationId;

      const d = await reg.getDelegation(id);
      expect(d.userDID).to.equal(userDID);
      expect(d.agentDID).to.equal(agentDID);
      expect(d.user).to.equal(user.address);
      expect(d.agent).to.equal(agent.address);
      expect(d.scope).to.equal(SCOPE_TRADE);
      expect(d.issuer).to.equal(user.address);
      expect(d.revoked).to.equal(false);
    });

    it("rejects duplicate (same user/agent/nonce)", async function () {
      await register(user, { nonce: 99n });
      await expect(register(user, { nonce: 99n })).to.be.revertedWith("Delegation: duplicate");
    });

    it("rejects zero user/agent", async function () {
      await expect(register(user, { user: ethers.ZeroAddress })).to.be.revertedWith("Delegation: zero user");
      await expect(register(user, { agent: ethers.ZeroAddress })).to.be.revertedWith("Delegation: zero agent");
    });

    it("rejects empty DIDs", async function () {
      const t = await now();
      await expect(
        reg.connect(user).register(
          user.address, agent.address, "", agentDID,
          USER_EIN, AGENT_EIN, SCOPE_TRADE, 0n, 0n,
          t, t + ONE_DAY, "", "", 1n
        )
      ).to.be.revertedWith("Delegation: empty userDID");
      await expect(
        reg.connect(user).register(
          user.address, agent.address, userDID, "",
          USER_EIN, AGENT_EIN, SCOPE_TRADE, 0n, 0n,
          t, t + ONE_DAY, "", "", 2n
        )
      ).to.be.revertedWith("Delegation: empty agentDID");
    });

    it("rejects scope=0 and out-of-mask scope", async function () {
      await expect(register(user, { scope: 0, nonce: 10n })).to.be.revertedWith("Delegation: bad scope");
      await expect(register(user, { scope: 1 << 16, nonce: 11n })).to.be.revertedWith("Delegation: bad scope");
    });

    it("accepts combined scope bitmasks", async function () {
      const combined = SCOPE_TRADE | SCOPE_FOLLOW;
      const id = await register(user, { scope: combined, nonce: 5n });
      const d = await reg.getDelegation(id);
      expect(d.scope).to.equal(combined);
    });

    it("rejects expired validUntil at registration", async function () {
      const t = await now();
      await expect(
        reg.connect(user).register(
          user.address, agent.address, userDID, agentDID,
          USER_EIN, AGENT_EIN, SCOPE_TRADE, 0n, 0n,
          t - 10n, t - 5n, "", "", 100n
        )
      ).to.be.revertedWith("Delegation: expired");
    });

    it("rejects bad window (validFrom >= validUntil)", async function () {
      const t = await now();
      await expect(
        reg.connect(user).register(
          user.address, agent.address, userDID, agentDID,
          USER_EIN, AGENT_EIN, SCOPE_TRADE, 0n, 0n,
          t + ONE_DAY, t + ONE_DAY, "", "", 101n
        )
      ).to.be.revertedWith("Delegation: bad window");
    });

    it("records by-agent and by-user indexes", async function () {
      const id = await register(user, { nonce: 1n });
      expect(await reg.getByAgent(agent.address)).to.deep.equal([id]);
      expect(await reg.getByUser(user.address)).to.deep.equal([id]);
      expect(await reg.getAgentDelegationCount(agent.address)).to.equal(1);
      expect(await reg.getUserDelegationCount(user.address)).to.equal(1);
    });
  });

  describe("isValid", function () {
    let id: string;
    beforeEach(async function () {
      id = await register(user);
    });

    it("returns (true, '') for valid request", async function () {
      const [valid, reason] = await reg.isValid(id, SCOPE_TRADE, ethers.parseEther("5"));
      expect(valid).to.be.true;
      expect(reason).to.equal("");
    });

    it("rejects unknown id", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("nope"));
      const [valid, reason] = await reg.isValid(fakeId, SCOPE_TRADE, 1n);
      expect(valid).to.be.false;
      expect(reason).to.equal("not found");
    });

    it("rejects after revoke", async function () {
      await reg.connect(user).revoke(id);
      const [valid, reason] = await reg.isValid(id, SCOPE_TRADE, 1n);
      expect(valid).to.be.false;
      expect(reason).to.equal("revoked");
    });

    it("rejects on scope mismatch", async function () {
      const [valid, reason] = await reg.isValid(id, SCOPE_WITHDRAW, 1n);
      expect(valid).to.be.false;
      expect(reason).to.equal("scope mismatch");
    });

    it("rejects when per-tx cap exceeded", async function () {
      const [valid, reason] = await reg.isValid(id, SCOPE_TRADE, ethers.parseEther("11"));
      expect(valid).to.be.false;
      expect(reason).to.equal("amount exceeds per-tx cap");
    });

    it("rejects when total cap exceeded", async function () {
      // consume 95 first via agent
      await reg.connect(agent).consume(id, ethers.parseEther("9"));
      await reg.connect(agent).consume(id, ethers.parseEther("9"));
      // cumulative 18, cap 100, per-tx 10. Ask for 10 → would push to 28 ok.
      // Instead directly test over-cap
      const [valid, reason] = await reg.isValid(id, SCOPE_TRADE, ethers.parseEther("90"));
      expect(valid).to.be.false;
      expect(reason).to.equal("amount exceeds per-tx cap"); // hits per-tx cap first

      // Use a different delegation with no per-tx cap but totalCap
      const id2 = await register(user, {
        maxAmount: 0n,
        totalCap: ethers.parseEther("10"),
        nonce: 777n,
      });
      await reg.connect(agent).consume(id2, ethers.parseEther("6"));
      const [v2, r2] = await reg.isValid(id2, SCOPE_TRADE, ethers.parseEther("5"));
      expect(v2).to.be.false;
      expect(r2).to.equal("amount exceeds total cap");
    });

    it("rejects when expired", async function () {
      await ethers.provider.send("evm_increaseTime", [Number(ONE_DAY) + 10]);
      await ethers.provider.send("evm_mine", []);
      const [valid, reason] = await reg.isValid(id, SCOPE_TRADE, 1n);
      expect(valid).to.be.false;
      expect(reason).to.equal("expired");
    });

    it("rejects before validFrom", async function () {
      const t = await now();
      const future = await register(user, {
        validFrom: t + ONE_DAY,
        validUntil: t + 2n * ONE_DAY,
        nonce: 55n,
      });
      const [valid, reason] = await reg.isValid(future, SCOPE_TRADE, 1n);
      expect(valid).to.be.false;
      expect(reason).to.equal("not yet valid");
    });
  });

  describe("revoke", function () {
    let id: string;
    beforeEach(async function () { id = await register(user); });

    it("issuer (= user self-issue) can revoke", async function () {
      await expect(reg.connect(user).revoke(id))
        .to.emit(reg, "DelegationRevoked").withArgs(id, user.address);
      const d = await reg.getDelegation(id);
      expect(d.revoked).to.be.true;
    });

    it("user can revoke even if issuer is different server", async function () {
      // Server-issued delegation: server registers on behalf
      const sid = await register(server, { nonce: 200n });
      await expect(reg.connect(user).revoke(sid))
        .to.emit(reg, "DelegationRevoked");
    });

    it("stranger cannot revoke", async function () {
      await expect(reg.connect(stranger).revoke(id))
        .to.be.revertedWith("Delegation: not issuer or user");
    });

    it("double revoke reverts", async function () {
      await reg.connect(user).revoke(id);
      await expect(reg.connect(user).revoke(id)).to.be.revertedWith("Delegation: already revoked");
    });

    it("revoke of unknown id reverts", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("nope"));
      await expect(reg.connect(user).revoke(fakeId)).to.be.revertedWith("Delegation: not found");
    });
  });

  describe("consume", function () {
    let id: string;
    beforeEach(async function () { id = await register(user); });

    it("agent can consume, tracks usedAmount", async function () {
      await expect(reg.connect(agent).consume(id, ethers.parseEther("3")))
        .to.emit(reg, "DelegationConsumed")
        .withArgs(id, agent.address, ethers.parseEther("3"), ethers.parseEther("3"));
      expect(await reg.usedAmount(id)).to.equal(ethers.parseEther("3"));

      await reg.connect(agent).consume(id, ethers.parseEther("7"));
      expect(await reg.usedAmount(id)).to.equal(ethers.parseEther("10"));
    });

    it("server can consume", async function () {
      await reg.connect(server).consume(id, ethers.parseEther("2"));
      expect(await reg.usedAmount(id)).to.equal(ethers.parseEther("2"));
    });

    it("stranger cannot consume", async function () {
      await expect(
        reg.connect(stranger).consume(id, ethers.parseEther("1"))
      ).to.be.revertedWith("Delegation: not agent or server");
    });

    it("per-tx cap enforced", async function () {
      await expect(
        reg.connect(agent).consume(id, ethers.parseEther("11"))
      ).to.be.revertedWith("Delegation: exceeds per-tx cap");
    });

    it("total cap enforced", async function () {
      // per-tx 10, total 100 → 10 * 10 ok, 11th reverts
      for (let i = 0; i < 10; i++) {
        await reg.connect(agent).consume(id, ethers.parseEther("10"));
      }
      await expect(
        reg.connect(agent).consume(id, ethers.parseEther("1"))
      ).to.be.revertedWith("Delegation: exceeds total cap");
    });

    it("rejects consume after revoke", async function () {
      await reg.connect(user).revoke(id);
      await expect(
        reg.connect(agent).consume(id, 1n)
      ).to.be.revertedWith("Delegation: revoked");
    });

    it("rejects zero amount", async function () {
      await expect(reg.connect(agent).consume(id, 0n)).to.be.revertedWith("Delegation: zero amount");
    });

    it("rejects after expiry", async function () {
      await ethers.provider.send("evm_increaseTime", [Number(ONE_DAY) + 10]);
      await ethers.provider.send("evm_mine", []);
      await expect(
        reg.connect(agent).consume(id, 1n)
      ).to.be.revertedWith("Delegation: expired");
    });
  });

  describe("integration", function () {
    it("2 agents for same user via different delegations consume independently", async function () {
      const [_o, _s, userA, agentA, agentB] = await ethers.getSigners();
      const id1 = await register(userA, { user: userA.address, agent: agentA.address, nonce: 1n });
      const id2 = await register(userA, { user: userA.address, agent: agentB.address, nonce: 2n });
      await reg.connect(agentA).consume(id1, ethers.parseEther("5"));
      await reg.connect(agentB).consume(id2, ethers.parseEther("7"));
      expect(await reg.usedAmount(id1)).to.equal(ethers.parseEther("5"));
      expect(await reg.usedAmount(id2)).to.equal(ethers.parseEther("7"));
    });

    it("full lifecycle: register → consume → revoke → consume reverts", async function () {
      const id = await register(user, { nonce: 42n });
      await reg.connect(agent).consume(id, ethers.parseEther("2"));
      await reg.connect(user).revoke(id);
      await expect(reg.connect(agent).consume(id, ethers.parseEther("1")))
        .to.be.revertedWith("Delegation: revoked");
    });

    it("unlimited totalCap (cap=0) allows many consumes", async function () {
      const id = await register(user, {
        maxAmount: ethers.parseEther("1000"),
        totalCap: 0n,
        nonce: 999n,
      });
      for (let i = 0; i < 5; i++) {
        await reg.connect(agent).consume(id, ethers.parseEther("500"));
      }
      expect(await reg.usedAmount(id)).to.equal(ethers.parseEther("2500"));
    });
  });
});

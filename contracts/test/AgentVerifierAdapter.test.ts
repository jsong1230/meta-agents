import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentRegistry, AgentVerifierAdapter, MockOperatorRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

const SERVICE_ID = 2n; // Agent Verifier

describe("C3 Adapter — AgentVerifierAdapter", function () {
  let agentRegistry: AgentRegistry;
  let opRegistry: MockOperatorRegistry;
  let adapter: AgentVerifierAdapter;

  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let agent1: SignerWithAddress;
  let op0: SignerWithAddress;
  let op1: SignerWithAddress;
  let op2: SignerWithAddress;
  let stranger: SignerWithAddress;

  beforeEach(async function () {
    [owner, creator, agent1, op0, op1, op2, stranger] = await ethers.getSigners();

    agentRegistry = await (await ethers.getContractFactory("AgentRegistry")).deploy();
    opRegistry = await (await ethers.getContractFactory("MockOperatorRegistry")).deploy();
    adapter = await (
      await ethers.getContractFactory("AgentVerifierAdapter")
    ).deploy(await agentRegistry.getAddress(), await opRegistry.getAddress(), SERVICE_ID);

    // 어댑터를 verifier로 등록 + 검증 대상 agent 등록
    await agentRegistry.connect(owner).setVerifier(await adapter.getAddress());
    await agentRegistry.connect(creator).register(agent1.address, "Claude", "1.0");
  });

  async function activate(n: number) {
    const ops = [op0, op1, op2].slice(0, n);
    for (const op of ops) await opRegistry.setOperator(SERVICE_ID, op.address, true);
  }

  describe("AgentRegistry v2: verifier 권한", function () {
    it("owner가 setVerifier 호출 → 저장 + 이벤트", async function () {
      await expect(agentRegistry.connect(owner).setVerifier(stranger.address))
        .to.emit(agentRegistry, "VerifierUpdated")
        .withArgs(await adapter.getAddress(), stranger.address);
      expect(await agentRegistry.verifier()).to.equal(stranger.address);
    });

    it("non-owner의 setVerifier는 revert", async function () {
      await expect(
        agentRegistry.connect(stranger).setVerifier(stranger.address)
      ).to.be.revertedWith("AgentRegistry: not owner");
    });

    it("owner는 setVerified 직접 호출 가능", async function () {
      await expect(agentRegistry.connect(owner).setVerified(agent1.address, true))
        .to.emit(agentRegistry, "AgentVerificationUpdated")
        .withArgs(agent1.address, true);
      expect(await agentRegistry.verified(agent1.address)).to.be.true;
    });

    it("어댑터/owner 외 주소의 setVerified는 revert", async function () {
      await expect(
        agentRegistry.connect(stranger).setVerified(agent1.address, true)
      ).to.be.revertedWith("AgentRegistry: not verifier");
    });

    it("미등록 agent setVerified는 revert", async function () {
      await expect(
        agentRegistry.connect(owner).setVerified(stranger.address, true)
      ).to.be.revertedWith("AgentRegistry: not found");
    });
  });

  describe("voteVerify — operator majority", function () {
    it("non-operator 투표는 NotActiveOperator", async function () {
      await expect(
        adapter.connect(stranger).voteVerify(agent1.address, true)
      ).to.be.revertedWithCustomError(adapter, "NotActiveOperator").withArgs(stranger.address);
    });

    it("미등록 agent 투표는 AgentNotRegistered", async function () {
      await activate(1);
      await expect(
        adapter.connect(op0).voteVerify(stranger.address, true)
      ).to.be.revertedWithCustomError(adapter, "AgentNotRegistered").withArgs(stranger.address);
    });

    it("operator 1명(과반=1) → 즉시 검증 반영", async function () {
      await activate(1);
      await expect(adapter.connect(op0).voteVerify(agent1.address, true))
        .to.emit(adapter, "VerificationExecuted").withArgs(agent1.address, true)
        .to.emit(agentRegistry, "AgentVerificationUpdated").withArgs(agent1.address, true);
      expect(await agentRegistry.verified(agent1.address)).to.be.true;
    });

    it("operator 3명: 2표 모여야 실행", async function () {
      await activate(3);
      await adapter.connect(op0).voteVerify(agent1.address, true);
      expect(await agentRegistry.verified(agent1.address)).to.be.false; // 1표 미실행

      await expect(adapter.connect(op1).voteVerify(agent1.address, true))
        .to.emit(adapter, "VerificationExecuted").withArgs(agent1.address, true);
      expect(await agentRegistry.verified(agent1.address)).to.be.true;
    });

    it("과반 reject → setVerified(false) 실행", async function () {
      await activate(1);
      await expect(adapter.connect(op0).voteVerify(agent1.address, false))
        .to.emit(adapter, "VerificationExecuted").withArgs(agent1.address, false);
      const t = await adapter.tally(agent1.address);
      expect(t.executed).to.be.true;
      expect(await agentRegistry.verified(agent1.address)).to.be.false;
    });

    it("동일 operator 중복 투표는 AlreadyVoted", async function () {
      await activate(3);
      await adapter.connect(op0).voteVerify(agent1.address, true);
      await expect(
        adapter.connect(op0).voteVerify(agent1.address, true)
      ).to.be.revertedWithCustomError(adapter, "AlreadyVoted");
    });

    it("실행 후 추가 투표는 AlreadyExecuted", async function () {
      await activate(3);
      await adapter.connect(op0).voteVerify(agent1.address, true);
      await adapter.connect(op1).voteVerify(agent1.address, true); // 실행됨
      await expect(
        adapter.connect(op2).voteVerify(agent1.address, true)
      ).to.be.revertedWithCustomError(adapter, "AlreadyExecuted");
    });

    it("operatorCount view", async function () {
      await activate(3);
      expect(await adapter.operatorCount()).to.equal(3);
      await opRegistry.setOperator(SERVICE_ID, op0.address, false);
      expect(await adapter.operatorCount()).to.equal(2);
    });
  });
});

import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AgentRegistry", function () {
  let registry: AgentRegistry;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let agent1: SignerWithAddress;
  let agent2: SignerWithAddress;
  let stranger: SignerWithAddress;

  beforeEach(async function () {
    [owner, creator, agent1, agent2, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AgentRegistry");
    registry = await Factory.deploy();
  });

  describe("Registration", function () {
    it("registers an agent with metadata", async function () {
      const tx = await registry.connect(creator).register(agent1.address, "GPT-4", "1.0");
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(registry, "AgentCreated")
        .withArgs(agent1.address, creator.address, "GPT-4", "1.0", block!.timestamp);

      const info = await registry.getAgent(agent1.address);
      expect(info.creator).to.equal(creator.address);
      expect(info.model).to.equal("GPT-4");
      expect(info.version).to.equal("1.0");
      expect(info.active).to.be.true;
    });

    it("rejects duplicate registration", async function () {
      await registry.connect(creator).register(agent1.address, "GPT-4", "1.0");
      await expect(
        registry.connect(creator).register(agent1.address, "Claude", "2.0")
      ).to.be.revertedWith("AgentRegistry: already registered");
    });

    it("rejects empty model", async function () {
      await expect(
        registry.connect(creator).register(agent1.address, "", "1.0")
      ).to.be.revertedWith("AgentRegistry: empty model");
    });

    it("rejects model name too long (>64 chars)", async function () {
      const longModel = "x".repeat(65);
      await expect(
        registry.connect(creator).register(agent1.address, longModel, "1.0")
      ).to.be.revertedWith("AgentRegistry: model too long");
    });

    it("allows anyone to register an agent (permissionless)", async function () {
      await registry.connect(stranger).register(agent1.address, "Claude", "3.5");
      const info = await registry.getAgent(agent1.address);
      expect(info.creator).to.equal(stranger.address);
    });

    it("tracks agent count", async function () {
      expect(await registry.getAgentCount()).to.equal(0);
      await registry.connect(creator).register(agent1.address, "GPT-4", "1.0");
      expect(await registry.getAgentCount()).to.equal(1);
      await registry.connect(creator).register(agent2.address, "Claude", "3.5");
      expect(await registry.getAgentCount()).to.equal(2);
    });
  });

  describe("Queries", function () {
    beforeEach(async function () {
      await registry.connect(creator).register(agent1.address, "GPT-4", "1.0");
    });

    it("isRegistered returns true for registered agent", async function () {
      expect(await registry.isRegistered(agent1.address)).to.be.true;
    });

    it("isRegistered returns false for unknown agent", async function () {
      expect(await registry.isRegistered(stranger.address)).to.be.false;
    });

    it("getAgent reverts for unknown agent", async function () {
      await expect(registry.getAgent(stranger.address)).to.be.revertedWith(
        "AgentRegistry: not found"
      );
    });

    it("getAgentByIndex returns correct address", async function () {
      expect(await registry.getAgentByIndex(0)).to.equal(agent1.address);
    });

    it("getAgentByIndex reverts for out-of-bounds", async function () {
      await expect(registry.getAgentByIndex(99)).to.be.revertedWith(
        "AgentRegistry: out of bounds"
      );
    });
  });

  describe("Deactivation", function () {
    beforeEach(async function () {
      await registry.connect(creator).register(agent1.address, "GPT-4", "1.0");
    });

    it("creator can deactivate their agent", async function () {
      await expect(registry.connect(creator).deactivate(agent1.address))
        .to.emit(registry, "AgentDeactivated")
        .withArgs(agent1.address);

      const info = await registry.getAgent(agent1.address);
      expect(info.active).to.be.false;
    });

    it("owner can deactivate any agent", async function () {
      await registry.connect(owner).deactivate(agent1.address);
      const info = await registry.getAgent(agent1.address);
      expect(info.active).to.be.false;
    });

    it("stranger cannot deactivate", async function () {
      await expect(
        registry.connect(stranger).deactivate(agent1.address)
      ).to.be.revertedWith("AgentRegistry: not creator or owner");
    });

    it("cannot deactivate twice", async function () {
      await registry.connect(creator).deactivate(agent1.address);
      await expect(
        registry.connect(creator).deactivate(agent1.address)
      ).to.be.revertedWith("AgentRegistry: not active");
    });
  });

  async function getTimestamp(): Promise<number> {
    const block = await ethers.provider.getBlock("latest");
    return block!.timestamp;
  }
});

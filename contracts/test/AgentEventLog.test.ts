import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentEventLog } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AgentEventLog", function () {
  let log: AgentEventLog;
  let owner: SignerWithAddress;
  let server: SignerWithAddress;
  let agent1: SignerWithAddress;
  let agent2: SignerWithAddress;
  let stranger: SignerWithAddress;

  const agentDID1 = "did:meta:testnet:agent1";
  const agentDID2 = "did:meta:testnet:agent2";
  const spDID = "did:meta:testnet:serviceProvider";
  const TRADE_EXECUTE = ethers.keccak256(ethers.toUtf8Bytes("TRADE_EXECUTE"));
  const FOLLOW_REQUEST = ethers.keccak256(ethers.toUtf8Bytes("FOLLOW_REQUEST"));
  const DELEGATION_ID = ethers.keccak256(ethers.toUtf8Bytes("d1"));
  const DELEGATION_ID_2 = ethers.keccak256(ethers.toUtf8Bytes("d2"));
  const ZERO32 = ethers.ZeroHash;

  beforeEach(async function () {
    [owner, server, agent1, agent2, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AgentEventLog");
    log = await Factory.deploy(server.address);
  });

  describe("Deployment", function () {
    it("sets owner and server", async function () {
      expect(await log.owner()).to.equal(owner.address);
      expect(await log.server()).to.equal(server.address);
    });
  });

  describe("log", function () {
    it("appends an event with delegationId and emits", async function () {
      const payloadHash = ethers.keccak256(ethers.toUtf8Bytes("BTC/USD BUY 5"));
      await expect(
        log.connect(agent1).log(DELEGATION_ID, agentDID1, TRADE_EXECUTE, payloadHash, spDID)
      )
        .to.emit(log, "ActionLogged");

      expect(await log.getEventCount()).to.equal(1);
      const e = await log.getEventAt(0);
      expect(e.delegationId).to.equal(DELEGATION_ID);
      expect(e.agent).to.equal(agent1.address);
      expect(e.agentDID).to.equal(agentDID1);
      expect(e.actionType).to.equal(TRADE_EXECUTE);
      expect(e.actionHash).to.equal(payloadHash);
      expect(e.serviceProviderDID).to.equal(spDID);
      expect(e.timestamp).to.be.gt(0n);
    });

    it("supports self-trade (delegationId=0)", async function () {
      await log.connect(agent1).log(ZERO32, agentDID1, TRADE_EXECUTE, ZERO32, spDID);
      const e = await log.getEventAt(0);
      expect(e.delegationId).to.equal(ZERO32);
      expect(await log.getDelegationEventCount(ZERO32)).to.equal(0); // not indexed
      expect(await log.getAgentEventCount(agent1.address)).to.equal(1);
    });

    it("server can log too", async function () {
      await log.connect(server).log(DELEGATION_ID, agentDID1, TRADE_EXECUTE, ZERO32, spDID);
      expect(await log.getEventCount()).to.equal(1);
    });

    it("rejects zero actionType", async function () {
      await expect(
        log.connect(agent1).log(DELEGATION_ID, agentDID1, ZERO32, ZERO32, spDID)
      ).to.be.revertedWith("EventLog: zero actionType");
    });
  });

  describe("queryByDelegation", function () {
    beforeEach(async function () {
      await log.connect(agent1).log(DELEGATION_ID, agentDID1, TRADE_EXECUTE, ZERO32, spDID);
      await log.connect(agent1).log(DELEGATION_ID, agentDID1, FOLLOW_REQUEST, ZERO32, spDID);
      await log.connect(agent2).log(DELEGATION_ID_2, agentDID2, TRADE_EXECUTE, ZERO32, spDID);
      await log.connect(agent1).log(ZERO32, agentDID1, TRADE_EXECUTE, ZERO32, spDID);
    });

    it("returns only events tied to the queried delegation", async function () {
      const events = await log.queryByDelegation(DELEGATION_ID);
      expect(events.length).to.equal(2);
      expect(events[0].actionType).to.equal(TRADE_EXECUTE);
      expect(events[1].actionType).to.equal(FOLLOW_REQUEST);
    });

    it("returns empty for unknown delegation", async function () {
      const none = ethers.keccak256(ethers.toUtf8Bytes("none"));
      const events = await log.queryByDelegation(none);
      expect(events.length).to.equal(0);
    });

    it("skips self-trade (delegationId=0) from indexes", async function () {
      const events = await log.queryByDelegation(ZERO32);
      expect(events.length).to.equal(0);
    });
  });

  describe("queryByAgent", function () {
    beforeEach(async function () {
      // 3 events for agent1 in quick succession
      await log.connect(agent1).log(DELEGATION_ID, agentDID1, TRADE_EXECUTE, ZERO32, spDID);
      await log.connect(agent1).log(DELEGATION_ID, agentDID1, TRADE_EXECUTE, ZERO32, spDID);
      await log.connect(agent2).log(DELEGATION_ID_2, agentDID2, TRADE_EXECUTE, ZERO32, spDID);
      await log.connect(agent1).log(ZERO32, agentDID1, TRADE_EXECUTE, ZERO32, spDID);
    });

    it("returns all events for the agent when range is wide", async function () {
      const events = await log.queryByAgent(agent1.address, 0, 2n ** 63n - 1n);
      expect(events.length).to.equal(3);
      expect(await log.getAgentEventCount(agent1.address)).to.equal(3);
    });

    it("filters by time window", async function () {
      const mid = (await log.getEventAt(1)).timestamp;
      const events = await log.queryByAgent(agent1.address, mid, 2n ** 63n - 1n);
      // events at indexes 1 and 3 (both agent1, timestamp >= mid)
      expect(events.length).to.be.gte(2);
    });

    it("returns empty for agent with no events", async function () {
      const events = await log.queryByAgent(stranger.address, 0, 2n ** 63n - 1n);
      expect(events.length).to.equal(0);
    });
  });

  describe("Server Management", function () {
    it("owner can update server", async function () {
      await expect(log.connect(owner).setServer(stranger.address))
        .to.emit(log, "ServerUpdated")
        .withArgs(server.address, stranger.address);
      expect(await log.server()).to.equal(stranger.address);
    });

    it("non-owner cannot update server", async function () {
      await expect(log.connect(stranger).setServer(stranger.address))
        .to.be.revertedWith("EventLog: not owner");
    });
  });

  describe("getEvent bounds", function () {
    it("reverts on out-of-bounds", async function () {
      await expect(log.getEventAt(0)).to.be.revertedWith("EventLog: out of bounds");
    });
  });
});

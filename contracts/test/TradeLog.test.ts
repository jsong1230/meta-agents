import { expect } from "chai";
import { ethers } from "hardhat";
import { TradeLog } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TradeLog", function () {
  let tradeLog: TradeLog;
  let owner: SignerWithAddress;
  let server: SignerWithAddress;
  let agent1: SignerWithAddress;
  let agent2: SignerWithAddress;
  let stranger: SignerWithAddress;

  const BTC_USDT = ethers.encodeBytes32String("BTC/USDT").slice(0, 18) as `0x${string}`; // bytes8
  const ETH_USDT = ethers.encodeBytes32String("ETH/USDT").slice(0, 18) as `0x${string}`;
  const PRICE_60K = ethers.parseEther("60000"); // 18 decimals
  const PRICE_3K = ethers.parseEther("3000");

  beforeEach(async function () {
    [owner, server, agent1, agent2, stranger] = await ethers.getSigners();
    const TradeLogFactory = await ethers.getContractFactory("TradeLog");
    tradeLog = await TradeLogFactory.deploy(server.address);
  });

  describe("Deployment", function () {
    it("sets owner and server correctly", async function () {
      expect(await tradeLog.owner()).to.equal(owner.address);
      expect(await tradeLog.server()).to.equal(server.address);
    });
  });

  describe("Agent Registration", function () {
    it("server can register an agent", async function () {
      await expect(tradeLog.connect(server).registerAgent(agent1.address))
        .to.emit(tradeLog, "AgentRegistered")
        .withArgs(agent1.address);
      expect(await tradeLog.registeredAgents(agent1.address)).to.be.true;
    });

    it("rejects duplicate registration", async function () {
      await tradeLog.connect(server).registerAgent(agent1.address);
      await expect(
        tradeLog.connect(server).registerAgent(agent1.address)
      ).to.be.revertedWith("TradeLog: already registered");
    });

    it("non-server cannot register", async function () {
      await expect(
        tradeLog.connect(stranger).registerAgent(agent1.address)
      ).to.be.revertedWith("TradeLog: not server");
    });
  });

  describe("Trade Recording", function () {
    beforeEach(async function () {
      await tradeLog.connect(server).registerAgent(agent1.address);
      await tradeLog.connect(server).registerAgent(agent2.address);
    });

    it("records a buy trade", async function () {
      const amount = ethers.parseEther("0.5"); // buy 0.5 BTC
      const tx = await tradeLog.connect(server).recordTrade(agent1.address, BTC_USDT, amount, PRICE_60K);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(tradeLog, "TradeRecorded")
        .withArgs(0, agent1.address, BTC_USDT, amount, PRICE_60K, block!.timestamp);

      expect(await tradeLog.getTradeCount()).to.equal(1);
      expect(await tradeLog.getAgentTradeCount(agent1.address)).to.equal(1);
    });

    it("records a sell trade (negative amount)", async function () {
      const amount = ethers.parseEther("-0.3"); // sell 0.3 BTC
      await tradeLog.connect(server).recordTrade(agent1.address, BTC_USDT, amount, PRICE_60K);
      const trades = await tradeLog.getAgentTrades(agent1.address, 0, 10);
      expect(trades[0].amount).to.equal(amount);
    });

    it("rejects unregistered agent", async function () {
      await expect(
        tradeLog.connect(server).recordTrade(stranger.address, BTC_USDT, 100, PRICE_60K)
      ).to.be.revertedWith("TradeLog: agent not registered");
    });

    it("rejects zero amount", async function () {
      await expect(
        tradeLog.connect(server).recordTrade(agent1.address, BTC_USDT, 0, PRICE_60K)
      ).to.be.revertedWith("TradeLog: zero amount");
    });

    it("rejects zero price", async function () {
      await expect(
        tradeLog.connect(server).recordTrade(agent1.address, BTC_USDT, 100, 0)
      ).to.be.revertedWith("TradeLog: zero price");
    });

    it("non-server cannot record trades", async function () {
      await expect(
        tradeLog.connect(stranger).recordTrade(agent1.address, BTC_USDT, 100, PRICE_60K)
      ).to.be.revertedWith("TradeLog: not server");
    });
  });

  describe("Trade Queries", function () {
    beforeEach(async function () {
      await tradeLog.connect(server).registerAgent(agent1.address);
      // Record 5 trades
      for (let i = 1; i <= 5; i++) {
        await tradeLog
          .connect(server)
          .recordTrade(agent1.address, BTC_USDT, ethers.parseEther(String(i)), PRICE_60K);
      }
    });

    it("returns paginated trades", async function () {
      const page1 = await tradeLog.getAgentTrades(agent1.address, 0, 3);
      expect(page1.length).to.equal(3);

      const page2 = await tradeLog.getAgentTrades(agent1.address, 3, 3);
      expect(page2.length).to.equal(2); // only 2 remaining
    });

    it("returns empty for out-of-range offset", async function () {
      const result = await tradeLog.getAgentTrades(agent1.address, 100, 10);
      expect(result.length).to.equal(0);
    });

    it("returns empty for agent with no trades", async function () {
      await tradeLog.connect(server).registerAgent(agent2.address);
      const result = await tradeLog.getAgentTrades(agent2.address, 0, 10);
      expect(result.length).to.equal(0);
    });
  });

  describe("Server Management", function () {
    it("owner can update server", async function () {
      await expect(tradeLog.connect(owner).setServer(stranger.address))
        .to.emit(tradeLog, "ServerUpdated")
        .withArgs(server.address, stranger.address);
      expect(await tradeLog.server()).to.equal(stranger.address);
    });

    it("non-owner cannot update server", async function () {
      await expect(
        tradeLog.connect(stranger).setServer(stranger.address)
      ).to.be.revertedWith("TradeLog: not owner");
    });
  });

  async function getBlockTimestamp(): Promise<number> {
    const block = await ethers.provider.getBlock("latest");
    return block!.timestamp;
  }
});

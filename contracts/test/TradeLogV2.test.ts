import { expect } from "chai";
import { ethers } from "hardhat";
import { TradeLogV2 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TradeLogV2", function () {
  let tradeLog: TradeLogV2;
  let owner: SignerWithAddress;
  let server: SignerWithAddress;
  let agent1: SignerWithAddress;
  let agent2: SignerWithAddress;
  let stranger: SignerWithAddress;

  const BTC_USDT = ethers.encodeBytes32String("BTC/USDT").slice(0, 18) as `0x${string}`;
  const PRICE_60K = ethers.parseEther("60000");
  const DELEGATION_ID = ethers.keccak256(ethers.toUtf8Bytes("d1"));
  const DELEGATION_ID_2 = ethers.keccak256(ethers.toUtf8Bytes("d2"));
  const ZERO32 = ethers.ZeroHash;

  beforeEach(async function () {
    [owner, server, agent1, agent2, stranger] = await ethers.getSigners();
    const F = await ethers.getContractFactory("TradeLogV2");
    tradeLog = await F.deploy(server.address);
  });

  it("sets owner and server", async function () {
    expect(await tradeLog.owner()).to.equal(owner.address);
    expect(await tradeLog.server()).to.equal(server.address);
  });

  it("records delegation-backed trade", async function () {
    await tradeLog.connect(server).registerAgent(agent1.address);
    const amount = ethers.parseEther("0.5");

    await expect(
      tradeLog.connect(server).recordTrade(agent1.address, BTC_USDT, amount, PRICE_60K, DELEGATION_ID)
    ).to.emit(tradeLog, "TradeRecorded");

    expect(await tradeLog.getTradeCount()).to.equal(1);
    const t = await tradeLog.getTrade(0);
    expect(t.delegationId).to.equal(DELEGATION_ID);
    expect(t.agent).to.equal(agent1.address);
  });

  it("records self-trade (delegationId=0) — v0.1 compat", async function () {
    await tradeLog.connect(server).registerAgent(agent1.address);
    await tradeLog.connect(server).recordTrade(agent1.address, BTC_USDT, 100n, PRICE_60K, ZERO32);
    const t = await tradeLog.getTrade(0);
    expect(t.delegationId).to.equal(ZERO32);
    expect(await tradeLog.getDelegationTradeCount(ZERO32)).to.equal(0); // not indexed
  });

  it("indexes by delegation id", async function () {
    await tradeLog.connect(server).registerAgent(agent1.address);
    await tradeLog.connect(server).registerAgent(agent2.address);

    await tradeLog.connect(server).recordTrade(agent1.address, BTC_USDT, 10n, PRICE_60K, DELEGATION_ID);
    await tradeLog.connect(server).recordTrade(agent1.address, BTC_USDT, 20n, PRICE_60K, DELEGATION_ID);
    await tradeLog.connect(server).recordTrade(agent2.address, BTC_USDT, 30n, PRICE_60K, DELEGATION_ID_2);
    await tradeLog.connect(server).recordTrade(agent1.address, BTC_USDT, 40n, PRICE_60K, ZERO32);

    expect(await tradeLog.getDelegationTradeCount(DELEGATION_ID)).to.equal(2);
    expect(await tradeLog.getDelegationTradeCount(DELEGATION_ID_2)).to.equal(1);
    expect(await tradeLog.getAgentTradeCount(agent1.address)).to.equal(3);

    const d1Trades = await tradeLog.getDelegationTrades(DELEGATION_ID, 0, 10);
    expect(d1Trades.length).to.equal(2);
    expect(d1Trades[0].amount).to.equal(10n);
    expect(d1Trades[1].amount).to.equal(20n);
  });

  it("rejects unregistered agent", async function () {
    await expect(
      tradeLog.connect(server).recordTrade(stranger.address, BTC_USDT, 1n, PRICE_60K, ZERO32)
    ).to.be.revertedWith("TradeLogV2: agent not registered");
  });

  it("rejects zero amount / zero price", async function () {
    await tradeLog.connect(server).registerAgent(agent1.address);
    await expect(
      tradeLog.connect(server).recordTrade(agent1.address, BTC_USDT, 0n, PRICE_60K, ZERO32)
    ).to.be.revertedWith("TradeLogV2: zero amount");
    await expect(
      tradeLog.connect(server).recordTrade(agent1.address, BTC_USDT, 1n, 0n, ZERO32)
    ).to.be.revertedWith("TradeLogV2: zero price");
  });

  it("non-server cannot record", async function () {
    await tradeLog.connect(server).registerAgent(agent1.address);
    await expect(
      tradeLog.connect(stranger).recordTrade(agent1.address, BTC_USDT, 1n, PRICE_60K, ZERO32)
    ).to.be.revertedWith("TradeLogV2: not server");
  });

  it("getTrade out-of-bounds reverts", async function () {
    await expect(tradeLog.getTrade(0)).to.be.revertedWith("TradeLogV2: out of bounds");
  });

  it("paginates agent trades", async function () {
    await tradeLog.connect(server).registerAgent(agent1.address);
    for (let i = 1; i <= 5; i++) {
      await tradeLog.connect(server).recordTrade(
        agent1.address, BTC_USDT, BigInt(i), PRICE_60K, i % 2 === 0 ? DELEGATION_ID : ZERO32
      );
    }
    const page1 = await tradeLog.getAgentTrades(agent1.address, 0, 3);
    expect(page1.length).to.equal(3);
    const page2 = await tradeLog.getAgentTrades(agent1.address, 3, 10);
    expect(page2.length).to.equal(2);
  });

  it("owner can rotate server", async function () {
    await expect(tradeLog.connect(owner).setServer(stranger.address))
      .to.emit(tradeLog, "ServerUpdated").withArgs(server.address, stranger.address);
    expect(await tradeLog.server()).to.equal(stranger.address);
  });

  it("non-owner cannot rotate server", async function () {
    await expect(tradeLog.connect(stranger).setServer(stranger.address))
      .to.be.revertedWith("TradeLogV2: not owner");
  });
});

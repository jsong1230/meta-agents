/**
 * Unit tests for SDK delegation module — pure + contract-interface checks.
 * Full on-chain integration is covered by hardhat tests on the contracts side.
 */
import { describe, it, expect } from "vitest";
import { ethers } from "ethers";
import {
  Scope,
  SCOPE_MASK,
  ActionType,
  computeDelegationId,
  DelegationManager,
} from "../src/delegation.js";

describe("Scope enum", () => {
  it("assigns bitmask values", () => {
    expect(Scope.TRADE).toBe(1);
    expect(Scope.FOLLOW).toBe(2);
    expect(Scope.TRANSFER).toBe(4);
    expect(Scope.WITHDRAW).toBe(8);
  });

  it("SCOPE_MASK covers all defined scopes", () => {
    expect(SCOPE_MASK).toBe(15);
  });

  it("scopes can be combined", () => {
    const combined = Scope.TRADE | Scope.FOLLOW;
    expect(combined & Scope.TRADE).toBe(Scope.TRADE);
    expect(combined & Scope.FOLLOW).toBe(Scope.FOLLOW);
    expect(combined & Scope.WITHDRAW).toBe(0);
  });
});

describe("ActionType hashes", () => {
  it("TRADE_EXECUTE matches keccak256('TRADE_EXECUTE')", () => {
    expect(ActionType.TRADE_EXECUTE).toBe(
      ethers.keccak256(ethers.toUtf8Bytes("TRADE_EXECUTE"))
    );
  });

  it("exports distinct values for all action types", () => {
    const values = new Set([
      ActionType.TRADE_EXECUTE,
      ActionType.FOLLOW_REQUEST,
      ActionType.TRANSFER_EXECUTE,
      ActionType.WITHDRAW_EXECUTE,
    ]);
    expect(values.size).toBe(4);
  });
});

describe("computeDelegationId", () => {
  const user = "0x1111111111111111111111111111111111111111";
  const agent = "0x2222222222222222222222222222222222222222";
  const registry = "0x3333333333333333333333333333333333333333";

  it("is deterministic for the same inputs", () => {
    const a = computeDelegationId(user, agent, 42n, 12, registry);
    const b = computeDelegationId(user, agent, 42n, 12, registry);
    expect(a).toBe(b);
  });

  it("returns a 32-byte hex string", () => {
    const id = computeDelegationId(user, agent, 1n, 12, registry);
    expect(id).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("differs when nonce changes", () => {
    const a = computeDelegationId(user, agent, 1n, 12, registry);
    const b = computeDelegationId(user, agent, 2n, 12, registry);
    expect(a).not.toBe(b);
  });

  it("differs when user or agent changes", () => {
    const a = computeDelegationId(user, agent, 1n, 12, registry);
    const other = "0x9999999999999999999999999999999999999999";
    expect(a).not.toBe(computeDelegationId(other, agent, 1n, 12, registry));
    expect(a).not.toBe(computeDelegationId(user, other, 1n, 12, registry));
  });

  it("differs across chains (replay protection)", () => {
    const mainnet = computeDelegationId(user, agent, 1n, 11, registry);
    const testnet = computeDelegationId(user, agent, 1n, 12, registry);
    expect(mainnet).not.toBe(testnet);
  });

  it("differs per registry instance", () => {
    const a = computeDelegationId(user, agent, 1n, 12, registry);
    const other = "0x4444444444444444444444444444444444444444";
    expect(a).not.toBe(computeDelegationId(user, agent, 1n, 12, other));
  });

  it("matches on-chain keccak256(abi.encode(user, agent, nonce, chainId, registry))", () => {
    const expected = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256", "address"],
        [user, agent, 123n, 12n, registry]
      )
    );
    expect(computeDelegationId(user, agent, 123n, 12, registry)).toBe(expected);
  });
});

describe("DelegationManager (construction)", () => {
  const rpc = new ethers.JsonRpcProvider("http://localhost:1"); // never called
  const REG = "0x5555555555555555555555555555555555555555";
  const LOG = "0x6666666666666666666666666666666666666666";

  it("throws when registry address is missing", () => {
    expect(() => new DelegationManager(rpc as any, "")).toThrow(
      /registryAddress is required/
    );
  });

  it("exposes registry address", () => {
    const mgr = new DelegationManager(rpc as any, REG);
    expect(mgr.address.toLowerCase()).toBe(REG.toLowerCase());
    expect(mgr.eventLogAddress).toBeNull();
  });

  it("exposes eventLog address when provided", () => {
    const mgr = new DelegationManager(rpc as any, REG, LOG);
    expect(mgr.eventLogAddress?.toLowerCase()).toBe(LOG.toLowerCase());
  });

  it("rejects logEvent when eventLog is not configured", async () => {
    const mgr = new DelegationManager(rpc as any, REG);
    await expect(
      mgr.logEvent("0x" + "0".repeat(64), "did:meta:testnet:0x1", ActionType.TRADE_EXECUTE, "0x" + "0".repeat(64), "did:meta:testnet:0x2")
    ).rejects.toThrow(/eventLog address not configured/);
  });

  it("rejects queryEventsByDelegation without eventLog", async () => {
    const mgr = new DelegationManager(rpc as any, REG);
    await expect(
      mgr.queryEventsByDelegation("0x" + "0".repeat(64))
    ).rejects.toThrow(/eventLog address not configured/);
  });

  it("create() rejects zero scope before any RPC call", async () => {
    const mgr = new DelegationManager(rpc as any, REG);
    await expect(
      mgr.create({
        user: "0x1111111111111111111111111111111111111111",
        agent: "0x2222222222222222222222222222222222222222",
        userDID: "did:meta:testnet:0x1",
        agentDID: "did:meta:testnet:0x2",
        scope: 0,
        validFor: 3600,
      })
    ).rejects.toThrow(/non-zero bitmask/);
  });

  it("create() rejects unknown scope bits before any RPC call", async () => {
    const mgr = new DelegationManager(rpc as any, REG);
    await expect(
      mgr.create({
        user: "0x1111111111111111111111111111111111111111",
        agent: "0x2222222222222222222222222222222222222222",
        userDID: "did:meta:testnet:0x1",
        agentDID: "did:meta:testnet:0x2",
        scope: 1 << 16,
        validFor: 3600,
      })
    ).rejects.toThrow(/unknown bits/);
  });
});

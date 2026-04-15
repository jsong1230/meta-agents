import { describe, it, expect } from "vitest";
import { ethers } from "ethers";
import {
  decodeDynamicFeeTx,
  encodeFDUnsigned,
  encodeFDSigned,
  signAsFeePayer,
} from "../src/fee-delegation.js";

describe("Fee Delegation", () => {
  // Known test vector from METADIUM/feedelegation-js README
  const KNOWN_RAW_TX =
    "0x02f8740c2685174876e80185174876e80182520894db8408bb47bf5e745fed00fc2c99e2f4e1a9270f880de0b6b3a764000080c001a06ad4753f48d3cad0b3b5ada1d03718a6abd81467a9896e63c012c944c9014a5ba0163a2aadee9028dc2c2993c55e2d519b58345832a6b540f3b0c71697f25aabfc";

  describe("decodeDynamicFeeTx", () => {
    it("decodes a known DynamicFeeTx (type 0x02)", () => {
      const decoded = decodeDynamicFeeTx(KNOWN_RAW_TX);

      expect(decoded.chainId).toBe(12); // Metadium chainId
      expect(decoded.nonce).toBe(0x26);
      expect(decoded.to.toLowerCase()).toContain("db8408bb47bf5e745fed00fc2c99e2f4e1a9270f");
      expect(decoded.v).toBeDefined();
      expect(decoded.r).toBeDefined();
      expect(decoded.s).toBeDefined();
    });

    it("rejects non-0x02 tx type", () => {
      expect(() => decodeDynamicFeeTx("0x01abcd")).toThrow("Expected DynamicFeeTx");
    });
  });

  describe("encodeFDUnsigned + encodeFDSigned", () => {
    it("produces valid FD tx type 0x16", () => {
      const decoded = decodeDynamicFeeTx(KNOWN_RAW_TX);
      const fdTx = {
        ...decoded,
        feePayer: "0xd5d06d0d1ec47131e284ac3a88864fb750dba9f6",
      };

      const [hash, rawHex] = encodeFDUnsigned(fdTx);

      expect(hash).toMatch(/^0x[0-9a-f]{64}$/);
      expect(rawHex).toMatch(/^0x16/); // FD tx type
    });

    it("signed FD tx includes feePayer signature fields", () => {
      const decoded = decodeDynamicFeeTx(KNOWN_RAW_TX);
      const fdTx = {
        ...decoded,
        feePayer: "0xd5d06d0d1ec47131e284ac3a88864fb750dba9f6",
        fv: 0,
        fr: "0x42cfb84cd7724d648b79a6a486b5e632842295d7be4761165860abbb2c34ec15",
        fs: "0x1e60339ae50691dbbe290d5c7739e1d75271a316cd643effe247ab6514480b05",
      };

      const [hash, rawHex] = encodeFDSigned(fdTx);

      expect(hash).toMatch(/^0x[0-9a-f]{64}$/);
      expect(rawHex).toMatch(/^0x16/);
    });

    it("rejects signed encode without feePayer signature", () => {
      const decoded = decodeDynamicFeeTx(KNOWN_RAW_TX);
      const fdTx = {
        ...decoded,
        feePayer: "0xd5d06d0d1ec47131e284ac3a88864fb750dba9f6",
      };

      expect(() => encodeFDSigned(fdTx as any)).toThrow("Missing feePayer signature");
    });
  });

  describe("signAsFeePayer", () => {
    it("wraps a DynamicFeeTx with feePayer signature", async () => {
      const decoded = decodeDynamicFeeTx(KNOWN_RAW_TX);
      const feePayerWallet = ethers.Wallet.createRandom();

      const result = await signAsFeePayer(decoded, feePayerWallet);

      expect(result.hash).toMatch(/^0x[0-9a-f]{64}$/);
      expect(result.rawTransaction).toMatch(/^0x16/);
      expect(result.feeDelegateTx.feePayer.toLowerCase()).toBe(
        feePayerWallet.address.toLowerCase()
      );
      expect(result.feeDelegateTx.fr).toBeDefined();
      expect(result.feeDelegateTx.fs).toBeDefined();
      expect(result.feeDelegateTx.fv).toBeDefined();
    });
  });
});

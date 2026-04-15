import { describe, it, expect } from "vitest";
import { addressToDid, didToAddress } from "../src/did.js";

describe("DID utilities", () => {
  // ethers.getAddress returns EIP-55 checksum — use that as canonical form
  const VALID_ADDRESS_LOWER = "0x742d35cc6634c0532925a3b844bc9e7595f2bd18";
  const VALID_DID = "did:meta:testnet:" + VALID_ADDRESS_LOWER;

  describe("addressToDid", () => {
    it("converts address to did:meta format", () => {
      const did = addressToDid(VALID_ADDRESS_LOWER);
      expect(did).toBe(VALID_DID);
    });

    it("lowercases the address", () => {
      const did = addressToDid("0xABCDEF1234567890ABCDEF1234567890ABCDEF12");
      expect(did).toMatch(/^did:meta:testnet:0x[0-9a-f]+$/);
    });
  });

  describe("didToAddress", () => {
    it("extracts checksum address from DID", () => {
      const address = didToAddress(VALID_DID);
      expect(address.toLowerCase()).toBe(VALID_ADDRESS_LOWER);
    });

    it("rejects invalid DID format", () => {
      expect(() => didToAddress("not:a:did")).toThrow("Invalid DID format");
      expect(() => didToAddress("did:eth:mainnet:0x123")).toThrow("Invalid DID format");
    });

    it("rejects invalid address in DID", () => {
      expect(() => didToAddress("did:meta:testnet:0xinvalid")).toThrow("Invalid address");
    });

    it("handles DID with different networks", () => {
      const mainnetDid = "did:meta:mainnet:" + VALID_ADDRESS_LOWER;
      const address = didToAddress(mainnetDid);
      expect(address.toLowerCase()).toBe(VALID_ADDRESS_LOWER);
    });
  });

  describe("roundtrip", () => {
    it("address → DID → address preserves identity", () => {
      const did = addressToDid(VALID_ADDRESS_LOWER);
      const recovered = didToAddress(did);
      expect(recovered.toLowerCase()).toBe(VALID_ADDRESS_LOWER);
    });
  });
});

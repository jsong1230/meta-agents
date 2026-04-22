/**
 * @deprecated 2026-04-22 — use the official Metadium testnet DID contracts instead.
 *
 *   IdentityRegistry   0xbe2bb3d7085ff04bde4b3f177a730a826f05cb70
 *   PublicKeyResolver  0x81c638aec7d323d4cd0114a5d5407be241b25d0a
 *   ServiceKeyResolver 0xf4f9790205ee559a379c519e04042b20560eefad
 *
 * Sources: METADIUM/did-sdk-java, METADIUM/meta-did-resolver.
 *
 * This script remains in the repo for historical reference — it deployed the
 * initial self-owned DID stack to `0x98ee60.../0xFD89c9.../0x108A19...` during
 * v0.1 development. Do NOT run again. SDK and web config both point at the
 * official registry.
 */
import { ethers } from "hardhat";

async function main() {
  throw new Error(
    "deploy-did.ts is deprecated — meta-agents now uses the official Metadium testnet DID registry. " +
    "See packages/sdk/src/config.ts TESTNET_CONTRACTS."
  );

  // eslint-disable-next-line @typescript-eslint/no-unreachable
  const [deployer] = await ethers.getSigners();
  console.log("Deploying DID contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "META");

  // 1. Deploy IdentityRegistry
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const registry = await IdentityRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("IdentityRegistry:", registryAddr);

  // 2. Deploy PublicKeyResolver (needs IdentityRegistry address)
  const PublicKeyResolver = await ethers.getContractFactory("PublicKeyResolver");
  const pkResolver = await PublicKeyResolver.deploy(registryAddr);
  await pkResolver.waitForDeployment();
  const pkAddr = await pkResolver.getAddress();
  console.log("PublicKeyResolver:", pkAddr);

  // 3. Deploy ServiceKeyResolver (needs IdentityRegistry address)
  const ServiceKeyResolver = await ethers.getContractFactory("ServiceKeyResolver");
  const skResolver = await ServiceKeyResolver.deploy(registryAddr);
  await skResolver.waitForDeployment();
  const skAddr = await skResolver.getAddress();
  console.log("ServiceKeyResolver:", skAddr);

  console.log("\n=== DID Deployment Summary ===");
  console.log(`IdentityRegistry:   ${registryAddr}`);
  console.log(`PublicKeyResolver:  ${pkAddr}`);
  console.log(`ServiceKeyResolver: ${skAddr}`);
  console.log(`Network: ${(await ethers.provider.getNetwork()).chainId}`);
  console.log(`Deployer: ${deployer.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

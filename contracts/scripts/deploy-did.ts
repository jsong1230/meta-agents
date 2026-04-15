import { ethers } from "hardhat";

async function main() {
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

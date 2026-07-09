import { ethers } from "hardhat";

/**
 * C3 어댑터 (AgentVerifierAdapter) 배포 스크립트
 *
 * meta-agents의 AI agent 검증을 MetaStake OperatorRegistry의 operator majority vote로
 * 판정하도록 연결한다.
 *
 * 실행:
 *   AGENT_REGISTRY_ADDRESS=0x... \
 *   OPERATOR_REGISTRY_ADDRESS=0x19F4... \
 *   VERIFIER_SERVICE_ID=2 \
 *   npx hardhat run scripts/deploy-agent-verifier.ts --network metadium_testnet
 *
 * 사전 조건:
 *   - AgentRegistry(v2, setVerifier/verified 포함)가 배포돼 있어야 함 (구버전이면 재배포 필요)
 *   - OperatorRegistry에 "Agent Verifier" 서비스(serviceId=2)와 operator stake(10 META)
 *   - 배포자가 AgentRegistry owner여야 setVerifier 호출 가능
 */
async function main() {
  const AGENT_REGISTRY_ADDRESS = process.env.AGENT_REGISTRY_ADDRESS;
  const OPERATOR_REGISTRY_ADDRESS = process.env.OPERATOR_REGISTRY_ADDRESS;
  const serviceId = BigInt(process.env.VERIFIER_SERVICE_ID ?? "2");

  if (!AGENT_REGISTRY_ADDRESS || !OPERATOR_REGISTRY_ADDRESS) {
    throw new Error("환경변수 AGENT_REGISTRY_ADDRESS, OPERATOR_REGISTRY_ADDRESS 필요");
  }

  const [deployer] = await ethers.getSigners();
  console.log("========================================================");
  console.log("C3 어댑터 (AgentVerifierAdapter) 배포");
  console.log("========================================================");
  console.log("배포자:           ", deployer.address);
  console.log("잔액:             ", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "META");
  console.log("AgentRegistry:    ", AGENT_REGISTRY_ADDRESS);
  console.log("OperatorRegistry: ", OPERATOR_REGISTRY_ADDRESS);
  console.log("serviceId:        ", serviceId.toString());
  console.log("--------------------------------------------------------");

  // 어댑터 배포
  const Adapter = await ethers.getContractFactory("AgentVerifierAdapter");
  const adapter = await Adapter.deploy(AGENT_REGISTRY_ADDRESS, OPERATOR_REGISTRY_ADDRESS, serviceId);
  await adapter.waitForDeployment();
  const adapterAddr = await adapter.getAddress();
  console.log("어댑터 배포 완료: ", adapterAddr);

  // AgentRegistry에 verifier 등록 (배포자 = owner 필요)
  const registry = await ethers.getContractAt("AgentRegistry", AGENT_REGISTRY_ADDRESS);
  const owner = await registry.owner();
  if (owner.toLowerCase() === deployer.address.toLowerCase()) {
    const tx = await registry.setVerifier(adapterAddr);
    await tx.wait();
    console.log("setVerifier 완료 (tx:", tx.hash + ")");
  } else {
    console.log("⚠️  배포자가 AgentRegistry owner(" + owner + ")가 아닙니다.");
    console.log("    owner가 registry.setVerifier(\"" + adapterAddr + "\")를 호출해야 합니다.");
  }

  console.log("========================================================");
  console.log("완료!  verifier =", await registry.verifier());
  console.log("다음: OperatorRegistry serviceId=2에 operator stake(10 META) 확인");
  console.log("      operator들이 voteVerify(agent, approve)로 검증 참여");
  console.log("========================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

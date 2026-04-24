# @meta-agents/sdk

> **⚠️ TESTNET ONLY** — Metadium Kalmia testnet (chain id `12`). No production / mainnet support. Do not use with real funds. Contracts are deployed on the test network and can be migrated or reset without notice while v0.3 is stabilising.

AI Agent Identity + Delegation SDK for **Metadium**.

- **DID (ERC-1484)** — on-chain identity for your trading bot. Create once, verify forever.
- **KYA (Know Your Agent)** — one call returns identity + on-chain trade record + badges.
- **Fee Delegation** — agents transact without holding META. Server pays gas.
- **v0.3 Delegation Framework** — reference implementation of KR patent `10-2025-0074709` (Smart Contract delegation, claims 6-7, 20).

## Install

```bash
npm install @meta-agents/sdk@testnet
```

The plain `@meta-agents/sdk` install will fail until a mainnet-ready `latest` tag ships. This is intentional so you can't accidentally point production at testnet.

## Quick Start

### Verify a bot's on-chain record (KYA)

```ts
import { MetaAgentClient } from "@meta-agents/sdk";

const client = new MetaAgentClient();

const result = await client.verifyAgent("did:meta:testnet:0x...");
console.log(result.verified);              // true
console.log(result.stats.pnlPercent);      // e.g. 12.5
console.log(result.stats.totalTrades);     // e.g. 47
```

### Create a new agent DID

```ts
import { ethers } from "ethers";
import { MetaAgentClient } from "@meta-agents/sdk";

const client = new MetaAgentClient();
const wallet = ethers.Wallet.createRandom().connect(client.provider);

// Fund wallet with a small amount of META for gas first.
const { did, ein, txHashes } = await client.createAgentDID(
  wallet,
  "GPT-4o",
  "1.0"
);

console.log(did);   // did:meta:testnet:0x...
console.log(ein);   // assigned by the official IdentityRegistry
```

Calls `IdentityRegistry.createIdentity` → `ServiceKeyResolver.addKey("meta-agents")` → `AgentRegistry.register`. The EIN is live on the official Metadium testnet registry and interoperates with other Metadium DID tooling.

### v0.3 — On-chain delegation

```ts
import { DelegationManager, Scope, TESTNET_CONTRACTS } from "@meta-agents/sdk";
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://api.metadium.com/dev");
const userSigner = new ethers.Wallet(USER_KEY, provider);

const dm = new DelegationManager(
  userSigner,
  TESTNET_CONTRACTS.delegationRegistry!,
  TESTNET_CONTRACTS.agentEventLog
);

// 1. Issue a delegation: user → agent, TRADE scope, 10 MAG per tx, 100 MAG total, 30 days
const { delegationId } = await dm.create({
  user: userSigner.address,
  agent: AGENT_ADDRESS,
  userDID: `did:meta:testnet:${userSigner.address.toLowerCase()}`,
  agentDID: `did:meta:testnet:${AGENT_ADDRESS.toLowerCase()}`,
  scope: Scope.TRADE,
  maxAmount: ethers.parseEther("10"),
  totalCap: ethers.parseEther("100"),
  validFor: 30 * 24 * 3600,
});

// 2. Agent side: pre-check before acting
const check = await dm.isValid(delegationId, Scope.TRADE, ethers.parseEther("5"));
if (!check.valid) throw new Error(check.reason);

// 3. After execution, consume + log
await dm.consume(delegationId, ethers.parseEther("5"));
await dm.logEvent(
  delegationId,
  agentDID,
  ActionType.TRADE_EXECUTE,
  actionHash,
  serviceProviderDID,
);

// Later: revoke
await dm.revoke(delegationId);
```

Audit + tracking:

```ts
const events = await dm.queryEventsByDelegation(delegationId);
const delegations = await dm.listByUser(userSigner.address);
```

### Fee Delegation (gasless agent transactions)

```ts
import { delegateAndSend } from "@meta-agents/sdk";

// Agent signs a type-0x02 tx with its own key (no META balance required)
const agentSigned = await agentWallet.signTransaction(tx);

// Fee-payer wraps it as type-0x16 and pays the gas
const txHash = await delegateAndSend(agentSigned, feePayerWallet, provider);
```

## Public Endpoints (testnet)

| | |
|---|---|
| Web | https://meta-agents-testnet.metadium.club/ |
| API | https://api.meta-agents-testnet.metadium.club/ |
| RPC | https://api.metadium.com/dev (chain id 12) |

## Deployed Contracts (Metadium testnet)

| Contract | Address |
|---|---|
| IdentityRegistry (official Metadium) | `0xbe2bb3d7085ff04bde4b3f177a730a826f05cb70` |
| PublicKeyResolver (official Metadium) | `0x81c638aec7d323d4cd0114a5d5407be241b25d0a` |
| ServiceKeyResolver (official Metadium) | `0xf4f9790205ee559a379c519e04042b20560eefad` |
| AgentRegistry | `0x3418ce33ec4369268e86b6DEd2288248da3dD39d` |
| TradeLog (v0.1) | `0xB02239dEB85528a268f31a00EDFde682eFe268B6` |
| DelegationRegistry (v0.3) | `0xc1866e1f1ef84acB3DAf0224C81Bb3aa410aF09e` |
| AgentEventLog (v0.3) | `0xE25154d1173c6eE3B50cC7eb6EE1f145ba95102F` |
| TradeLogV2 (v0.3) | `0x2B5C8Ab3139B7A31381Dd487150Bb30699d0c1A2` |

## Patent reference

The v0.3 delegation framework implements **KR patent 10-2025-0074709** — Smart Contract delegation (claims 6-7, 20) and related device claims. `DelegationRegistry` + `AgentEventLog` + `TradeLogV2.delegationId` together cover claims 1, 2, 3, 6, 7, and 20. VC (claims 4-5), Token (claims 8-9), and One-time Key (claims 10-11) modes will ship in v0.3.1 / v0.4.

## Repository

https://github.com/jsong1230/meta-agents

The monorepo holds:
- `contracts/` — Solidity + Hardhat tests (90 passing)
- `packages/sdk/` — this package (32 tests)
- `apps/web/` — Next.js leaderboard + delegate/audit UI

## Versioning

Testnet releases: `0.3.x-testnet.N` under the `testnet` dist-tag. When the contracts, addresses, and API are promoted to Metadium mainnet, a `1.0.0` release will graduate to the `latest` tag. Testnet-only consumers should pin to the `testnet` tag.

## License

MIT — see [LICENSE](./LICENSE).

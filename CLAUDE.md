# meta-agents

AI Agent Identity & Trading Leaderboard — Metadium DID (ERC-1484) 기반

## Project

- Repo: https://github.com/jsong1230/meta-agents
- Live: http://100.126.168.26:3100 (110번 서버, PM2)
- Telegram: @meta_agents_bot

## Contracts (Metadium Testnet, Chain ID: 12)

| Contract | Address |
|----------|---------|
| IdentityRegistry | `0x98ee60651533e561395098E1FF6653E68F579DdE` |
| PublicKeyResolver | `0xFD89c9dFC82f9f806E5aFd55cBA37ce02708F2Cf` |
| ServiceKeyResolver | `0x108A19883eA22D47FcB58862129c686994583dCf` |
| AgentRegistry | `0x3418ce33ec4369268e86b6DEd2288248da3dD39d` |
| TradeLog | `0xB02239dEB85528a268f31a00EDFde682eFe268B6` |

Deployer: `0x18b52D157C5DD28231AF7e4A848BDd50c6b1283c`
RPC: `https://api.metadium.com/dev`

## Stack

- Contracts: Solidity 0.8.24 (TradeLog, AgentRegistry) + 0.5.0 (ERC-1484 DID)
- SDK: TypeScript + ethers.js (packages/sdk/)
- Web: Next.js + Tailwind (apps/web/)
- DB: SQLite (better-sqlite3)
- Deploy: PM2 on server 110 (10.150.254.110 / Tailscale 100.126.168.26)

## Commands

```bash
# Contract tests (30 tests)
cd contracts && npx hardhat test

# SDK tests (13 tests)
cd packages/sdk && npx vitest run

# Web dev server
cd apps/web && npm run dev

# Deploy to testnet
cd contracts && DEPLOYER_KEY=0x... npx hardhat run scripts/deploy.ts --network metadium_testnet

# Deploy to 110 server
ssh jsong@10.150.254.110 'cd ~/meta-agents && git pull && cd apps/web && npx next build && pm2 restart meta-agents'
```

## Cron (110번 서버)

- `*/5 * * * *` — mock bot 자동 매매
- `0 0 * * *` — Telegram 리더보드 알림 (09:00 KST)

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health

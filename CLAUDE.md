# meta-agents

AI Agent Identity & Trading Leaderboard — Metadium DID (ERC-1484) 기반

## Project

- Repo: https://github.com/jsong1230/meta-agents
- Web: https://meta-agents-testnet.metadium.club/
- API: https://api.meta-agents-testnet.metadium.club/
- Internal: http://10.150.255.48:3100 (48번 서버 사내망, PM2 `meta-agents`)
- Telegram: @meta_agents_bot

## Contracts (Metadium Testnet, Chain ID: 12)

| Contract | Address |
|----------|---------|
| IdentityRegistry | `0xbe2bb3d7085ff04bde4b3f177a730a826f05cb70` (official Metadium) |
| PublicKeyResolver | `0x81c638aec7d323d4cd0114a5d5407be241b25d0a` (official Metadium) |
| ServiceKeyResolver | `0xf4f9790205ee559a379c519e04042b20560eefad` (official Metadium) |
| AgentRegistry | `0x3418ce33ec4369268e86b6DEd2288248da3dD39d` |
| TradeLog | `0xB02239dEB85528a268f31a00EDFde682eFe268B6` |
| DelegationRegistry (v0.3) | `0xc1866e1f1ef84acB3DAf0224C81Bb3aa410aF09e` |
| AgentEventLog (v0.3) | `0xE25154d1173c6eE3B50cC7eb6EE1f145ba95102F` |
| TradeLogV2 (v0.3) | `0x2B5C8Ab3139B7A31381Dd487150Bb30699d0c1A2` |

Deployer: `0x18b52D157C5DD28231AF7e4A848BDd50c6b1283c`
RPC: `https://api.metadium.com/dev`

## Stack

- Contracts: Solidity 0.8.24 (TradeLog, AgentRegistry) + 0.5.0 (ERC-1484 DID)
- SDK: TypeScript + ethers.js (packages/sdk/)
- Web: Next.js + Tailwind (apps/web/)
- DB: SQLite (better-sqlite3)
- Deploy: PM2 on server 48 (10.150.255.48) + 48번 전용 Caddy docker-compose

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

# Deploy to 48 server
ssh dev-pc-01 'cd ~/meta-agents && git pull && cd apps/web && npx next build && pm2 restart meta-agents'
```

## Cron (48번 서버)

- `*/5 * * * *` — mock bot 자동 매매
- `0 0 * * *` — Telegram 리더보드 알림 (09:00 KST)

## Operations

### Testnet endpoint
- Web: https://meta-agents-testnet.metadium.club/
- API: https://api.meta-agents-testnet.metadium.club/ (현재 web과 동일 upstream)
- Hosted on: **48번 서버 (10.150.255.48)** — app + gateway 모두
  - PM2 `meta-agents` on :3100 (Next.js production, ecosystem config at `~/meta-agents/ecosystem.config.cjs`)
  - Docker Compose `meta-agents-gateway` Caddy at `~/meta-agents-gateway/` (443 TLS, reverse_proxy `host.docker.internal:3100`)
- HTTPS: 48번 전용 Caddy 컨테이너, Let's Encrypt DNS-01 via `jsong-claude-route53`
- Access: 내부망 전용 (private IP — Tailscale 또는 사내망)

### Domain 네이밍 규칙
- Testnet: `*-testnet.metadium.club` (suffix)
- Mainnet: `*.metadium.club` (suffix 없음, 아직 미배포)
- API: `api.<web>` 동일 규칙

### DNS 관리
- Zone: `metadium.club` (James Uhr AWS account `748501526749`, zone id `Z3RA5HA5VA82JG`)
- IAM user: `jsong-claude-route53` — metadium.club zone 쓰기 + 전체 zone 읽기 권한
- gram-jsong profile: `route53-metadium`
- A 레코드: `meta-agents-testnet` · `api.meta-agents-testnet` → `10.150.255.48`

### Deploy (48번)
```bash
ssh dev-pc-01 'cd ~/meta-agents && git pull && cd apps/web && npx next build && pm2 restart meta-agents'
```

### History
- v0.1 (2026-04-15) ~ 2026-04-24: 110번 서버 공유 Caddy 편승
- 2026-04-24: heritageradio Caddy reload로 meta-agents 블록 소실 → 48번 전용 스택으로 전체 이관 (app + gateway + cron + DB). 110번은 rollback 대비 stopped PM2 entry만 보존

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

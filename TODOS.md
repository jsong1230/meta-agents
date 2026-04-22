# TODOS

## Completed

### TradeLog contract + tests
**Completed:** v0.1.0 (2026-04-15)

### AgentRegistry contract + tests
**Completed:** v0.1.0 (2026-04-15)

### Fee Delegation SDK
**Completed:** v0.1.0 (2026-04-15)

### DID SDK (ERC-1484 연동)
**Completed:** v0.1.0 (2026-04-15)

### Next.js 리더보드 + API
**Completed:** v0.1.0 (2026-04-15)

### Mock trading bot (5분 cron)
**Completed:** v0.1.0 (2026-04-15)

### verifyAgent API (KYA)
**Completed:** v0.1.0 (2026-04-15)

### Follow API
**Completed:** v0.1.0 (2026-04-15)

### Sparkline + Badge UI
**Completed:** v0.1.0 (2026-04-15)

### Telegram bot
**Completed:** v0.1.0 (2026-04-15)

### Fee Delegator server (/api/delegate)
**Completed:** v0.1.0 (2026-04-15)

### Testnet contract 배포 (TradeLog + AgentRegistry + DID)
**Completed:** v0.1.0 (2026-04-15)

### Site redesign (랜딩 + 가이드 + i18n)
**Completed:** v0.1.0 (2026-04-15)

### SDK 문서 (quickstart guide)
**Completed:** v0.1.0 (2026-04-15)

### v0.3.0 — Smart Contract Delegation Framework
**Completed:** v0.3.0 (2026-04-22)
- `DelegationRegistry.sol` (청구항 6-7, 20) — `0xc1866e1f1ef84acB3DAf0224C81Bb3aa410aF09e`
- `AgentEventLog.sol` (청구항 2-3) — `0xE25154d1173c6eE3B50cC7eb6EE1f145ba95102F`
- `TradeLogV2.sol` (delegationId 필드 추가) — `0x2B5C8Ab3139B7A31381Dd487150Bb30699d0c1A2`
- SDK `DelegationManager` — create/revoke/isValid/consume/listBy* + AgentEventLog 조회
- Web: `/delegate` · `/delegation/[id]` · `/audit` + API routes
- Seeder script — on-chain demo delegation 실증 (3 trades + 3 events)
- Tests: 90 hardhat (60 신규) + 32 vitest (19 신규)

### Testnet DID → 공식 Metadium 레지스트리 전환
**Completed:** v0.3.0 (2026-04-22)
- IdentityRegistry/PublicKeyResolver/ServiceKeyResolver 모두 공식 주소로 교체
- E2E 검증: createAgentDID → 신규 EIN 475362, service key "meta-agents" 등록 확인
- `deploy-did.ts` @deprecated 처리

## Next (v0.2)

### npm publish (@meta-agents/sdk)
- **What**: SDK를 npm에 퍼블리시
- **Why**: 외부 개발자가 npm install로 바로 사용
- **Priority**: P1
- **Blocked by**: 없음

### 외부 개발자 5명 검증
- **What**: AI crypto trading bot 개발자 5명에게 SDK 테스트 요청
- **Why**: KYA 가설 검증 + 피드백
- **Priority**: P1
- **Blocked by**: SDK docs 완성 (완료)

### Agent profile에 DID Document 정보 표시
- **What**: /agent 페이지에 EIN, service keys, public key 등 DID 정보 표시
- **Why**: "왜 DID인가, 지갑 주소와 뭐가 다른가"를 시각적으로 증명
- **Priority**: P2
- **Blocked by**: 없음

### 도메인 + HTTPS
- **What**: meta-agents 전용 도메인 + SSL 인증서
- **Why**: Telegram webhook 활성화, 외부 공유 시 신뢰도
- **Priority**: P2
- **Blocked by**: 없음

## Next (v0.3.1+)

> **배경**: ㈜씨피랩스 특허 10-2025-0074709. v0.3.0은 Smart Contract 방식(청구항 6-7) 완료 (Completed 섹션 참조). 남은 3개 방식은 이후 릴리스에서.
>
> **상세 스펙**: `~/dev/jsong1230-github/claude-agent/research/ai-agent-delegation/v03-spec.md`

### v0.3.1 — Verifiable Credential 방식 (청구항 4-5)
- VC 발급 issuer 서버 (or 내부 API)
- W3C VC 표준 호환 (기존 Deferred 항목 활성화)
- SDK `DelegationManager.issueVC()` / `verifyVC()`

### v0.4 — Token + One-time Key 방식 (청구항 8-11)
- Delegation Token (JWT + DID 서명)
- One-time ephemeral keypair

### v0.3 마일스톤 연동
- 공개 타이밍: v0.3.0 배포 + 외부 개발자 5명 검증 완료 후 프레스/블로그 (~2026-06)
- 특허 등록번호 명기한 기술 레퍼런스 문서
- 라온시큐어 AAM 대비 실제 동작 PoC로 포지셔닝

## Deferred (v2+)

- Oracle/Chainlink 가격 검증 (실거래 도입 시)
- Python SDK (PyPI)
- W3C VC 호환 credential
- Sharpe ratio, MDD 리더보드 지표
- Multi-chain agent 인증
- 실제 crypto 매매 연동
- Prediction market 확장

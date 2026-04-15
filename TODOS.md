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

## Deferred (v2+)

- Oracle/Chainlink 가격 검증 (실거래 도입 시)
- Python SDK (PyPI)
- W3C VC 호환 credential
- Sharpe ratio, MDD 리더보드 지표
- Multi-chain agent 인증
- 실제 crypto 매매 연동
- Prediction market 확장

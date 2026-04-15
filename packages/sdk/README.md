# @meta-agents/sdk

AI 트레이딩 봇을 만들었다면, 그 실력을 증명하세요.
meta-agents는 당신의 봇에 블록체인 신원(DID)을 부여하고, 거래 기록을 위조 불가능하게 남깁니다.

## 왜 필요한가?

당신의 AI 트레이딩 봇이 +30% 수익을 냈다고 합시다.
그걸 어떻게 증명하나요? 스크린샷? 엑셀? 누가 믿나요?

meta-agents를 쓰면:
- 봇에 **블록체인 신원증(DID)** 이 발급됩니다
- 모든 거래가 **블록체인에 기록**됩니다 (조작 불가)
- 누구나 **한 번의 API 호출**로 봇의 실력을 검증할 수 있습니다

## 시작하기 (5분)

### Step 1. 봇을 등록하세요

```bash
curl -X POST http://100.126.168.26:3100/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0xYOUR_WALLET_ADDRESS",
    "model": "GPT-4o",
    "version": "1.0"
  }'
```

응답:
```json
{
  "did": "did:meta:testnet:0xyour_wallet_address",
  "address": "0xYOUR_WALLET_ADDRESS",
  "model": "GPT-4o",
  "version": "1.0"
}
```

`did`가 봇의 신원증입니다. 이걸 저장하세요.

### Step 2. 거래를 기록하세요

봇이 매수/매도할 때마다 이 API를 호출합니다.

```bash
# BTC 0.5개 매수
curl -X POST http://100.126.168.26:3100/api/trade \
  -H "Content-Type: application/json" \
  -d '{
    "agentAddress": "0xYOUR_WALLET_ADDRESS",
    "pair": "BTC/USDT",
    "amount": 0.5
  }'

# ETH 2개 매도 (음수 = 매도)
curl -X POST http://100.126.168.26:3100/api/trade \
  -H "Content-Type: application/json" \
  -d '{
    "agentAddress": "0xYOUR_WALLET_ADDRESS",
    "pair": "ETH/USDT",
    "amount": -2.0
  }'
```

- `amount` 양수 = 매수, 음수 = 매도
- 가격은 서버가 CoinGecko에서 실시간으로 가져옵니다 (조작 불가)
- 지원 페어: `BTC/USDT`, `ETH/USDT`, `SOL/USDT`, `BNB/USDT`, `META/USDT`

### Step 3. 실력을 증명하세요

누구나 이 한 줄로 봇의 진짜 실력을 확인할 수 있습니다.

```bash
curl http://100.126.168.26:3100/api/verify?did=did:meta:testnet:0xyour_wallet_address
```

응답:
```json
{
  "verified": true,
  "agent": {
    "did": "did:meta:testnet:0x...",
    "model": "GPT-4o",
    "version": "1.0",
    "creator": "0x...",
    "active": true
  },
  "stats": {
    "totalTrades": 47,
    "pnlPercent": 12.5,
    "pairBreakdown": [
      { "pair": "BTC/USDT", "bought": 50000, "sold": 55000, "trades": 20 }
    ]
  },
  "badges": ["active-trader", "profitable", "diversified"],
  "proof": {
    "chainId": 12,
    "network": "metadium-testnet"
  }
}
```

이게 KYA (Know Your Agent)입니다. 신원 + 실적 + 증명, 한 번에.

### Step 4. 리더보드에서 경쟁하세요

http://100.126.168.26:3100

등록한 순간부터 리더보드에 표시됩니다. 수익률 기준으로 자동 랭킹.

## Python에서 사용하기

```python
import requests

BASE = "http://100.126.168.26:3100"

# 등록
requests.post(f"{BASE}/api/agent", json={
    "address": "0xYOUR_WALLET",
    "model": "my-bot",
    "version": "1.0"
})

# 매수
requests.post(f"{BASE}/api/trade", json={
    "agentAddress": "0xYOUR_WALLET",
    "pair": "BTC/USDT",
    "amount": 0.1
})

# 검증
r = requests.get(f"{BASE}/api/verify?did=did:meta:testnet:0xyour_wallet")
print(r.json())
```

## JavaScript/TypeScript에서 사용하기

```typescript
const BASE = "http://100.126.168.26:3100";

// 등록
await fetch(`${BASE}/api/agent`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    address: "0xYOUR_WALLET",
    model: "my-bot",
    version: "1.0",
  }),
});

// 매수
await fetch(`${BASE}/api/trade`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    agentAddress: "0xYOUR_WALLET",
    pair: "BTC/USDT",
    amount: 0.1,
  }),
});

// 검증
const res = await fetch(`${BASE}/api/verify?did=did:meta:testnet:0xyour_wallet`);
const data = await res.json();
console.log(data.verified, data.stats.pnlPercent);
```

## 전체 API

| 뭘 하고 싶나요? | 방법 |
|--------------|------|
| 봇 등록 | `POST /api/agent` `{ address, model, version }` |
| 거래 기록 | `POST /api/trade` `{ agentAddress, pair, amount }` |
| 실력 검증 (KYA) | `GET /api/verify?did=did:meta:testnet:0x...` |
| 리더보드 보기 | `GET /api/leaderboard?period=24h\|7d\|30d\|all` |
| 봇 상세 보기 | `GET /api/agent?address=0x...` |
| 팔로우 | `POST /api/follow` `{ userId, agentAddress }` |
| 팔로우 해제 | `DELETE /api/follow` `{ userId, agentAddress }` |
| Fee Delegation | `POST /api/delegate` `{ signedTx }` (가스비 0) |

## FAQ

**Q: 지갑 주소가 없는데?**
아무 이더리움 주소나 사용 가능합니다. MetaMask에서 새 계정 만들거나, `ethers.Wallet.createRandom()`으로 생성하세요.

**Q: 진짜 돈이 들어가나요?**
아닙니다. 테스트넷 모의투자입니다. 실제 자산 거래는 없습니다.

**Q: 가격을 조작할 수 있나요?**
아닙니다. 가격은 서버가 CoinGecko에서 가져와서 기록합니다. 봇이 가격을 지정할 수 없습니다.

**Q: DID가 뭔가요?**
Decentralized Identifier. 블록체인에 기록된 신원증입니다. 누구도 위조하거나 삭제할 수 없습니다.

## 라이선스

MIT

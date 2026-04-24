import { Nav } from "@/components/Nav";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Getting Started</h1>
        <p className="text-zinc-400 mb-10">
          AI 트레이딩 봇을 등록하고 실력을 증명하세요. 5분이면 됩니다.
        </p>

        {/* What is this */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 text-zinc-200">meta-agents란?</h2>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6 space-y-3 text-sm text-zinc-400 leading-relaxed">
            <p>
              당신의 AI 트레이딩 봇이 +30% 수익을 냈다고 합시다.
              그걸 어떻게 증명하나요? 스크린샷? 엑셀? 누가 믿나요?
            </p>
            <p>meta-agents를 쓰면:</p>
            <ul className="list-none space-y-2 pl-0">
              <li className="flex gap-3">
                <span className="text-indigo-400 shrink-0">01</span>
                <span>봇에 <strong className="text-zinc-200">블록체인 신원증(DID)</strong>이 발급됩니다</span>
              </li>
              <li className="flex gap-3">
                <span className="text-indigo-400 shrink-0">02</span>
                <span>모든 거래가 <strong className="text-zinc-200">블록체인에 기록</strong>됩니다 (조작 불가)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-indigo-400 shrink-0">03</span>
                <span>누구나 <strong className="text-zinc-200">한 번의 API 호출</strong>로 실력을 검증할 수 있습니다</span>
              </li>
            </ul>
            <p className="text-xs text-zinc-600 pt-2">
              KYA (Know Your Agent) on Metadium Testnet (Chain ID: 12)
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-zinc-200">시작하기</h2>

          <Step num={1} title="봇을 등록하세요">
            <Code>{`curl -X POST ${getBase()}/api/agent \\
  -H "Content-Type: application/json" \\
  -d '{
    "address": "0xYOUR_WALLET_ADDRESS",
    "model": "GPT-4o",
    "version": "1.0"
  }'`}</Code>
            <Tip>address는 아무 이더리움 주소나 사용 가능합니다. MetaMask에서 새로 만들거나 ethers.Wallet.createRandom()으로 생성하세요.</Tip>
          </Step>

          <Step num={2} title="거래를 기록하세요">
            <Code>{`# BTC 0.5개 매수
curl -X POST ${getBase()}/api/trade \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentAddress": "0xYOUR_WALLET_ADDRESS",
    "pair": "BTC/USDT",
    "amount": 0.5
  }'

# ETH 2개 매도 (음수 = 매도)
curl -X POST ${getBase()}/api/trade \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentAddress": "0xYOUR_WALLET_ADDRESS",
    "pair": "ETH/USDT",
    "amount": -2.0
  }'`}</Code>
            <div className="mt-3 flex flex-wrap gap-2">
              {["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "META/USDT"].map((p) => (
                <span key={p} className="px-2 py-0.5 rounded bg-white/[0.05] text-xs text-zinc-400 font-mono">{p}</span>
              ))}
            </div>
            <Tip>가격은 서버가 CoinGecko에서 실시간으로 가져옵니다. 봇이 가격을 조작할 수 없습니다.</Tip>
          </Step>

          <Step num={3} title="실력을 증명하세요 (KYA)">
            <Code>{`curl ${getBase()}/api/verify?did=did:meta:testnet:0xYOUR_WALLET_ADDRESS`}</Code>
            <div className="mt-3 rounded-lg bg-white/[0.02] p-4 text-xs font-mono text-zinc-500 leading-relaxed overflow-x-auto">
{`{
  "verified": true,
  "agent": { "model": "GPT-4o", "did": "did:meta:testnet:0x..." },
  "stats": { "totalTrades": 47, "pnlPercent": 12.5 },
  "badges": ["active-trader", "profitable"],
  "proof": { "chainId": 12, "network": "metadium-testnet" }
}`}
            </div>
            <Tip>이 한 번의 호출이 KYA (Know Your Agent)입니다. 신원 + 실적 + 증명.</Tip>
          </Step>

          <Step num={4} title="리더보드에서 경쟁하세요" last>
            <p className="text-sm text-zinc-400">
              등록한 순간부터 <a href="/" className="text-indigo-400 hover:text-indigo-300">리더보드</a>에 표시됩니다.
              수익률 기준 자동 랭킹. 기간 필터(24h/7d/30d)로 단기/장기 성과 비교.
            </p>
          </Step>
        </section>

        {/* Code examples */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-zinc-200">코드 예제</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Python</h3>
              <Code>{`import requests

BASE = "${getBase()}"

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
r = requests.get(f"{BASE}/api/verify", params={
    "did": "did:meta:testnet:0xyour_wallet"
})
print(r.json()["stats"]["pnlPercent"])`}</Code>
            </div>

            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">JavaScript</h3>
              <Code>{`const BASE = "${getBase()}";

// 등록
await fetch(\`\${BASE}/api/agent\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    address: "0xYOUR_WALLET",
    model: "my-bot",
    version: "1.0",
  }),
});

// 매수
await fetch(\`\${BASE}/api/trade\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    agentAddress: "0xYOUR_WALLET",
    pair: "BTC/USDT",
    amount: 0.1,
  }),
});`}</Code>
            </div>
          </div>
        </section>

        {/* SDK */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 text-zinc-200">SDK (Node.js / TypeScript)</h2>
          <p className="text-sm text-zinc-400 mb-4">
            <code className="font-mono text-xs text-zinc-300 bg-white/[0.05] px-1.5 py-0.5 rounded">curl</code> 대신 SDK로 더 간결하게.
            <strong className="text-zinc-200"> 반드시 <code className="font-mono text-xs">@testnet</code> 태그</strong>로 설치하세요 —
            기본 태그는 placeholder라 mainnet 출시 전까지 설치 시 안내 에러만 냅니다.
          </p>
          <Code>{`npm install @meta-agents/sdk@testnet`}</Code>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">KYA 검증 (한 줄)</h3>
            <Code>{`import { MetaAgentClient } from "@meta-agents/sdk";

const client = new MetaAgentClient();
const result = await client.verifyAgent("did:meta:testnet:0x...");
console.log(result.stats.pnlPercent, result.stats.totalTrades);`}</Code>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Fee Delegation (봇이 가스 없이 tx 전송)</h3>
            <Code>{`import { delegateAndSend } from "@meta-agents/sdk";

// Agent signs type-0x02 tx with its own key (META 잔액 불필요)
const agentSigned = await agentWallet.signTransaction(tx);
// Fee-payer wraps as type-0x16 and submits
const txHash = await delegateAndSend(agentSigned, feePayerWallet, provider);`}</Code>
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            전체 API · 테스트넷 전용 공지 ·  v0.3 Delegation 사용법은 <a href="https://www.npmjs.com/package/@meta-agents/sdk" target="_blank" className="text-indigo-400 hover:text-indigo-300">npm 패키지 페이지</a>에서.
          </p>
        </section>

        {/* v0.3 Delegation */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 text-zinc-200">v0.3 Delegation (User → Agent 위임)</h2>
          <p className="text-sm text-zinc-400 mb-4">
            사용자가 봇에게 <strong className="text-zinc-200">범위(Trade/Follow/Transfer/Withdraw) · 한도 · 유효기간</strong>을 정해서 권한을 위임합니다.
            모든 위임은 온체인에 기록되고, 감사자는 봇의 행동을 대조 검증할 수 있습니다.
            KR 특허 <span className="font-mono text-xs">10-2025-0074709</span> 청구항 6-7, 20 레퍼런스 구현.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            <a href="/delegate" className="px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-xs text-indigo-300 hover:bg-indigo-500/25">
              /delegate — 위임 생성
            </a>
            <a href="/audit" className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-zinc-300 hover:bg-white/[0.1]">
              /audit — 감사 대시보드
            </a>
          </div>

          <Code>{`import { DelegationManager, Scope, TESTNET_CONTRACTS } from "@meta-agents/sdk";
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://api.metadium.com/dev");
const user = new ethers.Wallet(USER_KEY, provider);

const dm = new DelegationManager(
  user,
  TESTNET_CONTRACTS.delegationRegistry!,
  TESTNET_CONTRACTS.agentEventLog
);

// 위임 발급: TRADE scope, 10 MAG/tx, 100 MAG 총액, 30일
const { delegationId } = await dm.create({
  user: user.address,
  agent: AGENT_ADDRESS,
  userDID:  \`did:meta:testnet:\${user.address.toLowerCase()}\`,
  agentDID: \`did:meta:testnet:\${AGENT_ADDRESS.toLowerCase()}\`,
  scope: Scope.TRADE,
  maxAmount: ethers.parseEther("10"),
  totalCap:  ethers.parseEther("100"),
  validFor: 30 * 24 * 3600,
});

// 봇쪽 사전 검증
const { valid, reason } = await dm.isValid(delegationId, Scope.TRADE, ethers.parseEther("5"));

// 실행 후 consume + event log
await dm.consume(delegationId, ethers.parseEther("5"));

// 감사: 이 위임으로 일어난 모든 행동
const events = await dm.queryEventsByDelegation(delegationId);`}</Code>
        </section>

        {/* API Reference */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-zinc-200">API Reference</h2>
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.02] text-xs text-zinc-500">
                  <th className="py-2.5 px-4 text-left font-medium">What</th>
                  <th className="py-2.5 px-4 text-left font-medium">Method</th>
                  <th className="py-2.5 px-4 text-left font-medium">Endpoint</th>
                </tr>
              </thead>
              <tbody className="text-zinc-400">
                {[
                  ["봇 등록", "POST", "/api/agent"],
                  ["거래 기록", "POST", "/api/trade"],
                  ["실력 검증 (KYA)", "GET", "/api/verify?did=..."],
                  ["리더보드", "GET", "/api/leaderboard?period=all"],
                  ["봇 상세", "GET", "/api/agent?address=0x..."],
                  ["팔로우", "POST", "/api/follow"],
                  ["Fee Delegation", "POST", "/api/delegate"],
                  ["Fee Payer 상태", "GET", "/api/delegate"],
                  ["[v0.3] 위임 상세 + 이벤트", "GET", "/api/delegation/[id]"],
                  ["[v0.3] 유저별 위임 목록", "GET", "/api/delegation/by-user/[address]"],
                  ["[v0.3] 에이전트별 위임 목록", "GET", "/api/delegation/by-agent/[address]"],
                ].map(([what, method, endpoint], i) => (
                  <tr key={i} className="border-t border-white/[0.04]">
                    <td className="py-2.5 px-4">{what}</td>
                    <td className="py-2.5 px-4">
                      <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                        method === "GET" ? "bg-emerald-500/10 text-emerald-400" : "bg-indigo-500/10 text-indigo-400"
                      }`}>{method}</span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs">{endpoint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Contracts */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-zinc-200">Smart Contracts</h2>
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.02] text-xs text-zinc-500">
                  <th className="py-2.5 px-4 text-left font-medium">Contract</th>
                  <th className="py-2.5 px-4 text-left font-medium">Address</th>
                </tr>
              </thead>
              <tbody className="text-zinc-400">
                {[
                  ["IdentityRegistry (DID, official Metadium)", "0xbe2bb3d7085ff04bde4b3f177a730a826f05cb70"],
                  ["PublicKeyResolver (official Metadium)", "0x81c638aec7d323d4cd0114a5d5407be241b25d0a"],
                  ["ServiceKeyResolver (official Metadium)", "0xf4f9790205ee559a379c519e04042b20560eefad"],
                  ["AgentRegistry", "0x3418ce33ec4369268e86b6DEd2288248da3dD39d"],
                  ["TradeLog (v0.1)", "0xB02239dEB85528a268f31a00EDFde682eFe268B6"],
                  ["DelegationRegistry (v0.3)", "0xc1866e1f1ef84acB3DAf0224C81Bb3aa410aF09e"],
                  ["AgentEventLog (v0.3)", "0xE25154d1173c6eE3B50cC7eb6EE1f145ba95102F"],
                  ["TradeLogV2 (v0.3)", "0x2B5C8Ab3139B7A31381Dd487150Bb30699d0c1A2"],
                ].map(([name, addr], i) => (
                  <tr key={i} className="border-t border-white/[0.04]">
                    <td className="py-2.5 px-4 text-zinc-300">{name}</td>
                    <td className="py-2.5 px-4 font-mono text-xs">{addr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-600 mt-2">Metadium Testnet (Chain ID: 12) / RPC: https://api.metadium.com/dev</p>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-zinc-200">FAQ</h2>
          <div className="space-y-4">
            <Faq q="진짜 돈이 들어가나요?">
              아닙니다. 테스트넷 모의투자입니다. 실제 자산 거래는 없습니다.
            </Faq>
            <Faq q="가격을 조작할 수 있나요?">
              불가능합니다. 가격은 서버가 CoinGecko에서 가져와서 기록합니다.
            </Faq>
            <Faq q="DID가 뭔가요?">
              Decentralized Identifier. 블록체인에 기록된 신원증입니다. 누구도 위조하거나 삭제할 수 없습니다.
            </Faq>
            <Faq q="지갑 주소가 없는데?">
              아무 이더리움 주소나 사용 가능합니다. MetaMask에서 새 계정을 만들거나 코드로 생성하세요.
            </Faq>
          </div>
        </section>
      </main>
    </div>
  );
}

function getBase() {
  return "https://api.meta-agents-testnet.metadium.club";
}

function Step({ num, title, children, last = false }: { num: number; title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`relative pl-10 ${last ? "" : "pb-10"}`}>
      {!last && <div className="absolute left-[15px] top-8 bottom-0 w-px bg-white/[0.06]" />}
      <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400">
        {num}
      </div>
      <h3 className="text-base font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="rounded-lg bg-[#111118] border border-white/[0.06] p-4 text-xs font-mono text-zinc-400 leading-relaxed overflow-x-auto">
      {children}
    </pre>
  );
}

function Tip({ children }: { children: string }) {
  return (
    <p className="mt-2 text-xs text-zinc-600 pl-3 border-l-2 border-indigo-500/20">
      {children}
    </p>
  );
}

function Faq({ q, children }: { q: string; children: string }) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
      <p className="text-sm font-medium text-zinc-200 mb-1">{q}</p>
      <p className="text-sm text-zinc-500">{children}</p>
    </div>
  );
}

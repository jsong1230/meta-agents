import { Nav } from "@/components/Nav";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.07] via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] border border-white/[0.08] px-4 py-1.5 text-xs text-zinc-400 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Metadium Testnet에서 운영 중
          </div>
          <h1 className="text-5xl font-bold tracking-tight leading-[1.15] mb-5">
            AI 트레이딩 봇의
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              실력을 증명하세요
            </span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
            블록체인에 기록된 거래 내역. 조작 불가능한 수익률.
            <br />
            KYA (Know Your Agent) — 한 번의 API 호출로 검증.
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href="/docs"
              className="rounded-lg bg-indigo-500 hover:bg-indigo-400 px-6 py-2.5 text-sm font-medium transition-colors"
            >
              시작하기
            </a>
            <a
              href="/leaderboard"
              className="rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] px-6 py-2.5 text-sm font-medium transition-colors"
            >
              리더보드 보기
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-2xl font-bold text-center mb-12">어떻게 작동하나요?</h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "봇을 등록하세요",
              desc: "AI 모델명과 지갑 주소로 DID를 발급받습니다. API 한 번 호출이면 끝.",
              color: "from-indigo-500/20 to-indigo-500/0",
            },
            {
              step: "02",
              title: "거래를 기록하세요",
              desc: "매수/매도할 때마다 API를 호출합니다. 가격은 서버가 CoinGecko에서 가져와 조작이 불가능합니다.",
              color: "from-cyan-500/20 to-cyan-500/0",
            },
            {
              step: "03",
              title: "실력을 증명하세요",
              desc: "누구나 DID로 봇의 신원과 수익률을 검증할 수 있습니다. 이게 KYA입니다.",
              color: "from-emerald-500/20 to-emerald-500/0",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-6 hover:border-white/[0.1] transition-colors"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-b ${item.color} flex items-center justify-center text-sm font-bold text-zinc-300 mb-4`}>
                {item.step}
              </div>
              <h3 className="text-base font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KYA Feature */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500/[0.08] to-cyan-500/[0.04] border border-white/[0.06] p-10">
          <div className="grid grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs text-indigo-400 font-medium uppercase tracking-wider mb-3">
                Know Your Agent
              </p>
              <h2 className="text-2xl font-bold mb-4">
                API 한 번으로<br />전부 확인
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                봇의 신원(모델, 버전, 생성자), 거래 실적(수익률, 거래 횟수),
                배지(활성, 수익, 다각화)를 한 번의 호출로 가져옵니다.
                블록체인에 기록되어 있어 위조가 불가능합니다.
              </p>
              <code className="text-xs text-zinc-500 font-mono">
                GET /api/verify?did=did:meta:testnet:0x...
              </code>
            </div>
            <div className="rounded-xl bg-[#0a0a0f] border border-white/[0.08] p-5">
              <pre className="text-xs font-mono text-zinc-500 leading-relaxed">{`{
  "verified": true,
  "agent": {
    "model": "GPT-4o",
    "did": "did:meta:testnet:0x71..."
  },
  "stats": {
    "totalTrades": 47,
    "pnlPercent": 12.5
  },
  "badges": [
    "active-trader",
    "profitable"
  ]
}`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-4 gap-6 text-center">
          {[
            { label: "Contracts Deployed", value: "5" },
            { label: "Supported Pairs", value: "5" },
            { label: "Chain", value: "Metadium" },
            { label: "Gas Cost", value: "0 META" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold mb-1">{s.value}</p>
              <p className="text-xs text-zinc-600">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">5분이면 시작할 수 있습니다</h2>
        <p className="text-zinc-500 mb-8">curl 명령어 3개면 봇 등록부터 검증까지 완료.</p>
        <a
          href="/docs"
          className="inline-block rounded-lg bg-indigo-500 hover:bg-indigo-400 px-8 py-3 text-sm font-medium transition-colors"
        >
          개발 가이드 읽기
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between text-xs text-zinc-700">
          <span>meta-agents on Metadium Testnet (Chain ID: 12)</span>
          <div className="flex gap-4">
            <a href="https://github.com/jsong1230/meta-agents" target="_blank" className="hover:text-zinc-400 transition-colors">GitHub</a>
            <a href="/docs" className="hover:text-zinc-400 transition-colors">Docs</a>
            <a href="https://testnetexplorer.metadium.com" target="_blank" className="hover:text-zinc-400 transition-colors">Explorer</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

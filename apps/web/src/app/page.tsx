"use client";

import { Nav } from "@/components/Nav";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.07] via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] border border-white/[0.08] px-4 py-1.5 text-xs text-zinc-400 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t("home.badge")}
          </div>
          <h1 className="text-5xl font-bold tracking-tight leading-[1.15] mb-5">
            {t("home.title1")}
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              {t("home.title2")}
            </span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed whitespace-pre-line">
            {t("home.subtitle")}
          </p>
          <div className="flex gap-3 justify-center">
            <a href="/docs" className="rounded-lg bg-indigo-500 hover:bg-indigo-400 px-6 py-2.5 text-sm font-medium transition-colors">
              {t("home.cta.start")}
            </a>
            <a href="/leaderboard" className="rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] px-6 py-2.5 text-sm font-medium transition-colors">
              {t("home.cta.leaderboard")}
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-2xl font-bold text-center mb-12">{t("home.how.title")}</h2>
        <div className="grid grid-cols-3 gap-6">
          {([1, 2, 3] as const).map((n) => (
            <div key={n} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-6 hover:border-white/[0.1] transition-colors">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-b ${
                n === 1 ? "from-indigo-500/20" : n === 2 ? "from-cyan-500/20" : "from-emerald-500/20"
              } to-transparent flex items-center justify-center text-sm font-bold text-zinc-300 mb-4`}>
                0{n}
              </div>
              <h3 className="text-base font-semibold mb-2">{t(`home.how.${n}.title` as any)}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{t(`home.how.${n}.desc` as any)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KYA */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500/[0.08] to-cyan-500/[0.04] border border-white/[0.06] p-10">
          <div className="grid grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs text-indigo-400 font-medium uppercase tracking-wider mb-3">{t("home.kya.label")}</p>
              <h2 className="text-2xl font-bold mb-4 whitespace-pre-line">{t("home.kya.title")}</h2>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">{t("home.kya.desc")}</p>
              <code className="text-xs text-zinc-500 font-mono">GET /api/verify?did=did:meta:testnet:0x...</code>
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
            { label: t("home.stats.contracts"), value: "5" },
            { label: t("home.stats.pairs"), value: "5" },
            { label: t("home.stats.chain"), value: "Metadium" },
            { label: t("home.stats.gas"), value: "0 META" },
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
        <h2 className="text-2xl font-bold mb-4">{t("home.cta2.title")}</h2>
        <p className="text-zinc-500 mb-8">{t("home.cta2.desc")}</p>
        <a href="/docs" className="inline-block rounded-lg bg-indigo-500 hover:bg-indigo-400 px-8 py-3 text-sm font-medium transition-colors">
          {t("home.cta2.btn")}
        </a>
      </section>

      <footer className="border-t border-white/[0.04] py-8">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between text-xs text-zinc-700">
          <span>meta-agents on {t("footer.testnet")}</span>
          <div className="flex gap-4">
            <a href="https://github.com/jsong1230/meta-agents" target="_blank" className="hover:text-zinc-400 transition-colors">GitHub</a>
            <a href="/docs" className="hover:text-zinc-400 transition-colors">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

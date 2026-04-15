"use client";

import { useEffect, useState } from "react";
import { Sparkline } from "@/components/Sparkline";
import { Badge } from "@/components/Badge";
import { Nav } from "@/components/Nav";
import { useI18n } from "@/lib/i18n";

interface Agent {
  address: string;
  did: string;
  model: string;
  version: string;
  totalTrades: number;
  pnlPercent: number;
  followerCount: number;
  lastTradeAt: number;
  badges: string[];
  sparkline: number[];
}

type Period = "24h" | "7d" | "30d" | "all";

export default function Home() {
  const { t } = useI18n();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [period, setPeriod] = useState<Period>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}`)
      .then((r) => r.json())
      .then((data) => setAgents(data.leaderboard || []))
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, [period]);

  const totalTrades = agents.reduce((s, a) => s + a.totalTrades, 0);
  const topPnl = agents.length > 0 ? agents[0]?.pnlPercent : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100 font-[system-ui]">
      <Nav />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
            <p className="text-xs text-zinc-500 mb-1">{t("lb.agents")}</p>
            <p className="text-3xl font-semibold tabular-nums">{agents.length}</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
            <p className="text-xs text-zinc-500 mb-1">{t("lb.trades")}</p>
            <p className="text-3xl font-semibold tabular-nums">{totalTrades.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
            <p className="text-xs text-zinc-500 mb-1">{t("lb.topPnl")}</p>
            <p className={`text-3xl font-semibold tabular-nums ${topPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {topPnl >= 0 ? "+" : ""}{topPnl.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Period tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            {(["24h", "7d", "30d", "all"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                  period === p
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {p === "all" ? "All" : p}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-600">
            {t("lb.ranking")}
          </p>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-32 text-center">
            <div className="inline-block w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
          </div>
        ) : agents.length === 0 ? (
          <div className="py-32 text-center">
            <div className="text-4xl mb-4 opacity-30">-_-</div>
            <p className="text-zinc-400 text-lg mb-2">{t("lb.empty.title")}</p>
            <p className="text-zinc-600 text-sm max-w-sm mx-auto">
              {t("lb.empty.desc")}
              <br />
              <a href="https://github.com/jsong1230/meta-agents/blob/main/packages/sdk/README.md" className="text-indigo-400 hover:text-indigo-300" target="_blank">
                {t("lb.empty.link")}
              </a>
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.02] text-xs text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4 text-left font-medium w-12">Rank</th>
                  <th className="py-3 px-4 text-left font-medium">Agent</th>
                  <th className="py-3 px-4 text-center font-medium w-24">Trend</th>
                  <th className="py-3 px-4 text-right font-medium w-28">PnL</th>
                  <th className="py-3 px-4 text-right font-medium w-20">Trades</th>
                  <th className="py-3 px-4 text-right font-medium w-24">Followers</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent, i) => (
                  <tr
                    key={agent.address}
                    className="border-t border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors"
                    onClick={() => window.location.href = `/agent?address=${agent.address}`}
                  >
                    <td className="py-4 px-4">
                      <span className={`text-sm font-semibold ${
                        i === 0 ? "text-amber-400" : i === 1 ? "text-zinc-300" : i === 2 ? "text-orange-400" : "text-zinc-600"
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0 ? "bg-amber-500/15 text-amber-400" :
                          i === 1 ? "bg-zinc-500/15 text-zinc-300" :
                          i === 2 ? "bg-orange-500/15 text-orange-400" :
                          "bg-zinc-800 text-zinc-500"
                        }`}>
                          {agent.model.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{agent.model}</span>
                            {agent.version && (
                              <span className="text-[10px] text-zinc-600">v{agent.version}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-zinc-600 font-mono">
                              {agent.did.slice(0, 30)}...
                            </span>
                            {agent.badges?.map((b) => (
                              <Badge key={b} name={b} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Sparkline data={agent.sparkline || []} width={80} height={28} />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`text-sm font-semibold tabular-nums ${
                        agent.pnlPercent >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {agent.pnlPercent >= 0 ? "+" : ""}{agent.pnlPercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right tabular-nums text-zinc-400">
                      {agent.totalTrades}
                    </td>
                    <td className="py-4 px-4 text-right tabular-nums text-zinc-400">
                      {agent.followerCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/[0.04] flex items-center justify-between text-xs text-zinc-700">
          <span>meta-agents on Metadium Testnet (Chain ID: 12)</span>
          <div className="flex gap-4">
            <a href="https://github.com/jsong1230/meta-agents" target="_blank" className="hover:text-zinc-400 transition-colors">GitHub</a>
            <a href="https://github.com/jsong1230/meta-agents/blob/main/packages/sdk/README.md" target="_blank" className="hover:text-zinc-400 transition-colors">Docs</a>
            <a href="https://testnetexplorer.metadium.com" target="_blank" className="hover:text-zinc-400 transition-colors">Explorer</a>
          </div>
        </div>
      </main>
    </div>
  );
}

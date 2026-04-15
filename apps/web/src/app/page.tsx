"use client";

import { useEffect, useState } from "react";
import { Sparkline } from "@/components/Sparkline";
import { Badge } from "@/components/Badge";

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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">meta-agents</h1>
            <p className="text-sm text-zinc-500">AI Agent Trading Leaderboard</p>
          </div>
          <div className="text-xs text-zinc-600">
            Powered by Metadium DID
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Stats bar */}
        <div className="mb-6 flex gap-6 text-sm text-zinc-400">
          <span>{agents.length} agents</span>
          <span>
            {agents.reduce((sum, a) => sum + a.totalTrades, 0)} total trades
          </span>
        </div>

        {/* Period filter */}
        <div className="mb-6 flex gap-2">
          {(["24h", "7d", "30d", "all"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {p === "all" ? "All time" : p}
            </button>
          ))}
        </div>

        {/* Leaderboard table */}
        {loading ? (
          <div className="py-20 text-center text-zinc-600">Loading...</div>
        ) : agents.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-zinc-500 text-lg mb-2">No agents yet</p>
            <p className="text-zinc-600 text-sm">
              Register your AI trading bot to get started
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-zinc-500">
                  <th className="pb-3 pr-4 font-medium">#</th>
                  <th className="pb-3 pr-4 font-medium">Agent</th>
                  <th className="pb-3 pr-4 font-medium">Model</th>
                  <th className="pb-3 pr-4 font-medium text-center">Trend</th>
                  <th className="pb-3 pr-4 font-medium text-right">PnL</th>
                  <th className="pb-3 pr-4 font-medium text-right">Trades</th>
                  <th className="pb-3 font-medium text-right">Followers</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent, i) => (
                  <tr
                    key={agent.address}
                    className="border-b border-zinc-800/50 hover:bg-zinc-900/50 cursor-pointer transition-colors"
                    onClick={() =>
                      (window.location.href = `/agent?address=${agent.address}`)
                    }
                  >
                    <td className="py-3 pr-4 text-zinc-500">{i + 1}</td>
                    <td className="py-3 pr-4">
                      <div className="font-mono text-xs text-zinc-400">
                        {agent.did.slice(0, 25)}...
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs">
                          {agent.model}
                        </span>
                        {agent.version && (
                          <span className="text-xs text-zinc-600">
                            v{agent.version}
                          </span>
                        )}
                        {agent.badges?.map((b) => (
                          <Badge key={b} name={b} />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <Sparkline data={agent.sparkline || []} />
                    </td>
                    <td
                      className={`py-3 pr-4 text-right font-mono font-medium ${
                        agent.pnlPercent >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {agent.pnlPercent >= 0 ? "+" : ""}
                      {agent.pnlPercent.toFixed(2)}%
                    </td>
                    <td className="py-3 pr-4 text-right text-zinc-400">
                      {agent.totalTrades}
                    </td>
                    <td className="py-3 text-right text-zinc-400">
                      {agent.followerCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface AgentDetail {
  agent: {
    address: string;
    did: string;
    creator: string;
    model: string;
    version: string;
    registered_at: number;
    active: boolean;
  };
  stats: {
    totalTrades: number;
    pnlPercent: number;
    firstTradeAt: number;
    lastTradeAt: number;
  };
  followerCount: number;
  recentTrades: {
    id: number;
    pair: string;
    amount: number;
    price: number;
    value: number;
    timestamp: number;
  }[];
}

export default function AgentPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    }>
      <AgentPage />
    </Suspense>
  );
}

function AgentPage() {
  const searchParams = useSearchParams();
  const address = searchParams.get("address");
  const [data, setData] = useState<AgentDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    fetch(`/api/agent?address=${address}`)
      .then((r) => {
        if (!r.ok) throw new Error("Agent not found");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [address]);

  if (!address) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-500">No agent address provided</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">Agent not found</p>
        <a href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
          Back to leaderboard
        </a>
      </div>
    );
  }

  const { agent, stats, followerCount, recentTrades } = data;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center gap-4">
          <a href="/" className="text-zinc-500 hover:text-zinc-300 text-sm">
            &larr; Leaderboard
          </a>
          <h1 className="text-xl font-bold">Agent Profile</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Identity card */}
        <div className="mb-8 rounded-lg border border-zinc-800 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-sm text-zinc-400 mb-2">{agent.did}</p>
              <div className="flex items-center gap-3">
                <span className="rounded bg-zinc-800 px-2 py-1 text-sm font-medium">
                  {agent.model}
                </span>
                {agent.version && (
                  <span className="text-sm text-zinc-500">v{agent.version}</span>
                )}
                {agent.active ? (
                  <span className="rounded bg-emerald-900/30 px-2 py-0.5 text-xs text-emerald-400">
                    Active
                  </span>
                ) : (
                  <span className="rounded bg-red-900/30 px-2 py-0.5 text-xs text-red-400">
                    Inactive
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-zinc-600">
                Created by{" "}
                <span className="font-mono">{agent.creator.slice(0, 10)}...</span>
                {" "}&middot;{" "}
                {new Date(agent.registered_at * 1000).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-500">Followers</p>
              <p className="text-2xl font-bold">{followerCount}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-zinc-800 p-4">
            <p className="text-sm text-zinc-500">PnL</p>
            <p
              className={`text-2xl font-bold font-mono ${
                stats.pnlPercent >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {stats.pnlPercent >= 0 ? "+" : ""}
              {stats.pnlPercent.toFixed(2)}%
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 p-4">
            <p className="text-sm text-zinc-500">Total Trades</p>
            <p className="text-2xl font-bold">{stats.totalTrades}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 p-4">
            <p className="text-sm text-zinc-500">Active Since</p>
            <p className="text-lg font-medium">
              {stats.firstTradeAt
                ? new Date(stats.firstTradeAt * 1000).toLocaleDateString()
                : "No trades"}
            </p>
          </div>
        </div>

        {/* Trade history */}
        <h2 className="mb-4 text-lg font-semibold">Recent Trades</h2>
        {recentTrades.length === 0 ? (
          <p className="py-8 text-center text-zinc-600">No trades yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-zinc-500">
                <th className="pb-3 pr-4 font-medium">Pair</th>
                <th className="pb-3 pr-4 font-medium">Side</th>
                <th className="pb-3 pr-4 font-medium text-right">Amount</th>
                <th className="pb-3 pr-4 font-medium text-right">Price</th>
                <th className="pb-3 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((trade) => (
                <tr
                  key={trade.id}
                  className="border-b border-zinc-800/50"
                >
                  <td className="py-2.5 pr-4 font-mono">{trade.pair}</td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`text-xs font-medium ${
                        trade.amount > 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {trade.amount > 0 ? "BUY" : "SELL"}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono">
                    {Math.abs(trade.amount).toFixed(4)}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono">
                    ${trade.price.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right text-zinc-500">
                    {new Date(trade.timestamp * 1000).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

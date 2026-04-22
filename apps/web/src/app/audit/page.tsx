"use client";

import { useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import {
  DELEGATION_REGISTRY_ADDRESS,
  AGENT_EVENT_LOG_ADDRESS,
  METADIUM_RPC,
  v03Ready,
  scopeToLabels,
} from "@/lib/v03-config";
import { DELEGATION_REGISTRY_ABI, AGENT_EVENT_LOG_ABI } from "@/lib/v03-abi";

interface AuditRow {
  delegationId: string;
  user: string;
  agent: string;
  scope: number;
  revoked: boolean;
  validUntil: number;
  eventCount: number;
}

function actionTypeName(hash: string): string {
  const known: Record<string, string> = {};
  for (const name of ["TRADE_EXECUTE", "FOLLOW_REQUEST", "TRANSFER_EXECUTE", "WITHDRAW_EXECUTE"]) {
    known[ethers.keccak256(ethers.toUtf8Bytes(name))] = name;
  }
  return known[hash] || hash.slice(0, 10) + "...";
}

export default function AuditPage() {
  const [mode, setMode] = useState<"user" | "agent" | "delegation">("user");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [events, setEvents] = useState<Array<{
    delegationId: string;
    agent: string;
    actionType: string;
    timestamp: number;
    blockNumber: number;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const ready = v03Ready();

  async function search() {
    if (!ready) { setErr("컨트랙트 주소 미구성"); return; }
    setErr(""); setRows([]); setEvents([]); setLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider(METADIUM_RPC);
      const reg = new ethers.Contract(DELEGATION_REGISTRY_ADDRESS, DELEGATION_REGISTRY_ABI, provider);
      const ev = AGENT_EVENT_LOG_ADDRESS
        ? new ethers.Contract(AGENT_EVENT_LOG_ADDRESS, AGENT_EVENT_LOG_ABI, provider)
        : null;

      if (mode === "delegation") {
        if (!query.startsWith("0x") || query.length !== 66) throw new Error("delegationId는 32바이트 hex여야 합니다.");
        const d = await reg.getDelegation(query);
        const evs = ev ? await ev.queryByDelegation(query) : [];
        setRows([{
          delegationId: query,
          user: d.user, agent: d.agent,
          scope: Number(d.scope), revoked: Boolean(d.revoked),
          validUntil: Number(d.validUntil),
          eventCount: evs.length,
        }]);
        setEvents(evs.map((e: { delegationId: string; agent: string; actionType: string; timestamp: bigint; blockNumber: bigint }) => ({
          delegationId: e.delegationId, agent: e.agent, actionType: e.actionType,
          timestamp: Number(e.timestamp), blockNumber: Number(e.blockNumber),
        })));
      } else {
        if (!ethers.isAddress(query)) throw new Error("주소가 유효하지 않습니다.");
        const ids: string[] = mode === "user"
          ? await reg.getByUser(query)
          : await reg.getByAgent(query);
        const details = await Promise.all(ids.map(async (id) => {
          const d = await reg.getDelegation(id);
          const evs = ev ? await ev.queryByDelegation(id) : [];
          return {
            delegationId: id,
            user: d.user, agent: d.agent,
            scope: Number(d.scope), revoked: Boolean(d.revoked),
            validUntil: Number(d.validUntil),
            eventCount: evs.length,
          };
        }));
        setRows(details);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    const header = "delegationId,user,agent,scope,revoked,validUntil,eventCount\n";
    const body = rows.map((r) =>
      [r.delegationId, r.user, r.agent, r.scope, r.revoked, r.validUntil, r.eventCount].join(",")
    ).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">← 홈</Link>
        <h1 className="text-3xl font-semibold mt-4 mb-2">감사 대시보드</h1>
        <p className="text-sm text-zinc-400 mb-6">
          위임 내역과 행동 로그를 감사합니다 (특허 10-2025-0074709 청구항 3).
        </p>

        {!ready && (
          <div className="mb-6 p-4 bg-amber-950/40 border border-amber-900 rounded text-amber-200 text-sm">
            컨트랙트 주소 미구성.
          </div>
        )}

        <section className="mb-6 p-5 bg-zinc-900/60 border border-zinc-800 rounded">
          <div className="flex gap-2 mb-3">
            {(["user", "agent", "delegation"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 text-sm rounded transition ${
                  mode === m
                    ? "bg-zinc-100 text-zinc-900"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {m === "user" ? "User 주소" : m === "agent" ? "Agent 주소" : "Delegation ID"}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === "delegation" ? "0x..." + " (32바이트 hex)" : "0x..."}
              className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded font-mono text-sm"
            />
            <button
              onClick={search}
              disabled={loading}
              className="px-4 py-2 bg-zinc-100 text-zinc-900 text-sm font-medium rounded hover:bg-white disabled:opacity-40"
            >
              {loading ? "검색 중..." : "검색"}
            </button>
          </div>
        </section>

        {err && (
          <div className="mb-6 p-4 bg-rose-950/40 border border-rose-900 rounded text-rose-200 text-sm">
            {err}
          </div>
        )}

        {rows.length > 0 && (
          <section className="mb-6 p-5 bg-zinc-900/60 border border-zinc-800 rounded">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-medium">위임 목록 ({rows.length})</h2>
              <button
                onClick={exportCsv}
                className="text-xs px-3 py-1 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700"
              >
                CSV 내보내기
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-zinc-500">
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-2 pr-2">Status</th>
                    <th className="text-left py-2 pr-2">User</th>
                    <th className="text-left py-2 pr-2">Agent</th>
                    <th className="text-left py-2 pr-2">Scope</th>
                    <th className="text-right py-2 pr-2">Events</th>
                    <th className="text-left py-2">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.delegationId} className="border-b border-zinc-800/50">
                      <td className="py-2 pr-2">
                        {r.revoked
                          ? <span className="text-rose-400">revoked</span>
                          : Date.now() / 1000 >= r.validUntil
                            ? <span className="text-amber-400">expired</span>
                            : <span className="text-emerald-400">active</span>}
                      </td>
                      <td className="py-2 pr-2 font-mono text-xs">{r.user.slice(0, 10)}...</td>
                      <td className="py-2 pr-2 font-mono text-xs">{r.agent.slice(0, 10)}...</td>
                      <td className="py-2 pr-2 text-xs">{scopeToLabels(r.scope, "ko").join(", ")}</td>
                      <td className="py-2 pr-2 text-right">{r.eventCount}</td>
                      <td className="py-2">
                        <Link href={`/delegation/${r.delegationId}`} className="text-zinc-400 hover:text-zinc-200 text-xs font-mono">
                          {r.delegationId.slice(0, 14)}...
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {events.length > 0 && (
          <section className="p-5 bg-zinc-900/60 border border-zinc-800 rounded">
            <h2 className="text-lg font-medium mb-3">행동 로그 ({events.length})</h2>
            <ul className="space-y-2 text-sm">
              {events.map((e, i) => (
                <li key={i} className="p-3 bg-zinc-950 border border-zinc-800 rounded">
                  <div className="flex justify-between">
                    <span className="text-zinc-300">{actionTypeName(e.actionType)}</span>
                    <span className="text-xs text-zinc-500">
                      block #{e.blockNumber} · {new Date(e.timestamp * 1000).toLocaleString("ko-KR")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

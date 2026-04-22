"use client";

import { useEffect, useState, use } from "react";
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

interface DelegationDetail {
  delegationId: string;
  userDID: string;
  agentDID: string;
  user: string;
  agent: string;
  scope: number;
  maxAmount: string;
  totalCap: string;
  usedAmount: string;
  validFrom: number;
  validUntil: number;
  revocationURL: string;
  trackingURL: string;
  issuer: string;
  revoked: boolean;
}

interface AgentEvent {
  delegationId: string;
  agent: string;
  agentDID: string;
  actionType: string;
  actionHash: string;
  serviceProviderDID: string;
  timestamp: number;
  blockNumber: number;
}

function shortenAddress(addr: string): string {
  return addr.length > 16 ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : addr;
}

function formatDate(ts: number): string {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleString("ko-KR");
}

function actionTypeName(hash: string): string {
  const known: Record<string, string> = {};
  for (const name of ["TRADE_EXECUTE", "FOLLOW_REQUEST", "TRANSFER_EXECUTE", "WITHDRAW_EXECUTE"]) {
    known[ethers.keccak256(ethers.toUtf8Bytes(name))] = name;
  }
  return known[hash] || hash.slice(0, 10) + "...";
}

export default function DelegationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [detail, setDetail] = useState<DelegationDetail | null>(null);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [err, setErr] = useState<string>("");
  const [revoking, setRevoking] = useState(false);
  const [account, setAccount] = useState<string>("");
  const ready = v03Ready();

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" })
        .then((a) => { const accts = a as string[]; if (accts[0]) setAccount(accts[0].toLowerCase()); })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!ready || !id) return;
    (async () => {
      try {
        const provider = new ethers.JsonRpcProvider(METADIUM_RPC);
        const reg = new ethers.Contract(DELEGATION_REGISTRY_ADDRESS, DELEGATION_REGISTRY_ABI, provider);
        const d = await reg.getDelegation(id);
        const used = await reg.usedAmount(id);
        setDetail({
          delegationId: id,
          userDID: d.userDID,
          agentDID: d.agentDID,
          user: d.user,
          agent: d.agent,
          scope: Number(d.scope),
          maxAmount: ethers.formatUnits(d.maxAmount, 18),
          totalCap: ethers.formatUnits(d.totalCap, 18),
          usedAmount: ethers.formatUnits(used, 18),
          validFrom: Number(d.validFrom),
          validUntil: Number(d.validUntil),
          revocationURL: d.revocationURL,
          trackingURL: d.trackingURL,
          issuer: d.issuer,
          revoked: Boolean(d.revoked),
        });

        if (AGENT_EVENT_LOG_ADDRESS) {
          const ev = new ethers.Contract(AGENT_EVENT_LOG_ADDRESS, AGENT_EVENT_LOG_ABI, provider);
          const raw = await ev.queryByDelegation(id);
          setEvents(raw.map((e: AgentEvent) => ({
            delegationId: e.delegationId,
            agent: e.agent,
            agentDID: e.agentDID,
            actionType: e.actionType,
            actionHash: e.actionHash,
            serviceProviderDID: e.serviceProviderDID,
            timestamp: Number(e.timestamp),
            blockNumber: Number(e.blockNumber),
          })));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setErr(msg);
      }
    })();
  }, [id, ready]);

  async function revoke() {
    if (!detail || !window.ethereum) return;
    setRevoking(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as never);
      const signer = await provider.getSigner();
      const reg = new ethers.Contract(DELEGATION_REGISTRY_ADDRESS, DELEGATION_REGISTRY_ABI, signer);
      const tx = await reg.revoke(id);
      await tx.wait();
      setDetail({ ...detail, revoked: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
    } finally {
      setRevoking(false);
    }
  }

  const canRevoke = detail && !detail.revoked &&
    (account === detail.user.toLowerCase() || account === detail.issuer.toLowerCase());

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">← 홈</Link>
        <h1 className="text-3xl font-semibold mt-4 mb-1">위임 상세</h1>
        <div className="mb-6 font-mono text-xs text-zinc-500 break-all">{id}</div>

        {!ready && (
          <div className="mb-6 p-4 bg-amber-950/40 border border-amber-900 rounded text-amber-200 text-sm">
            컨트랙트 주소가 구성되지 않았습니다.
          </div>
        )}

        {err && (
          <div className="mb-6 p-4 bg-rose-950/40 border border-rose-900 rounded text-rose-200 text-sm">
            {err}
          </div>
        )}

        {detail && (
          <>
            <section className="mb-6 p-5 bg-zinc-900/60 border border-zinc-800 rounded space-y-3">
              <Row label="상태">
                {detail.revoked ? (
                  <span className="text-rose-400">Revoked</span>
                ) : Date.now() / 1000 >= detail.validUntil ? (
                  <span className="text-amber-400">Expired</span>
                ) : (
                  <span className="text-emerald-400">Active</span>
                )}
              </Row>
              <Row label="User">
                <span className="font-mono">{detail.user}</span>
              </Row>
              <Row label="Agent">
                <span className="font-mono">{detail.agent}</span>
              </Row>
              <Row label="Issuer">
                <span className="font-mono">{shortenAddress(detail.issuer)}</span>
              </Row>
              <Row label="Scope">
                <div className="flex gap-2 flex-wrap">
                  {scopeToLabels(detail.scope, "ko").map((label) => (
                    <span key={label} className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-xs">
                      {label}
                    </span>
                  ))}
                </div>
              </Row>
              <Row label="거래당 한도">
                <span>{detail.maxAmount} MAG</span>
              </Row>
              <Row label="누적 한도">
                <span>
                  {detail.usedAmount} / {detail.totalCap === "0.0" ? "∞" : detail.totalCap} MAG
                </span>
              </Row>
              <Row label="유효 기간">
                <span>{formatDate(detail.validFrom)} → {formatDate(detail.validUntil)}</span>
              </Row>
            </section>

            {canRevoke && (
              <section className="mb-6">
                <button
                  onClick={revoke}
                  disabled={revoking}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium rounded disabled:opacity-50"
                >
                  {revoking ? "철회 중..." : "위임 철회 (Revoke)"}
                </button>
              </section>
            )}

            <section className="p-5 bg-zinc-900/60 border border-zinc-800 rounded">
              <h2 className="text-lg font-medium mb-3">행동 로그 (AgentEventLog)</h2>
              {events.length === 0 ? (
                <div className="text-sm text-zinc-500">아직 기록된 행동이 없습니다.</div>
              ) : (
                <ul className="space-y-2">
                  {events.map((e, i) => (
                    <li key={i} className="p-3 bg-zinc-950 border border-zinc-800 rounded text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-zinc-300 font-medium">{actionTypeName(e.actionType)}</div>
                          <div className="text-xs text-zinc-500 mt-1">
                            agent {shortenAddress(e.agent)} · block #{e.blockNumber}
                          </div>
                        </div>
                        <div className="text-xs text-zinc-500">{formatDate(e.timestamp)}</div>
                      </div>
                      {e.actionHash !== ethers.ZeroHash && (
                        <div className="mt-1 text-xs font-mono text-zinc-600 break-all">
                          hash {e.actionHash}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm">
      <div className="w-32 shrink-0 text-zinc-500">{label}</div>
      <div className="text-zinc-200">{children}</div>
    </div>
  );
}

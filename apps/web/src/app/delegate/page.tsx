"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import {
  DELEGATION_REGISTRY_ADDRESS,
  METADIUM_CHAIN_ID,
  METADIUM_RPC,
  SCOPE,
  scopeToLabels,
  v03Ready,
} from "@/lib/v03-config";
import { DELEGATION_REGISTRY_ABI } from "@/lib/v03-abi";

function addressToDid(address: string): string {
  return `did:meta:testnet:${address.toLowerCase()}`;
}

export default function DelegatePage() {
  const [account, setAccount] = useState<string>("");
  const [agentAddr, setAgentAddr] = useState<string>("");
  const [scopeBits, setScopeBits] = useState<number>(SCOPE.TRADE);
  const [maxAmount, setMaxAmount] = useState<string>("10");
  const [totalCap, setTotalCap] = useState<string>("100");
  const [validHours, setValidHours] = useState<string>("720"); // 30 days
  const [status, setStatus] = useState<string>("");
  const [delegationId, setDelegationId] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const ready = v03Ready();

  async function connect() {
    if (!window.ethereum) {
      setStatus("MetaMask가 설치되어 있지 않습니다.");
      return;
    }
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      setAccount(accounts[0]);

      // Check chain id, prompt switch if needed
      const chainIdHex = (await window.ethereum.request({
        method: "eth_chainId",
      })) as string;
      if (parseInt(chainIdHex, 16) !== METADIUM_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${METADIUM_CHAIN_ID.toString(16)}` }],
          });
        } catch {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: `0x${METADIUM_CHAIN_ID.toString(16)}`,
              chainName: "Metadium Testnet",
              rpcUrls: [METADIUM_RPC],
              nativeCurrency: { name: "META", symbol: "META", decimals: 18 },
              blockExplorerUrls: ["https://testnetexplorer.metadium.com/"],
            }],
          });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus(`연결 실패: ${msg}`);
    }
  }

  async function submit() {
    setStatus("");
    setDelegationId("");
    setTxHash("");
    if (!ready) { setStatus("컨트랙트 주소가 구성되지 않았습니다."); return; }
    if (!account) { setStatus("먼저 지갑을 연결하세요."); return; }
    if (!ethers.isAddress(agentAddr)) { setStatus("Agent 주소가 유효하지 않습니다."); return; }
    if (scopeBits === 0) { setStatus("최소 1개 이상의 scope를 선택하세요."); return; }

    setSubmitting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as never);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        DELEGATION_REGISTRY_ADDRESS,
        DELEGATION_REGISTRY_ABI,
        signer
      );

      const nonce = BigInt(ethers.hexlify(ethers.randomBytes(16)));
      const validFrom = BigInt(Math.floor(Date.now() / 1000));
      const validUntil = validFrom + BigInt(Math.floor(Number(validHours) * 3600));
      const maxAmt = ethers.parseUnits(maxAmount || "0", 18);
      const totalCapBn = ethers.parseUnits(totalCap || "0", 18);

      const tx = await contract.register(
        account,
        agentAddr,
        addressToDid(account),
        addressToDid(agentAddr),
        BigInt(0), BigInt(0),
        scopeBits,
        maxAmt,
        totalCapBn,
        validFrom,
        validUntil,
        `${window.location.origin}/api/delegation/revoke`,
        `${window.location.origin}/delegation/`,
        nonce
      );
      setStatus(`Tx 전송됨: ${tx.hash}`);
      const receipt = await tx.wait();
      setTxHash(tx.hash);

      const iface = new ethers.Interface(DELEGATION_REGISTRY_ABI);
      const event = receipt.logs
        .map((l: { topics: string[]; data: string }) => {
          try { return iface.parseLog(l); } catch { return null; }
        })
        .find((e: { name?: string } | null) => e?.name === "DelegationRegistered");
      if (event) {
        setDelegationId(event.args.delegationId as string);
        setStatus("위임 등록 완료");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus(`실패: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (window.ethereum && account === "") {
      window.ethereum.request({ method: "eth_accounts" })
        .then((a) => { const accts = a as string[]; if (accts[0]) setAccount(accts[0]); })
        .catch(() => {});
    }
  }, [account]);

  function toggleScope(bit: number) {
    setScopeBits((s) => s ^ bit);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">← 홈</Link>
          <h1 className="text-3xl font-semibold mt-4 mb-2">위임 생성</h1>
          <p className="text-sm text-zinc-400">
            Smart Contract 방식 (특허 10-2025-0074709, 청구항 6-7) · 메타디움 테스트넷에 온체인 등록됩니다.
          </p>
        </div>

        {!ready && (
          <div className="mb-6 p-4 bg-amber-950/40 border border-amber-900 rounded text-amber-200 text-sm">
            DelegationRegistry 주소가 아직 구성되지 않았습니다. `.env`에
            `NEXT_PUBLIC_DELEGATION_REGISTRY`를 설정해야 합니다.
          </div>
        )}

        <section className="mb-6 p-5 bg-zinc-900/60 border border-zinc-800 rounded">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-500">지갑</div>
              <div className="font-mono text-sm">
                {account ? account : <span className="text-zinc-500">연결되지 않음</span>}
              </div>
            </div>
            <button
              onClick={connect}
              className="px-4 py-2 bg-zinc-100 text-zinc-900 text-sm font-medium rounded hover:bg-white transition"
            >
              {account ? "다시 연결" : "MetaMask 연결"}
            </button>
          </div>
        </section>

        <section className="space-y-5 p-5 bg-zinc-900/60 border border-zinc-800 rounded">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Agent 주소</label>
            <input
              value={agentAddr}
              onChange={(e) => setAgentAddr(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded font-mono text-sm"
            />
          </div>

          <div>
            <div className="text-sm text-zinc-400 mb-2">권한 (Scope)</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                [SCOPE.TRADE, "거래 실행"],
                [SCOPE.FOLLOW, "팔로우 요청"],
                [SCOPE.TRANSFER, "자금 이체"],
                [SCOPE.WITHDRAW, "출금"],
              ].map(([bit, label]) => (
                <label key={bit as number} className="flex items-center gap-2 p-2 bg-zinc-950 border border-zinc-800 rounded cursor-pointer hover:border-zinc-700">
                  <input
                    type="checkbox"
                    checked={(scopeBits & (bit as number)) !== 0}
                    onChange={() => toggleScope(bit as number)}
                  />
                  <span className="text-sm">{label as string}</span>
                </label>
              ))}
            </div>
            {scopeBits !== 0 && (
              <div className="mt-2 text-xs text-zinc-500">
                선택됨: {scopeToLabels(scopeBits, "ko").join(", ")}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">거래당 한도 (MAG)</label>
              <input
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">누적 한도 (MAG)</label>
              <input
                value={totalCap}
                onChange={(e) => setTotalCap(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">유효 기간 (시간)</label>
            <input
              value={validHours}
              onChange={(e) => setValidHours(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm"
            />
            <div className="mt-1 text-xs text-zinc-500">
              기본 720시간 = 30일. 위임 만료 후 재발급 필요.
            </div>
          </div>

          <button
            onClick={submit}
            disabled={submitting || !ready}
            className="w-full py-3 bg-zinc-100 text-zinc-900 font-medium rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {submitting ? "등록 중..." : "온체인 등록"}
          </button>
        </section>

        {status && (
          <div className="mt-6 p-4 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-200">
            {status}
          </div>
        )}

        {delegationId && (
          <div className="mt-4 p-4 bg-emerald-950/30 border border-emerald-900 rounded text-sm">
            <div className="text-emerald-400 font-medium mb-1">등록 완료</div>
            <div className="font-mono text-xs break-all text-zinc-300 mb-2">{delegationId}</div>
            <div className="flex gap-3">
              <Link
                href={`/delegation/${delegationId}`}
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
              >
                상세 보기 →
              </Link>
              {txHash && (
                <a
                  href={`https://testnetexplorer.metadium.com/tx/${txHash}`}
                  target="_blank" rel="noreferrer"
                  className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2"
                >
                  Explorer ↗
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/**
 * v0.3 contract addresses & chain config.
 * Blank strings are treated as "not yet deployed" — pages fall back to a warning banner.
 */

export const METADIUM_RPC =
  process.env.NEXT_PUBLIC_METADIUM_RPC || "https://api.metadium.com/dev";

export const METADIUM_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_METADIUM_CHAIN_ID || "12"
);

export const DELEGATION_REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_DELEGATION_REGISTRY || "";

export const AGENT_EVENT_LOG_ADDRESS =
  process.env.NEXT_PUBLIC_AGENT_EVENT_LOG || "";

export const TRADE_LOG_V2_ADDRESS =
  process.env.NEXT_PUBLIC_TRADE_LOG_V2 || "";

export function v03Ready(): boolean {
  return !!DELEGATION_REGISTRY_ADDRESS && !!AGENT_EVENT_LOG_ADDRESS;
}

// Server-side (no NEXT_PUBLIC_ prefix)
export function serverAddresses() {
  return {
    registry: process.env.DELEGATION_REGISTRY_ADDRESS || DELEGATION_REGISTRY_ADDRESS,
    eventLog: process.env.AGENT_EVENT_LOG_ADDRESS || AGENT_EVENT_LOG_ADDRESS,
    tradeLogV2: process.env.TRADELOG_V2_ADDRESS || TRADE_LOG_V2_ADDRESS,
    rpc: process.env.METADIUM_RPC_URL || METADIUM_RPC,
    chainId: METADIUM_CHAIN_ID,
  };
}

export const SCOPE = {
  TRADE: 1,
  FOLLOW: 2,
  TRANSFER: 4,
  WITHDRAW: 8,
} as const;

export const SCOPE_LABELS: Record<number, { ko: string; en: string }> = {
  1: { ko: "거래 실행", en: "Trade" },
  2: { ko: "팔로우 요청", en: "Follow" },
  4: { ko: "자금 이체", en: "Transfer" },
  8: { ko: "출금", en: "Withdraw" },
};

export function scopeToLabels(scope: number, lang: "ko" | "en" = "ko"): string[] {
  const out: string[] = [];
  for (const [bit, label] of Object.entries(SCOPE_LABELS)) {
    if (scope & Number(bit)) out.push(label[lang]);
  }
  return out;
}

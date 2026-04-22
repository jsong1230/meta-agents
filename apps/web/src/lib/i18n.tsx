"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Lang = "ko" | "en";

const translations = {
  // Nav
  "nav.home": { ko: "홈", en: "Home" },
  "nav.leaderboard": { ko: "리더보드", en: "Leaderboard" },
  "nav.guide": { ko: "가이드", en: "Guide" },
  "nav.delegate": { ko: "위임", en: "Delegate" },
  "nav.audit": { ko: "감사", en: "Audit" },

  // Home hero
  "home.badge": { ko: "Metadium Testnet에서 운영 중", en: "Live on Metadium Testnet" },
  "home.title1": { ko: "AI 트레이딩 봇의", en: "Prove your AI" },
  "home.title2": { ko: "실력을 증명하세요", en: "trading bot's skill" },
  "home.subtitle": {
    ko: "블록체인에 기록된 거래 내역. 조작 불가능한 수익률.\nKYA (Know Your Agent) — 한 번의 API 호출로 검증.",
    en: "On-chain trade records. Tamper-proof returns.\nKYA (Know Your Agent) — verify with one API call.",
  },
  "home.cta.start": { ko: "시작하기", en: "Get Started" },
  "home.cta.leaderboard": { ko: "리더보드 보기", en: "View Leaderboard" },

  // How it works
  "home.how.title": { ko: "어떻게 작동하나요?", en: "How does it work?" },
  "home.how.1.title": { ko: "봇을 등록하세요", en: "Register your bot" },
  "home.how.1.desc": {
    ko: "AI 모델명과 지갑 주소로 DID를 발급받습니다. API 한 번 호출이면 끝.",
    en: "Get a DID with your AI model name and wallet address. One API call.",
  },
  "home.how.2.title": { ko: "거래를 기록하세요", en: "Record trades" },
  "home.how.2.desc": {
    ko: "매수/매도할 때마다 API를 호출합니다. 가격은 서버가 CoinGecko에서 가져와 조작이 불가능합니다.",
    en: "Call the API on every buy/sell. Prices are fetched from CoinGecko by the server — tamper-proof.",
  },
  "home.how.3.title": { ko: "실력을 증명하세요", en: "Prove your skill" },
  "home.how.3.desc": {
    ko: "누구나 DID로 봇의 신원과 수익률을 검증할 수 있습니다. 이게 KYA입니다.",
    en: "Anyone can verify your bot's identity and returns via DID. That's KYA.",
  },

  // KYA section
  "home.kya.label": { ko: "Know Your Agent", en: "Know Your Agent" },
  "home.kya.title": { ko: "API 한 번으로\n전부 확인", en: "Everything in\none API call" },
  "home.kya.desc": {
    ko: "봇의 신원(모델, 버전, 생성자), 거래 실적(수익률, 거래 횟수), 배지(활성, 수익, 다각화)를 한 번의 호출로 가져옵니다. 블록체인에 기록되어 있어 위조가 불가능합니다.",
    en: "Fetch identity (model, version, creator), trade performance (PnL, trade count), and badges (active, profitable, diversified) in one call. Recorded on-chain — impossible to forge.",
  },

  // Stats
  "home.stats.contracts": { ko: "배포된 컨트랙트", en: "Contracts Deployed" },
  "home.stats.pairs": { ko: "지원 페어", en: "Supported Pairs" },
  "home.stats.chain": { ko: "체인", en: "Chain" },
  "home.stats.gas": { ko: "가스비", en: "Gas Cost" },

  // CTA
  "home.cta2.title": { ko: "5분이면 시작할 수 있습니다", en: "Get started in 5 minutes" },
  "home.cta2.desc": { ko: "curl 명령어 3개면 봇 등록부터 검증까지 완료.", en: "Three curl commands from registration to verification." },
  "home.cta2.btn": { ko: "개발 가이드 읽기", en: "Read the guide" },

  // Leaderboard
  "lb.title": { ko: "리더보드", en: "Leaderboard" },
  "lb.agents": { ko: "Active Agents", en: "Active Agents" },
  "lb.trades": { ko: "Total Trades", en: "Total Trades" },
  "lb.topPnl": { ko: "Top PnL", en: "Top PnL" },
  "lb.rank": { ko: "Rank", en: "Rank" },
  "lb.agent": { ko: "Agent", en: "Agent" },
  "lb.trend": { ko: "Trend", en: "Trend" },
  "lb.pnl": { ko: "PnL", en: "PnL" },
  "lb.tradeCount": { ko: "Trades", en: "Trades" },
  "lb.followers": { ko: "Followers", en: "Followers" },
  "lb.ranking": { ko: "누적 수익률 기준 랭킹", en: "Rankings by cumulative PnL" },
  "lb.empty.title": { ko: "아직 에이전트가 없습니다", en: "No agents yet" },
  "lb.empty.desc": { ko: "AI 트레이딩 봇을 등록하고 경쟁하세요.", en: "Register your AI trading bot and start competing." },
  "lb.empty.link": { ko: "퀵스타트 가이드 보기", en: "Read the quickstart guide" },

  // Docs
  "docs.title": { ko: "시작하기", en: "Getting Started" },
  "docs.subtitle": {
    ko: "AI 트레이딩 봇을 등록하고 실력을 증명하세요. 5분이면 됩니다.",
    en: "Register your AI trading bot and prove its skill. Takes 5 minutes.",
  },
  "docs.what.title": { ko: "meta-agents란?", en: "What is meta-agents?" },
  "docs.what.p1": {
    ko: "당신의 AI 트레이딩 봇이 +30% 수익을 냈다고 합시다. 그걸 어떻게 증명하나요? 스크린샷? 엑셀? 누가 믿나요?",
    en: "Say your AI trading bot made +30% returns. How do you prove it? Screenshots? Spreadsheets? Who believes that?",
  },
  "docs.what.p2": { ko: "meta-agents를 쓰면:", en: "With meta-agents:" },
  "docs.what.1": {
    ko: "봇에 <strong>블록체인 신원증(DID)</strong>이 발급됩니다",
    en: "Your bot gets a <strong>blockchain identity (DID)</strong>",
  },
  "docs.what.2": {
    ko: "모든 거래가 <strong>블록체인에 기록</strong>됩니다 (조작 불가)",
    en: "All trades are <strong>recorded on-chain</strong> (tamper-proof)",
  },
  "docs.what.3": {
    ko: "누구나 <strong>한 번의 API 호출</strong>로 실력을 검증할 수 있습니다",
    en: "Anyone can <strong>verify with one API call</strong>",
  },

  "docs.step1": { ko: "봇을 등록하세요", en: "Register your bot" },
  "docs.step1.tip": {
    ko: "address는 아무 이더리움 주소나 사용 가능합니다. MetaMask에서 새로 만들거나 ethers.Wallet.createRandom()으로 생성하세요.",
    en: "Any Ethereum address works. Create one in MetaMask or with ethers.Wallet.createRandom().",
  },
  "docs.step2": { ko: "거래를 기록하세요", en: "Record trades" },
  "docs.step2.tip": {
    ko: "가격은 서버가 CoinGecko에서 실시간으로 가져옵니다. 봇이 가격을 조작할 수 없습니다.",
    en: "Prices are fetched from CoinGecko by the server. Bots cannot manipulate prices.",
  },
  "docs.step3": { ko: "실력을 증명하세요 (KYA)", en: "Prove your skill (KYA)" },
  "docs.step3.tip": {
    ko: "이 한 번의 호출이 KYA (Know Your Agent)입니다. 신원 + 실적 + 증명.",
    en: "This single call is KYA (Know Your Agent). Identity + performance + proof.",
  },
  "docs.step4": { ko: "리더보드에서 경쟁하세요", en: "Compete on the leaderboard" },
  "docs.step4.desc": {
    ko: "등록한 순간부터 리더보드에 표시됩니다. 수익률 기준 자동 랭킹. 기간 필터(24h/7d/30d)로 단기/장기 성과 비교.",
    en: "You appear on the leaderboard the moment you register. Auto-ranked by PnL. Filter by period (24h/7d/30d).",
  },
  "docs.examples": { ko: "코드 예제", en: "Code Examples" },
  "docs.api": { ko: "API Reference", en: "API Reference" },
  "docs.contracts": { ko: "Smart Contracts", en: "Smart Contracts" },
  "docs.faq": { ko: "FAQ", en: "FAQ" },

  // API table
  "api.register": { ko: "봇 등록", en: "Register bot" },
  "api.trade": { ko: "거래 기록", en: "Record trade" },
  "api.verify": { ko: "실력 검증 (KYA)", en: "Verify (KYA)" },
  "api.leaderboard": { ko: "리더보드", en: "Leaderboard" },
  "api.detail": { ko: "봇 상세", en: "Bot detail" },
  "api.follow": { ko: "팔로우", en: "Follow" },
  "api.delegate": { ko: "Fee Delegation", en: "Fee Delegation" },
  "api.delegateStatus": { ko: "Fee Payer 상태", en: "Fee Payer status" },

  // FAQ
  "faq.money.q": { ko: "진짜 돈이 들어가나요?", en: "Does it involve real money?" },
  "faq.money.a": { ko: "아닙니다. 테스트넷 모의투자입니다. 실제 자산 거래는 없습니다.", en: "No. It's testnet paper trading. No real assets are involved." },
  "faq.price.q": { ko: "가격을 조작할 수 있나요?", en: "Can prices be manipulated?" },
  "faq.price.a": { ko: "불가능합니다. 가격은 서버가 CoinGecko에서 가져와서 기록합니다.", en: "No. Prices are fetched from CoinGecko by the server." },
  "faq.did.q": { ko: "DID가 뭔가요?", en: "What is a DID?" },
  "faq.did.a": {
    ko: "Decentralized Identifier. 블록체인에 기록된 신원증입니다. 누구도 위조하거나 삭제할 수 없습니다.",
    en: "Decentralized Identifier. A blockchain-based identity that nobody can forge or delete.",
  },
  "faq.wallet.q": { ko: "지갑 주소가 없는데?", en: "I don't have a wallet address" },
  "faq.wallet.a": {
    ko: "아무 이더리움 주소나 사용 가능합니다. MetaMask에서 새 계정을 만들거나 코드로 생성하세요.",
    en: "Any Ethereum address works. Create one in MetaMask or generate programmatically.",
  },

  // Agent profile
  "agent.back": { ko: "리더보드", en: "Leaderboard" },
  "agent.title": { ko: "Agent 프로필", en: "Agent Profile" },
  "agent.followers": { ko: "팔로워", en: "Followers" },
  "agent.pnl": { ko: "수익률", en: "PnL" },
  "agent.totalTrades": { ko: "총 거래", en: "Total Trades" },
  "agent.since": { ko: "활동 시작", en: "Active Since" },
  "agent.noTrades": { ko: "거래 없음", en: "No trades" },
  "agent.recentTrades": { ko: "최근 거래", en: "Recent Trades" },
  "agent.noTradesYet": { ko: "아직 거래가 없습니다", en: "No trades yet" },
  "agent.pair": { ko: "페어", en: "Pair" },
  "agent.side": { ko: "방향", en: "Side" },
  "agent.amount": { ko: "수량", en: "Amount" },
  "agent.price": { ko: "가격", en: "Price" },
  "agent.time": { ko: "시간", en: "Time" },
  "agent.notFound": { ko: "에이전트를 찾을 수 없습니다", en: "Agent not found" },

  // Footer
  "footer.testnet": { ko: "Metadium Testnet (Chain ID: 12)", en: "Metadium Testnet (Chain ID: 12)" },
} as const;

type TKey = keyof typeof translations;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TKey) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "ko",
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ko");

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  }, []);

  const t = useCallback((key: TKey): string => {
    return translations[key]?.[lang] || key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

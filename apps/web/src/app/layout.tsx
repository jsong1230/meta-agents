import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "meta-agents | AI Agent Trading Leaderboard",
    template: "%s | meta-agents",
  },
  description: "AI 트레이딩 봇의 실력을 블록체인으로 증명하세요. KYA (Know Your Agent) on Metadium. Prove your AI trading bot's skill with tamper-proof on-chain records.",
  keywords: ["AI agent", "trading bot", "leaderboard", "DID", "KYA", "Metadium", "blockchain", "on-chain", "decentralized identity"],
  authors: [{ name: "meta-agents", url: "https://github.com/jsong1230/meta-agents" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "meta-agents | AI Agent Trading Leaderboard",
    description: "AI 트레이딩 봇의 실력을 블록체인으로 증명하세요. KYA (Know Your Agent) on Metadium.",
    siteName: "meta-agents",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "meta-agents | AI Agent Trading Leaderboard",
    description: "Prove your AI trading bot's skill with on-chain records. KYA on Metadium.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "AI agent 수익률 순위. Rankings by cumulative PnL.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guide",
  description: "AI 트레이딩 봇 등록부터 검증까지. 5분 퀵스타트 가이드. Getting started in 5 minutes.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

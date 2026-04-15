"use client";

import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export function Nav() {
  const pathname = usePathname();
  const { lang, setLang, t } = useI18n();

  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/leaderboard", label: t("nav.leaderboard") },
    { href: "/docs", label: t("nav.guide") },
  ];

  return (
    <header className="border-b border-white/5 sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white">
              M
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">meta-agents</span>
          </a>
          <nav className="flex gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  pathname === l.href
                    ? "text-white bg-white/10"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLang(lang === "ko" ? "en" : "ko")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors"
          >
            <span className={lang === "ko" ? "text-white font-medium" : ""}>KR</span>
            <span className="text-zinc-700">/</span>
            <span className={lang === "en" ? "text-white font-medium" : ""}>EN</span>
          </button>
          <a
            href="https://github.com/jsong1230/meta-agents"
            target="_blank"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}

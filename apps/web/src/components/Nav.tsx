"use client";

import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/docs", label: "Guide" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-white/5 sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-xs font-bold">
              M
            </div>
            <span className="text-sm font-semibold tracking-tight">meta-agents</span>
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
        <a
          href="https://github.com/jsong1230/meta-agents"
          target="_blank"
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}

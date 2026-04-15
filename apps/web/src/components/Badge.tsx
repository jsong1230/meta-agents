const BADGE_CONFIG: Record<string, { label: string; color: string }> = {
  "centurion": { label: "100+", color: "bg-amber-900/30 text-amber-400" },
  "active-trader": { label: "Active", color: "bg-blue-900/30 text-blue-400" },
  "profitable": { label: "Profit", color: "bg-emerald-900/30 text-emerald-400" },
  "diversified": { label: "Multi", color: "bg-purple-900/30 text-purple-400" },
  "veteran": { label: "30d+", color: "bg-zinc-700 text-zinc-300" },
};

interface BadgeProps {
  name: string;
}

export function Badge({ name }: BadgeProps) {
  const config = BADGE_CONFIG[name];
  if (!config) return null;

  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

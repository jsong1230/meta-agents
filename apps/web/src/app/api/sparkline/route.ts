import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * GET /api/sparkline?address=0x...&days=30
 * Returns daily cumulative PnL values for sparkline rendering.
 */
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const days = parseInt(req.nextUrl.searchParams.get("days") || "30");
  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  const db = getDb();
  const since = Math.floor(Date.now() / 1000) - days * 86400;

  // Get daily net value (sells - buys)
  const rows = db.prepare(`
    SELECT
      date(timestamp, 'unixepoch') as day,
      SUM(CASE WHEN amount < 0 THEN value ELSE -value END) as daily_pnl
    FROM trades
    WHERE agent_address = ? AND timestamp > ?
    GROUP BY day
    ORDER BY day ASC
  `).all(address, since) as any[];

  // Build cumulative PnL series
  let cumulative = 0;
  const points = rows.map((r: any) => {
    cumulative += r.daily_pnl;
    return Math.round(cumulative * 100) / 100;
  });

  return NextResponse.json({ address, days, points });
}

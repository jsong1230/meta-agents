import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * GET /api/leaderboard?period=24h|7d|30d|all
 *
 * Returns agents ranked by cumulative PnL %.
 */
export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") || "all";

  const db = getDb();

  // Period filter
  let timeFilter = "";
  switch (period) {
    case "24h":
      timeFilter = "AND t.timestamp > unixepoch() - 86400";
      break;
    case "7d":
      timeFilter = "AND t.timestamp > unixepoch() - 604800";
      break;
    case "30d":
      timeFilter = "AND t.timestamp > unixepoch() - 2592000";
      break;
    default:
      timeFilter = "";
  }

  const rows = db.prepare(`
    SELECT
      a.address,
      a.did,
      a.model,
      a.version,
      COUNT(t.id) as total_trades,
      COALESCE(SUM(CASE WHEN t.amount < 0 THEN t.value ELSE 0 END), 0) as total_sells,
      COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.value ELSE 0 END), 0) as total_buys,
      MAX(t.timestamp) as last_trade_at,
      (SELECT COUNT(*) FROM follows f WHERE f.agent_address = a.address) as follower_count
    FROM agents a
    LEFT JOIN trades t ON t.agent_address = a.address ${timeFilter}
    WHERE a.active = 1
    GROUP BY a.address
    ORDER BY (total_sells - total_buys) DESC
  `).all() as any[];

  const leaderboard = rows.map((row) => {
    const pnlPercent = row.total_buys > 0
      ? ((row.total_sells - row.total_buys) / row.total_buys) * 100
      : 0;

    // Badges
    const badges: string[] = [];
    if (row.total_trades >= 100) badges.push("centurion");
    if (row.total_trades >= 10) badges.push("active-trader");
    if (pnlPercent > 0) badges.push("profitable");

    // Sparkline: daily cumulative PnL (last 14 days)
    const sparkRows = db.prepare(`
      SELECT date(timestamp, 'unixepoch') as day,
             SUM(CASE WHEN amount < 0 THEN value ELSE -value END) as daily_pnl
      FROM trades
      WHERE agent_address = ? AND timestamp > unixepoch() - 1209600
      GROUP BY day ORDER BY day ASC
    `).all(row.address) as any[];
    let cum = 0;
    const sparkline = sparkRows.map((s: any) => {
      cum += s.daily_pnl;
      return Math.round(cum * 100) / 100;
    });

    return {
      address: row.address,
      did: row.did,
      model: row.model,
      version: row.version,
      totalTrades: row.total_trades,
      pnlPercent: Math.round(pnlPercent * 100) / 100,
      followerCount: row.follower_count,
      lastTradeAt: row.last_trade_at || 0,
      badges,
      sparkline,
    };
  });

  return NextResponse.json({ leaderboard, period });
}

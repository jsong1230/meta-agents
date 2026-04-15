import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * GET /api/verify?did=did:meta:testnet:0x...
 *
 * THE KYA KILLER FEATURE.
 * One call: verify agent identity + get on-chain performance.
 * This is what makes DID better than a plain wallet address.
 *
 * Returns: identity (creator, model, version) + stats (PnL, trades) + proof (contract addresses)
 */
export async function GET(req: NextRequest) {
  const did = req.nextUrl.searchParams.get("did");
  if (!did) {
    return NextResponse.json({ error: "Missing did parameter" }, { status: 400 });
  }

  // Parse DID
  const parts = did.split(":");
  if (parts.length !== 4 || parts[0] !== "did" || parts[1] !== "meta") {
    return NextResponse.json(
      { error: "Invalid DID format. Expected did:meta:<network>:<address>" },
      { status: 400 }
    );
  }
  const address = parts[3];

  const db = getDb();
  const agent = db.prepare("SELECT * FROM agents WHERE address = ?").get(address) as any;

  if (!agent) {
    return NextResponse.json({
      verified: false,
      did,
      error: "Agent not found",
    });
  }

  // Compute stats
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_trades,
      COALESCE(SUM(CASE WHEN amount < 0 THEN value ELSE 0 END), 0) as total_sells,
      COALESCE(SUM(CASE WHEN amount > 0 THEN value ELSE 0 END), 0) as total_buys,
      MIN(timestamp) as first_trade_at,
      MAX(timestamp) as last_trade_at
    FROM trades WHERE agent_address = ?
  `).get(address) as any;

  const pnlPercent = stats.total_buys > 0
    ? Math.round(((stats.total_sells - stats.total_buys) / stats.total_buys) * 10000) / 100
    : 0;

  // Per-pair breakdown
  const pairs = db.prepare(`
    SELECT
      pair,
      SUM(CASE WHEN amount > 0 THEN value ELSE 0 END) as bought,
      SUM(CASE WHEN amount < 0 THEN value ELSE 0 END) as sold,
      COUNT(*) as trades
    FROM trades WHERE agent_address = ?
    GROUP BY pair
  `).all(address) as any[];

  // Badges
  const badges: string[] = [];
  if (stats.total_trades >= 100) badges.push("centurion");
  if (stats.total_trades >= 10) badges.push("active-trader");
  if (pnlPercent > 0) badges.push("profitable");
  if (pairs.length >= 3) badges.push("diversified");
  const daysSinceFirst = stats.first_trade_at
    ? Math.floor((Date.now() / 1000 - stats.first_trade_at) / 86400)
    : 0;
  if (daysSinceFirst >= 30 && stats.total_trades > 0) badges.push("veteran");

  const followerCount = (db.prepare(
    "SELECT COUNT(*) as cnt FROM follows WHERE agent_address = ?"
  ).get(address) as any).cnt;

  return NextResponse.json({
    verified: true,
    agent: {
      did: agent.did,
      address: agent.address,
      creator: agent.creator,
      model: agent.model,
      version: agent.version,
      registeredAt: agent.registered_at,
      active: !!agent.active,
    },
    stats: {
      totalTrades: stats.total_trades,
      pnlPercent,
      firstTradeAt: stats.first_trade_at || 0,
      lastTradeAt: stats.last_trade_at || 0,
      pairBreakdown: pairs.map((p: any) => ({
        pair: p.pair,
        bought: Math.round(p.bought * 100) / 100,
        sold: Math.round(p.sold * 100) / 100,
        trades: p.trades,
      })),
    },
    badges,
    followerCount,
    proof: {
      source: "meta-agents",
      chainId: 12,
      network: "metadium-testnet",
    },
  });
}

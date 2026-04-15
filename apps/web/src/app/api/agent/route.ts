import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * GET /api/agent?address=0x...
 * POST /api/agent — Register a new agent
 */
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "Missing address parameter" }, { status: 400 });
  }

  const db = getDb();
  const agent = db.prepare("SELECT * FROM agents WHERE address = ?").get(address) as any;
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const trades = db.prepare(
    "SELECT * FROM trades WHERE agent_address = ? ORDER BY timestamp DESC LIMIT 50"
  ).all(address) as any[];

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
    ? ((stats.total_sells - stats.total_buys) / stats.total_buys) * 100
    : 0;

  const followerCount = (db.prepare(
    "SELECT COUNT(*) as cnt FROM follows WHERE agent_address = ?"
  ).get(address) as any).cnt;

  return NextResponse.json({
    agent: {
      ...agent,
      active: !!agent.active,
    },
    stats: {
      totalTrades: stats.total_trades,
      pnlPercent: Math.round(pnlPercent * 100) / 100,
      firstTradeAt: stats.first_trade_at || 0,
      lastTradeAt: stats.last_trade_at || 0,
    },
    followerCount,
    recentTrades: trades,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { address, model, version } = await req.json();

    if (!address || !model) {
      return NextResponse.json(
        { error: "Missing required fields: address, model" },
        { status: 400 }
      );
    }

    const did = `did:meta:testnet:${address.toLowerCase()}`;
    const db = getDb();

    const existing = db.prepare("SELECT address FROM agents WHERE address = ?").get(address);
    if (existing) {
      return NextResponse.json({ error: "Agent already registered" }, { status: 409 });
    }

    db.prepare(
      "INSERT INTO agents (address, did, creator, model, version) VALUES (?, ?, ?, ?, ?)"
    ).run(address, did, address, model, version || "");

    return NextResponse.json({ did, address, model, version: version || "" }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

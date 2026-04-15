import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getPrice } from "@/lib/price";

/**
 * POST /api/trade — Server-stamped trade recording
 *
 * Agent sends: { agentAddress, pair, amount }
 * Server: fetches real price, records trade with server-stamped price
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentAddress, pair, amount } = body;

    if (!agentAddress || !pair || amount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: agentAddress, pair, amount" },
        { status: 400 }
      );
    }

    if (amount === 0) {
      return NextResponse.json({ error: "Amount cannot be zero" }, { status: 400 });
    }

    const db = getDb();

    // Check agent exists
    const agent = db.prepare("SELECT * FROM agents WHERE address = ?").get(agentAddress);
    if (!agent) {
      return NextResponse.json({ error: "Agent not registered" }, { status: 404 });
    }

    // Server stamps price (prevents gaming)
    const price = await getPrice(pair);
    const value = Math.abs(amount) * price;

    const result = db.prepare(
      "INSERT INTO trades (agent_address, pair, amount, price, value, timestamp) VALUES (?, ?, ?, ?, ?, unixepoch())"
    ).run(agentAddress, pair, amount, price, value);

    return NextResponse.json({
      tradeId: result.lastInsertRowid,
      pair,
      amount,
      price,
      value,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getPrice, getSupportedPairs } from "@/lib/price";

/**
 * POST /api/bot — Mock trading bot. Each call makes one random trade per agent.
 * Call via cron or manually to simulate live trading.
 *
 * Simple strategy per agent:
 *   - GPT-4o: momentum (buy if price > avg, sell if < avg)
 *   - Claude Sonnet: mean reversion (opposite of momentum)
 *   - Gemini Pro: random walk
 */
export async function POST() {
  const db = getDb();
  const agents = db.prepare("SELECT * FROM agents WHERE active = 1").all() as any[];

  if (agents.length === 0) {
    return NextResponse.json({ error: "No active agents" }, { status: 404 });
  }

  const pairs = getSupportedPairs();
  const results: any[] = [];

  for (const agent of agents) {
    try {
      const pair = pairs[Math.floor(Math.random() * pairs.length)];
      const price = await getPrice(pair);

      // Get agent's position in this pair
      const position = db.prepare(
        "SELECT COALESCE(SUM(amount), 0) as net FROM trades WHERE agent_address = ? AND pair = ?"
      ).get(agent.address, pair) as any;

      const net = position.net;
      let amount: number;

      // Strategy varies by model name
      const model = agent.model.toLowerCase();
      if (model.includes("gpt")) {
        // Momentum: buy more if already long, sell if no position
        amount = net > 0 ? randomAmount(0.01, 0.1) : (net < 0 ? randomAmount(0.01, 0.05) : randomAmount(-0.05, 0.1));
      } else if (model.includes("claude")) {
        // Mean reversion: sell if long, buy if short
        amount = net > 0 ? -randomAmount(0.01, 0.05) : randomAmount(0.01, 0.1);
      } else {
        // Random walk
        amount = randomAmount(-0.1, 0.1);
      }

      // Ensure non-zero
      if (Math.abs(amount) < 0.001) amount = 0.01;

      // Scale amount for non-BTC pairs
      if (pair.startsWith("ETH")) amount *= 3;
      if (pair.startsWith("SOL")) amount *= 30;
      if (pair.startsWith("BNB")) amount *= 5;

      amount = Math.round(amount * 10000) / 10000;
      const value = Math.abs(amount) * price;

      db.prepare(
        "INSERT INTO trades (agent_address, pair, amount, price, value, timestamp) VALUES (?, ?, ?, ?, ?, unixepoch())"
      ).run(agent.address, pair, amount, price, value);

      results.push({
        agent: agent.did,
        model: agent.model,
        pair,
        side: amount > 0 ? "BUY" : "SELL",
        amount: Math.abs(amount),
        price,
      });
    } catch (err: any) {
      results.push({ agent: agent.did, error: err.message });
    }
  }

  return NextResponse.json({ trades: results, timestamp: Math.floor(Date.now() / 1000) });
}

function randomAmount(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

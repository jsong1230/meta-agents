import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

/**
 * POST /api/telegram — Send leaderboard summary to Telegram
 * Called by cron or manually.
 *
 * Also handles Telegram webhook (bot commands) if body contains 'message'.
 */
export async function POST(req: NextRequest) {
  // Check if this is a Telegram webhook
  const body = await req.json().catch(() => ({}));
  if (body.message) {
    return handleWebhook(body);
  }

  // Otherwise: send leaderboard summary
  return sendLeaderboardSummary();
}

async function sendLeaderboardSummary() {
  if (!BOT_TOKEN || !CHAT_ID) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set" }, { status: 500 });
  }

  const db = getDb();

  const rows = db.prepare(`
    SELECT
      a.did, a.model,
      COUNT(t.id) as total_trades,
      COALESCE(SUM(CASE WHEN t.amount < 0 THEN t.value ELSE 0 END), 0) as total_sells,
      COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.value ELSE 0 END), 0) as total_buys
    FROM agents a
    LEFT JOIN trades t ON t.agent_address = a.address
    WHERE a.active = 1
    GROUP BY a.address
    ORDER BY (total_sells - total_buys) DESC
    LIMIT 5
  `).all() as any[];

  const totalTrades = (db.prepare("SELECT COUNT(*) as cnt FROM trades").get() as any).cnt;
  const agentCount = (db.prepare("SELECT COUNT(*) as cnt FROM agents WHERE active = 1").get() as any).cnt;

  let text = `🤖 *meta\\-agents Leaderboard*\n`;
  text += `${agentCount} agents \\| ${totalTrades} trades\n\n`;

  rows.forEach((row: any, i: number) => {
    const pnl = row.total_buys > 0
      ? ((row.total_sells - row.total_buys) / row.total_buys) * 100
      : 0;
    const pnlStr = pnl >= 0 ? `\\+${pnl.toFixed(1)}%` : `${pnl.toFixed(1)}%`;
    const emoji = pnl >= 0 ? "🟢" : "🔴";
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}\\.`;
    const model = escapeMarkdown(row.model);
    text += `${medal} *${model}* ${emoji} ${pnlStr} \\(${row.total_trades} trades\\)\n`;
  });

  text += `\n[View Leaderboard](http://100.126.168.26:3100)`;

  await sendTelegramMessage(text);
  return NextResponse.json({ sent: true });
}

async function handleWebhook(body: any) {
  const chatId = body.message?.chat?.id;
  const text = body.message?.text || "";

  if (!chatId || !BOT_TOKEN) {
    return NextResponse.json({ ok: true });
  }

  if (text === "/start" || text === "/leaderboard") {
    const db = getDb();
    const rows = db.prepare(`
      SELECT a.model,
        COUNT(t.id) as total_trades,
        COALESCE(SUM(CASE WHEN t.amount < 0 THEN t.value ELSE 0 END), 0) as total_sells,
        COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.value ELSE 0 END), 0) as total_buys
      FROM agents a
      LEFT JOIN trades t ON t.agent_address = a.address
      WHERE a.active = 1
      GROUP BY a.address
      ORDER BY (total_sells - total_buys) DESC
      LIMIT 3
    `).all() as any[];

    let reply = "🤖 *Top 3 Agents*\n\n";
    rows.forEach((r: any, i: number) => {
      const pnl = r.total_buys > 0
        ? ((r.total_sells - r.total_buys) / r.total_buys) * 100
        : 0;
      const medal = ["🥇", "🥈", "🥉"][i];
      reply += `${medal} ${escapeMarkdown(r.model)}: ${pnl >= 0 ? "\\+" : ""}${pnl.toFixed(1)}%\n`;
    });
    reply += `\n/verify \\<did\\> \\- Verify an agent`;

    await sendTelegramMessageTo(chatId, reply);
  } else if (text.startsWith("/verify ")) {
    const did = text.slice(8).trim();
    const parts = did.split(":");
    if (parts.length === 4) {
      const address = parts[3];
      const db = getDb();
      const agent = db.prepare("SELECT * FROM agents WHERE address = ?").get(address) as any;
      if (agent) {
        const stats = db.prepare(`
          SELECT COUNT(*) as cnt,
            COALESCE(SUM(CASE WHEN amount < 0 THEN value ELSE 0 END), 0) as sells,
            COALESCE(SUM(CASE WHEN amount > 0 THEN value ELSE 0 END), 0) as buys
          FROM trades WHERE agent_address = ?
        `).get(address) as any;
        const pnl = stats.buys > 0 ? ((stats.sells - stats.buys) / stats.buys) * 100 : 0;

        let reply = `✅ *Verified Agent*\n\n`;
        reply += `*Model:* ${escapeMarkdown(agent.model)} v${escapeMarkdown(agent.version)}\n`;
        reply += `*DID:* \`${escapeMarkdown(agent.did)}\`\n`;
        reply += `*Trades:* ${stats.cnt}\n`;
        reply += `*PnL:* ${pnl >= 0 ? "\\+" : ""}${pnl.toFixed(2)}%\n`;
        reply += `*Status:* ${agent.active ? "Active ✅" : "Inactive ❌"}`;

        await sendTelegramMessageTo(chatId, reply);
      } else {
        await sendTelegramMessageTo(chatId, "❌ Agent not found");
      }
    } else {
      await sendTelegramMessageTo(chatId, "Usage: /verify did:meta:testnet:0x\\.\\.\\.");
    }
  }

  return NextResponse.json({ ok: true });
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

async function sendTelegramMessage(text: string) {
  return sendTelegramMessageTo(CHAT_ID, text);
}

async function sendTelegramMessageTo(chatId: string | number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "MarkdownV2",
      disable_web_page_preview: true,
    }),
  });
}

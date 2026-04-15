import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * POST /api/follow   — Follow an agent
 * DELETE /api/follow — Unfollow an agent
 * GET /api/follow?agent=0x... — Get follower count
 *
 * Body: { userId: string, agentAddress: string }
 */
export async function POST(req: NextRequest) {
  const { userId, agentAddress } = await req.json();
  if (!userId || !agentAddress) {
    return NextResponse.json({ error: "Missing userId or agentAddress" }, { status: 400 });
  }

  if (userId === agentAddress) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const db = getDb();

  const agent = db.prepare("SELECT address FROM agents WHERE address = ?").get(agentAddress);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  try {
    db.prepare(
      "INSERT OR IGNORE INTO follows (user_id, agent_address) VALUES (?, ?)"
    ).run(userId, agentAddress);
  } catch {
    return NextResponse.json({ error: "Already following" }, { status: 409 });
  }

  const count = (db.prepare(
    "SELECT COUNT(*) as cnt FROM follows WHERE agent_address = ?"
  ).get(agentAddress) as any).cnt;

  return NextResponse.json({ following: true, followerCount: count });
}

export async function DELETE(req: NextRequest) {
  const { userId, agentAddress } = await req.json();
  if (!userId || !agentAddress) {
    return NextResponse.json({ error: "Missing userId or agentAddress" }, { status: 400 });
  }

  const db = getDb();
  db.prepare("DELETE FROM follows WHERE user_id = ? AND agent_address = ?").run(userId, agentAddress);

  const count = (db.prepare(
    "SELECT COUNT(*) as cnt FROM follows WHERE agent_address = ?"
  ).get(agentAddress) as any).cnt;

  return NextResponse.json({ following: false, followerCount: count });
}

export async function GET(req: NextRequest) {
  const agentAddress = req.nextUrl.searchParams.get("agent");
  if (!agentAddress) {
    return NextResponse.json({ error: "Missing agent parameter" }, { status: 400 });
  }

  const db = getDb();
  const count = (db.prepare(
    "SELECT COUNT(*) as cnt FROM follows WHERE agent_address = ?"
  ).get(agentAddress) as any).cnt;

  // Check if specific user follows
  const userId = req.nextUrl.searchParams.get("user");
  let isFollowing = false;
  if (userId) {
    const row = db.prepare(
      "SELECT 1 FROM follows WHERE user_id = ? AND agent_address = ?"
    ).get(userId, agentAddress);
    isFollowing = !!row;
  }

  return NextResponse.json({ followerCount: count, isFollowing });
}

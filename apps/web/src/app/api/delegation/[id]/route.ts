import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { serverAddresses } from "@/lib/v03-config";
import { DELEGATION_REGISTRY_ABI, AGENT_EVENT_LOG_ABI } from "@/lib/v03-abi";

/**
 * GET /api/delegation/[id] — public read-only delegation detail + events.
 * No auth needed: purpose is tracking (patent claim 20 `trackingURL`).
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { registry, eventLog, rpc } = serverAddresses();

  if (!registry) {
    return NextResponse.json({ error: "registry not configured" }, { status: 503 });
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(id)) {
    return NextResponse.json({ error: "invalid delegationId" }, { status: 400 });
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpc);
    const reg = new ethers.Contract(registry, DELEGATION_REGISTRY_ABI, provider);
    const d = await reg.getDelegation(id);
    const used = await reg.usedAmount(id);

    let events: unknown[] = [];
    if (eventLog) {
      const ev = new ethers.Contract(eventLog, AGENT_EVENT_LOG_ABI, provider);
      const raw = await ev.queryByDelegation(id);
      events = raw.map((e: { delegationId: string; agent: string; agentDID: string; actionType: string; actionHash: string; serviceProviderDID: string; timestamp: bigint; blockNumber: bigint }) => ({
        delegationId: e.delegationId,
        agent: e.agent,
        agentDID: e.agentDID,
        actionType: e.actionType,
        actionHash: e.actionHash,
        serviceProviderDID: e.serviceProviderDID,
        timestamp: Number(e.timestamp),
        blockNumber: Number(e.blockNumber),
      }));
    }

    return NextResponse.json({
      delegationId: id,
      userDID: d.userDID,
      agentDID: d.agentDID,
      user: d.user,
      agent: d.agent,
      scope: Number(d.scope),
      maxAmount: d.maxAmount.toString(),
      totalCap: d.totalCap.toString(),
      usedAmount: used.toString(),
      validFrom: Number(d.validFrom),
      validUntil: Number(d.validUntil),
      revocationURL: d.revocationURL,
      trackingURL: d.trackingURL,
      issuer: d.issuer,
      revoked: Boolean(d.revoked),
      events,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}

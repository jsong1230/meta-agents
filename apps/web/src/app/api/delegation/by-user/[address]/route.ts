import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { serverAddresses } from "@/lib/v03-config";
import { DELEGATION_REGISTRY_ABI } from "@/lib/v03-abi";

export async function GET(
  _req: Request,
  context: { params: Promise<{ address: string }> }
) {
  const { address } = await context.params;
  const { registry, rpc } = serverAddresses();
  if (!registry) return NextResponse.json({ error: "registry not configured" }, { status: 503 });
  if (!ethers.isAddress(address)) return NextResponse.json({ error: "invalid address" }, { status: 400 });

  try {
    const provider = new ethers.JsonRpcProvider(rpc);
    const reg = new ethers.Contract(registry, DELEGATION_REGISTRY_ABI, provider);
    const ids: string[] = await reg.getByUser(address);
    return NextResponse.json({ user: address, delegationIds: ids });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

/**
 * POST /api/delegate — Fee Delegation Server
 *
 * Agent sends a signed DynamicFeeTx (type 0x02).
 * Server wraps it as Fee Delegate tx (type 0x16) with feePayer signature.
 * Agent pays 0 gas.
 *
 * Body: { signedTx: "0x02..." }
 * Returns: { txHash, feeDelegate: true }
 *
 * Flow:
 *   Agent signs tx (0x02) → POST /api/delegate → Server wraps as 0x16 → chain
 */

const RPC_URL = process.env.METADIUM_RPC_URL || "https://api.metadium.com/dev";
const FEE_PAYER_KEY = process.env.FEE_PAYER_KEY || process.env.DEPLOYER_KEY || "";

const FD_TX_TYPE = 0x16;

export async function POST(req: NextRequest) {
  try {
    if (!FEE_PAYER_KEY) {
      return NextResponse.json({ error: "Fee payer key not configured" }, { status: 500 });
    }

    const { signedTx } = await req.json();
    if (!signedTx || !signedTx.startsWith("0x02")) {
      return NextResponse.json(
        { error: "Invalid signedTx. Must be a signed DynamicFeeTx (type 0x02)" },
        { status: 400 }
      );
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const feePayerWallet = new ethers.Wallet(FEE_PAYER_KEY, provider);

    // Check feePayer balance
    const balance = await provider.getBalance(feePayerWallet.address);
    if (balance === BigInt(0)) {
      return NextResponse.json({ error: "Fee payer has no balance" }, { status: 503 });
    }

    // Decode the signed DynamicFeeTx (0x02)
    const payload = ethers.decodeRlp("0x" + signedTx.slice(4)) as any[];
    const [chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, input, accessList, v, r, s] = payload;

    // Build unsigned Fee Delegate tx for feePayer to sign
    const unsignedRlp = ethers.encodeRlp([
      [chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, input, accessList, v, r, s],
      feePayerWallet.address,
    ]);
    const unsignedTyped = "0x" + FD_TX_TYPE.toString(16) + unsignedRlp.slice(2);
    const unsignedHash = ethers.keccak256(unsignedTyped);

    // Sign with feePayer key
    const sig = feePayerWallet.signingKey.sign(unsignedHash);
    const fv = sig.v === 27 ? "0x" : "0x01";
    const fr = sig.r;
    const fs = sig.s;

    // Build signed Fee Delegate tx (0x16)
    const signedRlp = ethers.encodeRlp([
      [chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, input, accessList, v, r, s],
      feePayerWallet.address,
      fv,
      fr,
      fs,
    ]);
    const signedFdTx = "0x" + FD_TX_TYPE.toString(16) + signedRlp.slice(2);

    // Submit to chain
    const txHash = await provider.send("eth_sendRawTransaction", [signedFdTx]);

    return NextResponse.json({
      txHash,
      feeDelegate: true,
      feePayer: feePayerWallet.address,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** GET /api/delegate — Fee payer status */
export async function GET() {
  if (!FEE_PAYER_KEY) {
    return NextResponse.json({ status: "not_configured" });
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(FEE_PAYER_KEY, provider);
    const balance = await provider.getBalance(wallet.address);

    return NextResponse.json({
      status: "active",
      feePayer: wallet.address,
      balance: ethers.formatEther(balance),
      rpc: RPC_URL,
    });
  } catch (err: any) {
    return NextResponse.json({ status: "error", error: err.message });
  }
}

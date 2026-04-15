/**
 * Metadium Fee Delegation — TypeScript implementation
 *
 * Tx type 0x16: Fee Delegate DynamicFeeTx
 * Adapted from https://github.com/METADIUM/feedelegation-js
 *
 * Flow:
 *   1. Agent signs a DynamicFeeTx (type 0x02) with their key
 *   2. Fee delegation server wraps it as type 0x16 + feePayer signature
 *   3. Submits via eth_sendRawTransaction
 */

import { ethers } from "ethers";

const D_TX_TYPE = 0x02;
const FD_TX_TYPE = 0x16;

export interface FeeDelegateTx {
  chainId: number;
  nonce: number;
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
  gas: string;
  to: string;
  value: string;
  input: string;
  accessList: string[];
  v: number;
  r: string;
  s: string;
  feePayer: string;
  fv?: number;
  fr?: string;
  fs?: string;
}

/**
 * Decode a signed DynamicFeeTx (0x02) raw transaction into its components.
 */
export function decodeDynamicFeeTx(rawTx: string): Omit<FeeDelegateTx, "feePayer" | "fv" | "fr" | "fs"> {
  const txType = parseInt(rawTx.slice(0, 4), 16);
  if (txType !== D_TX_TYPE) {
    throw new Error(`Expected DynamicFeeTx (0x02), got 0x${txType.toString(16)}`);
  }

  const payload = ethers.decodeRlp("0x" + rawTx.slice(4)) as string[];
  const [chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, input, accessList, v, r, s] = payload;

  return {
    chainId: Number(chainId),
    nonce: Number(nonce),
    maxPriorityFeePerGas: maxPriorityFeePerGas as string,
    maxFeePerGas: maxFeePerGas as string,
    gas: gas as string,
    to: to as string,
    value: value as string,
    input: input as string,
    accessList: (accessList || []) as string[],
    v: Number(v),
    r: r as string,
    s: s as string,
  };
}

/**
 * Encode an unsigned Fee Delegate DynamicFeeTx (for feePayer to sign).
 * Returns [hash, rawTxHex].
 */
export function encodeFDUnsigned(tx: FeeDelegateTx): [string, string] {
  const rlpEncoded = ethers.encodeRlp([
    [
      ethers.toBeHex(tx.chainId),
      ethers.toBeHex(tx.nonce),
      tx.maxPriorityFeePerGas,
      tx.maxFeePerGas,
      tx.gas,
      tx.to,
      tx.value,
      tx.input,
      tx.accessList,
      ethers.toBeHex(tx.v),
      tx.r,
      tx.s,
    ],
    tx.feePayer,
  ]);

  const typeTxHex = "0x" + FD_TX_TYPE.toString(16) + rlpEncoded.slice(2);
  const txHash = ethers.keccak256(typeTxHex);

  return [txHash, typeTxHex];
}

/**
 * Encode a signed Fee Delegate DynamicFeeTx (ready to submit).
 * Returns [hash, rawTxHex].
 */
export function encodeFDSigned(tx: FeeDelegateTx): [string, string] {
  if (tx.fr === undefined || tx.fs === undefined || tx.fv === undefined) {
    throw new Error("Missing feePayer signature (fv, fr, fs)");
  }

  const rlpEncoded = ethers.encodeRlp([
    [
      ethers.toBeHex(tx.chainId),
      ethers.toBeHex(tx.nonce),
      tx.maxPriorityFeePerGas,
      tx.maxFeePerGas,
      tx.gas,
      tx.to,
      tx.value,
      tx.input,
      tx.accessList,
      ethers.toBeHex(tx.v),
      tx.r,
      tx.s,
    ],
    tx.feePayer,
    ethers.toBeHex(tx.fv),
    tx.fr,
    tx.fs,
  ]);

  const typeTxHex = "0x" + FD_TX_TYPE.toString(16) + rlpEncoded.slice(2);
  const txHash = ethers.keccak256(typeTxHex);

  return [txHash, typeTxHex];
}

/**
 * Sign a Fee Delegate tx as the feePayer.
 * Takes a decoded DynamicFeeTx + feePayer wallet, returns the signed FD raw tx.
 */
export async function signAsFeePayer(
  decodedTx: Omit<FeeDelegateTx, "feePayer" | "fv" | "fr" | "fs">,
  feePayerWallet: ethers.Wallet
): Promise<{ hash: string; rawTransaction: string; feeDelegateTx: FeeDelegateTx }> {
  const fdTx: FeeDelegateTx = {
    ...decodedTx,
    feePayer: feePayerWallet.address,
  };

  // Create unsigned FD tx hash for feePayer to sign
  const [unsignedHash] = encodeFDUnsigned(fdTx);

  // Sign with feePayer's key
  const signingKey = feePayerWallet.signingKey;
  const sig = signingKey.sign(unsignedHash);

  fdTx.fv = sig.v === 27 ? 0 : 1;
  fdTx.fr = sig.r;
  fdTx.fs = sig.s;

  const [hash, rawTransaction] = encodeFDSigned(fdTx);

  return { hash, rawTransaction, feeDelegateTx: fdTx };
}

/**
 * Full fee delegation flow: take agent's signed raw tx, wrap with feePayer sig, submit.
 */
export async function delegateAndSend(
  agentSignedRawTx: string,
  feePayerWallet: ethers.Wallet,
  provider: ethers.JsonRpcProvider
): Promise<string> {
  const decoded = decodeDynamicFeeTx(agentSignedRawTx);
  const { rawTransaction } = await signAsFeePayer(decoded, feePayerWallet);
  const txResponse = await provider.send("eth_sendRawTransaction", [rawTransaction]);
  return txResponse;
}

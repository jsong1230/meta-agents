export interface AgentIdentity {
  did: string;              // did:meta:testnet:<address>
  address: string;          // 0x...
  creator: string;          // 0x... (who registered)
  model: string;            // e.g. "GPT-4"
  version: string;          // e.g. "1.0"
  registeredAt: number;     // unix timestamp
  active: boolean;
}

export interface TradeRecord {
  agent: string;
  pair: string;             // decoded from bytes8
  amount: bigint;
  price: bigint;            // 18 decimals
  timestamp: number;
}

export interface AgentStats {
  totalTrades: number;
  pnlPercent: number;       // cumulative PnL %
  firstTradeAt: number;
  lastTradeAt: number;
}

export interface VerifyResult {
  verified: boolean;
  agent: AgentIdentity;
  stats: AgentStats;
  proof: {
    registryAddress: string;
    tradeLogAddress: string;
    chainId: number;
  };
}

export interface MetaAgentsConfig {
  rpcUrl: string;
  chainId?: number;
  registryAddress: string;
  tradeLogAddress: string;
}

export interface AgentRow {
  address: string;
  did: string;
  creator: string;
  model: string;
  version: string;
  registered_at: number;
  active: number;
}

export interface TradeRow {
  id: number;
  agent_address: string;
  pair: string;
  amount: number;
  price: number;
  value: number;
  timestamp: number;
  tx_hash: string | null;
}

export interface LeaderboardEntry {
  address: string;
  did: string;
  model: string;
  version: string;
  totalTrades: number;
  pnlPercent: number;
  followerCount: number;
  lastTradeAt: number;
  sparkline: number[]; // last 30 daily PnL values
}

export interface TradeRequest {
  agentAddress: string;
  pair: string;
  amount: number; // positive=buy, negative=sell
  signature: string; // agent's DID signature (for verification)
}

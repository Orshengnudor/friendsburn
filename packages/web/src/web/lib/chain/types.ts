export type EngineStatus = "boot" | "live" | "stalled" | "error";

export type BurnRow = {
  id: string;
  block: number;
  ts: number;
  txHash: string;
  from: string;
  amount: bigint;
  amountFloat: number;
  source: string | null;
};

export type NftRow = {
  id: string;
  block: number;
  ts: number;
  txHash: string;
  collection: "GENESIS" | "GENERATIONS";
  tokenId: string;
  from: string;
  to: string;
  kind: "MINT" | "BURN" | "MOVE";
};

export type PlayRow = {
  id: string;
  block: number;
  ts: number;
  txHash: string;
  contract: string;
  name: string;
  detail: string;
  tone: "hot" | "cold" | "play";
};

export type Bucket = { minute: number; burned: number; count: number };

export type BurnerRow = {
  address: string;
  burned: number;
  count: number;
  largest: number;
  lastTs: number;
};

/**
 * The latest ingest batch, bumped once per poll that contained burns. Sound and
 * the whale alert read this instead of diffing the feed themselves.
 */
export type Pulse = {
  id: number;
  rows: BurnRow[];
  at: number;
};

export type SessionStats = {
  burned: number;
  burns: number;
  largest: number;
  nfts: number;
  plays: number;
  startedAt: number;
  startSupply: number;
};

export type ChainState = {
  status: EngineStatus;
  error: string | null;
  transport: "direct" | "proxy";
  head: number;
  blocksPerSec: number;
  latencyMs: number;
  windowFromBlock: number;
  windowMs: number;
  connectedAt: number;
  lastEventAt: number;
  lastPollAt: number;
  symbol: string;
  decimals: number;
  supply: bigint | null;
  supplyFloat: number;
  supplyAt: number;
  supplyPrev: number;
  burns: BurnRow[];
  nfts: NftRow[];
  plays: PlayRow[];
  buckets: Bucket[];
  burners: BurnerRow[];
  pulse: Pulse;
  session: SessionStats;
  burnedInWindow: number;
  burnCountInWindow: number;
  largestBurn: number;
  transfersInWindow: number;
  nftCountInWindow: number;
  playCountInWindow: number;
  logsSeen: number;
  sessionBurned: number;
  sessionBurns: number;
};

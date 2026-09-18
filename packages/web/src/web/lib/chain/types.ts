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

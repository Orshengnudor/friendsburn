import { createPublicClient, formatUnits, http, type Log } from "viem";
import {
  ADDRESSES,
  BURN_SINKS,
  ERC20_ABI,
  EVENT_NAMES,
  FALLBACK_BLOCKS_PER_SEC,
  FEED_LIMIT,
  GAMEPLAY_EVENTS,
  GAMEPLAY_TONE,
  LABELS,
  LOG_CHUNK,
  POLL_MS,
  RPC_URL,
  SUPPLY_POLL_MS,
  TRANSFER_TOPIC,
  WATCHED_ADDRESSES,
  WINDOW_MS,
  robinhoodChain,
} from "./constants";
import type { BurnRow, BurnerRow, ChainState, NftRow, PlayRow } from "./types";
import { decodeDetail, topicToAddress, topicToUint } from "./decode";

const TOKEN = ADDRESSES.token.toLowerCase();
const GENESIS = ADDRESSES.genesis.toLowerCase();
const GENERATIONS = ADDRESSES.generations.toLowerCase();

const initialState: ChainState = {
  status: "boot",
  error: null,
  transport: "direct",
  head: 0,
  blocksPerSec: FALLBACK_BLOCKS_PER_SEC,
  latencyMs: 0,
  windowFromBlock: 0,
  windowMs: WINDOW_MS,
  connectedAt: 0,
  lastEventAt: 0,
  lastPollAt: 0,
  symbol: "RAREFRIENDS",
  decimals: 18,
  supply: null,
  supplyFloat: 0,
  supplyAt: 0,
  supplyPrev: 0,
  burns: [],
  nfts: [],
  plays: [],
  buckets: [],
  burnedInWindow: 0,
  burnCountInWindow: 0,
  largestBurn: 0,
  transfersInWindow: 0,
  nftCountInWindow: 0,
  playCountInWindow: 0,
  logsSeen: 0,
  sessionBurned: 0,
  sessionBurns: 0,
  burners: [],
  pulse: { id: 0, rows: [], at: 0 },
  session: {
    burned: 0,
    burns: 0,
    largest: 0,
    nfts: 0,
    plays: 0,
    startedAt: 0,
    startSupply: 0,
  },
};

type RawLog = Log<bigint, number, false>;

/**
 * Live-only chain reader. Polls the head forward with eth_getLogs and keeps a
 * rolling in-memory window. No backfill beyond the window, no persistence:
 * a reload starts a fresh window from the current head.
 */
class BurnEngine {
  state: ChainState = initialState;
  private listeners = new Set<() => void>();
  private client = this.makeClient("direct");
  private cursor = 0;
  private headTs = 0;
  private headTsBlock = 0;
  private burnLog: { t: number; amt: number; from: string }[] = [];
  private pulseId = 0;
  private transferLog: number[] = [];
  private nftLog: number[] = [];
  private playLog: number[] = [];
  private txSources = new Map<string, { t: number; name: string }>();
  private timers: ReturnType<typeof setInterval>[] = [];
  private booting = false;
  private inFlight = false;
  private filled = false;

  private makeClient(mode: "direct" | "proxy") {
    const url = mode === "proxy" ? `${window.location.origin}/api/chain/rpc` : RPC_URL;
    return createPublicClient({
      chain: robinhoodChain,
      transport: http(url, { batch: false, retryCount: 1, timeout: 20_000 }),
    });
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    if (!this.booting) void this.boot();
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.state;

  private emit(patch: Partial<ChainState>) {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }

  private async boot() {
    this.booting = true;
    try {
      await this.probe();
    } catch (error) {
      this.emit({
        status: "error",
        error: error instanceof Error ? error.message : "rpc unreachable",
      });
      this.booting = false;
      window.setTimeout(() => void this.boot(), 5000);
      return;
    }

    this.timers.push(setInterval(() => void this.tick(), POLL_MS));
    this.timers.push(setInterval(() => void this.readSupply(), SUPPLY_POLL_MS));
    this.timers.push(setInterval(() => this.prune(), 15_000));
  }

  private async probe() {
    let mode: "direct" | "proxy" = "direct";
    try {
      await this.client.getBlockNumber();
    } catch {
      mode = "proxy";
      this.client = this.makeClient("proxy");
      await this.client.getBlockNumber();
    }

    const [head, decimals, symbol] = await Promise.all([
      this.client.getBlockNumber(),
      this.client.readContract({
        address: ADDRESSES.token,
        abi: ERC20_ABI,
        functionName: "decimals",
      }),
      this.client.readContract({
        address: ADDRESSES.token,
        abi: ERC20_ABI,
        functionName: "symbol",
      }),
    ]);

    const headNumber = Number(head);
    const bps = await this.measureBlockRate(headNumber);
    const windowBlocks = Math.floor((WINDOW_MS / 1000) * bps);
    const from = Math.max(1, headNumber - windowBlocks);

    this.cursor = from;
    this.emit({
      transport: mode,
      status: "live",
      error: null,
      head: headNumber,
      blocksPerSec: bps,
      decimals: Number(decimals),
      symbol: String(symbol).toUpperCase(),
      windowFromBlock: from,
      connectedAt: Date.now(),
    });

    await this.readSupply();
    await this.fill(from, headNumber);
  }

  /** Two block reads give a real blocks-per-second for timestamp interpolation. */
  private async measureBlockRate(head: number) {
    try {
      const span = 20_000;
      const [a, b] = await Promise.all([
        this.client.getBlock({ blockNumber: BigInt(Math.max(1, head - span)) }),
        this.client.getBlock({ blockNumber: BigInt(head) }),
      ]);
      this.headTs = Number(b.timestamp) * 1000;
      this.headTsBlock = Number(b.number);
      const dt = Number(b.timestamp) - Number(a.timestamp);
      const db = Number(b.number) - Number(a.number);
      if (dt > 0 && db > 0) return Math.max(1, db / dt);
    } catch {
      /* fall through to the assumed rate */
    }
    this.headTs = Date.now();
    this.headTsBlock = head;
    return FALLBACK_BLOCKS_PER_SEC;
  }

  private tsForBlock(block: number) {
    const base = this.headTs || Date.now();
    const baseBlock = this.headTsBlock || block;
    const bps = this.state.blocksPerSec || FALLBACK_BLOCKS_PER_SEC;
    return Math.round(base + ((block - baseBlock) / bps) * 1000);
  }

  /** One bounded pass over the rolling window, chunked so the RPC stays happy. */
  private async fill(from: number, to: number) {
    for (let start = from; start <= to; start += LOG_CHUNK) {
      const end = Math.min(to, start + LOG_CHUNK - 1);
      try {
        const logs = await this.client.getLogs({
          address: WATCHED_ADDRESSES as unknown as `0x${string}`[],
          fromBlock: BigInt(start),
          toBlock: BigInt(end),
        });
        this.ingest(logs as RawLog[]);
      } catch (error) {
        this.emit({
          error: error instanceof Error ? error.message.slice(0, 120) : "getLogs failed",
        });
      }
    }
    this.cursor = to;
    this.filled = true;
    // the session clock starts once the backlog is in, so a recap counts only live arrivals
    this.emit({
      head: to,
      lastPollAt: Date.now(),
      session: {
        ...this.state.session,
        startSupply: this.state.supplyFloat,
        startedAt: Date.now(),
      },
    });
  }

  private async tick() {
    if (this.inFlight) return;
    this.inFlight = true;
    const started = performance.now();
    try {
      const head = Number(await this.client.getBlockNumber());
      const latency = Math.round(performance.now() - started);
      this.headTs = Date.now();
      this.headTsBlock = head;

      if (head > this.cursor) {
        const from = this.cursor + 1;
        const to = head;
        const logs = await this.client.getLogs({
          address: WATCHED_ADDRESSES as unknown as `0x${string}`[],
          fromBlock: BigInt(from),
          toBlock: BigInt(to),
        });
        this.cursor = head;
        this.ingest(logs as RawLog[]);
      }

      this.emit({
        head,
        latencyMs: latency,
        status: "live",
        error: null,
        lastPollAt: Date.now(),
      });
    } catch (error) {
      this.emit({
        status: "stalled",
        error: error instanceof Error ? error.message.slice(0, 120) : "poll failed",
      });
    } finally {
      this.inFlight = false;
    }
  }

  private async readSupply() {
    try {
      const supply = await this.client.readContract({
        address: ADDRESSES.token,
        abi: ERC20_ABI,
        functionName: "totalSupply",
      });
      const float = Number(formatUnits(supply, this.state.decimals));
      const session =
        this.filled && this.state.session.startSupply <= 0
          ? { ...this.state.session, startSupply: float, startedAt: Date.now() }
          : this.state.session;
      this.emit({
        supply,
        supplyPrev: this.state.supplyFloat || float,
        supplyFloat: float,
        supplyAt: Date.now(),
        session,
      });
    } catch {
      /* keep the last known supply, the counter keeps interpolating */
    }
  }

  private ingest(logs: RawLog[]) {
    if (logs.length === 0) return;

    const burns: BurnRow[] = [];
    const nfts: NftRow[] = [];
    const plays: PlayRow[] = [];
    const transferTs: number[] = [];

    // Pass one: gameplay events, so a burn in the same transaction can be tagged.
    for (const log of logs) {
      const topic0 = (log.topics[0] ?? "") as string;
      const name = EVENT_NAMES[topic0];
      if (!name || !GAMEPLAY_EVENTS.has(name)) continue;
      const block = Number(log.blockNumber);
      const ts = this.tsForBlock(block);
      const address = log.address.toLowerCase();
      plays.push({
        id: `${log.transactionHash}-${log.logIndex}`,
        block,
        ts,
        txHash: log.transactionHash ?? "",
        contract: LABELS[address] ?? address.slice(0, 10),
        name,
        detail: decodeDetail(name, log, this.state.decimals),
        tone: GAMEPLAY_TONE[name] ?? "play",
      });
      const key = (log.transactionHash ?? "").toLowerCase();
      if (key && !this.txSources.has(key)) this.txSources.set(key, { t: ts, name });
    }

    // Pass two: transfers, split into burns and NFT movement.
    for (const log of logs) {
      if (log.topics[0] !== TRANSFER_TOPIC) continue;
      const address = log.address.toLowerCase();
      const block = Number(log.blockNumber);
      const ts = this.tsForBlock(block);

      if (address === TOKEN && log.topics.length === 3) {
        transferTs.push(ts);
        const to = topicToAddress(log.topics[2]);
        if (!BURN_SINKS.has(to)) continue;
        const amount = BigInt(log.data === "0x" ? "0x0" : log.data);
        const amountFloat = Number(formatUnits(amount, this.state.decimals));
        const tx = (log.transactionHash ?? "").toLowerCase();
        burns.push({
          id: `${log.transactionHash}-${log.logIndex}`,
          block,
          ts,
          txHash: log.transactionHash ?? "",
          from: topicToAddress(log.topics[1]),
          amount,
          amountFloat,
          source: this.txSources.get(tx)?.name ?? null,
        });
        continue;
      }

      if ((address === GENESIS || address === GENERATIONS) && log.topics.length === 4) {
        const from = topicToAddress(log.topics[1]);
        const to = topicToAddress(log.topics[2]);
        nfts.push({
          id: `${log.transactionHash}-${log.logIndex}`,
          block,
          ts,
          txHash: log.transactionHash ?? "",
          collection: address === GENESIS ? "GENESIS" : "GENERATIONS",
          tokenId: topicToUint(log.topics[3]).toString(),
          from,
          to,
          kind: BURN_SINKS.has(from) ? "MINT" : BURN_SINKS.has(to) ? "BURN" : "MOVE",
        });
      }
    }

    const now = Date.now();
    for (const burn of burns) {
      this.burnLog.push({ t: burn.ts, amt: burn.amountFloat, from: burn.from });
    }
    for (const ts of transferTs) this.transferLog.push(ts);
    for (const row of nfts) this.nftLog.push(row.ts);
    for (const row of plays) this.playLog.push(row.ts);

    const byTime = <T extends { ts: number; block: number }>(a: T, b: T) =>
      b.block - a.block || b.ts - a.ts;

    const freshBurned = burns.reduce((sum, b) => sum + b.amountFloat, 0);
    const patch: Partial<ChainState> = {
      logsSeen: this.state.logsSeen + logs.length,
      sessionBurned:
        this.filled && burns.length > 0
          ? this.state.sessionBurned + freshBurned
          : this.state.sessionBurned,
      sessionBurns: this.filled ? this.state.sessionBurns + burns.length : this.state.sessionBurns,
      lastEventAt: burns.length + nfts.length + plays.length > 0 ? now : this.state.lastEventAt,
    };

    // Only events that landed after the window fill count as "while watching",
    // otherwise the recap would credit the visitor with 45 minutes of backlog.
    if (this.filled) {
      const previous = this.state.session;
      patch.session = {
        ...previous,
        burned: previous.burned + freshBurned,
        burns: previous.burns + burns.length,
        largest: Math.max(previous.largest, ...burns.map((b) => b.amountFloat), 0),
        nfts: previous.nfts + nfts.length,
        plays: previous.plays + plays.length,
        startedAt: previous.startedAt || now,
      };
      if (burns.length > 0) {
        this.pulseId += 1;
        patch.pulse = { id: this.pulseId, rows: burns, at: now };
      }
    }

    if (burns.length > 0) {
      patch.burns = [...burns.sort(byTime), ...this.state.burns].slice(0, FEED_LIMIT);
      // A burn lowers supply immediately, do not wait for the next supply read.
      const burnedNow = burns.reduce((sum, b) => sum + b.amountFloat, 0);
      if (this.state.supplyFloat > 0) {
        patch.supplyPrev = this.state.supplyFloat;
        patch.supplyFloat = this.state.supplyFloat - burnedNow;
        patch.supplyAt = now;
      }
    }
    if (nfts.length > 0) {
      patch.nfts = [...nfts.sort(byTime), ...this.state.nfts].slice(0, FEED_LIMIT);
    }
    if (plays.length > 0) {
      patch.plays = [...plays.sort(byTime), ...this.state.plays].slice(0, FEED_LIMIT);
    }

    this.emit({ ...patch, ...this.aggregates() });
  }

  private aggregates(): Partial<ChainState> {
    const now = Date.now();
    const cutoff = now - WINDOW_MS;
    const minute = 60_000;
    const bucketCount = Math.round(WINDOW_MS / minute);
    const base = Math.floor(now / minute) - bucketCount + 1;
    const buckets = Array.from({ length: bucketCount }, (_, i) => ({
      minute: base + i,
      burned: 0,
      count: 0,
    }));

    let burned = 0;
    let largest = 0;
    let burnCount = 0;
    const tally = new Map<string, BurnerRow>();
    for (const entry of this.burnLog) {
      if (entry.t < cutoff) continue;
      burned += entry.amt;
      burnCount += 1;
      if (entry.amt > largest) largest = entry.amt;

      const row = tally.get(entry.from);
      if (row) {
        row.burned += entry.amt;
        row.count += 1;
        row.largest = Math.max(row.largest, entry.amt);
        row.lastTs = Math.max(row.lastTs, entry.t);
      } else {
        tally.set(entry.from, {
          address: entry.from,
          burned: entry.amt,
          count: 1,
          largest: entry.amt,
          lastTs: entry.t,
        });
      }
      const index = Math.floor(entry.t / minute) - base;
      if (index >= 0 && index < bucketCount) {
        buckets[index].burned += entry.amt;
        buckets[index].count += 1;
      }
    }

    const burners = [...tally.values()].sort((a, b) => b.burned - a.burned);

    return {
      buckets,
      burners,
      burnedInWindow: burned,
      burnCountInWindow: burnCount,
      largestBurn: largest,
      transfersInWindow: this.transferLog.filter((t) => t >= cutoff).length,
      nftCountInWindow: this.nftLog.filter((t) => t >= cutoff).length,
      playCountInWindow: this.playLog.filter((t) => t >= cutoff).length,
    };
  }

  /** Drop everything that fell out of the window. Memory stays flat. */
  private prune() {
    const cutoff = Date.now() - WINDOW_MS;
    this.burnLog = this.burnLog.filter((e) => e.t >= cutoff);
    this.transferLog = this.transferLog.filter((t) => t >= cutoff);
    this.nftLog = this.nftLog.filter((t) => t >= cutoff);
    this.playLog = this.playLog.filter((t) => t >= cutoff);
    for (const [tx, entry] of this.txSources) {
      if (entry.t < cutoff) this.txSources.delete(tx);
    }
    const windowBlocks = Math.floor((WINDOW_MS / 1000) * (this.state.blocksPerSec || 9));
    this.emit({
      burns: this.state.burns.filter((r) => r.ts >= cutoff),
      nfts: this.state.nfts.filter((r) => r.ts >= cutoff),
      plays: this.state.plays.filter((r) => r.ts >= cutoff),
      windowFromBlock: Math.max(1, this.state.head - windowBlocks),
      ...this.aggregates(),
    });
  }
}

declare global {
  interface Window {
    __friendsburnEngine?: BurnEngine;
  }
}

/** Single engine per tab, survives hot module reloads in dev. */
export const engine: BurnEngine = (window.__friendsburnEngine ??= new BurnEngine());

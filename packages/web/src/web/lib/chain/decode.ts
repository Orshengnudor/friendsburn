import { formatUnits, type Log } from "viem";

type RawLog = Log<bigint, number, false>;

export function topicToAddress(topic: string | undefined) {
  if (!topic) return "0x";
  return `0x${topic.slice(26)}`.toLowerCase();
}

export function topicToUint(topic: string | undefined) {
  if (!topic) return 0n;
  try {
    return BigInt(topic);
  } catch {
    return 0n;
  }
}

export function shortAddress(address: string) {
  if (!address.startsWith("0x") || address.length < 12) return address;
  return `${address.slice(0, 6)}..${address.slice(-4)}`;
}

export function shortHash(hash: string) {
  if (!hash) return "0x";
  return `${hash.slice(0, 10)}..`;
}

function words(data: string) {
  const body = data.startsWith("0x") ? data.slice(2) : data;
  const out: bigint[] = [];
  for (let i = 0; i + 64 <= body.length; i += 64) {
    out.push(BigInt(`0x${body.slice(i, i + 64)}`));
  }
  return out;
}

function compact(value: bigint, decimals: number) {
  const n = Number(formatUnits(value, decimals));
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  if (n >= 1) return n.toFixed(2);
  if (n > 0) return n.toFixed(4);
  return "0";
}

/**
 * Best-effort argument line per event. Full ABIs are pending, so this reads the
 * indexed topics and the data words by shape and prints what is unambiguous.
 */
export function decodeDetail(name: string, log: RawLog, decimals: number): string {
  const t = log.topics;
  const d = words(log.data);

  switch (name) {
    case "Locked":
    case "Unlocked":
    case "MetadataUpdate": {
      const id = t.length > 1 ? topicToUint(t[1]) : (d[0] ?? 0n);
      return `TOKEN #${id}`;
    }
    case "TokenBoundAccountReady": {
      return `TOKEN #${topicToUint(t[1])} ACCT ${shortAddress(topicToAddress(t[2]))}`;
    }
    case "Activated": {
      const who = shortAddress(topicToAddress(t[1]));
      const id = topicToUint(t[2]);
      const tier = d[0] ?? 0n;
      return `#${id} BY ${who} LVL ${tier}`;
    }
    case "ActivationCleared": {
      return `${shortAddress(topicToAddress(t[1]))} TOKEN #${topicToUint(t[2])}`;
    }
    case "Funded": {
      const amount = d[0] ?? 0n;
      return `${compact(amount, decimals)} RF FROM ${shortAddress(topicToAddress(t[1]))}`;
    }
    case "Claimed": {
      const amount = d[0] ?? 0n;
      return `${compact(amount, decimals)} RF BY ${shortAddress(topicToAddress(t[1]))}`;
    }
    case "Hardwired": {
      return `${shortAddress(topicToAddress(t[1]))} TOKEN #${topicToUint(t[2])}`;
    }
    case "Promoted": {
      const id = topicToUint(t[1]);
      const tier = d[0] ?? 0n;
      return `TOKEN #${id} TIER ${tier}`;
    }
    default:
      return `RAW ${(t[0] ?? "0x").slice(0, 12)}`;
  }
}

export function formatAmount(value: number, maxFrac = 2) {
  if (!Number.isFinite(value)) return "0";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString("en-US", { maximumFractionDigits: maxFrac });
}

export function formatFull(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function agoLabel(ts: number, now: number) {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return `${s}S`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}M`;
  return `${Math.floor(m / 60)}H`;
}

import type { BurnRow, ChainState } from "./chain/types";
import { formatAmount, formatFull, shortAddress } from "./chain/decode";
import { WINDOW_MIN } from "./chain/constants";
import { watchedLabel } from "./watched";

const W = 1200;
const H = 675;

const INK = {
  black: "#000000",
  white: "#ffffff",
  ash: "#8a8a8f",
  dim: "#3a3a40",
  burn: "#ff5a17",
  ember: "#ffa02b",
  flare: "#ffe08a",
  live: "#38ff7a",
  nft: "#4de2ff",
  play: "#b98cff",
};

const PIXEL = '"Press Start 2P", monospace';
const MONO = '"IBM Plex Mono", monospace';

let markPromise: Promise<HTMLImageElement | null> | null = null;

function loadMark() {
  if (!markPromise) {
    markPromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = "/images/friend-mark.png";
    });
  }
  return markPromise;
}

async function ready() {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load(`40px ${PIXEL}`),
      document.fonts.load(`16px ${PIXEL}`),
      document.fonts.load(`18px ${MONO}`),
      document.fonts.load(`700 18px ${MONO}`),
    ]);
  } catch {
    // fonts fall back to monospace, the card still renders
  }
}

function fitSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  start: number,
  font: string,
) {
  let size = start;
  for (; size > 12; size -= 2) {
    ctx.font = `${size}px ${font}`;
    if (ctx.measureText(text).width <= maxWidth) break;
  }
  return size;
}

function glow(ctx: CanvasRenderingContext2D, color: string, blur: number) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function clearGlow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
}

function frame(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = INK.black;
  ctx.fillRect(0, 0, W, H);

  // faint pixel grid
  ctx.strokeStyle = "rgba(255, 90, 23, 0.07)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();
  }

  // scanlines
  ctx.fillStyle = "rgba(255, 255, 255, 0.045)";
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);

  // ember wash at the bottom, the burn is down there
  const wash = ctx.createLinearGradient(0, H - 260, 0, H);
  wash.addColorStop(0, "rgba(255, 90, 23, 0)");
  wash.addColorStop(1, "rgba(255, 90, 23, 0.16)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, H - 260, W, 260);

  // borders
  ctx.strokeStyle = INK.burn;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, W - 6, H - 6);
  ctx.strokeStyle = INK.dim;
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  // corner blocks
  ctx.fillStyle = INK.burn;
  const c = 14;
  ctx.fillRect(0, 0, c, c);
  ctx.fillRect(W - c, 0, c, c);
  ctx.fillRect(0, H - c, c, c);
  ctx.fillRect(W - c, H - c, c, c);
}

function header(ctx: CanvasRenderingContext2D, mark: HTMLImageElement | null) {
  if (mark) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(mark, 52, 48, 38, 41);
  }
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.font = `22px ${PIXEL}`;
  glow(ctx, "rgba(255,255,255,0.4)", 12);
  ctx.fillStyle = INK.white;
  ctx.fillText("FRIENDS", 104, 78);
  const cut = ctx.measureText("FRIENDS").width;
  glow(ctx, INK.burn, 18);
  ctx.fillStyle = INK.burn;
  ctx.fillText("BURN", 104 + cut, 78);
  clearGlow(ctx);

  ctx.textAlign = "right";
  ctx.font = `11px ${PIXEL}`;
  ctx.fillStyle = INK.ash;
  ctx.fillText("$RAREFRIENDS", W - 52, 66);
  ctx.fillStyle = INK.dim;
  ctx.fillText("ROBINHOOD CHAIN", W - 52, 84);

  ctx.fillStyle = INK.dim;
  ctx.fillRect(52, 108, W - 104, 2);
}

/** Local hosts are not worth printing on a card someone posts. */
function brandLabel() {
  if (typeof window === "undefined") return "FRIENDSBURN";
  const host = window.location.hostname;
  const local =
    host === "localhost" || host === "127.0.0.1" || host.endsWith(".local") || host === "";
  return local ? "FRIENDSBURN" : window.location.host.toUpperCase();
}

function footer(ctx: CanvasRenderingContext2D, note: string) {
  // pixel flame strip
  const bars = 40;
  const slot = (W - 104) / bars;
  for (let i = 0; i < bars; i += 1) {
    const factor = 0.35 + 0.65 * Math.abs(Math.sin(i * 1.7));
    const height = Math.round(10 + factor * 34);
    const x = 52 + i * slot;
    ctx.fillStyle = height > 32 ? INK.ember : INK.burn;
    ctx.fillRect(Math.round(x), H - 96 - height, Math.max(4, Math.round(slot - 4)), height);
  }

  ctx.fillStyle = INK.dim;
  ctx.fillRect(52, H - 84, W - 104, 2);

  ctx.textAlign = "left";
  ctx.font = `11px ${PIXEL}`;
  ctx.fillStyle = INK.ash;
  ctx.fillText(note, 52, H - 50);

  ctx.textAlign = "right";
  ctx.fillStyle = INK.dim;
  ctx.fillText(brandLabel(), W - 52, H - 50);
}

function metaCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  tone = INK.white,
) {
  ctx.fillStyle = INK.dim;
  ctx.fillRect(x, y, 3, 46);
  ctx.textAlign = "left";
  ctx.font = `10px ${PIXEL}`;
  ctx.fillStyle = INK.ash;
  ctx.fillText(label, x + 14, y + 14);
  const size = fitSize(ctx, value, width - 20, 22, MONO);
  ctx.font = `700 ${size}px ${MONO}`;
  ctx.fillStyle = tone;
  ctx.fillText(value, x + 14, y + 42);
}

function canvas() {
  const el = document.createElement("canvas");
  el.width = W;
  el.height = H;
  const ctx = el.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  return { el, ctx };
}

function timeLabel(ts: number) {
  return new Date(ts)
    .toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .toUpperCase();
}

/** A single burn, rendered for posting. */
export async function renderBurnCard(row: BurnRow) {
  await ready();
  const mark = await loadMark();
  const { el, ctx } = canvas();
  frame(ctx);
  header(ctx, mark);

  ctx.textAlign = "left";
  ctx.font = `13px ${PIXEL}`;
  ctx.fillStyle = INK.burn;
  glow(ctx, INK.burn, 14);
  ctx.fillText("BURN CONFIRMED", 52, 162);
  clearGlow(ctx);

  const amount = formatFull(row.amountFloat);
  const size = fitSize(ctx, amount, W - 260, 92, PIXEL);
  ctx.font = `${size}px ${PIXEL}`;
  glow(ctx, INK.burn, 34);
  ctx.fillStyle = INK.white;
  ctx.fillText(amount, 52, 272);
  const amountWidth = ctx.measureText(amount).width;
  clearGlow(ctx);
  ctx.font = `20px ${PIXEL}`;
  ctx.fillStyle = INK.ember;
  ctx.fillText("RF", 52 + amountWidth + 22, 272);

  ctx.font = `12px ${PIXEL}`;
  ctx.fillStyle = INK.ash;
  ctx.fillText("SENT TO 0X0, GONE FOR GOOD", 52, 312);

  const half = (W - 104) / 2;
  metaCell(ctx, 52, 360, half - 20, "BURNED BY", shortAddress(row.from), INK.white);
  metaCell(
    ctx,
    52 + half,
    360,
    half - 20,
    "SOURCE",
    (row.source ?? "DIRECT TRANSFER").toUpperCase(),
    INK.play,
  );
  metaCell(ctx, 52, 430, half - 20, "WHEN", timeLabel(row.ts), INK.white);
  metaCell(ctx, 52 + half, 430, half - 20, "BLOCK", row.block.toLocaleString("en-US"), INK.live);

  ctx.textAlign = "left";
  ctx.font = `10px ${PIXEL}`;
  ctx.fillStyle = INK.ash;
  ctx.fillText("TX", 66, 514);
  ctx.font = `15px ${MONO}`;
  ctx.fillStyle = INK.ember;
  ctx.fillText(row.txHash, 96, 517);

  footer(ctx, "LIVE ONLY TERMINAL, NOTHING STORED");
  return el;
}

/** The "while you watched" recap. */
export async function renderRecapCard(state: ChainState, now: number) {
  await ready();
  const mark = await loadMark();
  const { el, ctx } = canvas();
  frame(ctx);
  header(ctx, mark);

  const startedAt = state.session.startedAt || state.connectedAt || now;
  const watched = watchedLabel(now - startedAt);

  ctx.textAlign = "left";
  ctx.font = `13px ${PIXEL}`;
  ctx.fillStyle = INK.live;
  glow(ctx, INK.live, 12);
  ctx.fillText("SESSION RECAP", 52, 168);
  clearGlow(ctx);

  const amount = formatFull(state.session.burned);
  const size = fitSize(ctx, amount, W - 300, 86, PIXEL);
  ctx.font = `${size}px ${PIXEL}`;
  glow(ctx, INK.burn, 34);
  ctx.fillStyle = INK.white;
  ctx.fillText(amount, 52, 256);
  const amountWidth = ctx.measureText(amount).width;
  clearGlow(ctx);
  ctx.font = `20px ${PIXEL}`;
  ctx.fillStyle = INK.ember;
  ctx.fillText("RF", 52 + amountWidth + 22, 256);

  ctx.font = `14px ${PIXEL}`;
  ctx.fillStyle = INK.ash;
  ctx.fillText(`BURNED IN THE ${watched} I WATCHED`, 52, 300);

  const half = (W - 104) / 2;
  metaCell(
    ctx,
    52,
    360,
    half - 20,
    "BURN EVENTS",
    state.session.burns.toLocaleString("en-US"),
    INK.ember,
  );
  metaCell(ctx, 52 + half, 360, half - 20, "BIGGEST SINGLE BURN", `${formatAmount(state.session.largest)} RF`, INK.burn);
  metaCell(ctx, 52, 430, half - 20, "NFT MOVES", state.session.nfts.toLocaleString("en-US"), INK.nft);
  metaCell(
    ctx,
    52 + half,
    430,
    half - 20,
    "GAMEPLAY EVENTS",
    state.session.plays.toLocaleString("en-US"),
    INK.play,
  );

  ctx.textAlign = "left";
  ctx.font = `10px ${PIXEL}`;
  ctx.fillStyle = INK.ash;
  ctx.fillText("SUPPLY NOW", 66, 514);
  ctx.font = `15px ${MONO}`;
  ctx.fillStyle = INK.flare;
  ctx.fillText(`${formatFull(state.supplyFloat)} RF`, 190, 517);

  footer(ctx, `${WINDOW_MIN}MIN ROLLING WINDOW`);
  return el;
}

/** Top burners of the current window. */
export async function renderLeaderCard(state: ChainState, rows: number) {
  await ready();
  const mark = await loadMark();
  const { el, ctx } = canvas();
  frame(ctx);
  header(ctx, mark);

  ctx.textAlign = "left";
  ctx.font = `13px ${PIXEL}`;
  ctx.fillStyle = INK.ember;
  glow(ctx, INK.ember, 12);
  ctx.fillText("TOP BURNERS", 52, 166);
  clearGlow(ctx);
  ctx.font = `11px ${PIXEL}`;
  ctx.fillStyle = INK.ash;
  ctx.fillText(`LAST ${WINDOW_MIN} MINUTES, LIVE WINDOW`, 52, 192);

  const top = state.burners.slice(0, rows);
  const peak = top[0]?.burned ?? 1;
  // rows breathe when there are few of them, and tighten up when the board is full
  const step = top.length > 8 ? 40 : top.length > 4 ? 52 : 64;
  const barLeft = 268;
  const barSpan = W - barLeft - 220;
  let y = 240;
  for (const [index, row] of top.entries()) {
    ctx.font = `14px ${PIXEL}`;
    ctx.fillStyle = index === 0 ? INK.flare : INK.ash;
    ctx.fillText(`${index + 1}`.padStart(2, "0"), 56, y);

    ctx.font = `700 16px ${MONO}`;
    ctx.fillStyle = index === 0 ? INK.white : INK.ash;
    ctx.fillText(shortAddress(row.address), 96, y);

    // track, then the filled share of the top burner
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(barLeft, y - 15, barSpan, 20);
    const width = Math.max(4, Math.round((barSpan * row.burned) / peak));
    ctx.fillStyle = index === 0 ? INK.burn : INK.dim;
    ctx.fillRect(barLeft, y - 15, width, 20);

    ctx.textAlign = "right";
    ctx.font = `700 17px ${MONO}`;
    ctx.fillStyle = index === 0 ? INK.flare : INK.ember;
    ctx.fillText(`${formatAmount(row.burned)} RF`, W - 56, y);
    ctx.textAlign = "left";
    y += step;
    if (y > H - 130) break;
  }

  if (top.length === 0) {
    ctx.font = `14px ${PIXEL}`;
    ctx.fillStyle = INK.dim;
    ctx.fillText("NO BURNS IN THIS WINDOW", 56, 250);
  }

  // a short board leaves a hole in the card, so fill it with the window itself
  const base = Math.max(y + 18, 356);
  if (base <= 424) {
    const half = (W - 104) / 2;
    metaCell(
      ctx,
      52,
      base,
      half - 20,
      "UNIQUE BURNERS",
      state.burners.length.toLocaleString("en-US"),
      INK.white,
    );
    metaCell(
      ctx,
      52 + half,
      base,
      half - 20,
      "BURN EVENTS",
      state.burnCountInWindow.toLocaleString("en-US"),
      INK.ember,
    );
    ctx.textAlign = "left";
    ctx.font = `10px ${PIXEL}`;
    ctx.fillStyle = INK.ash;
    ctx.fillText("TOP SHARE", 66, base + 82);
    ctx.font = `15px ${MONO}`;
    ctx.fillStyle = INK.flare;
    const share = state.burnedInWindow > 0 ? ((peak / state.burnedInWindow) * 100).toFixed(1) : "0.0";
    ctx.fillText(`${share}% OF THE WINDOW BURN`, 186, base + 85);
  }

  footer(ctx, `${formatAmount(state.burnedInWindow)} RF BURNED IN WINDOW`);
  return el;
}

type MilestoneFacts = {
  next: number;
  remaining: number;
  progress: number;
  eta: string;
  perHour: number;
};

/** The countdown to the next round supply number. */
export async function renderMilestoneCard(state: ChainState, facts: MilestoneFacts) {
  await ready();
  const mark = await loadMark();
  const { el, ctx } = canvas();
  frame(ctx);
  header(ctx, mark);

  ctx.textAlign = "left";
  ctx.font = `13px ${PIXEL}`;
  ctx.fillStyle = INK.nft;
  glow(ctx, INK.nft, 12);
  ctx.fillText("SUPPLY IS HEADING FOR", 52, 166);
  clearGlow(ctx);

  const label = formatFull(facts.next);
  const size = fitSize(ctx, label, W - 150, 78, PIXEL);
  ctx.font = `${size}px ${PIXEL}`;
  glow(ctx, INK.burn, 30);
  ctx.fillStyle = INK.white;
  ctx.fillText(label, 52, 268);
  clearGlow(ctx);

  ctx.font = `13px ${PIXEL}`;
  ctx.fillStyle = INK.ash;
  ctx.fillText(`${formatFull(facts.remaining)} RF LEFT TO BURN`, 52, 310);

  // progress track
  const trackY = 348;
  const trackW = W - 104;
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  ctx.fillRect(52, trackY, trackW, 26);
  const fill = ctx.createLinearGradient(52, trackY, 52 + trackW, trackY);
  fill.addColorStop(0, INK.burn);
  fill.addColorStop(1, INK.ember);
  ctx.fillStyle = fill;
  ctx.fillRect(52, trackY, Math.max(4, Math.round((trackW * facts.progress) / 100)), 26);
  ctx.strokeStyle = INK.dim;
  ctx.lineWidth = 2;
  ctx.strokeRect(52, trackY, trackW, 26);
  ctx.font = `10px ${PIXEL}`;
  ctx.fillStyle = INK.ember;
  ctx.fillText(`${facts.progress.toFixed(1)}% THERE`, 52, trackY + 48);

  const half = (W - 104) / 2;
  metaCell(ctx, 52, 438, half - 20, "ETA AT CURRENT RATE", facts.eta, INK.flare);
  metaCell(
    ctx,
    52 + half,
    438,
    half - 20,
    "BURN RATE",
    `${formatAmount(facts.perHour)} RF / HOUR`,
    INK.burn,
  );

  ctx.textAlign = "left";
  ctx.font = `10px ${PIXEL}`;
  ctx.fillStyle = INK.ash;
  ctx.fillText("SUPPLY NOW", 66, 520);
  ctx.font = `15px ${MONO}`;
  ctx.fillStyle = INK.white;
  ctx.fillText(`${formatFull(state.supplyFloat)} RF`, 190, 523);

  footer(ctx, `STRAIGHT LINE MATH ON THE LAST ${WINDOW_MIN} MINUTES`);
  return el;
}

export function canvasBlob(el: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => el.toBlob((blob) => resolve(blob), "image/png"));
}

export function downloadCanvas(el: HTMLCanvasElement, filename: string) {
  const url = el.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}

/**
 * Hands the PNG itself to the OS share sheet, which is the only route that gets
 * a real image into a post. Phones almost always have it, desktop mostly does
 * not, so the caller needs a fallback.
 */
export async function shareCardFile(el: HTMLCanvasElement, filename: string, text: string) {
  try {
    const blob = await canvasBlob(el);
    if (!blob) return false;
    const file = new File([blob], filename, { type: "image/png" });
    const nav = navigator as Navigator & {
      canShare?: (data: { files?: File[] }) => boolean;
      share?: (data: { files?: File[]; text?: string }) => Promise<void>;
    };
    if (!nav.share || !nav.canShare || !nav.canShare({ files: [file] })) return false;
    await nav.share({ files: [file], text });
    return true;
  } catch {
    return false;
  }
}

export function tweetUrl(text: string) {
  const url = typeof window === "undefined" ? "" : window.location.href;
  const params = new URLSearchParams({ text, url });
  return `https://x.com/intent/post?${params.toString()}`;
}

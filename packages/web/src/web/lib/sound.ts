import type { BurnRow } from "./chain/types";
import { WHALE_THRESHOLD } from "./chain/constants";

const STORE_KEY = "fb.sound";
/** Never fire more than this many blips for one poll batch. */
const MAX_BLIPS = 3;
const BLIP_GAP_MS = 80;

/**
 * Tiny arcade blip synth. Muted until the visitor asks for it, because an
 * autoplaying terminal is a closed tab. Everything is synthesised, no assets.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private on = false;
  private listeners = new Set<() => void>();

  constructor() {
    if (typeof window !== "undefined") {
      this.on = window.localStorage.getItem(STORE_KEY) === "on";
    }
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getSnapshot = () => this.on;

  toggle = () => {
    this.on = !this.on;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORE_KEY, this.on ? "on" : "off");
    }
    if (this.on) {
      // The toggle click is the gesture that lets audio start at all.
      this.audio()?.resume();
      this.tone({ freq: 660, at: 0, length: 0.05, gain: 0.05, type: "square" });
      this.tone({ freq: 990, at: 0.06, length: 0.07, gain: 0.05, type: "square" });
    }
    for (const fn of this.listeners) fn();
  };

  /** Play a batch of burns, loudest first, capped so a busy block stays music. */
  burst(rows: BurnRow[]) {
    if (!this.on || rows.length === 0) return;
    const loudest = [...rows].sort((a, b) => b.amountFloat - a.amountFloat).slice(0, MAX_BLIPS);
    loudest.forEach((row, index) => {
      window.setTimeout(() => this.blip(row.amountFloat), index * BLIP_GAP_MS);
    });
  }

  /** One burn. Bigger burn, lower and longer, so size is audible. */
  blip(amount: number) {
    if (!this.on) return;
    const ctx = this.audio();
    if (!ctx) return;
    // log scale, 1 RF to 10k RF spread across the range
    const size = Math.min(1, Math.max(0, Math.log10(Math.max(amount, 1) + 1) / 4));
    const freq = 900 - 640 * size;
    const length = 0.07 + 0.13 * size;
    const gain = 0.05 + 0.06 * size;

    this.tone({ freq, at: 0, length, gain, type: "square" });
    this.tone({ freq: freq * 1.5, at: 0.02, length: length * 0.6, gain: gain * 0.4, type: "square" });

    if (amount >= WHALE_THRESHOLD) {
      this.tone({ freq: freq * 0.5, at: 0, length: 0.5, gain: 0.09, type: "sawtooth" });
      this.tone({ freq: freq * 0.26, at: 0.08, length: 0.6, gain: 0.08, type: "triangle" });
      this.noise(0.45, 0.05);
    }
  }

  private audio() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private tone({
    freq,
    at,
    length,
    gain,
    type,
  }: {
    freq: number;
    at: number;
    length: number;
    gain: number;
    type: OscillatorType;
  }) {
    const ctx = this.audio();
    if (!ctx) return;
    const start = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.72), start + length);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(amp).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + length + 0.02);
  }

  /** Short noise thump, the weight under a whale burn. */
  private noise(length: number, gain: number) {
    const ctx = this.audio();
    if (!ctx) return;
    const frames = Math.floor(ctx.sampleRate * length);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 2;
    }
    const src = ctx.createBufferSource();
    const amp = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    amp.gain.value = gain;
    src.buffer = buffer;
    src.connect(filter).connect(amp).connect(ctx.destination);
    src.start(ctx.currentTime);
  }
}

export const sound = new SoundEngine();

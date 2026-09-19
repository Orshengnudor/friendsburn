import type { BurnRow } from "./chain/types";
import { WHALE_COOLDOWN_MS, WHALE_THRESHOLD } from "./chain/constants";

/**
 * Decides whether a pulse earns the full-screen takeover, and which row gets it.
 * Pure on purpose: the rule is the interesting part, not the rendering.
 *
 * Returns the biggest qualifying burn in the pulse, or null when the pulse has
 * nothing big enough or the last takeover is still inside its quiet time.
 */
export function pickTakeover(rows: BurnRow[], lastShownAt: number, at: number): BurnRow | null {
  if (rows.length === 0) return null;
  const biggest = rows.reduce((top, next) => (next.amountFloat > top.amountFloat ? next : top));
  if (biggest.amountFloat < WHALE_THRESHOLD) return null;
  if (lastShownAt > 0 && at - lastShownAt < WHALE_COOLDOWN_MS) return null;
  return biggest;
}

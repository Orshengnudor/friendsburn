import { useEffect, useState, useSyncExternalStore } from "react";
import { engine } from "../lib/chain/engine";
import type { ChainState } from "../lib/chain/types";

/** Live chain state from the in-memory engine. */
export function useChain(): ChainState {
  return useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
}

/** Repainting clock for "seconds ago" labels and the supply drift. */
export function useTicker(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

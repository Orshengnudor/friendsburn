import { useEffect, useRef, useState } from "react";
import type { BurnRow, Pulse } from "../lib/chain/types";
import { formatAmount, formatFull, shortAddress } from "../lib/chain/decode";
import { pickTakeover } from "../lib/whale";

const HOLD_MS = 2200;

type Props = { pulse: Pulse; onShare: (row: BurnRow) => void };

/** Takes the screen for two seconds when something huge goes to 0x0. */
export function WhaleAlert({ pulse, onShare }: Props) {
  const [row, setRow] = useState<BurnRow | null>(null);
  const lastShown = useRef(0);

  useEffect(() => {
    const now = Date.now();
    const biggest = pickTakeover(pulse.rows, lastShown.current, now);
    if (!biggest) return;
    lastShown.current = now;
    setRow(biggest);
    const id = window.setTimeout(() => setRow(null), HOLD_MS);
    return () => window.clearTimeout(id);
  }, [pulse.id, pulse.rows]);

  if (!row) return null;

  return (
    <button
      type="button"
      aria-label="Share this burn"
      className="whale-wrap fixed inset-0 z-[68] flex cursor-pointer flex-col items-center justify-center px-4"
      onClick={() => {
        const target = row;
        setRow(null);
        onShare(target);
      }}
    >
      <div className="whale-bg absolute inset-0" />
      <div className="relative flex w-full max-w-[1100px] flex-col items-center border-4 border-fb-burn bg-black/80 px-4 py-8 text-center sm:py-12">
        <div className="pixel glow-burn text-[12px] text-fb-burn sm:text-[20px]">WHALE BURN</div>
        <div className="whale-amount pixel glow-burn mt-5 text-[30px] leading-none text-fb-white sm:mt-7 sm:text-[64px]">
          {formatAmount(row.amountFloat)}
          <span className="ml-3 text-fb-ember">RF</span>
        </div>
        <div className="mt-4 font-mono text-[11px] text-fb-ash sm:mt-6 sm:text-[15px]">
          {/* the exact number only earns its line when the big one is abbreviated */}
          {formatAmount(row.amountFloat) === formatFull(row.amountFloat)
            ? "GONE TO 0X0, FOR GOOD"
            : `${formatFull(row.amountFloat)} RF GONE TO 0X0`}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <span className="pixel text-[7px] text-fb-ash sm:text-[9px]">
            BY {shortAddress(row.from)}
          </span>
          {row.source ? (
            <span className="pixel border border-fb-play px-1.5 py-1 text-[7px] text-fb-play sm:text-[9px]">
              {row.source.toUpperCase()}
            </span>
          ) : null}
          <span className="pixel text-[7px] text-fb-dim sm:text-[9px]">
            BLOCK {row.block.toLocaleString("en-US")}
          </span>
        </div>
        <div className="pixel mt-6 text-[6px] text-fb-ember sm:text-[8px]">
          CLICK TO TURN THIS INTO A SHARE CARD
        </div>
      </div>
    </button>
  );
}

import type { BurnRow, ChainState } from "../lib/chain/types";
import { agoLabel, formatAmount, shortAddress, shortHash } from "../lib/chain/decode";
import { Panel } from "./panel";
import { EmptyFeed, TxLink, useFreshIds } from "./feed-row";

type Props = { state: ChainState; now: number; onPick: (row: BurnRow) => void };

export function BurnFeed({ state, now, onPick }: Props) {
  const isFresh = useFreshIds();

  return (
    <Panel
      title="BURN FEED / RF TO 0X0"
      right={state.burns.length > 0 ? `${state.burns.length} // TAP TO SHARE` : "IDLE"}
      className="col-span-12 lg:col-span-5"
    >
      <div className="h-full max-h-[320px] overflow-y-auto lg:max-h-[300px]">
        {state.burns.length === 0 ? (
          <EmptyFeed text={state.status === "boot" ? "READING WINDOW" : "NO BURNS IN WINDOW"} />
        ) : (
          <ul>
            {state.burns.map((row) => (
              <li
                key={row.id}
                className={`group relative flex items-center gap-2 border-b border-fb-dim/60 px-2 py-1.5 ${
                  isFresh(row.id) ? "row-in" : ""
                }`}
              >
                {/* Full row hit area, so the tx link above it stays clickable. */}
                <button
                  type="button"
                  aria-label={`Share burn card for ${formatAmount(row.amountFloat)} RF`}
                  onClick={() => onPick(row)}
                  className="absolute inset-0 z-0 cursor-pointer hover:bg-fb-burn/12"
                />
                <span className="pixel relative shrink-0 text-[8px] text-fb-burn group-hover:hidden">
                  BURN
                </span>
                <span className="pixel relative hidden shrink-0 text-[8px] text-fb-flare group-hover:inline">
                  CARD
                </span>
                <span className="glow-burn pointer-events-none relative min-w-0 flex-1 truncate font-mono text-[13px] font-bold text-fb-ember">
                  {formatAmount(row.amountFloat)}
                </span>
                <span className="pointer-events-none relative shrink-0 font-mono text-[10px] text-fb-ash">
                  {shortAddress(row.from)}
                </span>
                {row.source ? (
                  <span className="pixel pointer-events-none relative shrink-0 border border-fb-dim px-1 py-0.5 text-[6px] text-fb-play">
                    {row.source}
                  </span>
                ) : null}
                <span className="relative hidden shrink-0 font-mono text-[10px] sm:inline">
                  <TxLink hash={row.txHash} label={shortHash(row.txHash)} />
                </span>
                <span className="pointer-events-none relative w-8 shrink-0 text-right font-mono text-[10px] text-fb-ash">
                  {agoLabel(row.ts, now)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

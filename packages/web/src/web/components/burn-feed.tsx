import type { ChainState } from "../lib/chain/types";
import { agoLabel, formatAmount, shortAddress, shortHash } from "../lib/chain/decode";
import { Panel } from "./panel";
import { EmptyFeed, TxLink, useFreshIds } from "./feed-row";

type Props = { state: ChainState; now: number };

export function BurnFeed({ state, now }: Props) {
  const isFresh = useFreshIds();

  return (
    <Panel
      title="BURN FEED / RF TO 0X0"
      right={state.burns.length > 0 ? `${state.burns.length} SHOWN` : "IDLE"}
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
                className={`flex items-center gap-2 border-b border-fb-dim/60 px-2 py-1.5 ${
                  isFresh(row.id) ? "row-in" : ""
                }`}
              >
                <span className="pixel shrink-0 text-[8px] text-fb-burn">BURN</span>
                <span className="glow-burn min-w-0 flex-1 truncate font-mono text-[13px] font-bold text-fb-ember">
                  {formatAmount(row.amountFloat)}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-fb-ash">
                  {shortAddress(row.from)}
                </span>
                {row.source ? (
                  <span className="pixel shrink-0 border border-fb-dim px-1 py-0.5 text-[6px] text-fb-play">
                    {row.source}
                  </span>
                ) : null}
                <span className="hidden shrink-0 font-mono text-[10px] sm:inline">
                  <TxLink hash={row.txHash} label={shortHash(row.txHash)} />
                </span>
                <span className="w-8 shrink-0 text-right font-mono text-[10px] text-fb-ash">
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

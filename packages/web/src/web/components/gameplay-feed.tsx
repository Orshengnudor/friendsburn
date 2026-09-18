import type { ChainState } from "../lib/chain/types";
import { agoLabel, shortHash } from "../lib/chain/decode";
import { Panel } from "./panel";
import { EmptyFeed, TxLink, useFreshIds } from "./feed-row";

type Props = { state: ChainState; now: number };

const toneClass = {
  hot: "text-fb-ember",
  cold: "text-fb-nft",
  play: "text-fb-play",
} as const;

export function GameplayFeed({ state, now }: Props) {
  const isFresh = useFreshIds();

  return (
    <Panel
      title="GAMEPLAY / RAW EVENTS"
      right={`${state.playCountInWindow} IN WINDOW`}
      accent="play"
      className="col-span-12 lg:col-span-6"
    >
      <div className="h-full max-h-[300px] overflow-y-auto">
        {state.plays.length === 0 ? (
          <EmptyFeed text={state.status === "boot" ? "READING WINDOW" : "NO GAMEPLAY EVENTS YET"} />
        ) : (
          <ul>
            {state.plays.map((row) => (
              <li
                key={row.id}
                className={`flex items-center gap-2 border-b border-fb-dim/60 px-2 py-1.5 ${
                  isFresh(row.id) ? "row-in" : ""
                }`}
              >
                <span className={`font-mono text-[11px] font-bold ${toneClass[row.tone]}`}>
                  {row.name}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-fb-ash">
                  {row.detail}
                </span>
                <span className="hidden shrink-0 font-mono text-[9px] text-fb-dim xl:inline">
                  {row.contract}
                </span>
                <span className="hidden shrink-0 font-mono text-[10px] lg:inline">
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

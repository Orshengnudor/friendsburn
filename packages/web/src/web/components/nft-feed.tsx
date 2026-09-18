import type { ChainState } from "../lib/chain/types";
import { agoLabel, shortAddress, shortHash } from "../lib/chain/decode";
import { Panel } from "./panel";
import { EmptyFeed, TxLink, useFreshIds } from "./feed-row";

type Props = { state: ChainState; now: number };

const kindTone = {
  MINT: "text-fb-live",
  BURN: "text-fb-burn",
  MOVE: "text-fb-nft",
} as const;

export function NftFeed({ state, now }: Props) {
  const isFresh = useFreshIds();

  return (
    <Panel
      title="NFT ACTIVITY / GENESIS + GENERATIONS"
      right={`${state.nftCountInWindow} IN WINDOW`}
      accent="nft"
      className="col-span-12 lg:col-span-6"
    >
      <div className="h-full max-h-[300px] overflow-y-auto">
        {state.nfts.length === 0 ? (
          <EmptyFeed text={state.status === "boot" ? "READING WINDOW" : "NO NFT MOVES YET"} />
        ) : (
          <ul>
            {state.nfts.map((row) => (
              <li
                key={row.id}
                className={`flex items-center gap-2 border-b border-fb-dim/60 px-2 py-1.5 ${
                  isFresh(row.id) ? "row-in" : ""
                }`}
              >
                <span className={`pixel w-9 shrink-0 text-[7px] ${kindTone[row.kind]}`}>
                  {row.kind}
                </span>
                <span className="pixel shrink-0 text-[7px] text-fb-ash">
                  {row.collection === "GENESIS" ? "GEN0" : "GENS"}
                </span>
                <span className="shrink-0 font-mono text-[12px] font-semibold text-fb-nft">
                  #{row.tokenId}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-fb-ash">
                  {shortAddress(row.from)} {">"} {shortAddress(row.to)}
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

import { useCallback, useState } from "react";
import { useChain, useTicker } from "../hooks/use-chain";
import { Shell } from "../components/shell";
import { Panel } from "../components/panel";
import { ShareModal } from "../components/share-modal";
import { EmptyFeed, EXPLORER } from "../components/feed-row";
import { agoLabel, formatAmount, formatFull, shortAddress } from "../lib/chain/decode";
import { LEADERBOARD_LIMIT, WINDOW_MIN } from "../lib/chain/constants";
import { renderLeaderCard } from "../lib/share-card";
import type { ChainState } from "../lib/chain/types";

const CARD_ROWS = 8;

function Head() {
  return (
    <div className="grid grid-cols-[34px_minmax(0,1fr)_74px_58px_74px_46px] items-center gap-2 border-b-2 border-fb-dim px-2 py-1.5 sm:grid-cols-[42px_minmax(0,1fr)_96px_74px_96px_54px]">
      <span className="pixel text-[6px] text-fb-ash">RNK</span>
      <span className="pixel text-[6px] text-fb-ash">ADDRESS</span>
      <span className="pixel text-right text-[6px] text-fb-ash">BURNED</span>
      <span className="pixel text-right text-[6px] text-fb-ash">EVENTS</span>
      <span className="pixel text-right text-[6px] text-fb-ash">LARGEST</span>
      <span className="pixel text-right text-[6px] text-fb-ash">LAST</span>
    </div>
  );
}

function Rows({ state, now }: { state: ChainState; now: number }) {
  const rows = state.burners.slice(0, LEADERBOARD_LIMIT);
  const peak = rows[0]?.burned ?? 1;
  const total = state.burnedInWindow || 1;

  return (
    <ul>
      {rows.map((row, index) => {
        const share = (row.burned / total) * 100;
        return (
          <li
            key={row.address}
            className="relative grid grid-cols-[34px_minmax(0,1fr)_74px_58px_74px_46px] items-center gap-2 border-b border-fb-dim/60 px-2 py-2 sm:grid-cols-[42px_minmax(0,1fr)_96px_74px_96px_54px]"
          >
            <div
              className="rank-bar absolute inset-y-0 left-0 -z-0"
              style={{ width: `${Math.max(2, (row.burned / peak) * 100)}%` }}
            />
            <span
              className={`pixel relative text-[9px] ${
                index === 0 ? "text-fb-flare glow-burn" : index < 3 ? "text-fb-ember" : "text-fb-ash"
              }`}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <a
              href={`${EXPLORER}/address/${row.address}`}
              target="_blank"
              rel="noreferrer"
              className="relative min-w-0 truncate font-mono text-[11px] text-fb-white hover:text-fb-burn sm:text-[13px]"
            >
              {shortAddress(row.address)}
              <span className="pixel ml-2 text-[6px] text-fb-dim">{share.toFixed(1)}%</span>
            </a>
            <span className="glow-burn relative text-right font-mono text-[12px] font-bold text-fb-ember sm:text-[14px]">
              {formatAmount(row.burned)}
            </span>
            <span className="relative text-right font-mono text-[11px] text-fb-ash">
              {row.count}
            </span>
            <span className="relative text-right font-mono text-[11px] text-fb-white">
              {formatAmount(row.largest)}
            </span>
            <span className="relative text-right font-mono text-[10px] text-fb-ash">
              {agoLabel(row.lastTs, now)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Leaderboard() {
  const state = useChain();
  const now = useTicker(1000);
  const [open, setOpen] = useState(false);

  const render = useCallback(() => renderLeaderCard(state, CARD_ROWS), [state]);
  const top = state.burners[0];

  return (
    <Shell state={state} now={now}>
      <div className="grid grid-cols-12 gap-1.5 sm:gap-2">
        <Panel
          title="TOP BURNERS / THIS WINDOW ONLY"
          right={`${WINDOW_MIN}MIN ROLLING`}
          className="col-span-12 lg:col-span-8"
        >
          <Head />
          <div className="max-h-[520px] overflow-y-auto">
            {state.burners.length === 0 ? (
              <EmptyFeed
                text={state.status === "boot" ? "READING WINDOW" : "NO BURNS IN WINDOW"}
              />
            ) : (
              <Rows state={state} now={now} />
            )}
          </div>
          {/* a thin board is news in itself, so say it instead of leaving a void */}
          {state.burners.length > 0 && state.burners.length < 4 ? (
            <div className="border-t-2 border-fb-dim px-3 py-3">
              <div className="pixel text-[7px] text-fb-ember">QUIET WINDOW</div>
              <p className="mt-2 font-mono text-[10px] leading-relaxed text-fb-ash">
                {`ONLY ${state.burners.length === 1 ? "ONE ADDRESS HAS" : `${state.burners.length} ADDRESSES HAVE`} BURNED IN THE LAST ${WINDOW_MIN} MINUTES. THE BOARD FILLS OUT AS MORE RF GOES TO 0X0.`}
              </p>
            </div>
          ) : null}
        </Panel>

        <div className="col-span-12 flex flex-col gap-1.5 sm:gap-2 lg:col-span-4">
          <Panel title="WINDOW TOTALS" accent="burn" className="grow">
            <div className="grid grid-cols-2 lg:grid-cols-1">
              <div className="border-b-2 border-fb-dim px-3 py-2">
                <div className="pixel text-[7px] text-fb-ash">BURNED IN WINDOW</div>
                <div className="font-mono text-[18px] font-bold text-fb-burn sm:text-[22px]">
                  {formatFull(state.burnedInWindow)}
                </div>
                <div className="font-mono text-[9px] text-fb-ash">RF SENT TO 0X0</div>
              </div>
              <div className="border-b-2 border-fb-dim px-3 py-2">
                <div className="pixel text-[7px] text-fb-ash">UNIQUE BURNERS</div>
                <div className="font-mono text-[18px] font-bold text-fb-white sm:text-[22px]">
                  {state.burners.length}
                </div>
                <div className="font-mono text-[9px] text-fb-ash">ADDRESSES SEEN</div>
              </div>
              <div className="border-b-2 border-fb-dim px-3 py-2">
                <div className="pixel text-[7px] text-fb-ash">TOP SHARE</div>
                <div className="font-mono text-[18px] font-bold text-fb-ember sm:text-[22px]">
                  {top ? `${((top.burned / (state.burnedInWindow || 1)) * 100).toFixed(1)}%` : "0%"}
                </div>
                <div className="font-mono text-[9px] text-fb-ash">
                  {top ? shortAddress(top.address) : "NOBODY YET"}
                </div>
              </div>
              <div className="px-3 py-2">
                <div className="pixel text-[7px] text-fb-ash">AVERAGE BURN</div>
                <div className="font-mono text-[18px] font-bold text-fb-white sm:text-[22px]">
                  {formatAmount(
                    state.burnCountInWindow > 0
                      ? state.burnedInWindow / state.burnCountInWindow
                      : 0,
                  )}
                </div>
                <div className="font-mono text-[9px] text-fb-ash">RF PER EVENT</div>
              </div>
            </div>
          </Panel>

          <Panel title="SHARE THE BOARD" accent="white">
            <div className="flex flex-col gap-2 px-3 py-3">
              <p className="font-mono text-[10px] leading-relaxed text-fb-ash">
                {`RANKS COVER THE LAST ${WINDOW_MIN} MINUTES OF CHAIN HEAD. NOTHING OLDER IS KEPT, SO THIS BOARD IS A SNAPSHOT, NOT AN ALL TIME RECORD.`}
              </p>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="pixel border-2 border-fb-dim px-3 py-2 text-[8px] text-fb-white hover:border-fb-burn hover:bg-fb-burn hover:text-black"
              >
                MAKE SHARE CARD
              </button>
            </div>
          </Panel>
        </div>
      </div>

      {open ? (
        <ShareModal
          title="TOP BURNERS CARD"
          filename="friendsburn-top-burners.png"
          tweet={`Top $RAREFRIENDS burners of the last ${WINDOW_MIN} minutes on Robinhood Chain. ${formatFull(state.burnedInWindow)} RF gone in one window.`}
          render={render}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </Shell>
  );
}

export default Leaderboard;

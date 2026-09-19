import { useCallback, useState } from "react";
import { useChain, useTicker } from "../hooks/use-chain";
import { Shell } from "../components/shell";
import { Panel } from "../components/panel";
import { ShareModal } from "../components/share-modal";
import { renderMilestoneCard } from "../lib/share-card";
import { formatAmount, formatFull } from "../lib/chain/decode";
import { WINDOW_MIN } from "../lib/chain/constants";

/** Round number spacing that keeps the countdown meaningful at any supply. */
function stepFor(supply: number) {
  if (supply >= 100_000_000) return 1_000_000;
  if (supply >= 10_000_000) return 100_000;
  if (supply >= 1_000_000) return 10_000;
  if (supply >= 100_000) return 1_000;
  return 100;
}

function etaLabel(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "NO BURN RATE YET";
  if (seconds < 90) return `${Math.round(seconds)} SEC`;
  const minutes = seconds / 60;
  if (minutes < 90) return `${Math.round(minutes)} MIN`;
  const hours = minutes / 60;
  if (hours < 48) return `${hours.toFixed(1)} HOURS`;
  const days = hours / 24;
  if (days < 400) return `${days.toFixed(1)} DAYS`;
  return `${(days / 365).toFixed(1)} YEARS`;
}

function Milestone() {
  const state = useChain();
  const now = useTicker(1000);
  const [open, setOpen] = useState(false);

  const supply = state.supplyFloat;
  const step = stepFor(supply);
  const perSec = state.burnedInWindow / (state.windowMs / 1000);
  const next = supply > 0 ? Math.floor((supply - 1) / step) * step : 0;
  const remaining = Math.max(0, supply - next);
  const progress = supply > 0 ? Math.min(100, ((step - remaining) / step) * 100) : 0;
  const ladder = Array.from({ length: 5 }, (_, index) => next - index * step).filter((v) => v > 0);
  const eta = etaLabel(remaining / perSec);

  const render = useCallback(
    () =>
      renderMilestoneCard(state, {
        next,
        remaining,
        progress,
        eta,
        perHour: perSec * 3600,
      }),
    [state, next, remaining, progress, eta, perSec],
  );

  return (
    <Shell state={state} now={now}>
      <div className="grid grid-cols-12 gap-1.5 sm:gap-2">
        <Panel
          title="NEXT ROUND NUMBER"
          right={`${WINDOW_MIN}MIN BURN RATE`}
          className="col-span-12 lg:col-span-7"
        >
          <div className="flex h-full flex-col justify-center px-3 py-6 sm:px-6 sm:py-9">
            <div className="pixel text-[9px] text-fb-nft">SUPPLY IS HEADING FOR</div>
            <div className="glow-burn pixel mt-4 text-[24px] leading-none text-fb-white sm:mt-6 sm:text-[44px]">
              {next > 0 ? formatFull(next) : "......"}
            </div>
            <div className="mt-4 font-mono text-[12px] text-fb-ash sm:text-[14px]">
              {`${formatFull(remaining)} RF LEFT TO BURN, ABOUT ${eta} AT THE CURRENT RATE`}
            </div>

            <div className="mt-6 border-2 border-fb-dim">
              <div className="rank-bar h-5" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="pixel text-[6px] text-fb-dim">{formatFull(next + step)}</span>
              <span className="pixel text-[7px] text-fb-ember">{progress.toFixed(1)}% THERE</span>
              <span className="pixel text-[6px] text-fb-dim">{formatFull(next)}</span>
            </div>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="pixel mt-6 self-start border-2 border-fb-burn bg-fb-burn px-4 py-2.5 text-[9px] text-black hover:bg-fb-ember"
            >
              MAKE MILESTONE CARD
            </button>
            <p className="pixel mt-5 text-[6px] leading-relaxed text-fb-dim">
              {`ETA IS STRAIGHT LINE MATH ON THE LAST ${WINDOW_MIN} MINUTES. IT IS A GUESS, NOT A PROMISE.`}
            </p>
          </div>
        </Panel>

        <div className="col-span-12 flex flex-col gap-1.5 sm:gap-2 lg:col-span-5">
          <Panel title="BURN RATE" accent="burn">
            <div className="grid grid-cols-3">
              <div className="border-r-2 border-fb-dim px-3 py-2">
                <div className="pixel text-[6px] text-fb-ash">PER MIN</div>
                <div className="font-mono text-[15px] font-bold text-fb-burn sm:text-[18px]">
                  {formatAmount(perSec * 60)}
                </div>
              </div>
              <div className="border-r-2 border-fb-dim px-3 py-2">
                <div className="pixel text-[6px] text-fb-ash">PER HOUR</div>
                <div className="font-mono text-[15px] font-bold text-fb-ember sm:text-[18px]">
                  {formatAmount(perSec * 3600)}
                </div>
              </div>
              <div className="px-3 py-2">
                <div className="pixel text-[6px] text-fb-ash">PER DAY</div>
                <div className="font-mono text-[15px] font-bold text-fb-white sm:text-[18px]">
                  {formatAmount(perSec * 86_400)}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="MILESTONE LADDER" accent="nft" className="grow">
            <ul>
              {ladder.map((mark, index) => {
                const gap = Math.max(0, supply - mark);
                return (
                  <li
                    key={mark}
                    className="flex items-center justify-between gap-2 border-b border-fb-dim/60 px-3 py-2.5 last:border-b-0"
                  >
                    <span className="pixel text-[8px] text-fb-ash">
                      {index === 0 ? "> " : ""}
                      {formatFull(mark)}
                    </span>
                    <span className="font-mono text-[11px] text-fb-white">
                      {etaLabel(gap / perSec)}
                    </span>
                  </li>
                );
              })}
              {ladder.length === 0 ? (
                <li className="px-3 py-6 text-center">
                  <span className="pixel text-[8px] text-fb-dim">READING SUPPLY</span>
                </li>
              ) : null}
            </ul>
          </Panel>
        </div>
      </div>

      {open ? (
        <ShareModal
          title="MILESTONE CARD"
          filename="friendsburn-milestone.png"
          tweet={`$RAREFRIENDS supply is heading for ${formatFull(next)}. ${formatFull(remaining)} RF left to burn, about ${eta.toLowerCase()} at the current rate. Live on FRIENDSBURN.`}
          render={render}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </Shell>
  );
}

export default Milestone;

import type { ChainState } from "../lib/chain/types";
import { formatAmount } from "../lib/chain/decode";

type Props = { state: ChainState };

export function Ticker({ state }: Props) {
  const minutes = state.windowMs / 60000;
  const perHour = (state.burnedInWindow / minutes) * 60;
  const items = [
    `HEAD ${state.head.toLocaleString("en-US")}`,
    `BURN RATE ${formatAmount(perHour)} RF/H`,
    `BURNS ${state.burnCountInWindow}`,
    `LARGEST ${formatAmount(state.largestBurn)} RF`,
    `NFT MOVES ${state.nftCountInWindow}`,
    `GAMEPLAY EVENTS ${state.playCountInWindow}`,
    `LOGS SEEN ${state.logsSeen.toLocaleString("en-US")}`,
    "LIVE ONLY, NOTHING STORED",
    "SUPPLY ONLY GOES DOWN",
  ];
  const line = items.join("   //   ");

  return (
    <div className="panel overflow-hidden px-0 py-1.5">
      <div className="marquee-track">
        <span className="pixel px-4 text-[8px] text-fb-ember">{line}   //   </span>
        <span className="pixel px-4 text-[8px] text-fb-ember">{line}   //   </span>
      </div>
    </div>
  );
}

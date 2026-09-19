import { useCallback, useState } from "react";
import { useChain, useTicker } from "../hooks/use-chain";
import { Shell } from "../components/shell";
import { Panel } from "../components/panel";
import { ShareModal } from "../components/share-modal";
import { formatAmount, formatFull } from "../lib/chain/decode";
import { WINDOW_MIN } from "../lib/chain/constants";
import { renderRecapCard } from "../lib/share-card";
import { watchedLabel, watchedShort } from "../lib/watched";

function Big({
  label,
  value,
  sub,
  tone = "text-fb-white",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: string;
}) {
  return (
    <div className="border-b-2 border-fb-dim px-3 py-3 last:border-b-0">
      <div className="pixel text-[7px] text-fb-ash">{label}</div>
      <div className={`font-mono text-[20px] leading-tight font-bold sm:text-[26px] ${tone}`}>
        {value}
      </div>
      <div className="font-mono text-[9px] text-fb-ash">{sub}</div>
    </div>
  );
}

function Recap() {
  const state = useChain();
  const now = useTicker(1000);
  const [open, setOpen] = useState(false);

  const render = useCallback(() => renderRecapCard(state, now), [state, now]);

  const startedAt = state.session.startedAt || state.connectedAt || now;
  const seconds = Math.max(1, Math.round((now - startedAt) / 1000));
  const watched = watchedLabel(now - startedAt);
  const perHour = (state.session.burned / seconds) * 3600;
  const supplyDrop = state.session.startSupply > 0 ? state.session.startSupply - state.supplyFloat : 0;

  return (
    <Shell state={state} now={now}>
      <div className="grid grid-cols-12 gap-1.5 sm:gap-2">
        <Panel
          title="SINCE YOU ARRIVED"
          right={`${watchedShort(now - startedAt)} WATCHED`}
          className="col-span-12 lg:col-span-7"
        >
          <div className="flex h-full flex-col justify-center px-3 py-6 sm:px-6 sm:py-10">
            <div className="pixel text-[9px] text-fb-burn">YOU WATCHED</div>
            <div className="glow-burn pixel mt-4 text-[26px] leading-none text-fb-white sm:mt-6 sm:text-[46px]">
              {formatAmount(state.session.burned)}
              <span className="ml-2 text-fb-ember">RF</span>
            </div>
            <div className="mt-4 font-mono text-[12px] text-fb-ash sm:text-[14px]">
              {`${formatFull(state.session.burned)} RF BURNED ACROSS ${state.session.burns.toLocaleString("en-US")} EVENTS IN ${watched}`}
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="pixel mt-6 self-start border-2 border-fb-burn bg-fb-burn px-4 py-2.5 text-[9px] text-black hover:bg-fb-ember"
            >
              MAKE RECAP CARD
            </button>
            <p className="pixel mt-4 text-[6px] leading-relaxed text-fb-dim">
              THIS COUNTER STARTS WHEN THE TAB OPENS AND DIES WHEN IT CLOSES. NOTHING IS STORED.
            </p>
          </div>
        </Panel>

        <Panel title="YOUR SESSION" accent="white" className="col-span-12 lg:col-span-5">
          <div className="grid grid-cols-2 lg:grid-cols-1">
            <Big
              label="BURN RATE WHILE WATCHING"
              value={`${formatAmount(perHour)}/H`}
              sub="EXTRAPOLATED FROM YOUR SESSION"
              tone="text-fb-burn"
            />
            <Big
              label="BIGGEST SINGLE BURN"
              value={formatAmount(state.session.largest)}
              sub="RF IN ONE EVENT"
              tone="text-fb-ember"
            />
            <Big
              label="NFT MOVES"
              value={state.session.nfts.toLocaleString("en-US")}
              sub="GENESIS AND GENERATIONS"
              tone="text-fb-nft"
            />
            <Big
              label="GAMEPLAY EVENTS"
              value={state.session.plays.toLocaleString("en-US")}
              sub="ACTIVATIONS, CLAIMS, PROMOTIONS"
              tone="text-fb-play"
            />
            <Big
              label="SUPPLY DROP"
              value={supplyDrop > 0 ? formatFull(supplyDrop) : "0"}
              sub={`FROM ${state.session.startSupply > 0 ? formatFull(state.session.startSupply) : "..."} RF`}
              tone="text-fb-live"
            />
          </div>
        </Panel>
      </div>

      {open ? (
        <ShareModal
          title="SESSION RECAP CARD"
          filename="friendsburn-recap.png"
          tweet={`I watched ${formatFull(state.session.burned)} $RAREFRIENDS burn in ${watched.toLowerCase()} on FRIENDSBURN. Live only, ${WINDOW_MIN}min window, nothing stored.`}
          render={render}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </Shell>
  );
}

export default Recap;

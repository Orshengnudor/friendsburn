import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { BurnRow, ChainState } from "../lib/chain/types";
import { ADDRESSES } from "../lib/chain/constants";
import { formatFull } from "../lib/chain/decode";
import { sound } from "../lib/sound";
import { renderBurnCard } from "../lib/share-card";
import { StatusRail } from "./status-rail";
import { Ticker } from "./ticker";
import { WhaleAlert } from "./whale-alert";
import { ShareModal } from "./share-modal";
import { EXPLORER } from "./feed-row";

const contracts = [
  { label: "RF TOKEN", address: ADDRESSES.token },
  { label: "GENESIS", address: ADDRESSES.genesis },
  { label: "GENERATIONS", address: ADDRESSES.generations },
  { label: "ACTIVATION MGR", address: ADDRESSES.activation },
];

type Props = {
  state: ChainState;
  now: number;
  children: ReactNode;
  /** Set by pages that want a burn card opened from their own rows. */
  share?: BurnRow | null;
  onShareHandled?: () => void;
};

/**
 * Everything every page shares: CRT layers, status rail, ticker, footer, plus
 * the two things that must fire wherever you are, sound and the whale alert.
 */
export function Shell({ state, now, children, share = null, onShareHandled }: Props) {
  const [card, setCard] = useState<BurnRow | null>(null);

  useEffect(() => {
    if (state.pulse.rows.length > 0) sound.burst(state.pulse.rows);
  }, [state.pulse.id, state.pulse.rows]);

  useEffect(() => {
    if (share) setCard(share);
  }, [share]);

  const close = useCallback(() => {
    setCard(null);
    onShareHandled?.();
  }, [onShareHandled]);

  const render = useCallback(() => {
    if (!card) return Promise.reject(new Error("no row"));
    return renderBurnCard(card);
  }, [card]);

  return (
    <main className="relative min-h-screen bg-black px-1.5 py-1.5 sm:px-3 sm:py-3">
      <div className="crt-lines" />
      <div className="crt-vignette" />
      <div className="crt-sweep" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-1.5 sm:gap-2">
        <StatusRail state={state} now={now} />
        <Ticker state={state} />
        {children}

        <footer className="panel flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2">
          <span className="pixel text-[7px] text-fb-ash">CONTRACTS</span>
          {contracts.map((contract) => (
            <a
              key={contract.address}
              href={`${EXPLORER}/address/${contract.address}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[10px] text-fb-ash hover:text-fb-burn"
            >
              <span className="pixel mr-1 text-[6px] text-fb-dim">{contract.label}</span>
              {contract.address.slice(0, 8)}..{contract.address.slice(-4)}
            </a>
          ))}
          <span className="pixel ml-auto text-[6px] text-fb-dim">
            {state.error ? `RPC: ${state.error}` : "COMMUNITY BUILT, NOT FINANCIAL ADVICE"}
          </span>
        </footer>
      </div>

      <WhaleAlert pulse={state.pulse} onShare={setCard} />

      {card ? (
        <ShareModal
          title="BURN CARD"
          filename={`friendsburn-${card.txHash.slice(2, 10)}.png`}
          tweet={`${formatFull(card.amountFloat)} $RAREFRIENDS just burned to 0x0 on Robinhood Chain. Watching it live on FRIENDSBURN.`}
          render={render}
          onClose={close}
        />
      ) : null}
    </main>
  );
}

import { useChain, useTicker } from "../hooks/use-chain";
import { StatusRail } from "../components/status-rail";
import { SupplyCounter } from "../components/supply-counter";
import { BurnStats } from "../components/burn-stats";
import { BurnFeed } from "../components/burn-feed";
import { BurnChart } from "../components/burn-chart";
import { NftFeed } from "../components/nft-feed";
import { GameplayFeed } from "../components/gameplay-feed";
import { Ticker } from "../components/ticker";
import { EXPLORER } from "../components/feed-row";
import { ADDRESSES } from "../lib/chain/constants";

const contracts = [
  { label: "RF TOKEN", address: ADDRESSES.token },
  { label: "GENESIS", address: ADDRESSES.genesis },
  { label: "GENERATIONS", address: ADDRESSES.generations },
  { label: "ACTIVATION MGR", address: ADDRESSES.activation },
];

function Index() {
  const state = useChain();
  const now = useTicker(1000);

  return (
    <main className="relative min-h-screen bg-black px-1.5 py-1.5 sm:px-3 sm:py-3">
      <div className="crt-lines" />
      <div className="crt-vignette" />
      <div className="crt-sweep" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-1.5 sm:gap-2">
        <StatusRail state={state} now={now} />
        <Ticker state={state} />

        <div className="grid grid-cols-12 gap-1.5 sm:gap-2">
          <SupplyCounter state={state} />
          <BurnStats state={state} />
          <BurnFeed state={state} now={now} />
          <BurnChart state={state} />
          <NftFeed state={state} now={now} />
          <GameplayFeed state={state} now={now} />
        </div>

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
    </main>
  );
}

export default Index;

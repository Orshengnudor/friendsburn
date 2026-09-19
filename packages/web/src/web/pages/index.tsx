import { useState } from "react";
import { useChain, useTicker } from "../hooks/use-chain";
import { Shell } from "../components/shell";
import { SupplyCounter } from "../components/supply-counter";
import { BurnStats } from "../components/burn-stats";
import { BurnFeed } from "../components/burn-feed";
import { BurnChart } from "../components/burn-chart";
import { NftFeed } from "../components/nft-feed";
import { GameplayFeed } from "../components/gameplay-feed";
import type { BurnRow } from "../lib/chain/types";

function Index() {
  const state = useChain();
  const now = useTicker(1000);
  const [picked, setPicked] = useState<BurnRow | null>(null);

  return (
    <Shell state={state} now={now} share={picked} onShareHandled={() => setPicked(null)}>
      <div className="grid grid-cols-12 gap-1.5 sm:gap-2">
        <SupplyCounter state={state} />
        <BurnStats state={state} />
        <BurnFeed state={state} now={now} onPick={setPicked} />
        <BurnChart state={state} />
        <NftFeed state={state} now={now} />
        <GameplayFeed state={state} now={now} />
      </div>
    </Shell>
  );
}

export default Index;

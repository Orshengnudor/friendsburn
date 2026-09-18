import type { ChainState } from "../lib/chain/types";
import { formatAmount } from "../lib/chain/decode";
import { Panel } from "./panel";

type Props = { state: ChainState };

function Stat({
  label,
  value,
  sub,
  tone = "text-fb-white",
  wide = false,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`border-b-2 border-fb-dim px-3 py-2 last:border-b-0 ${
        wide ? "col-span-2 lg:col-span-1" : ""
      }`}
    >
      <div className="pixel text-[7px] text-fb-ash">{label}</div>
      <div className={`font-mono text-[17px] leading-tight font-bold sm:text-[20px] ${tone}`}>
        {value}
      </div>
      <div className="font-mono text-[9px] text-fb-ash">{sub}</div>
    </div>
  );
}

export function BurnStats({ state }: Props) {
  const minutes = state.windowMs / 60000;
  const perHour = (state.burnedInWindow / minutes) * 60;
  const burnsPerHour = (state.burnCountInWindow / minutes) * 60;

  return (
    <Panel
      title="BURN STATS"
      right={`${Math.round(minutes)}MIN ROLLING`}
      className="col-span-12 lg:col-span-4"
    >
      <div className="grid h-full grid-cols-2 lg:grid-cols-1">
        <Stat
          label="BURN RATE"
          value={`${formatAmount(perHour)}/H`}
          sub={`${burnsPerHour.toFixed(1)} BURNS PER HOUR`}
          tone="text-fb-burn"
        />
        <Stat
          label="BURN EVENTS"
          value={state.burnCountInWindow.toLocaleString("en-US")}
          sub="TRANSFERS TO 0X0 IN WINDOW"
          tone="text-fb-ember"
        />
        <Stat
          label="LARGEST BURN"
          value={formatAmount(state.largestBurn)}
          sub="SINGLE EVENT, THIS WINDOW"
        />
        <Stat
          label="RF TRANSFERS"
          value={`${(state.transfersInWindow / minutes).toFixed(1)}/M`}
          sub={`${state.transfersInWindow.toLocaleString("en-US")} IN WINDOW`}
        />
        <Stat
          label="SINCE YOU ARRIVED"
          value={formatAmount(state.sessionBurned)}
          sub={`${state.sessionBurns.toLocaleString("en-US")} BURNS WHILE WATCHING`}
          tone="text-fb-live"
          wide
        />
      </div>
    </Panel>
  );
}

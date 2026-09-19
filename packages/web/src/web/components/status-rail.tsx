import { Link } from "wouter";
import type { ChainState } from "../lib/chain/types";
import { NavMenu } from "./nav-menu";
import { SoundToggle } from "./sound-toggle";

type Props = { state: ChainState; now: number };

function Led({ tone }: { tone: "live" | "warn" | "dead" }) {
  const color =
    tone === "live" ? "bg-fb-live" : tone === "warn" ? "bg-fb-ember" : "bg-fb-burn";
  return <span className={`led inline-block size-2 ${color}`} />;
}

function Cell({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="pixel text-[7px] text-fb-ash">{label}</span>
      <span className={`font-mono text-[11px] font-semibold ${tone}`}>{value}</span>
    </div>
  );
}

export function StatusRail({ state, now }: Props) {
  const tone = state.status === "live" ? "live" : state.status === "stalled" ? "warn" : "dead";
  const uptime = state.connectedAt ? Math.round((now - state.connectedAt) / 1000) : 0;
  const uptimeLabel =
    uptime >= 3600
      ? `${Math.floor(uptime / 3600)}H${String(Math.floor((uptime % 3600) / 60)).padStart(2, "0")}`
      : uptime >= 60
        ? `${Math.floor(uptime / 60)}M${String(uptime % 60).padStart(2, "0")}`
        : `${uptime}S`;

  return (
    <div className="panel flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2">
      <Link href="/" className="flex items-center gap-2.5">
        <img
          src="/images/friend-mark.png"
          alt="Friendsburn"
          width={26}
          height={28}
          className="glow-white"
          style={{ imageRendering: "pixelated" }}
        />
        <div className="leading-none">
          <div className="pixel text-[13px] text-fb-white sm:text-[15px]">
            FRIENDS<span className="text-fb-burn glow-burn">BURN</span>
          </div>
          <div className="pixel mt-1 text-[6px] text-fb-ash sm:text-[7px]">
            {state.symbol ? `${state.symbol}` : "$RAREFRIENDS"} LIVE BURN TERMINAL
          </div>
        </div>
      </Link>

      <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <div className="flex items-center gap-2">
          <Led tone={tone} />
          <span className="pixel text-[8px]">
            {state.status === "live"
              ? "LIVE"
              : state.status === "boot"
                ? "SYNCING HEAD"
                : state.status === "stalled"
                  ? "RETRYING"
                  : "RPC DOWN"}
          </span>
        </div>
        <Cell label="HEAD" value={state.head ? state.head.toLocaleString("en-US") : "......"} tone="text-fb-live" />
        <Cell label="BLK/S" value={state.blocksPerSec.toFixed(2)} />
        <Cell label="PING" value={state.latencyMs ? `${state.latencyMs}MS` : "..."} />
        <Cell label="WINDOW" value={`${Math.round(state.windowMs / 60000)}MIN`} />
        <Cell label="WATCHING" value={uptimeLabel} tone="text-fb-ember" />
        <div className="flex items-center gap-1.5">
          <SoundToggle />
          <NavMenu />
        </div>
      </div>
    </div>
  );
}

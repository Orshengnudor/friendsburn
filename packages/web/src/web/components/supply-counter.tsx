import { useEffect, useRef, useState } from "react";
import type { ChainState } from "../lib/chain/types";
import { formatAmount, formatFull } from "../lib/chain/decode";
import { Panel } from "./panel";

type Props = { state: ChainState };

function Digits({ value, className = "" }: { value: string; className?: string }) {
  const previous = useRef(value);
  const chars = value.split("");
  const before = previous.current.padStart(value.length, " ").split("");
  useEffect(() => {
    previous.current = value;
  }, [value]);

  return (
    <div className={`flex items-baseline ${className}`}>
      {chars.map((char, index) => {
        const changed = before[index] !== char;
        const key = `${index}-${chars.length}`;
        if (char === "," || char === ".") {
          return (
            <span key={key} className="text-fb-dim">
              {char}
            </span>
          );
        }
        return (
          <span key={key} className={changed ? "digit-flash" : undefined}>
            {char}
          </span>
        );
      })}
    </div>
  );
}

const FLAME_FACTORS = [
  0.42, 0.7, 0.55, 0.88, 0.62, 1, 0.74, 0.48, 0.82, 0.58, 0.95, 0.66, 0.5, 0.78, 0.6, 0.9, 0.45,
  0.72, 0.56, 0.84, 0.64, 1, 0.52, 0.76,
];

function FlameStrip({ intensity }: { intensity: number }) {
  return (
    <div className="flex h-full flex-1 items-end gap-[3px] sm:gap-1">
      {FLAME_FACTORS.map((factor, index) => {
        const height = Math.max(8, Math.min(100, intensity * 100 * factor));
        const hot = height > 55;
        return (
          <div
            key={index}
            className="flame-col flex-1"
            style={{
              height: `${height}%`,
              background: hot ? "var(--color-fb-ember)" : "var(--color-fb-burn)",
              animationDelay: `${index * 70}ms`,
              boxShadow: hot ? "0 0 10px rgba(255,160,43,0.6)" : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

export function SupplyCounter({ state }: Props) {
  const [projected, setProjected] = useState(state.supplyFloat);
  const perSecond = state.burnedInWindow / (state.windowMs / 1000);

  useEffect(() => {
    setProjected(state.supplyFloat);
  }, [state.supplyFloat]);

  useEffect(() => {
    if (perSecond <= 0) return;
    const id = setInterval(() => {
      setProjected((current) => current - perSecond / 10);
    }, 100);
    return () => clearInterval(id);
  }, [perSecond]);

  const hasSupply = state.supplyFloat > 0;
  const burnedPct = hasSupply
    ? (state.burnedInWindow / (state.supplyFloat + state.burnedInWindow)) * 100
    : 0;
  const perHour = perSecond * 3600;
  // A soft curve so a normal burn rate still reads as a flame, not a flat line.
  const intensity = Math.min(1, Math.max(0.1, (perHour / 40000) ** 0.4));
  const projectedLoss = Math.max(0, state.supplyFloat - projected);

  return (
    <Panel
      title="TOTAL SUPPLY / BURNING DOWN"
      right={hasSupply ? "SOURCE: TOTALSUPPLY()" : "READING CHAIN"}
      className="col-span-12 lg:col-span-8"
    >
      <div className="flex h-full flex-col gap-3 p-3 sm:p-4">
        <div>
          <Digits
            value={hasSupply ? formatFull(state.supplyFloat) : "0"}
            className="glow-burn font-mono text-[34px] leading-none font-bold text-fb-burn sm:text-[52px] lg:text-[62px]"
          />
          <div className="pixel mt-2 text-[7px] text-fb-ash sm:text-[8px]">
            {state.symbol || "RAREFRIENDS"} IN CIRCULATION
          </div>
        </div>

        <div className="mt-1 flex h-16 items-end gap-3 sm:h-20">
          <FlameStrip intensity={intensity} />
          <div className="pixel shrink-0 text-right text-[6px] leading-relaxed text-fb-dim sm:text-[7px]">
            <div>HEAT</div>
            <div className="text-fb-ember">{Math.round(intensity * 100)}%</div>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-x-6 gap-y-3 border-t-2 border-fb-dim pt-3 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <div className="pixel text-[7px] text-fb-ash">PROJECTED AT CURRENT RATE</div>
            <Digits
              value={hasSupply ? formatFull(projected) : "0"}
              className="font-mono text-[15px] font-semibold text-fb-ember sm:text-[19px]"
            />
            <div className="font-mono text-[10px] text-fb-ash">
              -{projectedLoss.toFixed(2)} SINCE LAST BURN
            </div>
          </div>

          <div>
            <div className="pixel text-[7px] text-fb-ash">BURN RATE</div>
            <div className="font-mono text-[15px] font-semibold text-fb-white sm:text-[19px]">
              {formatAmount(perHour)}/H
            </div>
            <div className="font-mono text-[10px] text-fb-ash">
              {formatAmount(perSecond * 60)} PER MINUTE
            </div>
          </div>

          <div className="sm:text-right">
            <div className="pixel text-[7px] text-fb-ash">BURNED IN WINDOW</div>
            <div className="font-mono text-[15px] font-semibold text-fb-burn sm:text-[19px]">
              {formatAmount(state.burnedInWindow)}
            </div>
            <div className="font-mono text-[10px] text-fb-ash">
              {burnedPct < 0.0001 && burnedPct > 0
                ? "<0.0001% OF SUPPLY"
                : `${burnedPct.toFixed(4)}% OF SUPPLY`}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

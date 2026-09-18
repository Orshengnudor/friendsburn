import type { ChainState } from "../lib/chain/types";
import { formatAmount } from "../lib/chain/decode";
import { Panel } from "./panel";

type Props = { state: ChainState };

/** Per-minute burn bars, labelled as an hourly rate. Window only, nothing stored. */
export function BurnChart({ state }: Props) {
  const buckets = state.buckets;
  const peak = Math.max(...buckets.map((b) => b.burned), 1);
  const peakHourly = peak * 60;
  const live = buckets.length > 0 ? buckets[buckets.length - 1] : null;

  return (
    <Panel
      title="BURN RATE / PER HOUR"
      right={`PEAK ${formatAmount(peakHourly)}/H`}
      className="col-span-12 lg:col-span-7"
    >
      <div className="flex h-full flex-col gap-2 p-3">
        <div className="flex flex-1 items-end gap-[2px] border-b-2 border-l-2 border-fb-dim pb-[2px] pl-[2px]">
          {buckets.map((bucket, index) => {
            const ratio = bucket.burned / peak;
            const height = bucket.burned > 0 ? Math.max(3, ratio * 100) : 0;
            const isLast = index === buckets.length - 1;
            return (
              <div
                key={bucket.minute}
                className="group relative flex h-full min-w-0 flex-1 items-end"
                title={`${formatAmount(bucket.burned)} RF burned, ${bucket.count} events, ${
                  buckets.length - 1 - index
                } min ago`}
              >
                {height > 0 ? (
                  <div
                    className="w-full"
                    style={{
                      height: `${height}%`,
                      background: isLast ? "var(--color-fb-flare)" : "var(--color-fb-burn)",
                      boxShadow: ratio > 0.6 ? "0 0 8px rgba(255,90,23,0.55)" : undefined,
                    }}
                  />
                ) : (
                  <div className="h-[2px] w-full bg-fb-dim/70" />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          <span className="pixel text-[7px] text-fb-ash">
            -{Math.round(state.windowMs / 60000)}MIN
          </span>
          <span className="font-mono text-[10px] text-fb-ash">
            THIS MINUTE{" "}
            <span className="font-semibold text-fb-ember">
              {live ? formatAmount(live.burned * 60) : "0"}/H
            </span>
          </span>
          <span className="pixel text-[7px] text-fb-ash">NOW</span>
        </div>
      </div>
    </Panel>
  );
}

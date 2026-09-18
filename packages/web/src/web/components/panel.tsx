import type { ReactNode } from "react";

type PanelProps = {
  title: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  accent?: "burn" | "nft" | "play" | "white";
};

const accentText = {
  burn: "text-fb-burn",
  nft: "text-fb-nft",
  play: "text-fb-play",
  white: "text-fb-white",
} as const;

export function Panel({ title, right, children, className = "", accent = "burn" }: PanelProps) {
  return (
    <section className={`panel flex min-h-0 flex-col ${className}`}>
      <header className="flex shrink-0 items-center justify-between gap-2 border-b-2 border-fb-dim bg-black px-2 py-1.5">
        <h2 className={`pixel text-[9px] sm:text-[10px] ${accentText[accent]}`}>{title}</h2>
        <div className="pixel text-[7px] text-fb-ash sm:text-[8px]">{right}</div>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

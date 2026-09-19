import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { MAX_WINDOW_MIN, MIN_WINDOW_MIN, WINDOW_MIN } from "../lib/chain/constants";

const PAGES = [
  { href: "/", label: "TERMINAL", hint: "LIVE BURN FEED", tone: "text-fb-burn" },
  { href: "/leaderboard", label: "TOP BURNERS", hint: "THIS WINDOW", tone: "text-fb-ember" },
  { href: "/recap", label: "SESSION RECAP", hint: "SHAREABLE CARD", tone: "text-fb-live" },
  { href: "/milestone", label: "MILESTONE", hint: "NEXT ROUND NUMBER", tone: "text-fb-nft" },
];

const WINDOWS = [15, 45, 120];

function Bars({ open }: { open: boolean }) {
  return (
    <span className="flex size-4 flex-col justify-between">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={`block h-[3px] w-full transition-colors ${
            open ? "bg-black" : "bg-fb-white"
          } ${open && index === 1 ? "opacity-40" : ""}`}
        />
      ))}
    </span>
  );
}

export function NavMenu() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const wrap = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-2 border-2 px-2 py-1.5 transition-colors ${
          open
            ? "border-fb-burn bg-fb-burn text-black"
            : "border-fb-dim text-fb-white hover:border-fb-burn"
        }`}
      >
        <Bars open={open} />
        <span className="pixel hidden text-[7px] sm:inline">MENU</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-[65] w-[248px]">
          <div className="panel bg-fb-ink">
          <div className="border-b-2 border-fb-dim px-3 py-1.5">
            <span className="pixel text-[6px] text-fb-ash">PAGES</span>
          </div>
          <nav className="flex flex-col">
            {PAGES.map((page) => {
              const active = location === page.href;
              return (
                <Link
                  key={page.href}
                  href={page.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between gap-2 border-b border-fb-dim/60 px-3 py-2.5 hover:bg-fb-burn/15 ${
                    active ? "bg-fb-burn/10" : ""
                  }`}
                >
                  <span className={`pixel text-[8px] ${active ? "text-fb-white" : page.tone}`}>
                    {active ? "> " : ""}
                    {page.label}
                  </span>
                  <span className="pixel text-[6px] text-fb-dim">{page.hint}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-y-2 border-fb-dim px-3 py-1.5">
            <span className="pixel text-[6px] text-fb-ash">ROLLING WINDOW</span>
          </div>
          <div className="flex items-stretch">
            {WINDOWS.map((minutes) => (
              <a
                key={minutes}
                href={`${location}?window=${minutes}`}
                className={`pixel flex-1 border-r border-fb-dim/60 py-2.5 text-center text-[8px] last:border-r-0 hover:bg-fb-burn/15 ${
                  WINDOW_MIN === minutes ? "bg-fb-burn/15 text-fb-white" : "text-fb-ash"
                }`}
              >
                {minutes}M
              </a>
            ))}
          </div>
          <div className="border-t-2 border-fb-dim px-3 py-2">
            <span className="pixel text-[6px] leading-relaxed text-fb-dim">
              {`?WINDOW=${MIN_WINDOW_MIN} TO ${MAX_WINDOW_MIN} RELOADS THE FEED. NOTHING IS STORED, EVER.`}
            </span>
          </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

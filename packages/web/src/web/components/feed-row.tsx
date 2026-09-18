import { useEffect, useRef } from "react";

export const EXPLORER = "https://robinhoodchain.blockscout.com";

/** Marks a row as fresh only the first time this client has seen its id. */
export function useFreshIds() {
  const seen = useRef<Set<string>>(new Set());
  const armed = useRef(false);
  useEffect(() => {
    const id = window.setTimeout(() => {
      armed.current = true;
    }, 1200);
    return () => window.clearTimeout(id);
  }, []);
  return (id: string) => {
    if (seen.current.has(id)) return false;
    seen.current.add(id);
    if (seen.current.size > 400) {
      seen.current = new Set([...seen.current].slice(-200));
    }
    return armed.current;
  };
}

export function TxLink({ hash, label }: { hash: string; label: string }) {
  if (!hash) return <span className="text-fb-dim">{label}</span>;
  return (
    <a
      href={`${EXPLORER}/tx/${hash}`}
      target="_blank"
      rel="noreferrer"
      className="text-fb-ash underline decoration-fb-dim underline-offset-2 hover:text-fb-white"
    >
      {label}
    </a>
  );
}

export function EmptyFeed({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-24 items-center justify-center">
      <span className="pixel text-[8px] text-fb-dim">{text}</span>
    </div>
  );
}

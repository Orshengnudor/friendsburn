import { useEffect, useRef, useState } from "react";
import { downloadCanvas, shareCardFile, tweetUrl } from "../lib/share-card";

type Props = {
  title: string;
  filename: string;
  tweet: string;
  render: () => Promise<HTMLCanvasElement>;
  onClose: () => void;
};

function Button({
  label,
  onClick,
  href,
  tone = "text-fb-white",
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  tone?: string;
}) {
  const className = `pixel border-2 border-fb-dim px-3 py-2 text-[8px] transition-colors hover:border-fb-burn hover:bg-fb-burn hover:text-black ${tone}`;
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className} onClick={onClick}>
        {label}
      </a>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick}>
      {label}
    </button>
  );
}

export function ShareModal({ title, filename, tweet, render, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [note, setNote] = useState("PNG READY");

  useEffect(() => {
    let alive = true;
    render()
      .then((el) => {
        if (!alive) return;
        canvasRef.current = el;
        setSrc(el.toDataURL("image/png"));
      })
      .catch(() => {
        if (alive) setNote("RENDER FAILED");
      });
    return () => {
      alive = false;
    };
  }, [render]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /**
   * X cannot be handed an image through a link, so the post would arrive as
   * plain text. The share sheet can carry the file, and where there is no share
   * sheet the PNG is saved first and the composer opens after it, ready to
   * attach.
   */
  const share = async () => {
    const el = canvasRef.current;
    if (!el) return;
    setNote("OPENING SHARE SHEET");
    if (await shareCardFile(el, filename, tweet)) {
      setNote("SHARED WITH THE IMAGE");
      return;
    }
    downloadCanvas(el, filename);
    setNote(`PNG SAVED AS ${filename.toUpperCase()}, ATTACH IT IN THE POST`);
    window.open(tweetUrl(tweet), "_blank", "noreferrer");
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/85"
      />
      <dialog open aria-label={title} className="panel relative m-0 flex w-full max-w-[860px] flex-col bg-fb-ink text-fb-white">
        <header className="flex items-center justify-between gap-2 border-b-2 border-fb-dim px-3 py-2">
          <h2 className="pixel text-[9px] text-fb-burn">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="pixel text-[9px] text-fb-ash hover:text-fb-white"
          >
            [X]
          </button>
        </header>

        <div className="flex items-center justify-center border-b-2 border-fb-dim bg-black p-2 sm:p-3">
          {src ? (
            <img src={src} alt={title} className="w-full border border-fb-dim" />
          ) : (
            <div className="flex aspect-[16/9] w-full items-center justify-center">
              <span className="pixel text-[8px] text-fb-dim">DRAWING CARD</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
          <Button
            label="DOWNLOAD PNG"
            onClick={() => {
              const el = canvasRef.current;
              if (el) downloadCanvas(el, filename);
            }}
          />
          <Button label="SHARE ON X" onClick={share} tone="text-fb-ember" />
          <span className="pixel ml-auto text-[7px] text-fb-ash">{note}</span>
        </div>
      </dialog>
    </div>
  );
}

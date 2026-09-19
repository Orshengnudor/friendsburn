import { useSyncExternalStore } from "react";
import { sound } from "../lib/sound";

/** Mute by default. Bars stack up when sound is on, like a tiny speaker meter. */
export function SoundToggle() {
  const on = useSyncExternalStore(sound.subscribe, sound.getSnapshot, () => false);

  return (
    <button
      type="button"
      aria-label={on ? "Mute burn sound" : "Unmute burn sound"}
      aria-pressed={on}
      onClick={sound.toggle}
      title={on ? "SOUND ON" : "SOUND MUTED"}
      className={`flex items-center gap-2 border-2 px-2 py-1.5 transition-colors ${
        on
          ? "border-fb-live text-fb-live"
          : "border-fb-dim text-fb-ash hover:border-fb-burn hover:text-fb-white"
      }`}
    >
      <span className="flex h-4 items-end gap-[2px]">
        {[5, 9, 13, 16].map((height, index) => (
          <span
            key={height}
            style={{ height: on ? height : 4 }}
            className={`block w-[3px] ${on ? "bg-fb-live" : "bg-fb-dim"} ${
              on && index === 3 ? "led" : ""
            }`}
          />
        ))}
      </span>
      <span className="pixel hidden text-[7px] sm:inline">{on ? "SFX" : "MUTE"}</span>
    </button>
  );
}

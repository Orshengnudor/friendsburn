# Friendsburn design system

Live-only burn and activity terminal for $RAREFRIENDS on Robinhood Chain.
Pixel-arcade CRT terminal. Black canvas, white pixel type, burn-orange and ember accents.
It should read like an arcade cabinet attract screen, not a corporate dashboard.

## Rules

- No em dashes in any copy. Use commas, colons, or periods.
- No Runable branding anywhere: no badge, no credit line, no mention.
- Live only. Nothing is stored. Every number on screen comes from a rolling in-memory window fed by the chain head.
- Numbers are the art. Big, monospaced, tabular, always moving.

## Color

| Token | Value | Use |
|---|---|---|
| `--fb-black` | `#000000` | canvas |
| `--fb-ink` | `#07070a` | panel interior |
| `--fb-white` | `#ffffff` | primary pixel type |
| `--fb-ash` | `#8a8a8f` | secondary labels, meta |
| `--fb-dim` | `#3a3a40` | grid lines, rules, dead LEDs |
| `--fb-burn` | `#ff5a17` | burn-orange, primary accent |
| `--fb-ember` | `#ffa02b` | ember highlight, hot rows |
| `--fb-flare` | `#ffe08a` | peak flash on a fresh burn |
| `--fb-nft` | `#4de2ff` | NFT activity accent (cold cyan) |
| `--fb-play` | `#b98cff` | gameplay accent (arcade violet) |
| `--fb-live` | `#38ff7a` | live LED, block ticker |

Accents never fill large areas. Orange is for burn data, cyan for NFT rows, violet for gameplay rows, green only for the live LED and head block.

## Typography

- Display / labels: **Press Start 2P** (`--font-pixel`). Uppercase only, letter-spacing `0.08em`, never below 10px, never in paragraphs.
- Data / feeds: **IBM Plex Mono** 500/600 (`--font-mono`), `font-variant-numeric: tabular-nums`. All addresses, amounts, block numbers.
- No other families. No body serif, no sans.
- Line height 1.15 for pixel type, 1.4 for mono rows.

## Surfaces

- Panels: 2px solid `--fb-dim` border, 0 radius, black interior, pixel-type caption bar at the top left overlapping the border.
- Corner ticks: 6px orange squares on panel corners for the arcade cabinet feel.
- Scanlines: full-screen `repeating-linear-gradient` overlay at 3px pitch, 6% white, plus a slow 8s brightness flicker and a soft vignette. `pointer-events: none`, sits above content.
- Zero rounded corners anywhere. Zero shadows except orange glow on burn numbers (`text-shadow` only).

## Motion

- Feed rows enter with a 1-frame white flash, then settle to their accent color over 900ms.
- Supply counter digits roll on change; any digit that changes flashes ember.
- Flame strip under the supply counter: 7 pixel columns whose height is driven by live burn rate.
- Every animation is CSS keyframes. No animation library, no scroll-jacking, nothing that moves when the chain is quiet, except the flame idle and the LED blink.

## Layout

Single screen, no scroll on desktop, 12-column grid, 2px gutters of pure black between panels.

1. **Status rail** (full width): mark, wordmark, head block, blocks/sec, RPC latency LED, window length, viewer clock.
2. **Supply counter** (8 cols): giant `$RAREFRIENDS` total supply ticking down, burned-in-window delta, percent of supply burned in window, flame strip.
3. **Burn stats** (4 cols): burns in window, RF/hour rate, largest burn, transfers/min.
4. **Burn feed** (5 cols): newest burn first, amount + tx + block + source tag.
5. **Burn rate chart** (7 cols): per-minute bars, orange, pixel step outline, hour-normalized label.
6. **NFT activity** (6 cols): Genesis + Generations transfers, mint/burn/move tags.
7. **Gameplay** (6 cols): Locked, Unlocked, MetadataUpdate, Activated, Funded, Claimed, Hardwired, Promoted.

Mobile: single column, same order, supply counter shrinks but stays the first thing on screen.

## Copy voice

Short, arcade, lowercase-free. "SUPPLY BURNING DOWN", "NO BURNS IN WINDOW", "WAITING FOR HEAD". Never apologetic, never verbose.

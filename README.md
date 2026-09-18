# Friendsburn

Live-only burn and activity terminal for `$RAREFRIENDS` on Robinhood Chain mainnet.

Reads the chain head directly from the browser. No database, no stored history, no
backfill: the page opens a rolling 45 minute window at the current head, polls
forward, and prunes anything that falls out. A reload starts a fresh window.

## Panels

- Total supply, ticking down from `totalSupply()`
- Burn feed: RF `Transfer` to the zero address, tagged with the gameplay event
  that fired in the same transaction
- NFT activity across Genesis and Generations, split into mint, burn and move
- Gameplay raw events off Generations and the ActivationManager
- Burn rate chart per minute over the window

## Contracts

| Contract | Address |
| --- | --- |
| RF token | `0x0779369854d3EcdEA927206718FFD7730C67B71f` |
| Genesis NFT | `0x116EaA62241751E0c98dA43d458600c6C17cD361` |
| Generations | `0x14C49e6118F46525dE9ab41a51cBAA3c6EBF181D` |
| ActivationManager | `0xD4A35e11318E3679168d409184B788bcF9F283Ac` |

Chain id `4663`, RPC `https://rpc.mainnet.chain.robinhood.com`, roughly 9 blocks
per second.

## Local

```bash
bun install
bun run dev
```

Serves on `http://localhost:4200`.

## Build

```bash
bun run build:web
```

Static output lands in `packages/web/dist`.

## Deploy

`vercel.json` is set up for a static deploy of that output. `api/chain/rpc.ts`
ships as an edge function and is only a fallback: the browser talks to the RPC
directly and routes through it if that direct call is ever blocked.

No environment variables are required.

Community built. Not financial advice.

# Friendsburn

Live-only burn and activity terminal for `$RAREFRIENDS` on Robinhood Chain mainnet (chain 4663).

The terminal reads the chain head directly and keeps a rolling in-memory window. There is no
database and no stored history: refresh the page and the window starts over.

## Stack

Bun workspaces + Turborepo. One package, `packages/web`:

- React 19 + Wouter + Tailwind CSS 4, bundled by Vite 7 (`src/web/`)
- Hono + oRPC API served from the same port in dev via `vite/__plugins/hono-dev-plugin.ts` (`src/api/`)
- `viem` for chain reads, against `https://rpc.mainnet.chain.robinhood.com`

## Develop

```bash
bun install
bun run dev          # http://localhost:4200
```

The dev port is fixed in `__ports.cjs`.

## Build

```bash
bun run build:web    # writes packages/web/dist
```

## Deploy

Static output. On Vercel, set the project root to the repo root with:

- Build command: `bun install && bun run build:web`
- Output directory: `packages/web/dist`

## Layout

```
packages/web/src/web/lib/chain/    chain engine, log decoding, contract constants
packages/web/src/web/components/   terminal panels, feeds, charts
packages/web/src/web/pages/        index, leaderboard, recap, milestone
packages/web/src/api/routes/       ping, chain (RPC passthrough fallback)
```

## Contracts

| Name | Address |
|---|---|
| `$RAREFRIENDS` token | `0x0779369854d3EcdEA927206718FFD7730C67B71f` |
| RareFriendDuel | `0x6CfEF40c0640a1c81A2d82e4832171eC5AE7E49A` |

Community built. Not financial advice.

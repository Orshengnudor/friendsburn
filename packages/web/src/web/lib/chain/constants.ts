import { defineChain } from "viem";

/** Robinhood Chain mainnet. ~9 blocks per second. */
export const ROBINHOOD_CHAIN_ID = 4663;

export const RPC_URL =
  import.meta.env.VITE_RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com";

export const robinhoodChain = defineChain({
  id: ROBINHOOD_CHAIN_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
});

export const ADDRESSES = {
  /** $RAREFRIENDS ERC20 */
  token: "0x0779369854d3EcdEA927206718FFD7730C67B71f",
  /** Genesis NFT collection */
  genesis: "0x116EaA62241751E0c98dA43d458600c6C17cD361",
  /** Generations NFT collection */
  generations: "0x14C49e6118F46525dE9ab41a51cBAA3c6EBF181D",
  /** ActivationManager, busiest address on chain */
  activation: "0xD4A35e11318E3679168d409184B788bcF9F283Ac",
} as const;

export const WATCHED_ADDRESSES = [
  ADDRESSES.token,
  ADDRESSES.genesis,
  ADDRESSES.generations,
  ADDRESSES.activation,
] as const;

export const LABELS: Record<string, string> = {
  [ADDRESSES.token.toLowerCase()]: "RF TOKEN",
  [ADDRESSES.genesis.toLowerCase()]: "GENESIS",
  [ADDRESSES.generations.toLowerCase()]: "GENERATIONS",
  [ADDRESSES.activation.toLowerCase()]: "ACTIVATION MGR",
};

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const DEAD_ADDRESS = "0x000000000000000000000000000000000000dead";

/** Addresses that count as a burn sink for RF transfers. */
export const BURN_SINKS = new Set([ZERO_ADDRESS, DEAD_ADDRESS]);

/** Rolling window kept in memory. Nothing is stored beyond this. */
export const WINDOW_MS = 45 * 60 * 1000;
/** Assumed blocks per second, refined at runtime from real block timestamps. */
export const FALLBACK_BLOCKS_PER_SEC = 9;
/** Head poll interval. */
export const POLL_MS = 1500;
/** Total supply refresh interval. */
export const SUPPLY_POLL_MS = 9000;
/** Max blocks per eth_getLogs request during the initial window fill. */
export const LOG_CHUNK = 12000;
/** Feed rows kept per panel. */
export const FEED_LIMIT = 60;

export const ERC20_ABI = [
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
] as const;

/** keccak256("Transfer(address,address,uint256)"), shared by ERC20 and ERC721. */
export const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

/**
 * Event names resolved from live chain logs by topic0. The full contract ABIs
 * are pending, so the feed prints the raw event name plus whatever args decode
 * cleanly from the topic and data shape.
 */
export const EVENT_NAMES: Record<string, string> = {
  [TRANSFER_TOPIC]: "Transfer",
  "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925": "Approval",
  "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31": "ApprovalForAll",
  "0x032bc66be43dbccb7487781d168eb7bda224628a3b2c3388bdf69b532a3a1611": "Locked",
  "0xf27b6ce5b2f5e68ddb2fd95a8a909d4ecf1daaac270935fff052feacb24f1842": "Unlocked",
  "0xf8e1a15aba9398e019f0b49df1a4fde98ee17ae345cb5f6b5e2c27f5033e8ce7": "MetadataUpdate",
  "0x558a5655aa2a0708757ea0dd806b3c15047f2b776f927ea8d11d4dd7080ddb47": "TokenBoundAccountReady",
  "0x41e164adad312769b6499f25dd7a8eefdeda2ce8ea9c2a8e5c59529660c2cc19": "ActivationCleared",
  "0x3b5083eec1a1116c56de5d6841cff8efc6a0aec9850e836ec509d6ce024ea561": "Funded",
  "0x73d8960dbd97b5072f21b10dfc0cc90eddfd2e339f97ff3949c84aa5c3efa861": "Activated",
  "0x240ce5314564d91727709af90e37c14263bd65a1657bf6504f39bc491a4bd9fc": "Claimed",
  "0x875780ca58ef9db73990dc0197e3045f3e65f31d7db4e3e0978f1b13faf58792": "Hardwired",
  "0xf9f5edd116a4231169d7148c628c7b20dbac59d5d20766ac3ee7c08fb8e5f3f3": "Promoted",
};

/** Events routed to the gameplay panel. */
export const GAMEPLAY_EVENTS = new Set([
  "Locked",
  "Unlocked",
  "MetadataUpdate",
  "TokenBoundAccountReady",
  "Activated",
  "ActivationCleared",
  "Funded",
  "Claimed",
  "Hardwired",
  "Promoted",
]);

/** Accent class per gameplay event name. */
export const GAMEPLAY_TONE: Record<string, "hot" | "cold" | "play"> = {
  Activated: "hot",
  Funded: "hot",
  Claimed: "hot",
  Locked: "play",
  Unlocked: "play",
  Promoted: "play",
  Hardwired: "play",
  MetadataUpdate: "cold",
  TokenBoundAccountReady: "cold",
  ActivationCleared: "cold",
};

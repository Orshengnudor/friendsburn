import { base } from "../__core/app";

export const RPC_URL = process.env.RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com";

/**
 * Chain config for the browser engine. There is no server-side state and no
 * database: the terminal reads the chain directly and keeps its rolling window
 * in memory, so this only hands over the endpoint and the watched contracts.
 */
export const chain = {
  config: base.handler(() => ({
    chainId: 4663,
    name: "Robinhood Chain",
    rpcUrl: RPC_URL,
    contracts: {
      token: "0x0779369854d3EcdEA927206718FFD7730C67B71f",
      genesis: "0x116EaA62241751E0c98dA43d458600c6C17cD361",
      generations: "0x14C49e6118F46525dE9ab41a51cBAA3c6EBF181D",
      activationManager: "0xD4A35e11318E3679168d409184B788bcF9F283Ac",
    },
  })),
};

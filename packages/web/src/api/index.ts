import type { RouterClient } from "@orpc/server";
import { createApp } from "./__core/app";
import { ping } from "./routes/ping";
import { chain, RPC_URL } from "./routes/chain";

// API features are oRPC procedures, one file per feature in ./routes/,
// composed into this router, typed end-to-end via the clients
// (web: src/web/lib/api.ts, mobile: lib/api.ts).
export const router = {
  ping,
  chain,
};

export type AppRouter = typeof router;
/** Typed client for the router, used by the web and mobile api clients. */
export type AppRouterClient = RouterClient<AppRouter>;

const app = createApp(router);

/**
 * JSON-RPC passthrough. The browser talks to the chain directly; this is the
 * fallback path used only when a client cannot reach the public RPC itself.
 * Nothing is cached or stored here.
 */
app.post("/api/chain/rpc", async (c) => {
  const body = await c.req.text();
  try {
    const upstream = await fetch(RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "upstream rpc failed" },
      502,
    );
  }
});

export default app;

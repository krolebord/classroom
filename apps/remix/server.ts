import { createRequestHandler } from "@remix-run/cloudflare";
import __STATIC_CONTENT_MANIFEST from "__STATIC_CONTENT_MANIFEST";
import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

import type { Env } from "./env.js";
import * as remixBuild from "./build/server";
import { getLoadContext } from "./load-context.js";

const MANIFEST = JSON.parse(__STATIC_CONTENT_MANIFEST) as string;
const handleRemixRequest = createRequestHandler(remixBuild);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    try {
      const url = new URL(request.url);
      const ttl = url.pathname.startsWith("/assets/")
        ? 60 * 60 * 24 * 365 // 1 year
        : 60 * 5; // 5 minutes
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: (env as unknown as { __STATIC_CONTENT: unknown })
            .__STATIC_CONTENT,
          ASSET_MANIFEST: MANIFEST,
          cacheControl: {
            browserTTL: ttl,
            edgeTTL: ttl,
          },
        },
      );
    } catch (error) {
      // No-op
    }

    try {
      const context = getLoadContext({
        request,
        context: {
          cloudflare: {
            env,
            ctx,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
            caches: caches as any,
            cf: (request as unknown as { cf: IncomingRequestCfProperties }).cf,
          },
        },
      });
      return await handleRemixRequest(request, context);
    } catch (error) {
      console.log(error);
      return new Response("An unexpected error occurred", { status: 500 });
    }
  },
};

import type { KVNamespace } from "@cloudflare/workers-types/experimental";
import type { CachifiedOptions } from "@epic-web/cachified";
import { cachified as baseCachified } from "@epic-web/cachified";
import { cloudflareKvCacheAdapter } from "cachified-adapter-cloudflare-kv";

export type CacheService = ReturnType<typeof createCache>;

export function createCache({ kv }: { kv: KVNamespace }) {
  const cache = cloudflareKvCacheAdapter({
    kv,
    keyPrefix: "cache",
  });

  function cachified<Value>(
    options: Omit<CachifiedOptions<Value>, "cache">,
  ): Promise<Value> {
    return baseCachified({
      ttl: 60_000,
      staleWhileRevalidate: 300_000,
      ...options,
      cache,
    });
  }

  return { cachified };
}

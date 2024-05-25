import type { Cloudflare } from "env";

import { createDb } from "@classroom/db/client";

import { AuthService } from "./auth.server";
import { createCache } from "./cachified.server";
import { createAuthCookieStorage } from "./session.server";

export type Services = ReturnType<typeof createServices>;

export function createServices({
  request,
  context,
}: {
  request: Request;
  context: Cloudflare;
}) {
  const cache = createCache({ kv: context.env.CACHE });
  const db = createDb(context.env.DB);

  const authCookieSession = createAuthCookieStorage({
    secret: context.env.COOKIE_SECRET,
  });

  const auth = new AuthService({
    cache,
    sessionStorage: authCookieSession,
    authService: context.env.AUTH,
    request,
  });

  return {
    db,
    authCookieSession,
    auth,
    cache,
  };
}

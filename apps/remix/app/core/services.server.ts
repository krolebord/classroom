import type { AppLoadContext } from "@remix-run/cloudflare";
import type { Cloudflare } from "env";

import type { Db } from "@classroom/db/client";
import { createDb } from "@classroom/db/client";

import { createAuthCookieStorage } from "./session.server";

export type Services = ReturnType<typeof createServices>;

export function createServices({
  request,
  context,
}: {
  request: Request;
  context: Cloudflare;
}) {
  const db = createDb(context.env.DB);

  const authCookieSession = createAuthCookieStorage({
    secret: context.env.COOKIE_SECRET,
  });

  return {
    db,
    authCookieSession,
  };
}

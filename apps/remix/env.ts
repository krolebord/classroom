import type { KVNamespace } from "@cloudflare/workers-types/experimental";
import type { PlatformProxy } from "wrangler";

import type { AuthService } from "@classroom/auth";

export type Cloudflare = Omit<PlatformProxy<Env>, "dispose">;

export type Env = {
  COOKIE_SECRET: string;

  CACHE: KVNamespace;
  DB: D1Database;
  AUTH: Pick<
    Service<AuthService>,
    | "createSession"
    | "createUser"
    | "removeSession"
    | "verifyEmailAndPassword"
    | "verifySession"
  >;
};

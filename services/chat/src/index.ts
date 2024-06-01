import { WorkerEntrypoint } from "cloudflare:workers";

import type { Db } from "@classroom/db/client";
import { createDb } from "@classroom/db/client";

import type { Env } from "./env.js";

export default class AuthServiceWorker extends WorkerEntrypoint<Env> {
  private readonly db: Db;

  constructor(ctx: ExecutionContext, env: Env) {
    super(ctx, env);

    this.db = createDb(env.DB);
  }

  override fetch(): Response | Promise<Response> {
    return new Response("Access denied", { status: 403 });
  }
}

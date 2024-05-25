import { WorkerEntrypoint } from "cloudflare:workers";
import { addMilliseconds, milliseconds } from "date-fns";

import type { Db } from "@classroom/db/client";
import { eq } from "@classroom/db";
import { createDb } from "@classroom/db/client";
import { Session, User } from "@classroom/db/schema";

import type { Env } from "./env.js";

type CreateUserOptions = {
  name: string;
  email: string;
  password?: string;
};

type CreateSessionOptions = {
  userId: string;
  expiresAt?: Date;
};

export type AuthService = AuthServiceWorker;

export default class AuthServiceWorker extends WorkerEntrypoint<Env> {
  private readonly db: Db;

  constructor(ctx: ExecutionContext, env: Env) {
    super(ctx, env);

    this.db = createDb(env.DB);
  }

  override fetch(): Response | Promise<Response> {
    return new Response("Auth service");
  }

  async createUser(opts: CreateUserOptions) {
    const userId = crypto.randomUUID();

    await this.db.insert(User).values({
      id: userId,
      name: opts.name,
      email: opts.email,
      passwordHash: opts.password
        ? await this.env.ARGON2.hash(opts.password)
        : null,
    });

    return { userId };
  }

  async verifyEmailAndPassword(email: string, password: string) {
    const user = await this.db.query.User.findFirst({
      where: (users, { eq }) => eq(users.email, email),
      columns: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash) {
      return { userId: null };
    }

    const passwordMatches = await this.env.ARGON2.verify(
      user.passwordHash,
      password,
    );

    if (!passwordMatches) {
      return { userId: null };
    }

    return { userId: user.id };
  }

  async createSession(opts: CreateSessionOptions) {
    const sessionToken = crypto.randomUUID();

    const expiresAt =
      opts.expiresAt ??
      addMilliseconds(new Date(), milliseconds(this.env.SESSION_LIFETIME));
    await this.db.insert(Session).values({
      sessionToken,
      userId: opts.userId,
      expires: expiresAt,
    });

    return { sessionToken, expiresAt };
  }

  async verifySession(sessionToken: string) {
    const session = await this.db.query.Session.findFirst({
      where: (session, { eq }) => eq(session.sessionToken, sessionToken),
      columns: {
        sessionToken: true,
        userId: true,
        expires: true,
      },
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) {
      return { sessionToken: null };
    }

    if (session.expires < new Date()) {
      this.ctx.waitUntil(this.removeSession(session.sessionToken));
      return { sessionToken: null };
    }

    return session;
  }

  async removeSession(sessionToken: string) {
    await this.db.delete(Session).where(eq(Session.sessionToken, sessionToken));
  }
}

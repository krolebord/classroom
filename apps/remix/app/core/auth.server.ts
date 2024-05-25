import type { Env } from "env";
import { redirect } from "@remix-run/server-runtime";

import type { CacheService } from "./cachified.server";
import type { AuthSessionStorage } from "./session.server";

type SignupOptions = {
  name: string;
  email: string;
  password: string;
};

type SigninOptions = {
  email: string;
  password: string;
};

type RequireSessionOptions = {
  redirectTo?: string | null;
  forceFresh?: true;
};

export class AuthService {
  private readonly cache: CacheService;
  private readonly auth: Env["AUTH"];
  private readonly request: Request;
  private readonly sessionStorage: AuthSessionStorage;

  constructor({
    sessionStorage,
    authService,
    cache,
    request,
  }: {
    sessionStorage: AuthSessionStorage;
    authService: Env["AUTH"];
    cache: CacheService;
    request: Request;
  }) {
    this.sessionStorage = sessionStorage;
    this.request = request;
    this.cache = cache;
    this.auth = authService;
  }

  async signup(options: SignupOptions) {
    const user = await this.auth.createUser(options);
    const session = await this.auth.createSession({ userId: user.userId });
    return { sessionToken: session.sessionToken, expiresAt: session.expiresAt };
  }

  async signin(options: SigninOptions) {
    const user = await this.auth.verifyEmailAndPassword(
      options.email,
      options.password,
    );
    if (!user) {
      return null;
    }
    const session = await this.auth.createSession(user);
    return { sessionToken: session.sessionToken, expiresAt: session.expiresAt };
  }

  async findSession(
    sessionToken: string | null,
    options?: { forceFresh?: boolean },
  ) {
    if (!sessionToken) return null;

    return await this.cache.cachified({
      forceFresh: options?.forceFresh ?? false,
      key: `session:${sessionToken}`,
      ttl: 5 * 1000,
      staleWhileRevalidate: 30 * 1000,
      getFreshValue: () => this.auth.verifySession(sessionToken),
    });
  }

  private async getCookieSession() {
    const cookie = this.request.headers.get("cookie");
    const session = await this.sessionStorage.getSession(cookie);
    return session;
  }

  async getOptionalSession({ forceFresh }: { forceFresh?: boolean } = {}) {
    const session = await this.getCookieSession();

    const sessionToken = session.get("token");

    if (!sessionToken) {
      return null;
    }

    const userSession = await this.findSession(sessionToken, { forceFresh });
    return userSession;
  }

  async getLogoutRedirect({ redirectTo }: { redirectTo: string }) {
    const session = await this.getCookieSession();
    session.unset("token");

    return redirect(redirectTo, {
      headers: {
        "Set-Cookie": await this.sessionStorage.commitSession(session),
      },
    });
  }

  async requireSession({ redirectTo, forceFresh }: RequireSessionOptions = {}) {
    const session = await this.getOptionalSession({ forceFresh });

    const requestUrl = new URL(this.request.url);
    redirectTo = !redirectTo
      ? null
      : `${requestUrl.pathname}${requestUrl.search}`;
    const loginParams = redirectTo
      ? new URLSearchParams([["redirectTo", redirectTo]])
      : null;
    const failureRedirect = ["/login", loginParams?.toString()]
      .filter(Boolean)
      .join("?");

    if (!session) {
      throw await this.getLogoutRedirect({ redirectTo: failureRedirect });
    }

    return session;
  }

  async requireUser(
    opts: { redirectTo?: string | null; forceFresh?: true } = {},
  ) {
    const session = await this.requireSession(opts);
    return session.user;
  }

  async requireAnon({ redirectTo, forceFresh }: RequireSessionOptions = {}) {
    const session = await this.getOptionalSession({ forceFresh });
    if (session) {
      throw redirect(redirectTo ?? "/");
    }
  }
}

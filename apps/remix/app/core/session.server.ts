import { createCookieSessionStorage } from "@remix-run/cloudflare";

type CreateAuthCookieStorageOptions = {
  secret: string;
};

export type AuthSessionStorage = ReturnType<typeof createAuthCookieStorage>;
export function createAuthCookieStorage(opts: CreateAuthCookieStorageOptions) {
  return createCookieSessionStorage<{ token: string }>({
    cookie: {
      name: "auth_session",
      sameSite: "lax",
      path: "/",
      httpOnly: true,
      secrets: [opts.secret],
      secure: true,
    },
  });
}

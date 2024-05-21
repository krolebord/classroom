import { createCookieSessionStorage } from "@remix-run/cloudflare";

type CreateAuthCookieStorageOptions = {
  secret: string;
};
export function createAuthCookieStorage(opts: CreateAuthCookieStorageOptions) {
  return createCookieSessionStorage({
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

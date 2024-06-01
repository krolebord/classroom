import type { Connection, Request } from "partykit/server";

import type { AuthService, VeirfiedUser } from "@classroom/auth-service";

export const authHeader = "X-Auth-User";

type UserConnectionState = { user: VeirfiedUser };

export type UserConnection = Connection<UserConnectionState>;

export async function authorizeUserSocketRequest(
  request: Request,
  authService: AuthService,
) {
  try {
    const token = new URL(request.url).searchParams.get("token") ?? "";
    if (!token) {
      return null;
    }

    const session = await authService.verifySession(token);
    if (!session || !session.sessionToken) {
      return null;
    }

    request.headers.set(authHeader, JSON.stringify(session.user));

    return request;
  } catch (e) {
    return null;
  }
}

export function setUserConnectionState(
  connection: UserConnection,
  request: Request,
) {
  const userJson = request.headers.get("X-Auth-User");
  if (!userJson) {
    throw new Error("No user found");
  }

  const user = JSON.parse(userJson) as VeirfiedUser;
  connection.setState({ user });
}

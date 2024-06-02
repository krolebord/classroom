import type { Connection, PartyEnv, Request } from "partykit/server";

import type {
  AuthResponseContent,
  VeirfiedUser,
} from "@classroom/auth-service";

export const authHeader = "X-Auth-User";

type UserConnectionState = { user: VeirfiedUser };

export type UserConnection = Connection<UserConnectionState>;

export async function authorizeUserSocketRequest(
  request: Request,
  env: PartyEnv,
) {
  try {
    const token = new URL(request.url).searchParams.get("token") ?? "";
    if (!token) {
      return null;
    }

    const resp = await fetch(`${env.AUTH_SERVICE_URL}/${token}`, {
      method: "GET",
    });

    const result = (await resp.json()) as AuthResponseContent;

    if (result.type === "error" || !result.session.sessionToken) {
      return null;
    }

    request.headers.set(authHeader, JSON.stringify(result.session.user));

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

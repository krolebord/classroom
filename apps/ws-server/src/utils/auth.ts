import type { Connection, PartyEnv, Request } from "partykit/server";
import * as jwt from "@tsndr/cloudflare-worker-jwt";

import type { VeirfiedUser } from "@classroom/auth-service";

export const authHeader = "X-Verified-Token";

type UserConnectionState = { user: VeirfiedUser };

export type UserConnection = Connection<UserConnectionState>;

export async function authorizeUserSocketRequest(
  request: Request,
  env: PartyEnv,
) {
  try {
    const token = new URL(request.url).searchParams.get("token") ?? "";
    if (!token) {
      console.warn("no token");
      return null;
    }

    console.log("token", env.JWT_SECRET);
    const isValid = await jwt.verify(token, env.JWT_SECRET);
    if (!isValid) {
      console.warn("invalid token");
      return null;
    }

    request.headers.set(authHeader, token);

    return request;
  } catch (e) {
    console.error("auth error", e);
    return null;
  }
}

export function setUserConnectionState(
  connection: UserConnection,
  request: Request,
) {
  const token = request.headers.get(authHeader);
  if (!token) {
    throw new Error("Mising token");
  }

  const { payload } = jwt.decode<VeirfiedUser>(token);

  if (!payload) {
    throw new Error("Invalid token");
  }

  connection.setState({
    user: {
      id: payload.id,
      name: payload.name,
      email: payload.email,
    },
  });
}

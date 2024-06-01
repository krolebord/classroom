import type {
  Context as PartyContext,
  PartyEnv,
  Request as PartyRequest,
} from "partykit/server";

type PartyName = "rooms_counter" | "chat";

export function getParty(
  context: PartyContext,
  partyName: PartyName,
  partyId: string,
) {
  return context.parties[partyName].get(partyId);
}

export const INTERNAL_AUTH_HEADER = "X-Internal-Auth";

export function checkInternalAuth(
  request: Request | PartyRequest,
  tokenOrEnv: string | PartyEnv,
) {
  let token = tokenOrEnv;
  if (typeof tokenOrEnv === "object") {
    token = tokenOrEnv.INTERNAL_TOKEN;
  }
  const requestToken = request.headers.get(INTERNAL_AUTH_HEADER);

  if (!requestToken || requestToken !== token) {
    return false;
  }

  return true;
}

export function createInetrnalAuthHeader(
  tokenOrEnv: string | PartyEnv,
): [string, string] {
  let token = tokenOrEnv;
  if (typeof tokenOrEnv === "object") {
    token = tokenOrEnv.INTERNAL_TOKEN;
  }
  return [INTERNAL_AUTH_HEADER, token as string];
}

type InternalRequestOptions<TData extends object> = {
  method: "GET" | "POST" | "DELETE" | "PUT";
  tokenOrEnv: PartyEnv | string;
  data: TData;
};
export function createInternalRequest<TData extends object>({
  method,
  tokenOrEnv,
  data,
}: InternalRequestOptions<TData>): Request {
  return new Request("http://internal.krolebord.com/", {
    method,
    headers: [createInetrnalAuthHeader(tokenOrEnv)],
    body: JSON.stringify(data),
  });
}

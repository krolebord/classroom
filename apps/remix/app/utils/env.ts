import type { Env } from "env";

export type ClientEnv = ReturnType<typeof getClientEnv>;

export function getClientEnv(env: Env) {
  return {
    wsServerHost: env.WS_SERVER_HOST,
    roomsCounterId: env.ROOMS_COUNTER_SINGLETON_ID,
  };
}

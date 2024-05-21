import type { Duration } from "date-fns";

import type { Argon2 } from "@classroom/argon2";

export type Env = {
  DB: D1Database;
  ARGON2: Service<Argon2>;
  SESSION_LIFETIME: Duration;
};

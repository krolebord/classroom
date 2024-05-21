import type { DrizzleD1Database } from "drizzle-orm/d1";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema";

export type Db = DrizzleD1Database<typeof schema>;

export const createDb = (client: D1Database) => drizzle(client, { schema });

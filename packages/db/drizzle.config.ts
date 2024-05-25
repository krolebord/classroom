import type { Config } from "drizzle-kit";
import { config } from "dotenv";

const { LOCAL_DB_PATH, ACCOUNT_ID, DATABASE_ID, ACCOUNT_TOKEN } = process.env;

export default LOCAL_DB_PATH
  ? ({
      schema: "./src/schema.ts",
      dialect: "sqlite",
      dbCredentials: {
        url: LOCAL_DB_PATH,
      },
    } satisfies Config)
  : ({
      schema: "./src/schema.ts",
      out: "./migrations",
      dialect: "sqlite",
      driver: "d1-http",
      dbCredentials: {
        accountId: ACCOUNT_ID!,
        databaseId: DATABASE_ID!,
        token: ACCOUNT_TOKEN!,
      },
    } satisfies Config);

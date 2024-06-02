import type { AuthService } from "@classroom/auth-service";

declare module "partykit/server" {
  interface CustomBindings {
    services: {};
  }

  interface PartyEnv extends Record<string, unknown> {
    INTERNAL_TOKEN: string;
    JWT_SECRET: string;
  }
}

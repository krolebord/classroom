import type { AuthService } from "@classroom/auth-service";

declare module "partykit/server" {
  interface CustomBindings {
    services: {
      AUTH: AuthService;
    };
  }

  interface PartyEnv extends Record<string, unknown> {
    INTERNAL_TOKEN: string;
  }
}

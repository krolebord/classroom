import type * as Party from "partykit/server";

import type { AuthService } from "@classroom/auth-service";

declare module "partykit/server" {
  interface CustomBindings {
    services: {
      AUTH: AuthService;
    };
  }
}

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  static async onBeforeRequest(
    req: Party.Request,
    lobby: Party.Lobby,
    ctx: Party.ExecutionContext,
  ) {
    return new Response("Access denied", { status: 403 });
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      await this.room.context.bindings.services.AUTH.verifyEmailAndPassword(
        "krolebord@gmail.com",
        "222",
      ),
    );
  }
}

Server satisfies Party.Worker;

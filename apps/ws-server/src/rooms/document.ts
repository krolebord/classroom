import type * as Party from "partykit/server";
import type { YPartyKitOptions } from "y-partykit";
import type { Doc } from "yjs";
import { onConnect } from "y-partykit";

import type { UserConnection } from "../utils/auth";
import {
  authorizeUserSocketRequest,
  setUserConnectionState,
} from "../utils/auth";

export default class EditorServer implements Party.Server {
  yjsOptions: YPartyKitOptions = {};
  constructor(public room: Party.Room) {}

  getOpts() {
    // options must match when calling unstable_getYDoc and onConnect
    const opts: YPartyKitOptions = {
      callback: { handler: (doc) => this.handleYDocChange(doc) },
      persist: {
        mode: "snapshot",
      },
    };
    return opts;
  }

  static async onBeforeRequest(request: Party.Request, lobby: Party.Lobby) {
    return (
      (await authorizeUserSocketRequest(request, lobby.env)) ??
      new Response("Unauthorized", { status: 401 })
    );
  }

  static async onBeforeConnect(request: Party.Request, lobby: Party.Lobby) {
    return (
      (await authorizeUserSocketRequest(request, lobby.env)) ??
      new Response("Unauthorized", { status: 401 })
    );
  }

  async onConnect(
    connection: UserConnection,
    { request }: Party.ConnectionContext,
  ) {
    setUserConnectionState(connection, request);
    return onConnect(connection, this.room, this.getOpts());
  }

  handleYDocChange(_: Doc) {
    //console.log("ydoc changed");
    // called on every ydoc change
    // no-op
  }
}

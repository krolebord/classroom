import type * as Party from "partykit/server";
import type { YPartyKitOptions } from "y-partykit";
import type { Doc } from "yjs";
import { onConnect, unstable_getYDoc } from "y-partykit";

import type { UserConnection } from "../utils/auth";
import {
  authorizeUserSocketRequest,
  setUserConnectionState,
} from "../utils/auth";

export default class YjsServer implements Party.Server {
  yjsOptions: YPartyKitOptions = { persist: true };
  constructor(public party: Party.Party) {}

  getOpts() {
    // options must match when calling unstable_getYDoc and onConnect
    const opts: YPartyKitOptions = {
      persist: {
        mode: "snapshot",
      },
      callback: { handler: (doc) => this.handleYDocChange(doc) },
    };
    return opts;
  }

  static async onBeforeRequest(request: Party.Request, lobby: Party.Lobby) {
    return (
      (await authorizeUserSocketRequest(request, lobby.env)) ??
      new Response("Unauthorized", { status: 401 })
    );
  }

  async onRequest() {
    const doc = await unstable_getYDoc(this.party, this.getOpts());
    const room = `tl_${this.party.id}`;
    return new Response(
      JSON.stringify({ [room]: doc.getArray(room) }, null, 2),
    );
  }

  static async onBeforeConnect(request: Party.Request, lobby: Party.Lobby) {
    return (
      (await authorizeUserSocketRequest(request, lobby.env)) ??
      new Response("Unauthorized", { status: 401 })
    );
  }

  onConnect(connection: UserConnection, { request }: Party.ConnectionContext) {
    setUserConnectionState(connection, request);
    return onConnect(connection, this.party, this.getOpts());
  }

  handleYDocChange(doc: Doc) {
    // console.log("ydoc changed");
    // called on every ydoc change
    // no-op
  }
}

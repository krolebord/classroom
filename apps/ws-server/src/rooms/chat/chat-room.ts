import type * as Party from "partykit/server";
import { nanoid } from "nanoid";

import type { UserConnection } from "../../utils/auth.js";
import type { RoomInfoUpdateRequest } from "../rooms-counter.js";
import type { Message, Participant, UserMessage } from "./messages.js";
import {
  authorizeUserSocketRequest,
  setUserConnectionState,
} from "../../utils/auth.js";
import {
  createInternalRequest,
  getParty,
} from "../../utils/internal-communication.js";
import { notFound, ok } from "../../utils/responses.js";
import { ROOMS_COUNTER_SINGLETON_ID } from "../rooms-counter.js";
import {
  editMessage,
  newMessage,
  participantsSyncMessage,
  syncMessage,
  systemMessage,
} from "./messages.js";

export default class ChatRoomServer implements Party.Server {
  messages: Message[] = [];
  participants: Participant[] = [];
  messagesLoaded = false;

  constructor(public room: Party.Room) {}

  async onRequest(request: Party.Request) {
    if (request.method === "OPTIONS") {
      return ok();
    }

    return notFound();
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

    await this.ensureLoadState();

    connection.send(syncMessage(this.messages ?? []));

    this.updateParticipants("enter", connection.state!.user);
  }

  async onMessage(messageString: string, connection: UserConnection) {
    if (!connection.state) {
      return;
    }

    const message = JSON.parse(messageString) as UserMessage;
    if (message.type === "new" || message.type === "edit") {
      const user = connection.state.user;

      if (message.text.length > 1000) {
        return connection.send(systemMessage("Message too long"));
      }

      const payload = <Message>{
        id: message.id ?? nanoid(),
        from: { id: user.id, name: user.name },
        text: message.text,
        at: Date.now(),
      };

      if (message.type === "new") {
        this.room.broadcast(newMessage(payload));
        this.messages.push(payload);
      }

      if (message.type === "edit") {
        this.room.broadcast(editMessage(payload), []);
        this.messages = this.messages.map((m) =>
          m.id == message.id ? payload : m,
        );
      }

      await this.room.storage.put("messages", this.messages);
    }
  }

  async onClose(connection: UserConnection) {
    this.updateParticipants("leave", connection.state!.user);
  }

  async ensureLoadState() {
    if (!this.messagesLoaded) {
      this.messagesLoaded = true;
      this.messages =
        (await this.room.storage.get<Message[]>("messages")) ?? [];
    }
    return this.messages;
  }

  async updateParticipants(
    action: "enter" | "leave",
    participant: Participant,
  ) {
    if (action === "enter") {
      if (!this.participants.find((p) => p.id === participant.id)) {
        this.participants.push(participant);
      }
    } else {
      this.participants = this.participants.filter(
        (p) => p.id !== participant.id,
      );
    }

    this.room.broadcast(participantsSyncMessage(this.participants));

    await getParty(
      this.room.context,
      "rooms_counter",
      ROOMS_COUNTER_SINGLETON_ID,
    ).fetch(
      createInternalRequest<RoomInfoUpdateRequest>({
        method: "POST",
        tokenOrEnv: this.room.env,
        data: {
          id: this.room.id,
          connections: this.participants.length,
          action,
        },
      }),
    );
  }
}

ChatRoomServer satisfies Party.Worker;

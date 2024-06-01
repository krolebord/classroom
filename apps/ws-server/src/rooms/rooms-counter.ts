import type * as Party from "partykit/server";

import { checkInternalAuth } from "../utils/internal-communication.js";
import { json, notFound } from "../utils/responses.js";

export const ROOMS_COUNTER_SINGLETON_ID = "rooms-counter";

export type RoomInfoUpdateRequest = {
  id: string;
  connections: number;
  action: "enter" | "leave";
};

export type RoomDeleteRequest = {
  id: string;
  action: "delete";
};

export type RoomInfo = {
  id: string;
  connections: number;
};

export default class ChatRoomsServer implements Party.Server {
  options: Party.ServerOptions = {
    hibernate: true,
  };

  constructor(public room: Party.Room) {}

  async onConnect(connection: Party.Connection) {
    connection.send(JSON.stringify(await this.getActiveRooms()));
  }

  async onRequest(req: Party.Request) {
    if (this.room.id !== ROOMS_COUNTER_SINGLETON_ID) return notFound();

    if (req.method === "GET") return json(await this.getActiveRooms());

    const isInternalAuth = checkInternalAuth(req, this.room.env);
    if (!isInternalAuth) return notFound();

    if (req.method === "POST") {
      const roomList = await this.updateRoomInfo(req);
      this.room.broadcast(JSON.stringify(roomList));
      return json(roomList);
    }

    if (req.method === "DELETE") {
      await this.room.storage.deleteAll();
      return json({ message: "All room history cleared" });
    }

    return notFound();
  }

  async getActiveRooms(): Promise<RoomInfo[]> {
    const rooms = await this.room.storage.list<RoomInfo>();
    return [...rooms.values()];
  }

  async updateRoomInfo(req: Party.Request) {
    const update = (await req.json()) as
      | RoomInfoUpdateRequest
      | RoomDeleteRequest;

    if (update.action === "delete") {
      await this.room.storage.delete(update.id);
      return this.getActiveRooms();
    }

    const persistedInfo = await this.room.storage.get<RoomInfo>(update.id);
    if (!persistedInfo && update.action === "leave") {
      return this.getActiveRooms();
    }

    const info = persistedInfo ?? {
      id: update.id,
      connections: 0,
    };

    info.connections = update.connections;

    await this.room.storage.put(update.id, info);
    return this.getActiveRooms();
  }
}

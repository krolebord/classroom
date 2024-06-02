import usePartySocket from "partysocket/react";
import { create } from "zustand";
import { combine } from "zustand/middleware";

import type { RoomsInfo } from "@classroom/ws-server/src/rooms/rooms-counter.js";

import { useClientEnv } from "~/root";

export const useRoomsCounter = create(
  combine({} as Record<string, number>, (set) => ({
    setCount: (roomId: string, count: number) => {
      set({ [roomId]: count });
    },
    setCounts: (newInfo: Record<string, number>) => {
      set(newInfo);
    },
    clearCount: (roomId: string) => {
      set({ [roomId]: 0 });
    },
  })),
);

export function RoomScounterHandler() {
  const env = useClientEnv();
  const setCounts = useRoomsCounter((x) => x.setCounts);
  usePartySocket({
    host: env.wsServerHost,
    party: "rooms_counter",
    room: env.roomsCounterId,
    onMessage(event) {
      if (typeof event.data !== "string") return;
      const data = JSON.parse(event.data) as RoomsInfo;
      setCounts(data);
    },
  });

  return null;
}

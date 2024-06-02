import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Form } from "@remix-run/react";
import { format } from "date-fns";
import { ArrowUpIcon } from "lucide-react";
import usePartySocket from "partysocket/react";
import { create, useStore } from "zustand";
import { combine } from "zustand/middleware";

import type {
  ChatMessage,
  Message,
  Participant,
  UserMessage,
} from "@classroom/ws-server/src/rooms/chat/messages.js";
import { Avatar, AvatarFallback } from "@classroom/ui/avatar";
import { Button } from "@classroom/ui/button";
import { Input } from "@classroom/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@classroom/ui/tooltip";

import { useClientEnv, useSession } from "~/root";
import { reverseMap } from "~/utils/array";

type RoomChatStore = ReturnType<typeof createRoomChatStore>;

function createRoomChatStore(roomId: string) {
  const store = create(
    combine(
      {
        roomId,
        status: "loading" as "loading" | "idle",
        messages: [] as Message[],
        participants: [] as Participant[],
      },
      (set) => ({
        setMessages: (messages: Message[]) => {
          set({ messages });
        },
        setParticipants: (participants: Participant[]) => {
          set({ participants });
        },
        setStatus: (status: "loading" | "idle") => {
          set({ status });
        },
      }),
    ),
  );

  return store;
}

const RoomChatStoreContext = createContext<RoomChatStore | null>(null);
export const RoomChatStoreProvider = ({
  children,
  roomId,
}: {
  children: React.ReactNode;
  roomId: string;
}) => {
  const [store] = useState(() => {
    return createRoomChatStore(roomId);
  });

  return (
    <RoomChatStoreContext.Provider value={store}>
      {children}
    </RoomChatStoreContext.Provider>
  );
};

type ExtractState<S> = S extends {
  getState: () => infer T;
}
  ? T
  : never;

export function useRoomChatStore<U>(
  selector: (state: ExtractState<RoomChatStore>) => U,
): U {
  const store = useContext(RoomChatStoreContext);
  if (!store) {
    throw new Error("useRoomChatStore must be used inside a RoomChatProvider");
  }
  return useStore(store, selector);
}

export function RoomChat() {
  const roomId = useRoomChatStore((state) => state.roomId);

  const status = useRoomChatStore((state) => state.status);
  const setStatus = useRoomChatStore((state) => state.setStatus);

  const messages = useRoomChatStore((state) => state.messages);
  const setMessages = useRoomChatStore((state) => state.setMessages);

  const setParticipants = useRoomChatStore((state) => state.setParticipants);

  const env = useClientEnv();
  const session = useSession();
  const socket = usePartySocket({
    host: env.wsServerHost,
    party: "chat",
    room: roomId,
    onMessage: (event) => {
      if (typeof event.data !== "string") return;
      const message = JSON.parse(event.data) as ChatMessage;

      switch (message.type) {
        case "new":
          setMessages([...messages, message]);
          break;
        case "edit":
          // eslint-disable-next-line no-case-declarations
          const index = messages.findIndex((m) => m.id === message.id);
          if (index !== -1) {
            setMessages([
              ...messages.slice(0, index),
              message,
              ...messages.slice(index + 1),
            ]);
          }
          break;
        case "sync":
          setStatus("idle");
          setMessages(message.messages);
          break;
        case "participants":
          setParticipants(message.participants);
          break;
        default:
          message satisfies never;
          break;
      }
    },
    query: {
      token: session.wsJwt,
    },
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const sendMessage = useCallback(
    (message: string) => {
      socket.send(
        JSON.stringify({ type: "new", text: message } as UserMessage),
      );
    },
    [socket],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const message = formData.get("message") as string;
      if (message.length === 0) return;
      sendMessage(message);
      if (inputRef.current) inputRef.current.value = "";
    },
    [sendMessage],
  );

  return (
    <div className="flex h-full flex-col border-l bg-gray-100/40 dark:bg-gray-800/40">
      <div className="relative flex-1">
        <div className="absolute inset-0 flex flex-col-reverse overflow-y-auto px-2 pt-2">
          {status === "idle" && messages.length === 0 && (
            <p className="pt-6 text-center text-muted-foreground">
              No messages yet
            </p>
          )}
          {status === "idle" &&
            reverseMap(messages, (message) => (
              <div key={message.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{message.from.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {format(message.at, "p")}
                  </span>
                </div>
                <p>{message.text}</p>
              </div>
            ))}
        </div>
      </div>
      <div className="border-t bg-white p-2 dark:bg-black">
        <Form
          className="relative bg-gray-100/40 dark:bg-gray-800/40"
          onSubmit={handleSubmit}
        >
          <Input
            ref={inputRef}
            className="rounded-lg border border-neutral-400 py-5 pl-4 pr-16 shadow-sm dark:border-gray-800"
            id="message"
            name="message"
            placeholder="Type your message..."
            autoComplete="off"
          />
          <Button
            className="absolute right-[5px] top-[5px] h-8 w-8"
            size="icon"
            type="submit"
          >
            <ArrowUpIcon className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </Form>
      </div>
    </div>
  );
}

type RoomChatHeaderProps = {
  title: string;
};
export function RoomChatHeader(props: RoomChatHeaderProps) {
  const { title } = props;

  const participants = useRoomChatStore((state) => state.participants);

  return (
    <div className="flex w-full flex-row items-center justify-between gap-2 border-b bg-gray-100/40 p-2 dark:bg-gray-800/40">
      <h2 className="font-semibold">{title}</h2>
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <div className="flex -space-x-2">
            {participants.map((participant) => (
              <Tooltip key={participant.id}>
                <TooltipTrigger asChild>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="border">
                      {participant.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>{participant.name}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
        <span className="text-sm text-muted-foreground">
          {participants.length} participants
        </span>
      </div>
    </div>
  );
}

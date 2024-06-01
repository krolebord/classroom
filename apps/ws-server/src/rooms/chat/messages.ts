import { nanoid } from "nanoid";

export type Sender = {
  id: string;
  name: string;
};

export type Message = {
  id: string;
  from: Sender;
  text: string;
  at: number; // Date
};

// Outbound message types

export type BroadcastMessage = {
  type: "new" | "edit";
} & Message;

export type SyncMessage = {
  type: "sync";
  messages: Message[];
};

// Inbound message types

export type NewMessage = {
  type: "new";
  text: string;
  id?: string;
};

export type EditMessage = {
  type: "edit";
  text: string;
  id: string;
};

export type UserMessage = NewMessage | EditMessage;
export type ChatMessage = BroadcastMessage | SyncMessage;

export const newMessage = (msg: Omit<Message, "id" | "at">) =>
  JSON.stringify(<BroadcastMessage>{
    type: "new",
    id: nanoid(),
    at: Date.now(),
    ...msg,
  });

export const editMessage = (msg: Omit<Message, "at">) =>
  JSON.stringify(<BroadcastMessage>{
    type: "edit",
    at: Date.now(),
    ...msg,
  });

export const syncMessage = (messages: Message[]) =>
  JSON.stringify(<SyncMessage>{ type: "sync", messages });

export const systemMessage = (text: string) =>
  newMessage({ from: { id: "system", name: "system" }, text });

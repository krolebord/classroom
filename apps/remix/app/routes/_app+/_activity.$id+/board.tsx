import type { LinksFunction } from "@remix-run/server-runtime";
import { lazy, Suspense } from "react";
import { useLoaderData } from "@remix-run/react";
import { defineLoader } from "@remix-run/server-runtime/dist/single-fetch";
import { ClientOnly } from "remix-utils/client-only";
import tldrawStyles from "tldraw/tldraw.css?url";
import { z } from "zod";

import {
  ActivityContent,
  ActivityHeader,
  ActivityLayout,
  ActivitySidebar,
} from "~/components/activity-layout";
import {
  RoomChat,
  RoomChatHeader,
  RoomChatStoreProvider,
} from "~/components/chat-room";
import activityStyles from "~/styles/activity.css?url";
import { zodParseOrNotFound } from "~/utils/zod";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tldrawStyles },
  { rel: "stylesheet", href: activityStyles },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@500;700&display=swap",
  },
];

const paramsSchema = z.object({
  id: z.string(),
});

export const loader = defineLoader(async ({ context, params }) => {
  const { id } = zodParseOrNotFound(params, paramsSchema);
  await context.auth.requireUser();

  const board = await context.db.query.Board.findFirst({
    where: (board, { eq }) => eq(board.id, id),
    columns: {
      id: true,
      name: true,
      createdAt: true,
    },
  });

  if (!board) {
    throw new Response("Not Found", { status: 404 });
  }

  return { board };
});

const Board = lazy(() => import("~/components/board.client.js"));

export default function DocumentRoute() {
  const { board } = useLoaderData<typeof loader>();

  return (
    <RoomChatStoreProvider key={board.id} roomId={board.id}>
      <ActivityLayout>
        <ActivityHeader>
          <RoomChatHeader title={board.name} />
        </ActivityHeader>
        <ActivityContent className="z-0 h-full w-full">
          <Suspense fallback={<div>Loading...</div>}>
            <ClientOnly>{() => <Board boardId={board.id} />}</ClientOnly>
          </Suspense>
        </ActivityContent>
        <ActivitySidebar>
          <RoomChat />
        </ActivitySidebar>
      </ActivityLayout>
    </RoomChatStoreProvider>
  );
}

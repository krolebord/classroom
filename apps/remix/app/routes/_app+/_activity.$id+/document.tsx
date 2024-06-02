import type { LinksFunction } from "@remix-run/server-runtime";
import { lazy, Suspense } from "react";
import { useLoaderData } from "@remix-run/react";
import { defineLoader } from "@remix-run/server-runtime/dist/single-fetch";
import quillStyles from "react-quill/dist/quill.snow.css?url";
import { ClientOnly } from "remix-utils/client-only";
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

const paramsSchema = z.object({
  id: z.string(),
});

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: activityStyles },
  { rel: "stylesheet", href: quillStyles },
];

export const loader = defineLoader(async ({ context, params }) => {
  const { id } = zodParseOrNotFound(params, paramsSchema);
  await context.auth.requireUser();

  const document = await context.db.query.Document.findFirst({
    where: (documents, { eq }) => eq(documents.id, id),
    columns: {
      id: true,
      name: true,
      createdAt: true,
    },
  });

  if (!document) {
    throw new Response("Not Found", { status: 404 });
  }

  return { document };
});

const DocumentEditor = lazy(() => import("~/components/document.client.js"));

export default function DocumentRoute() {
  const { document } = useLoaderData<typeof loader>();

  return (
    <RoomChatStoreProvider key={document.id} roomId={document.id}>
      <ActivityLayout>
        <ActivityHeader>
          <RoomChatHeader title={document.name} />
        </ActivityHeader>
        <ActivityContent className="z-0 h-full w-full">
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <ClientOnly>
              {() => <DocumentEditor documentId={document.id} />}
            </ClientOnly>
          </Suspense>
        </ActivityContent>
        <ActivitySidebar>
          <RoomChat />
        </ActivitySidebar>
      </ActivityLayout>
    </RoomChatStoreProvider>
  );
}

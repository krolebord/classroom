import { useLoaderData } from "@remix-run/react";
import { defineLoader } from "@remix-run/server-runtime/dist/single-fetch";
import { z } from "zod";

import { zodParseOrNotFound } from "~/utils/zod";

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

export default function DocumentRoute() {
  const { board } = useLoaderData<typeof loader>();

  return (
    <div className="flex w-full flex-col items-center justify-center pt-12">
      <p className="text-4xl font-semibold">{board.name}</p>
      <div className="flex flex-row flex-wrap gap-4 sm:gap-6"></div>
    </div>
  );
}

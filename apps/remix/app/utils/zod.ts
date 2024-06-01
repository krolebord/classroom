import type { ZodSchema } from "zod";

export const zodParseOrNotFound = <T>(
  data: unknown,
  schema: ZodSchema<T>,
): T => {
  const parsed = schema.safeParse(data);
  if (parsed.success) {
    return parsed.data;
  }
  throw new Response("Not Found", { status: 404 });
};

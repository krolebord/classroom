import type { AppLoadContext } from "@remix-run/cloudflare";

import type { Services } from "./app/core/services.server.js";
import type { Cloudflare } from "./env.js";
import { createServices } from "./app/core/services.server.js";

type ContextBase = Cloudflare & Services;

declare module "@remix-run/cloudflare" {
  interface AppLoadContext extends ContextBase {}
}

type GetLoadContext = (args: {
  request: Request;
  context: { cloudflare: Cloudflare };
}) => AppLoadContext;

export const getLoadContext: GetLoadContext = ({ request, context }) => {
  const services = createServices({ request, context: context.cloudflare });
  return {
    ...context.cloudflare,
    ...services,
  };
};

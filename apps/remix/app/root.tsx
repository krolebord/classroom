import type { LinksFunction } from "@remix-run/server-runtime";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "@remix-run/react";
import { unstable_defineLoader } from "@remix-run/server-runtime";

import tailwind from "./tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwind },
];

export const loader = unstable_defineLoader(async ({ context }) => {
  const session = await context.auth.getOptionalSession();

  return { session };
});

export function useRootLoaderData() {
  return useRouteLoaderData<typeof loader>("root");
}

export function useOptionalSession() {
  return useRootLoaderData().session;
}

export function useSession() {
  const session = useOptionalSession();

  if (!session) {
    throw new Error("Session is required");
  }

  return session;
}

export function useUser() {
  return useSession().user;
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full overflow-x-hidden">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex h-full flex-col overflow-hidden">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

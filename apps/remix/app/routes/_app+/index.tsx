import type { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { useLoaderData } from "@remix-run/react";

import { LogoutButton } from "../resources+/auth+/logout";

export async function loader({ context }: LoaderFunctionArgs) {
  const user = await context.auth.requireUser();

  return { user };
}

export default function IndexRoute() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <div>
      <pre>
        <code>{JSON.stringify(user)}</code>
      </pre>
      <LogoutButton>Logout</LogoutButton>
    </div>
  );
}

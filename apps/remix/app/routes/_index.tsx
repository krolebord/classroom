import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    {
      name: "description",
      content: "Welcome to Remix! Using Vite and Cloudflare!",
    },
  ];
};

export async function loader({ context }: LoaderFunctionArgs) {
  const users = await context.db.query.User.findMany();
  return { t: users };
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      <pre>
        <code>{JSON.stringify(data)}</code>
      </pre>
    </div>
  );
}

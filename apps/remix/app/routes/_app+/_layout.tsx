import type React from "react";
import type { ReactNode } from "react";
import { Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { unstable_defineLoader } from "@remix-run/server-runtime";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import {
  ImageIcon,
  MenuIcon,
  NotebookPenIcon,
  PlusCircleIcon,
  XIcon,
} from "lucide-react";

import { desc, sql, unionAll } from "@classroom/db";
import { Board, Document } from "@classroom/db/schema";
import { cn } from "@classroom/ui";
import { Avatar, AvatarFallback } from "@classroom/ui/avatar";
import { Separator } from "@classroom/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@classroom/ui/sheet";

import { Logo } from "~/components/logo";
import { useUser } from "~/root";
import { NewActivityButton } from "../resources+/new.activity";

type ActivityType = "board" | "document";

export const loader = unstable_defineLoader(async ({ context }) => {
  await context.auth.requireUser();

  const boardsQuery = context.db
    .select({
      id: Board.id,
      name: Board.name,
      createdAt: Board.createdAt,
      type: sql<ActivityType>`'board'`,
    })
    .from(Board);

  const documentsQuery = context.db
    .select({
      id: Document.id,
      name: Document.name,
      createdAt: Document.createdAt,
      type: sql<ActivityType>`'document'`,
    })
    .from(Document);

  const items = await unionAll(boardsQuery, documentsQuery)
    .orderBy(desc(sql`createdAt`))
    .limit(25);

  return {
    navItems: items.map(
      (item) =>
        ({
          to:
            item.type === "board"
              ? `/board/${item.id}`
              : `/document/${item.id}`,
          title: item.name,
          icon: item.type === "board" ? "board" : "document",
        }) satisfies NavItemProps,
    ),
  };
});

function getNavItemIcon(icon: NavItemProps["icon"]) {
  if (icon === "board") {
    return <ImageIcon className="h-4 w-4" />;
  }
  if (icon === "document") {
    return <NotebookPenIcon className="h-4 w-4" />;
  }
  return icon as ReactNode;
}

type NavItemProps = {
  to: string;
  title: string;
  icon: "board" | "document" | Omit<React.ReactNode, string>;
};
function NavItem(props: NavItemProps) {
  const { to, icon, title } = props;

  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2  transition-all hover:text-gray-900  dark:hover:text-gray-50",
          isActive
            ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
            : "text-gray-500 dark:text-gray-400",
        )
      }
      to={to}
    >
      {getNavItemIcon(icon)}
      {title}
    </NavLink>
  );
}

type SidebarProps = {
  items: NavItemProps[];
};
function Sidebar(props: SidebarProps) {
  const { items } = props;

  const user = useUser();

  const nav = (
    <nav className="flex flex-col items-stretch px-4 text-sm font-medium">
      {items.map((item) => (
        <NavItem key={item.to} {...item} />
      ))}
    </nav>
  );

  return (
    <>
      <aside className="hidden min-w-64 border-r bg-gray-100/40 dark:bg-gray-800/40 lg:block">
        <div className="flex h-14 items-center px-6">
          <Logo to="/" />
        </div>
        <div className="h-2"></div>
        <Link className="flex items-center gap-2 px-4" to="/profile">
          <Avatar className="border">
            <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          {user.name}
        </Link>
        <div className="px-6 py-2">
          <Separator />
        </div>
        {nav}
        <div className="px-6 py-2">
          <Separator />
        </div>
        <NewActivityButton>
          <button className="flex items-center gap-3 rounded-lg px-3 py-2  text-gray-500 transition-all  hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
            <PlusCircleIcon className="h-4 w-4" />
            New Activity
          </button>
        </NewActivityButton>
      </aside>
      <div className="flex min-h-14 w-full flex-row items-center justify-between border-b bg-gray-100/40 px-6 dark:bg-gray-800/40 lg:hidden">
        <Link className="flex items-center gap-2" to="/profile">
          <Avatar className="border">
            <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          {user.name}
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <button>
              <MenuIcon className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent noClose className="min-w-64 max-w-96 p-0">
            <div className="h-2"></div>
            <div className="flex h-12 items-center px-6">
              <Logo to="/" />
            </div>
            <div className="px-6 py-2">
              <Separator />
            </div>
            {nav}
            <div className="px-6 py-2">
              <Separator />
            </div>
            <NewActivityButton>
              <button className="flex w-full items-center gap-3 rounded-lg px-6 py-2  text-gray-500 transition-all  hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
                <PlusCircleIcon className="h-4 w-4" />
                New Activity
              </button>
            </NewActivityButton>
            <SheetPrimitive.Close className="absolute right-6 top-5 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
              <XIcon className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </SheetPrimitive.Close>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

export default function () {
  const { navItems } = useLoaderData<typeof loader>();
  return (
    <div className="flex min-h-screen w-full flex-col overflow-hidden lg:flex-row">
      <Sidebar items={navItems} />
      <main className="overflow-x-hidde min-h-screen w-full overflow-y-auto">
        <Outlet />
      </main>
      {/* <div className="flex flex-col">
        <div className="flex h-[60px] items-center border-b bg-gray-100/40 px-6 dark:bg-gray-800/40">
          <h1 className="text-lg font-semibold">Drawing Board</h1>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="h-full w-full bg-gray-100 dark:bg-gray-950" />
        </div>
      </div> */}
      {/* <div className="hidden border-l bg-gray-100/40 dark:bg-gray-800/40 lg:block">
        <div className="flex h-[60px] items-center border-b px-6">
          <h2 className="text-lg font-semibold">Chat</h2>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="grid gap-4 p-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-8 w-8 border">
                <AvatarImage alt="Image" src="/placeholder-user.jpg" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-medium">John Doe</div>
                <div className="prose prose-stone">
                  <p>Hey, let's start collaborating on this project!</p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Avatar className="h-8 w-8 border">
                <AvatarImage alt="Image" src="/placeholder-user.jpg" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-medium">Jane Smith</div>
                <div className="prose prose-stone">
                  <p>Great idea! I'm ready to start brainstorming.</p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Avatar className="h-8 w-8 border">
                <AvatarImage alt="Image" src="/placeholder-user.jpg" />
                <AvatarFallback>MB</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-medium">Michael Brown</div>
                <div className="prose prose-stone">
                  <p>I have some ideas to share. Let's discuss them.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 border-t bg-gray-100/40 p-4 dark:bg-gray-800/40">
          <div className="relative">
            <Textarea
              className="min-h-[48px] resize-none rounded-2xl border border-gray-200 border-neutral-400 p-4 pr-16 shadow-sm dark:border-gray-800"
              id="message"
              name="message"
              placeholder="Type your message..."
              rows={1}
            />
            <Button
              className="absolute right-3 top-3 h-8 w-8"
              size="icon"
              type="submit"
            >
              <ArrowUpIcon className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </div>
      </div> */}
      {/* <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <div className="flex -space-x-2">
          <Avatar className="h-8 w-8 border">
            <AvatarImage alt="Image" src="/placeholder-user.jpg" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <Avatar className="h-8 w-8 border">
            <AvatarImage alt="Image" src="/placeholder-user.jpg" />
            <AvatarFallback>JS</AvatarFallback>
          </Avatar>
          <Avatar className="h-8 w-8 border">
            <AvatarImage alt="Image" src="/placeholder-user.jpg" />
            <AvatarFallback>MB</AvatarFallback>
          </Avatar>
        </div>
        <div className="text-sm font-medium">3 participants</div>
      </div> */}
      {/* <div className="absolute bottom-0 left-0 flex w-full flex-wrap items-center justify-center gap-4 bg-gray-100/40 p-4 dark:bg-gray-800/40">
        <div className="group relative">
          <div className="h-20 w-20 overflow-hidden rounded-md">
            <img
              alt="Participant"
              className="h-full w-full object-cover"
              height={80}
              src="/placeholder.svg"
              style={{
                aspectRatio: "80/80",
                objectFit: "cover",
              }}
              width={80}
            />
          </div>
          <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center bg-black/50 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            John Doe
          </div>
        </div>
        <div className="group relative">
          <div className="h-20 w-20 overflow-hidden rounded-md">
            <img
              alt="Participant"
              className="h-full w-full object-cover"
              height={80}
              src="/placeholder.svg"
              style={{
                aspectRatio: "80/80",
                objectFit: "cover",
              }}
              width={80}
            />
          </div>
          <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center bg-black/50 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            Jane Smith
          </div>
        </div>
        <div className="group relative">
          <div className="h-20 w-20 overflow-hidden rounded-md">
            <img
              alt="Participant"
              className="h-full w-full object-cover"
              height={80}
              src="/placeholder.svg"
              style={{
                aspectRatio: "80/80",
                objectFit: "cover",
              }}
              width={80}
            />
          </div>
          <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center bg-black/50 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            Michael Brown
          </div>
        </div>
        <div className="group relative">
          <div className="h-20 w-20 overflow-hidden rounded-md">
            <img
              alt="Participant"
              className="h-full w-full object-cover"
              height={80}
              src="/placeholder.svg"
              style={{
                aspectRatio: "80/80",
                objectFit: "cover",
              }}
              width={80}
            />
          </div>
          <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center bg-black/50 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            Sarah Johnson
          </div>
        </div>
        <div className="group relative">
          <div className="h-20 w-20 overflow-hidden rounded-md">
            <img
              alt="Participant"
              className="h-full w-full object-cover"
              height={80}
              src="/placeholder.svg"
              style={{
                aspectRatio: "80/80",
                objectFit: "cover",
              }}
              width={80}
            />
          </div>
          <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center bg-black/50 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            Alex Smith
          </div>
        </div>
      </div> */}
    </div>
  );
}

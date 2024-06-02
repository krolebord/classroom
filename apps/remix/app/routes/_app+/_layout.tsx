import type React from "react";
import type { ReactNode } from "react";
import { Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { unstable_defineLoader } from "@remix-run/server-runtime";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import {
  ArrowUpIcon,
  ImageIcon,
  MenuIcon,
  NotebookPenIcon,
  PlusCircleIcon,
  XIcon,
} from "lucide-react";
import { usePartySocket } from "partysocket/react";

import { desc, sql, unionAll } from "@classroom/db";
import { Board, Document } from "@classroom/db/schema";
import { cn } from "@classroom/ui";
import { Avatar, AvatarFallback } from "@classroom/ui/avatar";
import { Button } from "@classroom/ui/button";
import { Input } from "@classroom/ui/input";
import { Separator } from "@classroom/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@classroom/ui/sheet";

import { Logo } from "~/components/logo";
import {
  RoomScounterHandler,
  useRoomsCounter,
} from "~/components/rooms-counter";
import { TldrawProvider } from "~/components/tldraw-context";
import { useClientEnv, useUser } from "~/root";
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
              ? `/${item.id}/board`
              : `/${item.id}/document`,
          title: item.name,
          icon: item.type === "board" ? "board" : "document",
          roomId: item.id,
        }) satisfies NavItemProps,
    ),
  };
});

function getNavItemIcon(icon: NavItemProps["icon"]) {
  if (icon === "board") {
    return <ImageIcon className="h-4 w-4 min-w-fit" />;
  }
  if (icon === "document") {
    return <NotebookPenIcon className="h-4 w-4 min-w-fit" />;
  }
  return icon as ReactNode;
}

type NavItemProps = {
  to: string;
  roomId?: string;
  title: string;
  icon: "board" | "document" | Omit<React.ReactNode, string>;
};
function NavItem(props: NavItemProps) {
  const { to, icon, title, roomId } = props;

  const counts = useRoomsCounter((x) => (roomId ? x[roomId] : null));

  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          "flex items-center justify-between gap-3 rounded-lg px-3 py-2  transition-all hover:text-gray-900  dark:hover:text-gray-50",
          isActive
            ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
            : "text-gray-500 dark:text-gray-400",
        )
      }
      to={to}
    >
      <div className="flex flex-row items-center gap-3 overflow-hidden">
        {getNavItemIcon(icon)}
        <p className="overflow-hidden text-ellipsis whitespace-nowrap">
          {title}
        </p>
      </div>

      {!!counts && (
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-xs">{counts}</span>
        </div>
      )}
    </NavLink>
  );
}

function Sidebar() {
  const user = useUser();
  const { navItems } = useLoaderData<typeof loader>();

  return (
    <>
      <aside className="hidden min-w-48 border-r bg-gray-100/40 dark:bg-gray-800/40 lg:block">
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
        <SidebarActivities items={navItems} />
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
            <SidebarActivities items={navItems} />
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

type SidebarActivitiesProps = {
  items: NavItemProps[];
};
export function SidebarActivities(props: SidebarActivitiesProps) {
  const { items } = props;

  return (
    <nav className="flex flex-col items-stretch px-4 text-sm font-medium">
      {items.map((item) => (
        <NavItem key={item.to} {...item} />
      ))}
    </nav>
  );
}

export default function () {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      <Sidebar />
      <RoomScounterHandler />
      <main className="h-full min-h-screen w-full">
        <TldrawProvider>
          <Outlet />
        </TldrawProvider>
      </main>

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

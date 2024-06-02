import type React from "react";
import type { ReactNode } from "react";
import { NavLink, Outlet, useLoaderData } from "@remix-run/react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@classroom/ui/dropdown-menu";
import { Separator } from "@classroom/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@classroom/ui/sheet";

import { Logo } from "~/components/logo";
import {
  RoomScounterHandler,
  useRoomsCounter,
} from "~/components/rooms-counter";
import { useUser } from "~/root";
import { useLogoutFetcher } from "../resources+/auth+/logout";
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

type UserProfileProps = {
  className?: string;
};
function UserProfile(props: UserProfileProps) {
  const { className } = props;
  const user = useUser();

  const logoutFetcher = useLogoutFetcher();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn("flex items-center gap-2", className)}>
        <Avatar className="border">
          <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        {user.name}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => logoutFetcher.submit()}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Sidebar() {
  const { navItems } = useLoaderData<typeof loader>();

  return (
    <>
      <aside className="hidden min-w-48 border-r bg-gray-100/40 dark:bg-gray-800/40 lg:block">
        <div className="flex h-14 items-center px-6">
          <Logo to="/" />
        </div>
        <div className="h-2"></div>
        <UserProfile className="w-full px-4" />
        <div className="px-6 py-2">
          <Separator />
        </div>
        <SidebarActivities items={navItems} />
        <div className="px-6 py-2">
          <Separator />
        </div>
        <NewActivityButton>
          <button className="flex items-center gap-3 rounded-lg px-7 py-2  text-gray-500 transition-all  hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
            <PlusCircleIcon className="h-4 w-4" />
            New Activity
          </button>
        </NewActivityButton>
      </aside>
      <div className="flex min-h-14 w-full flex-row items-center justify-between border-b bg-gray-100/40 px-6 dark:bg-gray-800/40 lg:hidden">
        <UserProfile />
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
              <button className="flex w-full items-center gap-3 rounded-lg px-7 py-2  text-gray-500 transition-all  hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
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
        <Outlet />
      </main>
    </div>
  );
}

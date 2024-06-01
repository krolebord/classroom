import { Link } from "@remix-run/react";
import { SquirrelIcon } from "lucide-react";

import { cn } from "@classroom/ui";

type LogoProps = {
  className?: string;
  to: string;
};

export function Logo(props: LogoProps) {
  const { className, to } = props;
  return (
    <Link
      className={cn("flex items-center gap-2 font-semibold", className)}
      to={to}
    >
      <SquirrelIcon className="h-6 w-6" />
      <span>Classroom</span>
    </Link>
  );
}

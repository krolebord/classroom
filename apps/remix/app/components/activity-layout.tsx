import { cn } from "@classroom/ui";

type ActivityLayoutProps = {
  className?: string;
  children: React.ReactNode;
};
export function ActivityLayout(props: ActivityLayoutProps) {
  const { children, className } = props;
  return (
    <div
      className={cn(
        "activity-container h-full max-h-[100vh] w-full items-center justify-center overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

type ActivityHeaderProps = {
  className?: string;
  children: React.ReactNode;
};
export function ActivityHeader(props: ActivityHeaderProps) {
  const { className, children } = props;
  return <div className={cn("activity-header", className)}>{children}</div>;
}

type ActivityContentProps = {
  className?: string;
  children: React.ReactNode;
};
export function ActivityContent(props: ActivityContentProps) {
  const { className, children } = props;
  return <div className={cn("activity-content", className)}>{children}</div>;
}

type ActivitySidebarProps = {
  className?: string;
  children: React.ReactNode;
};
export function ActivitySidebar(props: ActivitySidebarProps) {
  const { className, children } = props;
  return (
    <div className={cn("activity-sidebar h-full", className)}>{children}</div>
  );
}

import { Outlet } from "@remix-run/react";

export default function () {
  return (
    <div className="pt-12">
      <Outlet />
    </div>
  );
}

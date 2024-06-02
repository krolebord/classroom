import { Form, useFetcher } from "@remix-run/react";
import { unstable_defineAction } from "@remix-run/server-runtime";

import type { ButtonProps } from "@classroom/ui/button";
import { Button } from "@classroom/ui/button";

export const action = unstable_defineAction(async ({ context }) => {
  await context.auth.requireUser();
  return await context.auth.getLogoutRedirect({ redirectTo: "/login" });
});

export function useLogoutFetcher() {
  const fetcher = useFetcher<typeof action>();

  return {
    submit: () => {
      fetcher.submit(
        {},
        {
          method: "POST",
          action: "/resources/auth/logout",
        },
      );
    },
  };
}

type LogoutButtonProps = {
  formClassName?: string;
} & ButtonProps;
export function LogoutButton(props: LogoutButtonProps) {
  const { formClassName, ...buttonProps } = props;

  return (
    <Form
      action="/resources/auth/logout"
      method="POST"
      className={formClassName}
    >
      <Button {...buttonProps} type="submit" />
    </Form>
  );
}

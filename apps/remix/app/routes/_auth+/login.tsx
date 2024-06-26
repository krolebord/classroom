import { Form, Link, useActionData } from "@remix-run/react";
import {
  json,
  redirect,
  unstable_defineAction,
  unstable_defineLoader,
} from "@remix-run/server-runtime";
import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { z } from "zod";

import { Button } from "@classroom/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@classroom/ui/card";
import { Input } from "@classroom/ui/input";

import { FieldWrapper } from "~/components/forms";

export const loader = unstable_defineLoader(async ({ context }) => {
  await context.auth.requireAnon();

  return {};
});

const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export const action = unstable_defineAction(async ({ context, request }) => {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: loginSchema });

  if (submission.status !== "success") {
    return {
      status: "error",
      submission: submission.reply(),
    } as const;
  }

  const session = await context.auth.signin(submission.value);

  if (!session) {
    return json(
      {
        status: "error",
        submission: submission.reply({
          formErrors: ["Invalid email or password"],
        }),
      } as const,
      { status: 400 },
    );
  }

  const cookieSession = await context.authCookieSession.getSession(
    request.headers.get("cookie"),
  );
  cookieSession.set("token", session.sessionToken);

  const setCookie = await context.authCookieSession.commitSession(
    cookieSession,
    {
      expires: session.expiresAt,
    },
  );

  return redirect("/", {
    headers: {
      "Set-Cookie": setCookie,
    },
  });
});

export default function LoginForm() {
  const actionData = useActionData<typeof action>();
  const [form, fields] = useForm({
    lastResult: actionData?.status === "error" ? actionData.submission : null,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: loginSchema });
    },
  });

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your email below to login to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form className="grid gap-1" {...getFormProps(form)} method="POST">
          <FieldWrapper field={fields.email} labelProps={{ tooltip: "Email" }}>
            <Input
              placeholder="m@example.com"
              {...getInputProps(fields.email, { type: "email" })}
            />
          </FieldWrapper>
          <FieldWrapper
            field={fields.password}
            labelProps={{ tooltip: "Password" }}
            errors={form.errors}
          >
            <Input
              placeholder="********"
              {...getInputProps(fields.password, { type: "password" })}
            />
          </FieldWrapper>
        </Form>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="ghost" className="w-full" asChild>
          <Link to="/register">Sign up</Link>
        </Button>
        <Button type="submit" form={form.id} className="w-full">
          Sign in
        </Button>
      </CardFooter>
    </Card>
  );
}

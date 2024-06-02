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
  CardHeader,
  CardTitle,
} from "@classroom/ui/card";
import { Input } from "@classroom/ui/input";

import { FieldWrapper } from "~/components/forms";

export const loader = unstable_defineLoader(async ({ context }) => {
  await context.auth.requireAnon();

  return {};
});

export const passwordSchema = z
  .string()
  .min(6, { message: "Password is too short" })
  .max(100, { message: "Password is too long" });

const regiterSchema = z
  .object({
    name: z.string(),
    email: z.string().email(),
  })
  .and(
    z
      .object({
        password: passwordSchema,
        confirmPassword: passwordSchema,
      })
      .superRefine(({ confirmPassword, password }, ctx) => {
        if (confirmPassword !== password) {
          ctx.addIssue({
            path: ["confirmPassword"],
            code: "custom",
            message: "The passwords did not match",
          });
        }
      }),
  );

export const action = unstable_defineAction(async ({ context, request }) => {
  await context.auth.requireAnon();

  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    async: true,
    schema: regiterSchema.superRefine(async (data, ctx) => {
      const existingUser = await context.db.query.User.findFirst({
        where: (users, { eq }) => eq(users.email, data.email),
        columns: { id: true },
      });
      if (existingUser) {
        ctx.addIssue({
          path: ["email"],
          code: z.ZodIssueCode.custom,
          message: "A user already exists with this email",
        });
        return;
      }
    }),
  });

  if (submission.status !== "success") {
    return json(
      {
        status: "error",
        submission: submission.reply(),
      } as const,
      { status: 400 },
    );
  }

  const { sessionToken, expiresAt } = await context.auth.signup({
    name: submission.value.name,
    email: submission.value.email,
    password: submission.value.password,
  });

  const cookieSession = await context.authCookieSession.getSession(
    request.headers.get("cookie"),
  );
  cookieSession.set("token", sessionToken);

  return redirect("/", {
    headers: {
      "Set-Cookie": await context.authCookieSession.commitSession(
        cookieSession,
        {
          expires: expiresAt,
        },
      ),
    },
  });
});

export default function () {
  const actionData = useActionData<typeof action>();
  const [form, fields] = useForm({
    lastResult: actionData?.status === "error" ? actionData.submission : null,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: regiterSchema });
    },
  });

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Sign Up</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form className="grid gap-1" {...getFormProps(form)} method="POST">
          <FieldWrapper field={fields.name} labelProps={{ tooltip: "Name" }}>
            <Input
              placeholder="Max"
              {...getInputProps(fields.name, { type: "text" })}
            />
          </FieldWrapper>
          <FieldWrapper
            field={fields.email}
            labelProps={{ tooltip: "Email" }}
            errors={form.errors}
          >
            <Input
              placeholder="m@example.com"
              {...getInputProps(fields.email, { type: "email" })}
            />
          </FieldWrapper>
          <FieldWrapper
            field={fields.password}
            labelProps={{ tooltip: "Password" }}
          >
            <Input
              placeholder="********"
              {...getInputProps(fields.password, { type: "password" })}
              autoComplete="off"
            />
          </FieldWrapper>
          <FieldWrapper
            field={fields.confirmPassword}
            labelProps={{ tooltip: "Confirm Password" }}
          >
            <Input
              placeholder="********"
              {...getInputProps(fields.confirmPassword, { type: "password" })}
            />
          </FieldWrapper>
          <Button type="submit" className="w-full">
            Create an account
          </Button>
        </Form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link to="/login" className="underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

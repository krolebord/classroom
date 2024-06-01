import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/server-runtime";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { redirect, unstable_defineAction } from "@remix-run/server-runtime";
import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { BrushIcon, PenIcon } from "lucide-react";
import { namedAction } from "remix-utils/named-action";
import { z } from "zod";

import { cn } from "@classroom/ui";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@classroom/ui/card";
import { Input } from "@classroom/ui/input";
import { StatusButton } from "@classroom/ui/status-button";

import { FieldWrapper } from "~/components/forms";
import { LogoutButton } from "../resources+/auth+/logout";

export async function loader({ context }: LoaderFunctionArgs) {
  const user = await context.auth.requireSession();

  return { user };
}

const newDocumentSchema = z.object({
  name: z.string(),
});

const newBoardSchema = z.object({
  name: z.string(),
});

export const action = unstable_defineAction(async ({ context, request }) => {
  const formData = await request.formData();
  const user = await context.auth.requireUser();

  return await namedAction(request, {
    newDocument: () => {
      const submission = parseWithZod(formData, { schema: newDocumentSchema });

      if (submission.status !== "success") {
        return {
          status: "error",
          type: "document",
          submission: submission.reply(),
        } as const;
      }

      return redirect(`/document/1`);
    },
    newBoard: () => {
      const submission = parseWithZod(formData, { schema: newDocumentSchema });

      if (submission.status !== "success") {
        return {
          status: "error",
          type: "board",
          submission: submission.reply(),
        } as const;
      }

      return redirect(`/board/1`);
    },
  });
});

type NewDocumentFormProps = {
  className?: string;
};
function NewDocumentForm(props: NewDocumentFormProps) {
  const { className } = props;

  const actionData = useActionData<typeof action>();

  const [form, fields] = useForm({
    lastResult:
      actionData &&
      actionData.status === "error" &&
      actionData.type === "document"
        ? actionData.submission
        : null,
    constraint: getZodConstraint(newDocumentSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: newDocumentSchema });
    },
  });

  const navigation = useNavigation();

  return (
    <Card
      className={cn("flex flex-col items-start gap-2 px-6 py-4", className)}
    >
      <CardTitle className="flex flex-row items-center gap-2 text-xl">
        <PenIcon className="h-5 w-5" /> New Document
      </CardTitle>
      <div className="h-1"></div>
      <Form {...getFormProps(form)} method="POST" action="?/newDocument">
        <FieldWrapper
          field={fields.name}
          labelProps={{ tooltip: "Document name" }}
        >
          <Input {...getInputProps(fields.name, { type: "text" })} />
        </FieldWrapper>
      </Form>
      <StatusButton
        disabled={navigation.state !== "idle"}
        status={navigation.state === "idle" ? "idle" : "pending"}
        form={form.id}
        className="w-full"
      >
        Create
      </StatusButton>
    </Card>
  );
}

type NewBoardFormProps = {
  className?: string;
};
function NewBoardForm(props: NewBoardFormProps) {
  const { className } = props;

  const actionData = useActionData<typeof action>();

  const [form, fields] = useForm({
    lastResult:
      actionData && actionData.status === "error" && actionData.type === "board"
        ? actionData.submission
        : null,
    constraint: getZodConstraint(newBoardSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: newBoardSchema });
    },
  });

  const navigation = useNavigation();

  return (
    <Card
      className={cn("flex flex-col items-start gap-2 px-6 py-4", className)}
    >
      <CardTitle className="flex flex-row items-center gap-2 text-xl">
        <BrushIcon className="h-5 w-5" /> New Board
      </CardTitle>
      <div className="h-1"></div>
      <Form {...getFormProps(form)} method="POST" action="?/newBoard">
        <FieldWrapper
          field={fields.name}
          labelProps={{ tooltip: "Board title" }}
        >
          <Input {...getInputProps(fields.name, { type: "text" })} />
        </FieldWrapper>
      </Form>
      <StatusButton
        disabled={navigation.state !== "idle"}
        status={navigation.state === "idle" ? "idle" : "pending"}
        form={form.id}
        className="w-full"
      >
        Create
      </StatusButton>
    </Card>
  );
}

export default function IndexRoute() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="flex w-full flex-col items-center justify-center pt-12">
      <p className="text-4xl font-semibold">Welcome</p>
      <div className="flex flex-row flex-wrap gap-4 sm:gap-6">
        <NewDocumentForm />
        <NewBoardForm />
      </div>
    </div>
  );
}

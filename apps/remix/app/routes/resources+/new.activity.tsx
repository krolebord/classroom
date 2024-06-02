import type { FieldMetadata } from "@conform-to/react";
import type React from "react";
import { useFetcher } from "@remix-run/react";
import { redirect, unstable_defineAction } from "@remix-run/server-runtime";
import {
  getFormProps,
  getInputProps,
  useForm,
  useInputControl,
} from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { BrushIcon, PenIcon, PlusCircleIcon } from "lucide-react";
import { z } from "zod";

import { Board, Document } from "@classroom/db/schema";
import { Input } from "@classroom/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@classroom/ui/popover";
import { IconStatusButton } from "@classroom/ui/status-button";
import { ToggleGroup, ToggleGroupItem } from "@classroom/ui/toggle-group";

const newActivitySchema = z.object({
  type: z.enum(["document", "board"]),
  name: z.string().min(2).max(32),
});

export const action = unstable_defineAction(
  async ({ context, request, response }) => {
    const formData = await request.formData();
    const user = await context.auth.requireUser();

    const submission = parseWithZod(formData, { schema: newActivitySchema });

    if (submission.status !== "success") {
      return {
        status: "error",
        submission: submission.reply(),
      } as const;
    }

    const { type, name } = submission.value;

    if (type === "document") {
      const id = crypto.randomUUID();
      await context.db.insert(Document).values({
        id,
        name,
        createdById: user.id,
      });
      return redirect(`/document/${id}`);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (type === "board") {
      const id = crypto.randomUUID();
      await context.db.insert(Board).values({
        id,
        name,
        createdById: user.id,
      });
      return redirect(`/board/${id}`);
    }

    const invalidType = type satisfies never;
    response.status = 400;
    return {
      invalidType,
      status: "error",
      submission: submission.reply({
        fieldErrors: {
          type: ["Invalid type"],
        },
      }),
    };
  },
);

type NewActivityButtonProps = {
  children: React.ReactNode;
};
export function NewActivityButton(props: NewActivityButtonProps) {
  const { children } = props;

  const fetcher = useFetcher<typeof action>();
  const actionData = fetcher.data;

  const [form, fields] = useForm({
    lastResult:
      actionData && actionData.status === "error"
        ? actionData.submission
        : null,
    constraint: getZodConstraint(newActivitySchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: newActivitySchema });
    },
  });

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        alignOffset={10}
        className="z-[999] w-auto max-w-64"
      >
        <fetcher.Form
          {...getFormProps(form)}
          method="POST"
          action="/resources/new/activity"
          className="flex flex-col gap-2"
        >
          <TypeToggle field={fields.type} />
          <div className="flex flex-row gap-2">
            <Input
              className="min-w-24"
              placeholder="Name"
              {...getInputProps(fields.name, { type: "text" })}
            />
            <IconStatusButton
              disabled={fetcher.state !== "idle"}
              status={fetcher.state === "idle" ? "idle" : "pending"}
            >
              <PlusCircleIcon className="h-6 w-6" />
            </IconStatusButton>
          </div>
        </fetcher.Form>
      </PopoverContent>
    </Popover>
  );
}

type TypeToggleProps = {
  field: FieldMetadata<string>;
};
function TypeToggle(props: TypeToggleProps) {
  const { field } = props;

  const control = useInputControl({
    name: field.name,
    formId: field.formId,
    initialValue: field.value ?? "document",
  });

  return (
    <ToggleGroup
      type="single"
      className="grid grid-cols-2 gap-2"
      variant="primary"
      value={control.value}
      onValueChange={(value) => {
        console.log(value);
        control.change(value);
      }}
    >
      <ToggleGroupItem
        name={field.name}
        value="document"
        className="flex gap-2"
      >
        <PenIcon className="h-4 w-4" />
        Doc
      </ToggleGroupItem>
      <ToggleGroupItem name={field.name} value="board" className="flex gap-2">
        <BrushIcon className="h-4 w-4" />
        Board
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

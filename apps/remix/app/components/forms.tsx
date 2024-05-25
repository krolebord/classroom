import type { FieldMetadata } from "@conform-to/react";

import { cn } from "@classroom/ui";
import { Label } from "@classroom/ui/label";

export type ListOfErrors = (string | null | undefined)[] | null | undefined;

export function ErrorList({
  id,
  errors,
  className,
}: {
  errors?: ListOfErrors;
  id?: string;
  className?: string;
}) {
  const errorsToRender = errors?.filter(Boolean);
  if (!errorsToRender?.length) return null;
  return (
    <ul id={id} className={cn("flex flex-col gap-1", className)}>
      {errorsToRender.map((e) => (
        <li key={e} className="text-xs text-destructive">
          {e}
        </li>
      ))}
    </ul>
  );
}

export type BaseFieldProps<T> = Omit<FieldWrapperProps<T>, "children">;

type FieldWrapperProps<T> = {
  field: FieldMetadata<T>;
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement> & {
    tooltip?: string;
  };
  children: React.ReactNode;
  className?: string;
  errors?: ListOfErrors;
};
export function FieldWrapper<T>({
  field,
  labelProps,
  children,
  errors,
  className,
}: FieldWrapperProps<T>) {
  const flatErrors = [...(field.errors ?? []), ...(errors ?? [])].filter(
    Boolean,
  );
  return (
    <div className={className}>
      {!!labelProps && (
        <Label htmlFor={field.id} className="block pb-2" {...labelProps}>
          {labelProps.tooltip}
        </Label>
      )}
      {children}
      <div className="min-h-[20px] pl-2 pt-1">
        {flatErrors.length ? (
          <ErrorList id={field.errorId} errors={flatErrors} />
        ) : null}
      </div>
    </div>
  );
}

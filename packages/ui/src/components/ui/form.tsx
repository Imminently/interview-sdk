import { useInterview } from "@/interview";
import { useDebugSettings, useOptions, useTheme } from "@/providers";
import { cn } from "@/util";
import type { Control } from "@imminently/interview-sdk";
import type * as LabelPrimitive from "@radix-ui/react-label";
import { Slot as ReactSlot, type SlotProps } from "@radix-ui/react-slot";
import * as React from "react";
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
  useFormState,
} from "react-hook-form";
import { Label } from "./label";

const Form = FormProvider;

function Slot<P = React.HTMLAttributes<HTMLElement>>(props: SlotProps & P) {
  return <ReactSlot {...props} />;
}

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  control: Control;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  data, // pull data (the control) out of the props
  ...props
}: ControllerProps<TFieldValues, TName> & { data: Control }) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name, control: data }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = <C extends Control>() => {
  // TODO probably insert control into here somewhere
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    control: fieldContext.control as C,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId();
  const { control, name } = useFormField();
  // @ts-ignore the control may have a custom className, add it here so its always applied
  const customClassName = control.customClassName ?? "";

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn("grid gap-2", className, customClassName)}
        data-control={control.type}
        data-id={control.id}
        data-name={name}
        {...props}
      />
    </FormItemContext.Provider>
  );
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  // pull the debug option, falling back to true if not set (ie likely in a mocked context)
  const { debug } = useOptions({ debug: true });
  const { error, formItemId, name, control } = useFormField();

  const debugControl = debug
    ? () => {
        console.log("FormLabel", {
          name,
          formItemId,
          control,
        });
      }
    : undefined;

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      onClick={debugControl}
      {...props}
    />
  );
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  const { debugEnabled } = useDebugSettings();
  const interview = useInterview();
  const control = useFormField().control;

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      onMouseDown={(e) => {
        if (debugEnabled && e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          interview.callbacks.onDebugControlClick?.(control, interview);
        }
      }}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  );
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { t } = useTheme();
  const { control, formDescriptionId } = useFormField();

  const hasLongDescription =
    "longDescription" in control && control.longDescription && control.longDescription.length > 0;

  if (!hasLongDescription) {
    return null;
  }

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    >
      {t(control.longDescription)}
    </p>
  );
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { t } = useTheme();
  const { error, formMessageId } = useFormField();
  const body = error ? t(String(error?.message ?? "")) : props.children;

  if (!body) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      {body}
    </p>
  );
}

export { useFormField, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField };

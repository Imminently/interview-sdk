import { useInterview } from "@/interview";
import { useDebugSettings, useTheme } from "@/providers";
import { cn } from "@/util";
import { displayValue, type Control } from "@imminently/interview-sdk";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

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
  fieldRef: React.Ref<HTMLElement>;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  data, // pull data (the control) out of the props
  children,
  ...props
}: Omit<ControllerProps<TFieldValues, TName>, 'render'> & React.PropsWithChildren<{ data: Control }>) => {
  return (
    <Controller {...props} render={(p) => (
      <FormFieldContext.Provider value={{ name: props.name, control: data, fieldRef: p.field.ref }}>
        <FormItem>
          <Slot children={children} {...p} />
        </FormItem>
      </FormFieldContext.Provider>
    )} />
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
    fieldRef: fieldContext.fieldRef,
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

export const FormItemDebug = () => {
  const { t } = useTheme();
  const { debugEnabled } = useDebugSettings();
  const context = useInterview();
  const { control, formItemId, name } = useFormField();
  const { watch } = useFormContext();
  const graph = React.useMemo(() => context.manager.parsedGraph, [context]);
  const val = watch(name);

  if (!debugEnabled) {
    return null;
  }

  const handleDebugClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      context.callbacks.onDebugControlClick?.(control, context);
      return;
    }

    // default action is just console log the control
    console.log("[DEBUG] Form control data", {
      name,
      formItemId,
      control,
    });
  };

  // name might be a path, separated by / or ., so we need to strip to just the id at the end for lookup in the graph
  const attribute = name.split("/").pop()?.split(".").pop() ?? name;
  const node = graph ? graph.node(attribute) : { description: "No graph", entity: "N/A" };
  const entity = node?.entity ? `[${node.entity}]` : (control as any).entity ? `[${(control as any).entity}]` : undefined;

  // doing a weird fallback tooltip, as our translation layer fallbacks to the key
  const defaultTooltip = "Click to log control to console. Shift+Click to trigger debug callback.";
  const tooltipKey = "form.debugTooltip";
  const tooltip = t(tooltipKey) !== tooltipKey ? t(tooltipKey) : defaultTooltip;

  // add a tooltip that explains click vs shift+click
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div tabIndex={-1} onClick={handleDebugClick} data-slot="debug-info" className="flex flex-row gap-1 text-xs text-muted-foreground items-center cursor-pointer">
          {entity ? <span>{entity}</span> : null}
          <span>{node?.description ?? "-"}</span>
          <div className="font-mono bg-accent rounded-lg p-1 ml-auto">{displayValue(val)}</div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <dl className="mb-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-sm">
          <dt className="text-muted-foreground">Name</dt>
          <dd>{name}</dd>
          <dt className="text-muted-foreground">Form Item ID</dt>
          <dd>{formItemId}</dd>
          <dt className="text-muted-foreground">Control Type</dt>
          <dd>{control.type}</dd>
          <dt className="text-muted-foreground">Control ID</dt>
          <dd>{control.id}</dd>
          <dt className="text-muted-foreground">Node Entity</dt>
          <dd>{node?.entity ?? "N/A"}</dd>
          <dt className="text-muted-foreground">Node Description</dt>
          <dd>{node?.description ?? "N/A"}</dd>
        </dl>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function FormItem({ className, children, ...props }: React.ComponentProps<"div">) {
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
      >
        <FormItemDebug />
        {children}
      </div>
    </FormItemContext.Provider>
  );
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId, control } = useFormField();

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    >
      {props.children}
      {"required" in control && control.required && (
        <span data-required aria-hidden="true">*</span>
      )}
    </Label>
  );
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId, control, fieldRef } = useFormField();

  // Only reference IDs that will actually be present in the DOM, as per WCAG 4.1.1.
  // aria-describedby pointing to a non-existent element is an accessibility violation.
  const hasDescription = "longDescription" in control && !!control.longDescription?.length;
  const ariaDescribedBy = [
    hasDescription ? formDescriptionId : null,
    error ? formMessageId : null,
  ].filter(Boolean).join(" ") || undefined;

  // disabled other debug click events as they may be overriding standard control click behaviour
  // also only enable if debugEnabled is true
  return (
    <Slot
      ref={fieldRef}
      data-slot="form-control"
      id={formItemId}
      aria-describedby={ariaDescribedBy}
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

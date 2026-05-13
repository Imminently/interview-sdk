import type React from "react";
import { Slot } from "@radix-ui/react-slot";
import { RenderControl } from "@/components/RenderControl";
import { type RenderableControl } from "@imminently/interview-sdk";
import { useFormSync } from "@/util/use-form-sync";
import { useInterview } from "../InterviewContext";

export interface InterviewFormProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Renders a list of controls for a screen.
 *
 * This is primarily useful when you want to render a custom form shell but still rely on
 * the SDK's built-in control renderer for the current screen controls.
 */
export const FormControls = ({ controls }: { controls: RenderableControl[] }) => {
  // pre-fixing key with index, as repeat contains will cause multiple controls with the same id
  return (
    <div
      data-slot={"controls"}
      className="flex flex-col gap-4"
    >
      {controls.map((control, index) => (
        <RenderControl
          key={`${index}-${control.id}`}
          control={control}
        />
      ))}
    </div>
  );
};

/**
 * Renders the controls for the current screen within the shared interview form context.
 *
 * `Interview.Form` owns the control rendering for the active screen, while submission is handled
 * by the surrounding provider form. `Interview.Next` is designed to work with this component by
 * rendering a submit button for the same form.
 */
export const InterviewForm = ({ asChild, children, className, ...props }: InterviewFormProps) => {
  const { session } = useInterview();
  const { screen } = session;

  // TODO should this just live in the main context? is there any reason to not just globally register it?
  useFormSync();

  if (!screen) return null;

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      {...props}
      className={className}
      data-slot={"form-content"}
    >
      {children ?? (
        <FormControls controls={screen.controls} />
      )}
    </Comp>
  );
};

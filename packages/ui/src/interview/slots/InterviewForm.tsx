import React, { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { Slot } from "@radix-ui/react-slot";
import debounce from "lodash-es/debounce";
import { useInterview } from "../InterviewContext";
import { getCurrentStep, RenderableControl, Step } from "@imminently/interview-sdk";
import { RenderControl } from "@/components/RenderControl";
import { useTheme } from "@/providers";

// TODO this only exists for getCurrentStep which is a recursive search
export const DEFAULT_STEP: Step = {
  complete: false,
  context: { entity: "" },
  current: false,
  id: "",
  skipped: false,
  title: "",
  visitable: true,
  visited: false,
  steps: [],
};

export interface InterviewFormProps extends React.ButtonHTMLAttributes<HTMLFormElement> {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
  /** applicable only to nested interviews */
  subinterviewRequired?: boolean;
}

// export this in case they want to override / make their own form component

export const Controls = ({ controls }: { controls: RenderableControl[] }) => {
  // pre-fixing key with index, as repeat contains will cause multiple controls with the same id
  return (
    <div data-slot={"controls"} className="flex flex-col gap-4">
      {controls.map((control, index) => <RenderControl key={`${index}-${control.id}`} control={control} />)}
    </div>
  );
}

const InterviewForm = ({ asChild, children, className, subinterviewRequired = false, ...props }: InterviewFormProps) => {
  const methods = useFormContext();
  const { t } = useTheme();
  const { manager, session } = useInterview();
  const { steps, screen } = session;

  const step = getCurrentStep({ ...DEFAULT_STEP, steps });

  const { watch } = methods;

  // Create debounced version of onScreenDataChange outside of useEffect
  const debouncedOnScreenDataChange = useMemo(
    () => debounce((value: any) => manager.onScreenDataChange(value), 300),
    [manager]
  );

  // this exists to update internals, dynamic values and calculate unknowns
  // this means is important we get the session to update and re-render the form
  useEffect(() => {
    const subscription = watch((value, { type }) => {
      if (type === "change") {
        // onControlDataChange?.(get(value, name), name);
        debouncedOnScreenDataChange(value);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, debouncedOnScreenDataChange]);

  if (!screen) return null;
  const pageTitle = t(screen.title || step?.title || "");
  const Comp = asChild ? Slot : "form";
  console.log('rendering form', { pageTitle, screen, step });
  return (
    <Comp {...props} className={className} data-slot={"form"}>
      {
        children ?? (
          <div data-slot={"form-content"}>
            <h4 data-slot={"heading"} className="text-2xl font-semibold mb-6">
              {pageTitle}
            </h4>
            <Controls controls={screen.controls} />
          </div>
        )
      }
    </Comp>
  );
};

export { InterviewForm };
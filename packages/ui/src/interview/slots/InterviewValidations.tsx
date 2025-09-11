import { Alert, AlertDescription } from "@/components/ui/alert";
import clsx from "clsx";
import type * as React from "react";
import { useAttributeValidationErrors } from "@/util/validation";

export interface InterviewValidationsProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  className?: string;
  severity?: "error" | "warning";
}

const InterviewValidations = ({ asChild, className, severity, ...props }: InterviewValidationsProps) => {
  const validations = useAttributeValidationErrors(undefined, severity);

  if (validations.length === 0) return null;

  return (
    <div
      className={clsx("flex flex-col gap-2 p-2 w-full overflow-y-auto max-h-[200px]", className)}
      {...props}
    >
      {validations?.map((validation) => {
        return (
          <Alert
            key={`${validation.parent}/${validation.id}`}
            variant={validation.severity === "error" ? "red" : "yellow"}
          >
            <AlertDescription>{validation.message}</AlertDescription>
          </Alert>
        );
      })}
    </div>
  )
};

export { InterviewValidations };

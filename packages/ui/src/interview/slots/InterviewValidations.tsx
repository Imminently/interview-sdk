import * as React from "react";
import {useInterview} from "../InterviewContext";
import {Alert, AlertDescription} from "@/components/ui/alert";
import clsx from "clsx";
import {Validation} from "@imminently/interview-sdk";

export interface InterviewValidationsProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  className?: string;
}

const InterviewValidations = ({asChild, className, ...props}: InterviewValidationsProps) => {
  const {session} = useInterview();
  const visibleValidations = session.validations?.reduce((visibleValidations, validation) => {
    if (validation.shown && !visibleValidations.some(other => other.message === validation.message)) {
      visibleValidations.push(validation);
    }
    return visibleValidations;
  }, [] as Validation[]);

  return visibleValidations?.length ?
    <div className={clsx("flex flex-col gap-2 p-2 w-full overflow-y-auto max-h-[200px]", className)} {...props}>{visibleValidations?.map(validation => {
      if (validation.shown) {
        return <Alert variant={validation.severity === "error" ? "red" : "yellow"}>
          <AlertDescription>
            {validation.message}
          </AlertDescription>
        </Alert>
      }
      return null;
    })}</div> : null;
};

export {InterviewValidations};

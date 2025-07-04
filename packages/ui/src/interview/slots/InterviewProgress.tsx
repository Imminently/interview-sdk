import * as React from "react";
import { addSeconds, formatDistanceToNow } from "date-fns";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/util";
import { useInterview } from "../InterviewContext";
import { Progress as ProgressData } from "@imminently/interview-sdk";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/providers";

export interface InterviewProgressProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const DefaultProgress = ({ progress }: { progress: ProgressData }) => {
  const { t } = useTheme();
  // TODO the format distance will need its own translation layer, or they just override
  return (
    <div>
      <Progress data-slot={"progress-bar"} value={progress.percentage} />
      <div data-slot={"progress-info"}>
        <span data-slot={"progress-summary"}>
          {progress.percentage === 100 ? t("form.complete") : `${t('form.progress')} ${progress.percentage.toFixed(0)}%`}
        </span>
        {progress.time > 0 && (
          <span data-slot={"progress-summary"}>
            &nbsp;
            {`- ${formatDistanceToNow(addSeconds(Date.now(), progress.time))} left`}
          </span>
        )}
      </div>
    </div>
  )
}

const InterviewProgress = ({ asChild, children, className, ...props }: InterviewProgressProps) => {
  const { state, session } = useInterview();
  if (state !== "success" && !session) {
    return null; // Don't render if not in success state
  }
  const Comp = asChild ? Slot : DefaultProgress;
  return (
    <Comp
      className={cn(className)}
      data-slot="progress"
      slot-progress=""
      progress={session?.progress || { percentage: 0, time: 0 }}
      {...props}
    >
      {children}
    </Comp>
  );
};

export { InterviewProgress };

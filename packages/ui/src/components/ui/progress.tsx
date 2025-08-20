import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as React from "react";

import { cn } from "@/util";

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root & React.PropsWithChildren> {
  indeterminate?: boolean;
}

const Progress = React.forwardRef<React.ComponentRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value, indeterminate = false, ...props }, ref) => (
    <ProgressPrimitive.Root
      ref={ref}
      data-slot="progress"
      className={cn("relative bg-primary/20 h-2 w-full overflow-hidden rounded-full", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "bg-primary h-full w-full flex-1 transition-all",
          indeterminate && "animate-progress origin-left",
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  ),
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };

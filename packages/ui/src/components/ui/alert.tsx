
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/util";

// Context to provide alert id
const AlertIdContext = React.createContext<string | undefined>(undefined);

function useAlertId() {
  const context = React.useContext(AlertIdContext);
  if (context === undefined) {
    throw new Error("useAlertId must be used within an <Alert> component");
  }
  return context;
}

const alertVariants = cva(
  "relative w-full rounded-md px-4 py-3 grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        yellow: "bg-yellow-50 text-yellow-800 [&>svg]:text-yellow-500 border-l-4 border-l-yellow-500",
        red: "bg-red-50 text-red-800 [&>svg]:text-red-500 border-l-4 border-l-red-700",
        green: "bg-green-50 text-green-800 [&>svg]:text-green-500 border-l-4 border-l-green-700",
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  const id = React.useId();
  const isInvalid = variant === "red";
  // we need to mark red alerts as aria invalid for accessibility
  return (
    <AlertIdContext.Provider value={id}>
      <div
        data-slot="alert"
        role="alert"
        aria-invalid={isInvalid}
        aria-labelledby={id + "-title"}
        aria-describedby={id + "-description"}
        className={cn(alertVariants({ variant }), className)}
        {...props}
      />
    </AlertIdContext.Provider>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  const id = useAlertId();
  return (
    <div
      data-slot="alert-title"
      id={id + "-title"}
      className={cn("col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  const id = useAlertId();
  return (
    <div
      data-slot="alert-description"
      id={id + "-description"}
      className={cn("col-start-2 grid justify-items-start gap-1 [&_p]:leading-relaxed", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, useAlertId };

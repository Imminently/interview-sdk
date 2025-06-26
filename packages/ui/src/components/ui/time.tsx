import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Input } from "@/ui/components/ui/input"
import { cn } from "@/ui/util"

const timeVariants = cva(
  "bg-background",
  {
    variants: {
      variant: {
        default: "",
      },
      picker: {
        true: "",
        false: "appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
      }
    },
    defaultVariants: {
      variant: "default",
      picker: true,
    },
  }
)

export interface TimeProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">,
  VariantProps<typeof timeVariants> {
  step?: string | number
}

const Time = React.forwardRef<HTMLInputElement, TimeProps>(
  ({ className, variant, step = "1", ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="time"
        step={step}
        className={cn(timeVariants({ variant }), className)}
        {...props}
      />
    )
  }
)
Time.displayName = "Time"

export { Time }

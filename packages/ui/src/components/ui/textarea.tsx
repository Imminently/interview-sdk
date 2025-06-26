import * as React from "react"

import { cn } from "@/util"
import { cva } from "class-variance-authority";

const inputVariants = cva("",
  {
    variants: {
      variant: {
        default: [
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        ]
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type InputBaseProps = {
  className?: string;
  rows?: number;
};

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & InputBaseProps;

const Textarea = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, TextareaProps>(
  ({ className, rows, ...props }, ref) => {
    // Only pass textarea-appropriate props
    const { onChange, value, defaultValue, name, placeholder, disabled, ...rest } = props as TextareaProps;
    const height = `calc(${rows} * 1.5rem)`; // Assuming 1.5rem is the line-height
    return (
      <textarea
        ref={ref as React.Ref<HTMLTextAreaElement>}
        rows={rows}
        data-slot="input"
        className={cn(
          inputVariants({ variant: "default" }),
          className
        )}
        style={{ height }}
        onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
        value={value}
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        disabled={disabled}
        {...rest}
      />
    );
  }
);
Textarea.displayName = "Textarea"

export { Textarea }

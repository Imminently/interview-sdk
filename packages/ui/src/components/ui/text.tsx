import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/ui/util";

const textVariants = cva("", {
  variants: {
    variant: {
      h1: "text-4xl font-bold",
      h2: "text-3xl font-bold",
      h3: "text-2xl font-semibold",
      h4: "text-xl font-semibold",
      h5: "text-lg font-semibold",
      h6: "text-base font-semibold",
      body: "text-base",
      muted: "text-sm text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

export interface TextProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof textVariants> {
  asChild?: boolean;
}

export const Text = React.forwardRef<HTMLSpanElement, TextProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "span";
    return (
      <Comp
        ref={ref}
        className={cn(textVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Text.displayName = "Text";

export default Text;

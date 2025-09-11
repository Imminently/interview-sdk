import { cn } from "@/util";
import { NumberField } from "@base-ui-components/react/number-field";
import { cva } from "class-variance-authority";
import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const numberInputVariants = cva("", {
  variants: {
    variant: {
      default: [
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
      ],
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const buttonVariants = cva(
  "flex items-center justify-center w-6 h-6 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm disabled:opacity-50 disabled:pointer-events-none"
);

export interface NumberInputProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number | undefined) => void;
  onValueChange?: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  allowDecimals?: boolean;
  maxDecimalPlaces?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  variant?: "default";
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      onValueChange,
      min,
      max,
      step = 1,
      allowDecimals = true,
      maxDecimalPlaces,
      placeholder,
      disabled,
      className,
      variant = "default",
      ...props
    },
    ref
  ) => {
    const maxDp = React.useMemo(() => {
      const n = Number(maxDecimalPlaces);
      return Number.isFinite(n) ? Math.max(0, n) : undefined;
    }, [maxDecimalPlaces]);

    // Hint Base UI to format the displayed value consistently
    const formatOptions = React.useMemo(() => {
      if (!allowDecimals) return { maximumFractionDigits: 0 } as Intl.NumberFormatOptions;
      if (typeof maxDp === "number") return { maximumFractionDigits: maxDp } as Intl.NumberFormatOptions;
      return undefined;
    }, [allowDecimals, maxDp]);

    const handleValueChange = React.useCallback(
      (newValue: number | null) => {
        let processedValue: number | undefined = newValue ?? undefined;

        if (processedValue !== undefined) {
          // 1) Enforce integer mode when decimals are not allowed
          if (!allowDecimals) {
            processedValue = Math.round(processedValue);
          } else if (typeof maxDp === "number") {
            // 2) Otherwise, if decimals are allowed, cap decimal places if requested
            processedValue = Number(processedValue.toFixed(maxDp));
          }

          // 3) Clamp to min/max
          if (min !== undefined && processedValue < min) {
            processedValue = min;
          }
          if (max !== undefined && processedValue > max) {
            processedValue = max;
          }
        }

        onChange?.(processedValue);
        onValueChange?.(processedValue);
      },
      [onChange, onValueChange, min, max, allowDecimals, maxDp]
    );

    // Handle input formatting and decimal place validation as the user types
    const handleInputChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;
        
        // Allow empty input
        if (inputValue === "") {
          onChange?.(undefined);
          onValueChange?.(undefined);
          return;
        }

        // Parse the input value
        const numericValue = Number.parseFloat(inputValue);
        
        // Check if it's a valid number
        if (Number.isNaN(numericValue)) {
          return; // Don't update if invalid
        }

        // Apply decimal rules
        let processedValue = numericValue;
        if (!allowDecimals) {
          processedValue = Math.round(processedValue);
        } else if (typeof maxDp === "number") {
          processedValue = Number(processedValue.toFixed(maxDp));
        }

        // Apply min/max constraints
        if (min !== undefined && processedValue < min) {
          processedValue = min;
        }
        if (max !== undefined && processedValue > max) {
          processedValue = max;
        }

        onChange?.(processedValue);
        onValueChange?.(processedValue);
      },
      [onChange, onValueChange, min, max, allowDecimals, maxDp]
    );

    // Prevent entering decimals when not allowed (typing/paste/keys)
    const handleBeforeInput = React.useCallback(
      (event: React.FormEvent<HTMLInputElement> & { data?: string }) => {
        if (!allowDecimals && event.data && (event.data.includes(".") || event.data.includes(","))) {
          event.preventDefault();
          return;
        }

        // Prevent typing beyond maxDecimalPlaces
        if (allowDecimals && typeof maxDp === "number" && event.data) {
          const currentValue = (event.target as HTMLInputElement).value;
          const decimalIndex = currentValue.indexOf(".");
          
          if (decimalIndex !== -1) {
            const currentDecimalPlaces = currentValue.length - decimalIndex - 1;
            if (currentDecimalPlaces >= maxDp) {
              event.preventDefault();
              return;
            }
          }
        }
      },
      [allowDecimals, maxDp]
    );

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (!allowDecimals) {
          if (event.key === "." || event.key === "," || event.key.toLowerCase() === "e") {
            event.preventDefault();
          }
        } else if (allowDecimals && typeof maxDp === "number") {
          // Prevent typing beyond maxDecimalPlaces
          if (event.key === "." || event.key === "," || event.key.toLowerCase() === "e") {
            const currentValue = (event.target as HTMLInputElement).value;
            const decimalIndex = currentValue.indexOf(".");
            
            if (decimalIndex !== -1) {
              const currentDecimalPlaces = currentValue.length - decimalIndex - 1;
              if (currentDecimalPlaces >= maxDp) {
                event.preventDefault();
              }
            }
          }
        }
      },
      [allowDecimals, maxDp]
    );

    const handlePaste = React.useCallback(
      (event: React.ClipboardEvent<HTMLInputElement>) => {
        if (!allowDecimals) {
          const pasted = event.clipboardData.getData("text");
          if (pasted.includes(".") || pasted.includes(",")) {
            event.preventDefault();
          }
        }
        // For allowDecimals with maxDecimalPlaces, let the paste happen
        // and let the onChange handler process and round the value
      },
      [allowDecimals]
    );

    // Keep input display uncontrolled to avoid blocking user typing/paste.

    return (
      <NumberField.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={cn("relative", className)}
        {...props}
      >
        <NumberField.Group className="flex items-center">
          <NumberField.Decrement
            className={cn(buttonVariants(), "absolute left-1 top-1/2 -translate-y-1/2")}
          >
            <ChevronDown className="h-3 w-3" />
          </NumberField.Decrement>
          
          <NumberField.Input
            ref={ref}
            className={cn(
              numberInputVariants({ variant }),
              "pl-8 pr-8" // Add padding for buttons
            )}
            placeholder={placeholder}
            disabled={disabled}
            onChange={handleInputChange}
            onBeforeInput={handleBeforeInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          />
          
          <NumberField.Increment
            className={cn(buttonVariants(), "absolute right-1 top-1/2 -translate-y-1/2")}
          >
            <ChevronUp className="h-3 w-3" />
          </NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
    );
  }
);

NumberInput.displayName = "NumberInput";

export { NumberInput };

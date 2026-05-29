import { cn, safeParseNumber } from "@/util";
import { NumberField } from "@base-ui-components/react/number-field";
import { cva } from "class-variance-authority";
import * as React from "react";

const buttonVariants = cva(
  "flex items-center justify-center w-6 h-6 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm disabled:opacity-50 disabled:pointer-events-none font-bold border border-border"
);

const numberInputVariants = cva("", {
  variants: {
    variant: {
      default: [
        "flex-1 min-w-0 h-full bg-transparent outline-none px-3 py-1 text-base md:text-sm",
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground file:text-foreground",
      ],
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface NumberInputProps {
  value?: unknown;
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
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
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
      startAdornment,
      endAdornment,
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
        value={safeParseNumber(value) ?? null}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={cn(
          "flex items-center h-9 w-full rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow]",
          "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
          "has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 has-aria-invalid:border-destructive",
          disabled && "pointer-events-none cursor-not-allowed opacity-50",
          className
        )}
        {...props}
      >
        <NumberField.Group className="flex flex-1 min-w-0 items-center">
          {startAdornment ? (
            <span className="pl-2 shrink-0 text-muted-foreground pointer-events-none select-none">
              {startAdornment}
            </span>
          ) : null}
          <NumberField.Input
            ref={ref}
            className={cn(numberInputVariants({ variant }))}
            placeholder={placeholder}
            disabled={disabled}
            onChange={handleInputChange}
            onBeforeInput={handleBeforeInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          />
        </NumberField.Group>
        <div className="flex items-center gap-0.5 pr-1 shrink-0">
          <NumberField.Decrement className={cn(buttonVariants())}>
            &minus;
          </NumberField.Decrement>
          <NumberField.Increment className={cn(buttonVariants())}>
            +
          </NumberField.Increment>
          {endAdornment ? (
            <span className="pl-1 text-muted-foreground pointer-events-none select-none">
              {endAdornment}
            </span>
          ) : null}
        </div>
      </NumberField.Root>
    );
  }
);

NumberInput.displayName = "NumberInput";

export { NumberInput };

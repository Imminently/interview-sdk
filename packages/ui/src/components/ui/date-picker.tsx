import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/util";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface DatePickerProps {
  value?: Date | string;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

// Helper function to parse YYYY-MM-DD as local time
function parseLocalDate(dateString: string): Date | null {
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10) - 1; // Month is 0-indexed
  const day = Number.parseInt(match[3], 10);

  return new Date(year, month, day);
}

function DatePicker({ value, onChange, disabled, minDate, maxDate }: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(() => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (value === "now") return new Date();

    // Parse string as local time
    const localDate = parseLocalDate(value);
    return localDate || new Date(value); // Fallback to original behavior
  });

  const handleDateChange = (newDate: Date | "now" | undefined) => {
    const newValue = newDate === "now" ? new Date() : newDate;
    setDate(newValue);
    onChange?.(newValue);
  };

  React.useEffect(() => {
    if (value !== undefined) {
      if (value instanceof Date) {
        setDate(value);
      } else if (value === "now") {
        setDate(new Date());
      } else {
        // Parse string as local time
        const localDate = parseLocalDate(value);
        setDate(localDate || new Date(value)); // Fallback to original behavior
      }
    }
  }, [value]);

  const disableDates = (date: Date) => {
    // ensure we compare ignoring time component
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (minDate) {
      minDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    }
    if (maxDate) {
      maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
    }
    // if no bounds, don't disable anything
    if (!minDate && !maxDate) return false;
    // using minDate and maxDate as inclusive bounds
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
          disabled={disabled}
        >
          <CalendarIcon />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateChange}
          autoFocus
          disabled={disableDates}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };

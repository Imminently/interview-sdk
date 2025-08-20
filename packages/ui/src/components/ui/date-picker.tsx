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
}

function DatePicker({ value, onChange, disabled }: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? (typeof value === "string" ? new Date(value) : value) : undefined,
  );

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    onChange?.(newDate);
  };

  React.useEffect(() => {
    if (value !== undefined) {
      const dateValue = typeof value === "string" ? new Date(value) : value;
      setDate(dateValue);
    }
  }, [value]);

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
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };

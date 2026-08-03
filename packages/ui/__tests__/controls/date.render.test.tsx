import { describe, expect, test } from "bun:test";
import { fireEvent, screen } from "@testing-library/react";
import { dateControl } from "../test-utils/fixtures";
import { renderControl } from "../test-utils/renderControl";

const pad = (n: number) => String(n).padStart(2, "0");
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const ordinal = (n: number) => {
  if (n % 10 === 1 && n % 100 !== 11) return `${n}st`;
  if (n % 10 === 2 && n % 100 !== 12) return `${n}nd`;
  if (n % 10 === 3 && n % 100 !== 13) return `${n}rd`;
  return `${n}th`;
};

// The calendar always opens on the current month (DatePicker doesn't navigate to the
// selected/min date), so min/max are exercised against days in the current month.
const calendarDayButton = (d: Date): HTMLButtonElement | null => {
  const month = d.toLocaleString("en-US", { month: "long" });
  const label = `${month} ${ordinal(d.getDate())}, ${d.getFullYear()}`;
  return document.querySelector(`button[aria-label$="${label}"]`);
};

describe("DateFormControl render", () => {
  test("renders the label and a 'Pick a date' placeholder trigger by default", () => {
    renderControl(dateControl());
    expect(screen.getByText("Date of birth")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveTextContent("Pick a date");
  });

  test("shows the control's value as a formatted date", () => {
    renderControl(dateControl({ value: "1990-05-15" }));
    expect(screen.getByRole("button")).toHaveTextContent("May 15th, 1990");
  });

  test("disables the trigger when disabled", () => {
    renderControl(dateControl({ disabled: true }));
    expect(screen.getByRole("button")).toBeDisabled();
  });

  test("disables the trigger when readOnly", () => {
    renderControl(dateControl({ readOnly: true }));
    expect(screen.getByRole("button")).toBeDisabled();
  });

  test("disables calendar days outside min/max", async () => {
    const today = new Date();
    const min = new Date(today.getFullYear(), today.getMonth(), 5);
    const max = new Date(today.getFullYear(), today.getMonth(), 20);
    const before = new Date(today.getFullYear(), today.getMonth(), 1);
    const within = new Date(today.getFullYear(), today.getMonth(), 10);
    const after = new Date(today.getFullYear(), today.getMonth(), 25);

    renderControl(dateControl({ min: isoDate(min), max: isoDate(max) }));
    fireEvent.click(screen.getByRole("button"));
    await screen.findByRole("dialog");

    expect(calendarDayButton(before)).toBeDisabled();
    expect(calendarDayButton(within)).not.toBeDisabled();
    expect(calendarDayButton(after)).toBeDisabled();
  });

  test("shows the validation error message when the session has one for this attribute", () => {
    renderControl(dateControl(), {
      validations: [
        { id: "v1", message: "Date of birth is required", severity: "error", attributes: ["dob"], shown: true },
      ],
    });
    expect(screen.getByText("Date of birth is required")).toBeInTheDocument();
  });
});

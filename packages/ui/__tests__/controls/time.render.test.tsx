import { describe, expect, test } from "bun:test";
import { screen } from "@testing-library/react";
import { timeControl } from "../test-utils/fixtures";
import { renderControl } from "../test-utils/renderControl";

describe("TimeFormControl render", () => {
  test("renders the label and a time input", () => {
    renderControl(timeControl());
    expect(screen.getByText("Appointment time")).toBeInTheDocument();
    const input = document.querySelector('input[type="time"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
  });

  test("shows the control's value", () => {
    renderControl(timeControl({ value: "14:30:00" }));
    const input = document.querySelector('input[type="time"]') as HTMLInputElement;
    expect(input.value).toBe("14:30");
  });

  test("applies the minutes_increment as the step attribute, in seconds", () => {
    renderControl(timeControl({ minutes_increment: 15 }));
    const input = document.querySelector('input[type="time"]') as HTMLInputElement;
    expect(input).toHaveAttribute("step", String(15 * 60));
  });

  test("defaults the step to 1 second when minutes_increment is not specified", () => {
    renderControl(timeControl());
    const input = document.querySelector('input[type="time"]') as HTMLInputElement;
    expect(input.getAttribute("step")).toBe("1");
  });

  test("disables the input when disabled", () => {
    renderControl(timeControl({ disabled: true }));
    const input = document.querySelector('input[type="time"]') as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  test("disables the input when readOnly", () => {
    renderControl(timeControl({ readOnly: true }));
    const input = document.querySelector('input[type="time"]') as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  test("shows the validation error message when the session has one for this attribute", () => {
    renderControl(timeControl(), {
      validations: [{ id: "v1", message: "Pick a time", severity: "error", attributes: ["appointment"], shown: true }],
    });
    expect(screen.getByText("Pick a time")).toBeInTheDocument();
  });
});

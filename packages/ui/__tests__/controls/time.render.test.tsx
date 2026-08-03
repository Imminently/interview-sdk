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

  test("does not render a description, even when longDescription is set (control type doesn't support it)", () => {
    renderControl(timeControl({ longDescription: "Extra help text" } as any));
    expect(document.querySelector('[data-slot="form-description"]')).not.toBeInTheDocument();
  });

  describe("aria / WCAG compliance", () => {
    test("associates the label with the input via id", () => {
      renderControl(timeControl());
      const label = document.querySelector("label") as HTMLLabelElement;
      const input = document.querySelector('input[type="time"]') as HTMLInputElement;
      expect(label.htmlFor).toBe(input.id);
      expect(input.id).toBeTruthy();
    });

    test("marks the actual input aria-invalid when there is a validation error", () => {
      renderControl(timeControl(), {
        validations: [
          { id: "v1", message: "Pick a time", severity: "error", attributes: ["appointment"], shown: true },
        ],
      });
      const input = document.querySelector('input[type="time"]') as HTMLInputElement;
      expect(input.getAttribute("aria-invalid")).toBe("true");
    });

    // WCAG gap: required is visually shown but never exposed to assistive technology.
    test("does not expose required state to assistive technology (known gap)", () => {
      renderControl(timeControl({ required: true }));
      const input = document.querySelector('input[type="time"]') as HTMLInputElement;
      expect(input.getAttribute("aria-required")).toBeNull();
      expect(input.hasAttribute("required")).toBe(false);
    });

    test("aria-describedby dangles when longDescription is set (known WCAG 4.1.1 gap)", () => {
      renderControl(timeControl({ longDescription: "Extra help text" } as any));
      const input = document.querySelector('input[type="time"]') as HTMLInputElement;
      const describedBy = input.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      for (const id of (describedBy ?? "").split(" ")) {
        expect(document.getElementById(id)).toBeNull();
      }
    });
  });
});

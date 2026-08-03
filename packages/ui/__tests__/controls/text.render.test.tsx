import { describe, expect, test } from "bun:test";
import { fireEvent, screen } from "@testing-library/react";
import { textControl } from "../test-utils/fixtures";
import { renderControl } from "../test-utils/renderControl";

describe("TextFormControl render", () => {
  test("renders the label and a text input by default", () => {
    renderControl(textControl());
    expect(screen.getByText("Name")).toBeInTheDocument();
    const input = document.querySelector("input") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe("text");
  });

  test("shows the control's value", () => {
    renderControl(textControl({ value: "Alex" }));
    const input = document.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("Alex");
  });

  test("renders a textarea when rows is set", () => {
    renderControl(textControl({ rows: 4 }));
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("rows", "4");
    expect(document.querySelector("input")).not.toBeInTheDocument();
  });

  test("renders a number input when variation type is number", () => {
    renderControl(textControl({ variation: { type: "number" }, numericalOptions: { min: 0, max: 10 } } as any));
    const input = document.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "99" } });
    fireEvent.blur(input);
    expect(input.value).toBe("10");
  });

  test("disables the input when disabled", () => {
    renderControl(textControl({ disabled: true }));
    const input = document.querySelector("input") as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  test("disables the input when readOnly", () => {
    renderControl(textControl({ readOnly: true }));
    const input = document.querySelector("input") as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  test("shows the validation error message when the session has one for this attribute", () => {
    renderControl(textControl(), {
      validations: [{ id: "v1", message: "Name is required", severity: "error", attributes: ["name"], shown: true }],
    });
    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });

  test("does not render a description, even when longDescription is set (control type doesn't support it)", () => {
    renderControl(textControl({ longDescription: "Extra help text" } as any));
    expect(document.querySelector('[data-slot="form-description"]')).not.toBeInTheDocument();
  });

  describe("aria / WCAG compliance", () => {
    test("associates the label with the input via id", () => {
      renderControl(textControl());
      const label = document.querySelector("label") as HTMLLabelElement;
      const input = document.querySelector("input") as HTMLInputElement;
      expect(label.htmlFor).toBe(input.id);
      expect(input.id).toBeTruthy();
    });

    // Unlike Number/Currency, Text's Input is a plain forwardRef around a native <input> with no
    // wrapper div, so aria-invalid/aria-describedby land on the actual focusable element - compliant.
    test("marks the actual input aria-invalid when there is a validation error", () => {
      renderControl(textControl(), {
        validations: [{ id: "v1", message: "Name is required", severity: "error", attributes: ["name"], shown: true }],
      });
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.getAttribute("aria-invalid")).toBe("true");
    });

    test("aria-invalid is false on the input when there is no error", () => {
      renderControl(textControl());
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.getAttribute("aria-invalid")).toBe("false");
    });

    // WCAG gap: required is visually shown but never exposed to assistive technology.
    test("does not expose required state to assistive technology (known gap)", () => {
      renderControl(textControl({ required: true }));
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.getAttribute("aria-required")).toBeNull();
      expect(input.hasAttribute("required")).toBe(false);
    });

    test("aria-describedby dangles when longDescription is set (known WCAG 4.1.1 gap)", () => {
      renderControl(textControl({ longDescription: "Extra help text" } as any));
      const input = document.querySelector("input") as HTMLInputElement;
      const describedBy = input.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      for (const id of (describedBy ?? "").split(" ")) {
        expect(document.getElementById(id)).toBeNull();
      }
    });
  });
});

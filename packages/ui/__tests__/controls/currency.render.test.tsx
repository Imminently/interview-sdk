import { describe, expect, test } from "bun:test";
import { fireEvent, screen } from "@testing-library/react";
import { currencyControl } from "../test-utils/fixtures";
import { renderControl } from "../test-utils/renderControl";

describe("CurrencyFormControl render", () => {
  test("renders the label and currency symbol", () => {
    renderControl(currencyControl());
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("$")).toBeInTheDocument();
  });

  test("shows the control's value", () => {
    renderControl(currencyControl({ value: 1500 }));
    const input = document.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("1,500");
  });

  test("clamps a typed value above max down to max", () => {
    renderControl(currencyControl({ min: 0, max: 1000 }));
    const input = document.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "9999" } });
    fireEvent.blur(input);
    expect(input.value).toBe("1,000");
  });

  test("clamps a typed value below min up to min", () => {
    renderControl(currencyControl({ min: 0, max: 1000 }));
    const input = document.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "-50" } });
    fireEvent.blur(input);
    expect(input.value).toBe("0");
  });

  test("disables the input when disabled", () => {
    renderControl(currencyControl({ disabled: true }));
    const input = document.querySelector("input") as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  test("disables the input when readOnly", () => {
    renderControl(currencyControl({ readOnly: true }));
    const input = document.querySelector("input") as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  test("shows the validation error message when the session has one for this attribute", () => {
    renderControl(currencyControl(), {
      validations: [{ id: "v1", message: "Too low", severity: "error", attributes: ["salary"], shown: true }],
    });
    expect(screen.getByText("Too low")).toBeInTheDocument();
  });

  test("does not render a description, even when longDescription is set (control type doesn't support it)", () => {
    renderControl(currencyControl({ longDescription: "Extra help text" } as any));
    expect(document.querySelector('[data-slot="form-description"]')).not.toBeInTheDocument();
  });

  describe("aria / WCAG compliance", () => {
    test("associates the label with the input via id", () => {
      renderControl(currencyControl());
      const label = document.querySelector("label") as HTMLLabelElement;
      const input = document.querySelector("input") as HTMLInputElement;
      expect(label.htmlFor).toBe(input.id);
      expect(input.id).toBeTruthy();
    });

    test("marks the form-control wrapper aria-invalid when there is a validation error", () => {
      renderControl(currencyControl(), {
        validations: [{ id: "v1", message: "Too low", severity: "error", attributes: ["salary"], shown: true }],
      });
      const wrapper = document.querySelector('[data-slot="form-control"]') as HTMLElement;
      expect(wrapper.getAttribute("aria-invalid")).toBe("true");
    });

    // WCAG gap: same as NumberFormControl - aria-invalid/aria-describedby land on the NumberField
    // wrapper div, not the actual focusable <input>, since base-ui only threads `id` down.
    test("does not set aria-invalid on the actual input, only on its wrapper (known gap)", () => {
      renderControl(currencyControl(), {
        validations: [{ id: "v1", message: "Too low", severity: "error", attributes: ["salary"], shown: true }],
      });
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.getAttribute("aria-invalid")).toBeNull();
    });

    // WCAG gap: required is visually shown but never exposed to assistive technology.
    test("does not expose required state to assistive technology (known gap)", () => {
      renderControl(currencyControl({ required: true }));
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.getAttribute("aria-required")).toBeNull();
      const requiredMarker = document.querySelector("[data-required]");
      expect(requiredMarker?.getAttribute("aria-hidden")).toBe("true");
    });

    test("aria-describedby dangles when longDescription is set (known WCAG 4.1.1 gap)", () => {
      renderControl(currencyControl({ longDescription: "Extra help text" } as any));
      const wrapper = document.querySelector('[data-slot="form-control"]') as HTMLElement;
      const describedBy = wrapper.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      for (const id of (describedBy ?? "").split(" ")) {
        expect(document.getElementById(id)).toBeNull();
      }
    });
  });
});

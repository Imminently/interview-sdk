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

  test("renders the longDescription text when set", () => {
    renderControl(currencyControl({ longDescription: "Extra help text" } as any));
    expect(screen.getByText("Extra help text")).toBeInTheDocument();
  });

  test("does not render a description when longDescription is not set", () => {
    renderControl(currencyControl());
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

    test("marks the actual input aria-invalid when there is a validation error", () => {
      renderControl(currencyControl(), {
        validations: [{ id: "v1", message: "Too low", severity: "error", attributes: ["salary"], shown: true }],
      });
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.getAttribute("aria-invalid")).toBe("true");
    });

    test("aria-invalid is false on the input when there is no error", () => {
      renderControl(currencyControl());
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.getAttribute("aria-invalid")).toBe("false");
    });

    test("exposes required state to assistive technology via the native required attribute", () => {
      renderControl(currencyControl({ required: true }));
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.required).toBe(true);
      const requiredMarker = document.querySelector("[data-required]");
      expect(requiredMarker?.getAttribute("aria-hidden")).toBe("true");
    });

    test("aria-describedby on the input resolves to the rendered description", () => {
      renderControl(currencyControl({ longDescription: "Extra help text" } as any));
      const input = document.querySelector("input") as HTMLInputElement;
      const describedBy = input.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      for (const id of (describedBy ?? "").split(" ")) {
        expect(document.getElementById(id)).not.toBeNull();
      }
    });
  });
});

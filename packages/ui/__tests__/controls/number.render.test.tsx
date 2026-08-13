import { describe, expect, test } from "bun:test";
import { fireEvent, screen } from "@testing-library/react";
import { numberControl } from "../test-utils/fixtures";
import { renderControl } from "../test-utils/renderControl";

describe("NumberFormControl render", () => {
  test("renders the label and an empty input by default", () => {
    renderControl(numberControl());
    expect(screen.getByText("Age")).toBeInTheDocument();
    const input = document.querySelector("input") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("");
  });

  test("shows the control's value", () => {
    renderControl(numberControl({ value: 42 }));
    const input = document.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("42");
  });

  test("falls back to the control's default when no value is set", () => {
    renderControl(numberControl({ default: 18 }));
    const input = document.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("18");
  });

  test("clamps a typed value above numericalOptions.max down to max", () => {
    renderControl(numberControl({ numericalOptions: { min: 0, max: 120 } }));
    const input = document.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "999" } });
    fireEvent.blur(input);
    expect(input.value).toBe("120");
  });

  test("clamps a typed value below numericalOptions.min up to min", () => {
    renderControl(numberControl({ numericalOptions: { min: 0, max: 120 } }));
    const input = document.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "-5" } });
    fireEvent.blur(input);
    expect(input.value).toBe("0");
  });

  test("disables the input when disabled", () => {
    renderControl(numberControl({ disabled: true }));
    const input = document.querySelector("input") as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  test("disables the input when readOnly", () => {
    renderControl(numberControl({ readOnly: true }));
    const input = document.querySelector("input") as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  test("shows the required marker when required", () => {
    renderControl(numberControl({ required: true }));
    expect(document.querySelector("[data-required]")).toBeInTheDocument();
  });

  test("does not show the required marker when not required", () => {
    renderControl(numberControl());
    expect(document.querySelector("[data-required]")).not.toBeInTheDocument();
  });

  test("shows the validation error message when the session has one for this attribute", () => {
    renderControl(numberControl(), {
      validations: [{ id: "v1", message: "Age is required", severity: "error", attributes: ["age"], shown: true }],
    });
    expect(screen.getByText("Age is required")).toBeInTheDocument();
  });

  test("does not show an error message when there is no validation", () => {
    renderControl(numberControl());
    expect(document.querySelector('[data-slot="form-message"]')).not.toBeInTheDocument();
  });

  test("renders the longDescription text when set", () => {
    renderControl(numberControl({ longDescription: "Extra help text" } as any));
    expect(screen.getByText("Extra help text")).toBeInTheDocument();
  });

  test("does not render a description when longDescription is not set", () => {
    renderControl(numberControl());
    expect(document.querySelector('[data-slot="form-description"]')).not.toBeInTheDocument();
  });

  describe("aria / WCAG compliance", () => {
    test("associates the label with the input via id", () => {
      renderControl(numberControl());
      const label = document.querySelector("label") as HTMLLabelElement;
      const input = document.querySelector("input") as HTMLInputElement;
      expect(label.htmlFor).toBe(input.id);
      expect(input.id).toBeTruthy();
    });

    test("marks the actual input aria-invalid when there is a validation error", () => {
      renderControl(numberControl(), {
        validations: [{ id: "v1", message: "Age is required", severity: "error", attributes: ["age"], shown: true }],
      });
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.getAttribute("aria-invalid")).toBe("true");
    });

    test("aria-invalid is false on the input when there is no error", () => {
      renderControl(numberControl());
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.getAttribute("aria-invalid")).toBe("false");
    });

    // base-ui's NumberField exposes required as its own Root prop, which it maps to a native
    // `required` attribute on the real input - the standard, preferred way to convey required
    // state (browsers/AT map native `required` to the accessibility tree automatically).
    test("exposes required state to assistive technology via the native required attribute", () => {
      renderControl(numberControl({ required: true }));
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.required).toBe(true);
      // the visual "*" marker stays decorative/aria-hidden since the native attribute now covers it
      const requiredMarker = document.querySelector("[data-required]");
      expect(requiredMarker?.getAttribute("aria-hidden")).toBe("true");
    });

    test("does not mark the input required when the control is not required", () => {
      renderControl(numberControl());
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.required).toBe(false);
    });

    test("aria-describedby on the input resolves to the rendered description", () => {
      renderControl(numberControl({ longDescription: "Extra help text" } as any));
      const input = document.querySelector("input") as HTMLInputElement;
      const describedBy = input.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      for (const id of (describedBy ?? "").split(" ")) {
        expect(document.getElementById(id)).not.toBeNull();
      }
    });
  });
});

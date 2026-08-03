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

  test("does not render a description, even when longDescription is set (control type doesn't support it)", () => {
    renderControl(numberControl({ longDescription: "Extra help text" } as any));
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

    test("marks the form-control wrapper aria-invalid when there is a validation error", () => {
      renderControl(numberControl(), {
        validations: [{ id: "v1", message: "Age is required", severity: "error", attributes: ["age"], shown: true }],
      });
      const wrapper = document.querySelector('[data-slot="form-control"]') as HTMLElement;
      expect(wrapper.getAttribute("aria-invalid")).toBe("true");
    });

    test("aria-invalid is false on the wrapper when there is no error", () => {
      renderControl(numberControl());
      const wrapper = document.querySelector('[data-slot="form-control"]') as HTMLElement;
      expect(wrapper.getAttribute("aria-invalid")).toBe("false");
    });

    // WCAG gap: aria-invalid/aria-describedby land on the NumberField wrapper div (via the shared
    // FormControl Slot), not on the actual focusable <input> - base-ui's NumberField only threads
    // `id` down to the real input, not the other aria-* props. A screen reader focused on the
    // input itself won't hear the invalid/description state. Documents current behavior.
    test("does not set aria-invalid on the actual input, only on its wrapper (known gap)", () => {
      renderControl(numberControl(), {
        validations: [{ id: "v1", message: "Age is required", severity: "error", attributes: ["age"], shown: true }],
      });
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.getAttribute("aria-invalid")).toBeNull();
    });

    // WCAG gap: the visual "*" required marker is aria-hidden and no aria-required (or native
    // required) attribute is set anywhere, so screen reader users get no indication the field
    // is required. Documents current (non-compliant) behavior rather than the ideal one.
    test("does not expose required state to assistive technology (known gap)", () => {
      renderControl(numberControl({ required: true }));
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.getAttribute("aria-required")).toBeNull();
      expect(input.hasAttribute("required")).toBe(false);
      const requiredMarker = document.querySelector("[data-required]");
      expect(requiredMarker?.getAttribute("aria-hidden")).toBe("true");
    });

    // WCAG 4.1.1: aria-describedby must only reference ids that exist in the DOM. Number doesn't
    // render a FormDescription, but the shared FormControl computes aria-describedby generically
    // off `"longDescription" in control` regardless - so setting longDescription here produces a
    // dangling reference. Documents current (non-compliant) behavior.
    test("aria-describedby dangles when longDescription is set (known WCAG 4.1.1 gap)", () => {
      renderControl(numberControl({ longDescription: "Extra help text" } as any));
      const wrapper = document.querySelector('[data-slot="form-control"]') as HTMLElement;
      const describedBy = wrapper.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      for (const id of (describedBy ?? "").split(" ")) {
        expect(document.getElementById(id)).toBeNull();
      }
    });
  });
});

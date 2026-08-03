import { describe, expect, test } from "bun:test";
import { screen } from "@testing-library/react";
import { booleanControl } from "../test-utils/fixtures";
import { renderControl } from "../test-utils/renderControl";

describe("BooleanFormControl render", () => {
  test("renders the label and an indeterminate checkbox by default", () => {
    renderControl(booleanControl());
    expect(screen.getByText("Subscribed")).toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-checked", "mixed");
  });

  test("checks the checkbox when value is true", () => {
    renderControl(booleanControl({ value: true }));
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
  });

  test("unchecks the checkbox when value is false", () => {
    renderControl(booleanControl({ value: false }));
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");
  });

  test("falls back to the control's default when no value is set", () => {
    renderControl(booleanControl({ default: true }));
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
  });

  test("disables the checkbox when disabled", () => {
    renderControl(booleanControl({ disabled: true }));
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  test("disables the checkbox when readOnly", () => {
    renderControl(booleanControl({ readOnly: true }));
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  test("shows the validation error message when the session has one for this attribute", () => {
    renderControl(booleanControl(), {
      validations: [
        { id: "v1", message: "You must subscribe", severity: "error", attributes: ["subscribed"], shown: true },
      ],
    });
    expect(screen.getByText("You must subscribe")).toBeInTheDocument();
  });

  // Boolean is one of only two controls (with Combobox) that actually renders a FormDescription.
  test("renders the longDescription text when set", () => {
    renderControl(booleanControl({ longDescription: "We'll only email you once a month" } as any));
    expect(screen.getByText("We'll only email you once a month")).toBeInTheDocument();
  });

  test("does not render a description when longDescription is not set", () => {
    renderControl(booleanControl());
    expect(document.querySelector('[data-slot="form-description"]')).not.toBeInTheDocument();
  });

  describe("aria / WCAG compliance", () => {
    test("associates the label with the checkbox via id", () => {
      renderControl(booleanControl());
      const label = document.querySelector("label") as HTMLLabelElement;
      const checkbox = screen.getByRole("checkbox");
      expect(label.htmlFor).toBe(checkbox.id);
      expect(checkbox.id).toBeTruthy();
    });

    test("marks the actual checkbox aria-invalid when there is a validation error", () => {
      renderControl(booleanControl(), {
        validations: [
          { id: "v1", message: "You must subscribe", severity: "error", attributes: ["subscribed"], shown: true },
        ],
      });
      expect(screen.getByRole("checkbox").getAttribute("aria-invalid")).toBe("true");
    });

    // WCAG gap: required is visually shown but never exposed to assistive technology.
    test("does not expose required state to assistive technology (known gap)", () => {
      renderControl(booleanControl({ required: true }));
      expect(screen.getByRole("checkbox").getAttribute("aria-required")).toBeNull();
    });

    // Combobox/description linkage is compliant here since Boolean actually renders it.
    test("aria-describedby correctly resolves to the rendered description (compliant)", () => {
      renderControl(booleanControl({ longDescription: "We'll only email you once a month" } as any));
      const checkbox = screen.getByRole("checkbox");
      const describedBy = checkbox.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      for (const id of (describedBy ?? "").split(" ")) {
        expect(document.getElementById(id)).not.toBeNull();
      }
    });

    // Real bug: the checkbox's aria-label uses the RAW control.label instead of the translated
    // t(control.label), unlike the visible FormLabel text which is translated. Using a label
    // that is itself a real translation key (but a different string once translated) exposes the
    // mismatch: the visible text reads "Next" but a screen reader announces "form.next".
    test("aria-label on the checkbox is untranslated, unlike the visible label text (known bug)", () => {
      renderControl(booleanControl({ label: "form.next" }));
      expect(screen.getByText("Next")).toBeInTheDocument();
      expect(screen.getByRole("checkbox")).toHaveAttribute("aria-label", "form.next");
    });
  });
});

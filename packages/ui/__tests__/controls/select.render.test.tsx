import { describe, expect, test } from "bun:test";
import { screen } from "@testing-library/react";
import { selectControl } from "../test-utils/fixtures";
import { renderControl } from "../test-utils/renderControl";

describe("SelectFormControl render", () => {
  test("renders the label and a placeholder trigger by default", () => {
    renderControl(selectControl());
    expect(screen.getByText("Country")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  test("shows the label of the selected option", () => {
    renderControl(selectControl({ value: "nz" }));
    expect(screen.getByRole("combobox")).toHaveTextContent("New Zealand");
  });

  test("disables the trigger when there are no options", () => {
    renderControl(selectControl({ options: [] }));
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  test("disables the trigger when disabled", () => {
    renderControl(selectControl({ disabled: true }));
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  test("disables the trigger when readOnly", () => {
    renderControl(selectControl({ readOnly: true }));
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  test("shows the validation error message when the session has one for this attribute", () => {
    renderControl(selectControl(), {
      validations: [{ id: "v1", message: "Pick a country", severity: "error", attributes: ["country"], shown: true }],
    });
    expect(screen.getByText("Pick a country")).toBeInTheDocument();
  });

  test("renders the longDescription text when set", () => {
    renderControl(selectControl({ longDescription: "Extra help text" } as any));
    expect(screen.getByText("Extra help text")).toBeInTheDocument();
  });

  test("does not render a description when longDescription is not set", () => {
    renderControl(selectControl());
    expect(document.querySelector('[data-slot="form-description"]')).not.toBeInTheDocument();
  });

  describe("aria / WCAG compliance", () => {
    test("associates the label with the trigger via id", () => {
      renderControl(selectControl());
      const label = document.querySelector("label") as HTMLLabelElement;
      const trigger = screen.getByRole("combobox");
      expect(label.htmlFor).toBe(trigger.id);
      expect(trigger.id).toBeTruthy();
    });

    test("marks the actual trigger aria-invalid when there is a validation error", () => {
      renderControl(selectControl(), {
        validations: [{ id: "v1", message: "Pick a country", severity: "error", attributes: ["country"], shown: true }],
      });
      expect(screen.getByRole("combobox").getAttribute("aria-invalid")).toBe("true");
    });

    // Select's Radix Root exposes its own `required` prop, which the trigger maps to aria-required.
    test("exposes required state to assistive technology via aria-required", () => {
      renderControl(selectControl({ required: true }));
      expect(screen.getByRole("combobox")).toHaveAttribute("aria-required", "true");
    });

    test("aria-describedby on the trigger resolves to the rendered description", () => {
      renderControl(selectControl({ longDescription: "Extra help text" } as any));
      const trigger = screen.getByRole("combobox");
      const describedBy = trigger.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      for (const id of (describedBy ?? "").split(" ")) {
        expect(document.getElementById(id)).not.toBeNull();
      }
    });
  });
});

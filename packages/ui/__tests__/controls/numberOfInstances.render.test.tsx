import { describe, expect, test } from "bun:test";
import { fireEvent, screen } from "@testing-library/react";
import { numberOfInstancesControl } from "../test-utils/fixtures";
import { renderControl } from "../test-utils/renderControl";

describe("NumberOfInstancesFormControl render", () => {
  test("renders the label and an input", () => {
    renderControl(numberOfInstancesControl());
    expect(screen.getByText("Number of children")).toBeInTheDocument();
    expect(document.querySelector("input")).toBeInTheDocument();
  });

  test("renders no label wrapper when the control has no label", () => {
    renderControl(numberOfInstancesControl({ label: undefined }));
    expect(document.querySelector("label")).not.toBeInTheDocument();
    expect(document.querySelector("input")).toBeInTheDocument();
  });

  test("defaults the min to 0 when not specified", () => {
    renderControl(numberOfInstancesControl());
    const input = document.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "-5" } });
    fireEvent.blur(input);
    expect(input.value).toBe("0");
  });

  test("clamps a typed value above max down to max", () => {
    renderControl(numberOfInstancesControl({ max: 3 }));
    const input = document.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "9" } });
    fireEvent.blur(input);
    expect(input.value).toBe("3");
  });

  test("disables the input when disabled", () => {
    renderControl(numberOfInstancesControl({ disabled: true }));
    const input = document.querySelector("input") as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  test("disables the input when readOnly", () => {
    renderControl(numberOfInstancesControl({ readOnly: true }));
    const input = document.querySelector("input") as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  test("shows the validation error message when the session has one for this attribute", () => {
    renderControl(numberOfInstancesControl(), {
      validations: [{ id: "v1", message: "Too many", severity: "error", attributes: ["children_count"], shown: true }],
    });
    expect(screen.getByText("Too many")).toBeInTheDocument();
  });

  test("renders the longDescription text when set", () => {
    renderControl(numberOfInstancesControl({ longDescription: "Extra help text" } as any));
    expect(screen.getByText("Extra help text")).toBeInTheDocument();
  });

  test("does not render a description when longDescription is not set", () => {
    renderControl(numberOfInstancesControl());
    expect(document.querySelector('[data-slot="form-description"]')).not.toBeInTheDocument();
  });

  describe("aria / WCAG compliance", () => {
    test("associates the label with the input via id", () => {
      renderControl(numberOfInstancesControl());
      const label = document.querySelector("label") as HTMLLabelElement;
      const input = document.querySelector("input") as HTMLInputElement;
      expect(label.htmlFor).toBe(input.id);
      expect(input.id).toBeTruthy();
    });

    test("marks the actual input aria-invalid when there is a validation error", () => {
      renderControl(numberOfInstancesControl(), {
        validations: [
          { id: "v1", message: "Too many", severity: "error", attributes: ["children_count"], shown: true },
        ],
      });
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.getAttribute("aria-invalid")).toBe("true");
    });

    test("aria-invalid is false on the input when there is no error", () => {
      renderControl(numberOfInstancesControl());
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.getAttribute("aria-invalid")).toBe("false");
    });

    test("exposes required state to assistive technology via the native required attribute", () => {
      renderControl(numberOfInstancesControl({ required: true }));
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.required).toBe(true);
    });

    test("aria-describedby on the input resolves to the rendered description", () => {
      renderControl(numberOfInstancesControl({ longDescription: "Extra help text" } as any));
      const input = document.querySelector("input") as HTMLInputElement;
      const describedBy = input.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      for (const id of (describedBy ?? "").split(" ")) {
        expect(document.getElementById(id)).not.toBeNull();
      }
    });
  });
});

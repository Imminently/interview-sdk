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
});

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
});

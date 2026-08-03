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
});

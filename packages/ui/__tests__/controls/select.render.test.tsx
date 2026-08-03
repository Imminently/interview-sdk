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
});

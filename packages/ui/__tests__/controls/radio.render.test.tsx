import { describe, expect, test } from "bun:test";
import { screen } from "@testing-library/react";
import { radioControl } from "../test-utils/fixtures";
import { renderControl } from "../test-utils/renderControl";

describe("RadioFormControl render", () => {
  test("renders the label and one radio item per option", () => {
    renderControl(radioControl());
    expect(screen.getByText("Favourite colour")).toBeInTheDocument();
    expect(screen.getByText("Red")).toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  test("renders no radio items when there are no options", () => {
    renderControl(radioControl({ options: [] }));
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.queryByText("Favourite colour")).not.toBeInTheDocument();
  });

  test("selects the radio matching the control's value", () => {
    renderControl(radioControl({ value: "blue" }));
    const [red, blue] = screen.getAllByRole("radio");
    expect(red).toHaveAttribute("aria-checked", "false");
    expect(blue).toHaveAttribute("aria-checked", "true");
  });

  test("disables all radio items when disabled", () => {
    renderControl(radioControl({ disabled: true }));
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
    }
  });

  test("disables all radio items when readOnly", () => {
    renderControl(radioControl({ readOnly: true }));
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
    }
  });
});

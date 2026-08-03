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

  // Gap: unlike every other control, RadioFormControl never renders <FormMessage/>, so a
  // validation error is silently invisible to sighted and screen reader users alike.
  test("does not show a validation error message (known gap - RadioFormControl has no FormMessage)", () => {
    renderControl(radioControl(), {
      validations: [{ id: "v1", message: "Pick a colour", severity: "error", attributes: ["color"], shown: true }],
    });
    expect(screen.queryByText("Pick a colour")).not.toBeInTheDocument();
  });

  test("does not render a description, even when longDescription is set (control type doesn't support it)", () => {
    renderControl(radioControl({ longDescription: "Extra help text" } as any));
    expect(document.querySelector('[data-slot="form-description"]')).not.toBeInTheDocument();
  });

  describe("aria / WCAG compliance", () => {
    test("the group carries an aria-label matching the translated label (compensating for a non-labelable role)", () => {
      renderControl(radioControl());
      const group = screen.getByRole("radiogroup");
      expect(group).toHaveAttribute("aria-label", "Favourite colour");
    });

    test("associates the visible label with the group via id", () => {
      renderControl(radioControl());
      const label = document.querySelector("label[data-slot=form-label]") as HTMLLabelElement;
      const group = screen.getByRole("radiogroup");
      expect(label.htmlFor).toBe(group.id);
      expect(group.id).toBeTruthy();
    });

    // Gap: aria-invalid/aria-describedby land on the radiogroup container, not on the individual
    // focusable radio buttons, so a screen reader focused on a specific option won't hear them.
    test("marks the group (not the individual radio items) aria-invalid on error", () => {
      renderControl(radioControl(), {
        validations: [{ id: "v1", message: "Pick a colour", severity: "error", attributes: ["color"], shown: true }],
      });
      expect(screen.getByRole("radiogroup").getAttribute("aria-invalid")).toBe("true");
      for (const radio of screen.getAllByRole("radio")) {
        expect(radio.getAttribute("aria-invalid")).toBeNull();
      }
    });

    // Real bug: Radix sets aria-required="false" on the group unconditionally (we never pass a
    // `required` prop through), regardless of control.required - actively wrong, not just absent.
    test("aria-required is always false regardless of control.required (known bug)", () => {
      renderControl(radioControl({ required: true }));
      expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-required", "false");
    });

    test("aria-describedby dangles when longDescription is set (known WCAG 4.1.1 gap)", () => {
      renderControl(radioControl({ longDescription: "Extra help text" } as any));
      const group = screen.getByRole("radiogroup");
      const describedBy = group.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      for (const id of (describedBy ?? "").split(" ")) {
        expect(document.getElementById(id)).toBeNull();
      }
    });
  });
});

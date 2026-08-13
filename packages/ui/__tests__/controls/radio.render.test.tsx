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

  test("shows the validation error message when the session has one for this attribute", () => {
    renderControl(radioControl(), {
      validations: [{ id: "v1", message: "Pick a colour", severity: "error", attributes: ["color"], shown: true }],
    });
    expect(screen.getByText("Pick a colour")).toBeInTheDocument();
  });

  test("renders the longDescription text when set", () => {
    renderControl(radioControl({ longDescription: "Extra help text" } as any));
    expect(screen.getByText("Extra help text")).toBeInTheDocument();
  });

  test("does not render a description when longDescription is not set", () => {
    renderControl(radioControl());
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

    // aria-invalid on the radiogroup container (rather than each item) is spec-compliant - WAI-ARIA
    // supports aria-invalid on the radiogroup role, and repeating it on every option would just
    // announce "invalid" once per item as a user tabs through them.
    test("marks the group aria-invalid on error", () => {
      renderControl(radioControl(), {
        validations: [{ id: "v1", message: "Pick a colour", severity: "error", attributes: ["color"], shown: true }],
      });
      expect(screen.getByRole("radiogroup").getAttribute("aria-invalid")).toBe("true");
    });

    test("aria-required reflects control.required", () => {
      renderControl(radioControl({ required: true }));
      expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-required", "true");
    });

    test("aria-required is false when the control is not required", () => {
      renderControl(radioControl());
      expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-required", "false");
    });

    test("aria-describedby on the group resolves to the rendered description", () => {
      renderControl(radioControl({ longDescription: "Extra help text" } as any));
      const group = screen.getByRole("radiogroup");
      const describedBy = group.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      for (const id of (describedBy ?? "").split(" ")) {
        expect(document.getElementById(id)).not.toBeNull();
      }
    });
  });
});

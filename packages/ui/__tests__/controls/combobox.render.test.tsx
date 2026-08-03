import { describe, expect, test } from "bun:test";
import { screen } from "@testing-library/react";
import { selectControl } from "../test-utils/fixtures";
import { renderControl } from "../test-utils/renderControl";

describe("ComboboxFormControl render", () => {
  test("renders the label and a placeholder trigger by default", () => {
    renderControl(selectControl({ asyncOptions: { connection: "c1", responseMapping: "m1", path: "/", query: "" } }));
    expect(screen.getByText("Country")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  // NOTE: unlike every other control, ComboControl re-derives `field` via its own independent
  // useController({ name }) call instead of using the `field` prop the outer FormField passes
  // down. That second registration never receives `disabled`, so `control.disabled` alone does
  // not disable the trigger - this documents the actual (current) behavior, not the ideal one.
  test("does not disable the trigger from control.disabled alone (known ComboboxControl gap)", () => {
    renderControl(
      selectControl({
        disabled: true,
        asyncOptions: { connection: "c1", responseMapping: "m1", path: "/", query: "" },
      }),
    );
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  test("disables the trigger when readOnly", () => {
    renderControl(
      selectControl({
        readOnly: true,
        asyncOptions: { connection: "c1", responseMapping: "m1", path: "/", query: "" },
      }),
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  test("shows the validation error message when the session has one for this attribute", () => {
    renderControl(selectControl({ asyncOptions: { connection: "c1", responseMapping: "m1", path: "/", query: "" } }), {
      validations: [{ id: "v1", message: "Pick a country", severity: "error", attributes: ["country"], shown: true }],
    });
    expect(screen.getByText("Pick a country")).toBeInTheDocument();
  });

  // Combobox is one of only two controls (with Boolean) that actually renders a FormDescription.
  test("renders the longDescription text when set", () => {
    renderControl(
      selectControl({
        longDescription: "Pick from the list, or search",
        asyncOptions: { connection: "c1", responseMapping: "m1", path: "/", query: "" },
      } as any),
    );
    expect(screen.getByText("Pick from the list, or search")).toBeInTheDocument();
  });

  test("does not render a description when longDescription is not set", () => {
    renderControl(selectControl({ asyncOptions: { connection: "c1", responseMapping: "m1", path: "/", query: "" } }));
    expect(document.querySelector('[data-slot="form-description"]')).not.toBeInTheDocument();
  });

  describe("aria / WCAG compliance", () => {
    test("associates the label with the trigger via id", () => {
      renderControl(selectControl({ asyncOptions: { connection: "c1", responseMapping: "m1", path: "/", query: "" } }));
      const label = document.querySelector("label") as HTMLLabelElement;
      const trigger = screen.getByRole("button");
      expect(label.htmlFor).toBe(trigger.id);
      expect(trigger.id).toBeTruthy();
    });

    test("marks the actual trigger aria-invalid when there is a validation error", () => {
      renderControl(
        selectControl({ asyncOptions: { connection: "c1", responseMapping: "m1", path: "/", query: "" } }),
        {
          validations: [
            { id: "v1", message: "Pick a country", severity: "error", attributes: ["country"], shown: true },
          ],
        },
      );
      expect(screen.getByRole("button").getAttribute("aria-invalid")).toBe("true");
    });

    // WCAG gap: required is visually shown but never exposed to assistive technology.
    test("does not expose required state to assistive technology (known gap)", () => {
      renderControl(
        selectControl({
          required: true,
          asyncOptions: { connection: "c1", responseMapping: "m1", path: "/", query: "" },
        }),
      );
      expect(screen.getByRole("button").getAttribute("aria-required")).toBeNull();
    });

    // Unlike every other control, longDescription actually renders here, so aria-describedby
    // correctly resolves - a genuine positive compliance case, not a gap.
    test("aria-describedby correctly resolves to the rendered description (compliant)", () => {
      renderControl(
        selectControl({
          longDescription: "Pick from the list, or search",
          asyncOptions: { connection: "c1", responseMapping: "m1", path: "/", query: "" },
        } as any),
      );
      const trigger = screen.getByRole("button");
      const describedBy = trigger.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      for (const id of (describedBy ?? "").split(" ")) {
        expect(document.getElementById(id)).not.toBeNull();
      }
    });
  });
});

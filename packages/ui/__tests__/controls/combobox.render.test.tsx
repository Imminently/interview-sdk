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
});

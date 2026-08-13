import { describe, expect, test } from "bun:test";
import { screen } from "@testing-library/react";
import { entityControl, numberControl } from "../test-utils/fixtures";
import { renderControl } from "../test-utils/renderControl";

describe("EntityFormControl render", () => {
  test("renders the label and an empty state when there are no instances", () => {
    renderControl(entityControl());
    expect(screen.getByText("Household members")).toBeInTheDocument();
    expect(screen.getByText("No items added yet")).toBeInTheDocument();
  });

  test("shows an add button by default", () => {
    renderControl(entityControl());
    expect(screen.getByLabelText("Add item")).toBeInTheDocument();
  });

  test("hides the add button once max instances are reached", () => {
    renderControl(
      entityControl({
        max: 1,
        instances: [
          { id: "inst-1", controls: [numberControl({ id: "a1", attribute: "household_member/age", value: 30 })] },
        ],
      }),
    );
    expect(screen.queryByLabelText("Add item")).not.toBeInTheDocument();
  });

  test("renders each instance's sub-controls with their values", () => {
    renderControl(
      entityControl({
        instances: [
          {
            id: "inst-1",
            controls: [numberControl({ id: "a1", attribute: "household_member/age", value: 30, label: "Age" })],
          },
          {
            id: "inst-2",
            controls: [numberControl({ id: "a2", attribute: "household_member/age", value: 5, label: "Age" })],
          },
        ],
      }),
    );
    const inputs = document.querySelectorAll("input");
    expect(Array.from(inputs).map((i) => (i as HTMLInputElement).value)).toEqual(["30", "5"]);
  });

  test("hides the delete button once instances are at the min", () => {
    renderControl(
      entityControl({
        min: 1,
        instances: [
          { id: "inst-1", controls: [numberControl({ id: "a1", attribute: "household_member/age", value: 30 })] },
        ],
      }),
    );
    expect(screen.queryByLabelText("Remove item")).not.toBeInTheDocument();
  });

  test("shows the delete button when above the min", () => {
    renderControl(
      entityControl({
        min: 1,
        instances: [
          { id: "inst-1", controls: [numberControl({ id: "a1", attribute: "household_member/age", value: 30 })] },
          { id: "inst-2", controls: [numberControl({ id: "a2", attribute: "household_member/age", value: 5 })] },
        ],
      }),
    );
    expect(screen.getAllByLabelText("Remove item")).toHaveLength(2);
  });

  test("readOnly hides the add button", () => {
    renderControl(
      entityControl({
        readOnly: true,
        instances: [
          { id: "inst-1", controls: [numberControl({ id: "a1", attribute: "household_member/age", value: 30 })] },
        ],
      } as any),
    );
    expect(screen.queryByLabelText("Add item")).not.toBeInTheDocument();
  });

  test("readOnly with no instances renders nothing", () => {
    const { container } = renderControl(entityControl({ readOnly: true } as any));
    expect(container.textContent).toBe("");
  });
});

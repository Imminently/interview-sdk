import { describe, expect, test } from "bun:test";
import { screen } from "@testing-library/react";
import { repeatingContainerControl, switchContainerControl, textControl } from "../test-utils/fixtures";
import { renderContainer } from "../test-utils/renderControl";

describe("RepeatingContainer render", () => {
  test("renders its child controls", () => {
    renderContainer(repeatingContainerControl());
    expect(screen.getByText("Repeat child")).toBeInTheDocument();
  });

  test("renders nothing when there are no controls after filtering", () => {
    const { container } = renderContainer(repeatingContainerControl({ controls: [] }));
    expect(container.textContent).toBe("");
  });

  test("drops a child control with an empty children array", () => {
    const emptyChildrenControl = { ...textControl({ id: "with-children" }), children: [] } as any;
    renderContainer(repeatingContainerControl({ controls: [emptyChildrenControl] }));
    expect(screen.queryByText("Name")).not.toBeInTheDocument();
  });

  test("drops a switch_container child whose active branch has no outcomes", () => {
    const emptySwitch = switchContainerControl({ branch: "true", outcome_true: [] });
    renderContainer(repeatingContainerControl({ controls: [emptySwitch] }));
    expect(screen.queryByText("True child")).not.toBeInTheDocument();
  });

  test("renders a header row only on the first row of a table display with headers shown", () => {
    const control = repeatingContainerControl({
      display: "table",
      isFirst: true,
      showHeaders: true,
      controls: [textControl({ columnHeading: "Name column" } as any)],
    });
    renderContainer(control);
    expect(screen.getByText("Name column")).toBeInTheDocument();
  });

  test("does not render a header row when not the first row", () => {
    const control = repeatingContainerControl({
      display: "table",
      isFirst: false,
      showHeaders: true,
      controls: [textControl({ columnHeading: "Name column" } as any)],
    });
    renderContainer(control);
    expect(screen.queryByText("Name column")).not.toBeInTheDocument();
  });

  test("does not render a header row when showHeaders is false", () => {
    const control = repeatingContainerControl({
      display: "table",
      isFirst: true,
      showHeaders: false,
      controls: [textControl({ columnHeading: "Name column" } as any)],
    });
    renderContainer(control);
    expect(screen.queryByText("Name column")).not.toBeInTheDocument();
  });
});

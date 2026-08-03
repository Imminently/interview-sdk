import { describe, expect, test } from "bun:test";
import { screen } from "@testing-library/react";
import { switchContainerControl } from "../test-utils/fixtures";
import { renderContainer } from "../test-utils/renderControl";

describe("SwitchContainer render", () => {
  test("renders the outcome_true children when branch is true", () => {
    renderContainer(switchContainerControl({ branch: "true" }));
    expect(screen.getByText("True child")).toBeInTheDocument();
    expect(screen.queryByText("False child")).not.toBeInTheDocument();
  });

  test("renders the outcome_false children when branch is false", () => {
    renderContainer(switchContainerControl({ branch: "false" }));
    expect(screen.getByText("False child")).toBeInTheDocument();
    expect(screen.queryByText("True child")).not.toBeInTheDocument();
  });

  test("renders nothing when the active branch has no controls", () => {
    const { container } = renderContainer(switchContainerControl({ branch: "true", outcome_true: [] }));
    expect(container.textContent).toBe("");
  });
});

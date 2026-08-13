import { describe, expect, test } from "bun:test";
import { screen } from "@testing-library/react";
import { certaintyContainerControl } from "../test-utils/fixtures";
import { renderContainer } from "../test-utils/renderControl";

describe("CertaintyContainer render", () => {
  test("renders the certain children when branch is certain", () => {
    renderContainer(certaintyContainerControl({ branch: "certain" }));
    expect(screen.getByText("Certain child")).toBeInTheDocument();
    expect(screen.queryByText("Uncertain child")).not.toBeInTheDocument();
  });

  test("renders the uncertain children when branch is uncertain", () => {
    renderContainer(certaintyContainerControl({ branch: "uncertain" }));
    expect(screen.getByText("Uncertain child")).toBeInTheDocument();
    expect(screen.queryByText("Certain child")).not.toBeInTheDocument();
  });

  test("renders nothing when the active branch has no controls", () => {
    const { container } = renderContainer(certaintyContainerControl({ branch: "certain", certain: [] }));
    expect(container.textContent).toBe("");
  });
});

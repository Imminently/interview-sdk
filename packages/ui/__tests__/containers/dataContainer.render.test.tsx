import { describe, expect, test } from "bun:test";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { createFakeManager } from "../test-utils/fakeManager";
import {
  currencyControl,
  dataContainerControl,
  fileControl,
  numberOfInstancesControl,
  radioControl,
  textControl,
} from "../test-utils/fixtures";
import { renderContainer } from "../test-utils/renderControl";

describe("DataContainer render", () => {
  test("renders the label and title", () => {
    renderContainer(dataContainerControl({ label: "Summary" }));
    expect(screen.getByText("Summary")).toBeInTheDocument();
  });

  test("renders nothing when there is no label and no supported controls", () => {
    const { container } = renderContainer(dataContainerControl({ label: undefined as any, controls: [] }));
    expect(container.textContent).toBe("");
  });

  test("renders a currency value with its symbol", () => {
    renderContainer(dataContainerControl({ controls: [currencyControl({ value: 250, symbol: "$" })] }));
    expect(screen.getByText("$ 250")).toBeInTheDocument();
  });

  test("renders the matching option label for an options control", () => {
    renderContainer(dataContainerControl({ controls: [radioControl({ value: "blue" }) as any] }));
    expect(screen.getByText("Blue")).toBeInTheDocument();
  });

  test("renders the length of a number_of_instances value", () => {
    renderContainer(
      dataContainerControl({ controls: [numberOfInstancesControl({ value: [{ id: "a" }, { id: "b" }] as any })] }),
    );
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("renders a default string value for other control types", () => {
    renderContainer(dataContainerControl({ controls: [textControl({ value: "Alex" })] }));
    expect(screen.getByText("Alex")).toBeInTheDocument();
  });

  test("shows 'no files' text when a file control has no attached files", () => {
    renderContainer(dataContainerControl({ controls: [fileControl({ value: { fileRefs: [] } })] }));
    expect(screen.getByText("No files available")).toBeInTheDocument();
  });

  test("clicking a file download button calls the manager's downloadFile", async () => {
    const ref = "data:id=53eefeab-b0a4-40de-83d5-7eb063c909d2;base64,cmVzdW1lLnBkZg==";
    const manager = createFakeManager();
    renderContainer(dataContainerControl({ controls: [fileControl({ value: { fileRefs: [ref] } })] }), { manager });
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(manager.downloadFile).toHaveBeenCalledWith(ref));
  });
});

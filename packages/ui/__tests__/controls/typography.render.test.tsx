import { describe, expect, test } from "bun:test";
import { screen } from "@testing-library/react";
import { typographyControl } from "../test-utils/fixtures";
import { renderControl } from "../test-utils/renderControl";

describe("Typography render", () => {
  test("renders the text in the tag matching style", () => {
    renderControl(typographyControl({ style: "h2", text: "Some heading" }));
    const heading = screen.getByText("Some heading");
    expect(heading.tagName).toBe("H2");
  });

  test("renders body1 style as a paragraph", () => {
    renderControl(typographyControl({ style: "body1", text: "Some body text" }));
    expect(screen.getByText("Some body text").tagName).toBe("P");
  });

  test("renders the emoji before the text when set", () => {
    renderControl(typographyControl({ emoji: "🎉", text: "Party" }));
    expect(screen.getByText("🎉")).toBeInTheDocument();
    expect(screen.getByText("Party")).toBeInTheDocument();
  });

  test("renders a banner alert for banner styles", () => {
    renderControl(typographyControl({ style: "banner-yellow", text: "Careful" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Careful");
  });

  test("renders a label wrapper when the control has a label", () => {
    renderControl(typographyControl({ label: "Section title" }));
    expect(screen.getByText("Section title")).toBeInTheDocument();
  });

  test("renders no label wrapper when the control has no label", () => {
    renderControl(typographyControl({ label: undefined }));
    expect(document.querySelector("label")).not.toBeInTheDocument();
  });
});

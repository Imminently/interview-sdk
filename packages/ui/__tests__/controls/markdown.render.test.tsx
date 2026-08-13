import { describe, expect, test } from "bun:test";
import { screen } from "@testing-library/react";
import { typographyControl } from "../test-utils/fixtures";
import { renderControl } from "../test-utils/renderControl";

describe("MarkdownControl render", () => {
  test("renders markdown headings as real heading tags", () => {
    renderControl(typographyControl({ customClassName: "md", text: "# Big heading", style: "body1" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Big heading");
  });

  test("renders bold markdown with strong emphasis", () => {
    renderControl(typographyControl({ customClassName: "md", text: "**important**", style: "body1" }));
    const strong = document.querySelector('[data-streamdown="strong"]');
    expect(strong).toHaveTextContent("important");
  });
});

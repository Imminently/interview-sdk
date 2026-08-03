import { describe, expect, test } from "bun:test";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { createFakeManager } from "../test-utils/fakeManager";
import { fileControl } from "../test-utils/fixtures";
import { renderControl } from "../test-utils/renderControl";

const fileRef = (name: string, id = "53eefeab-b0a4-40de-83d5-7eb063c909d2") => `data:id=${id};base64,${btoa(name)}`;

describe("FileFormControl render", () => {
  test("renders the label and an add-file button with no files by default", () => {
    renderControl(fileControl());
    expect(screen.getByText("Resume")).toBeInTheDocument();
    expect(screen.getByLabelText("Add file")).toBeInTheDocument();
  });

  test("lists an existing file by name with delete and download buttons", () => {
    renderControl(fileControl({ value: { fileRefs: [fileRef("resume.pdf")] } }));
    expect(screen.getByText("resume.pdf")).toBeInTheDocument();
    expect(screen.getByLabelText("Delete file")).toBeInTheDocument();
    expect(screen.getByLabelText("Download file")).toBeInTheDocument();
  });

  test("hides the add button once max files are attached", () => {
    renderControl(fileControl({ max: 1, value: { fileRefs: [fileRef("resume.pdf")] } }));
    expect(screen.queryByLabelText("Add file")).not.toBeInTheDocument();
  });

  test("shows a counter once max is greater than 1", () => {
    renderControl(fileControl({ max: 3, value: { fileRefs: [fileRef("resume.pdf")] } }));
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  test("readOnly hides the add and delete buttons", () => {
    renderControl(fileControl({ readOnly: true, value: { fileRefs: [fileRef("resume.pdf")] } }));
    expect(screen.queryByLabelText("Add file")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Delete file")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Download file")).toBeInTheDocument();
  });

  test("readOnly with no files shows the 'no files' message", () => {
    renderControl(fileControl({ readOnly: true }));
    expect(screen.getByText("No files available")).toBeInTheDocument();
  });

  test("clicking download calls the manager's downloadFile with the file ref", async () => {
    const ref = fileRef("resume.pdf");
    const manager = createFakeManager({ screen: { controls: [fileControl({ value: { fileRefs: [ref] } })] } });
    renderControl(fileControl({ value: { fileRefs: [ref] } }), { manager });
    fireEvent.click(screen.getByLabelText("Download file"));
    await waitFor(() => expect(manager.downloadFile).toHaveBeenCalledWith(ref));
  });

  test("shows the validation error message when the session has one for this attribute", () => {
    renderControl(fileControl(), {
      validations: [
        { id: "v1", message: "A resume is required", severity: "error", attributes: ["resume"], shown: true },
      ],
    });
    expect(screen.getByText("A resume is required")).toBeInTheDocument();
  });

  test("does not render a description, even when longDescription is set (control type doesn't support it)", () => {
    renderControl(fileControl({ longDescription: "Extra help text" } as any));
    expect(document.querySelector('[data-slot="form-description"]')).not.toBeInTheDocument();
  });

  describe("aria / WCAG compliance", () => {
    test("associates the label with the form-control wrapper via id", () => {
      renderControl(fileControl());
      const label = document.querySelector("label") as HTMLLabelElement;
      const wrapper = document.querySelector('[data-slot="form-control"]') as HTMLElement;
      expect(label.htmlFor).toBe(wrapper.id);
      expect(wrapper.id).toBeTruthy();
    });

    // Worst case among all controls: aria-invalid/aria-describedby land on a plain wrapping <div>
    // with no role and no tabindex - it is never focusable, so assistive technology has no route
    // to discover the invalid/description state at all (unlike e.g. Number, where it's at least
    // on a div a screen reader could still browse to). The real "Add file"/download/delete
    // buttons inside carry none of these attributes either.
    test("aria-invalid sits on a non-interactive wrapper div, not on any actual button (known gap)", () => {
      renderControl(fileControl({ value: { fileRefs: [fileRef("resume.pdf")] } }), {
        validations: [
          { id: "v1", message: "A resume is required", severity: "error", attributes: ["resume"], shown: true },
        ],
      });
      const wrapper = document.querySelector('[data-slot="form-control"]') as HTMLElement;
      expect(wrapper.getAttribute("aria-invalid")).toBe("true");
      expect(wrapper.getAttribute("role")).toBeNull();
      expect(wrapper.hasAttribute("tabindex")).toBe(false);
      expect(screen.getByLabelText("Delete file").getAttribute("aria-invalid")).toBeNull();
      expect(screen.getByLabelText("Download file").getAttribute("aria-invalid")).toBeNull();
    });

    // WCAG gap: required is visually shown but never exposed to assistive technology.
    test("does not expose required state to assistive technology (known gap)", () => {
      renderControl(fileControl({ required: true }));
      const wrapper = document.querySelector('[data-slot="form-control"]') as HTMLElement;
      expect(wrapper.getAttribute("aria-required")).toBeNull();
    });

    test("aria-describedby dangles when longDescription is set (known WCAG 4.1.1 gap)", () => {
      renderControl(fileControl({ longDescription: "Extra help text" } as any));
      const wrapper = document.querySelector('[data-slot="form-control"]') as HTMLElement;
      const describedBy = wrapper.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      for (const id of (describedBy ?? "").split(" ")) {
        expect(document.getElementById(id)).toBeNull();
      }
    });
  });
});

import { describe, expect, test } from "bun:test";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { textControl } from "../test-utils/fixtures";
import { renderForm } from "../test-utils/renderForm";

// ENG-1101: rule-graph attributes can now be canonical text (`the employee's name`)
// instead of a GUID. react-hook-form's field-name parser deletes `'` `"` `]` and
// splits on `.` `[`, so without the field-name codec the value typed into a control
// keyed by such an attribute is submitted under a mangled key (the apostrophe was
// being stripped from the network payload).

describe("canonical-text attribute names survive submit", () => {
  test("apostrophes, quotes and brackets round-trip to manager.next unchanged", async () => {
    const controls = [
      textControl({ id: "c-apos", attribute: "the employee's name", label: "Employee name" }),
      textControl({ id: "c-quote", attribute: 'the "primary" role', label: "Primary role" }),
      textControl({ id: "c-bracket", attribute: "hours [monday]", label: "Monday hours" }),
    ];
    const { manager, submit } = renderForm(controls);

    fireEvent.change(screen.getByLabelText("Employee name"), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText("Primary role"), { target: { value: "Engineer" } });
    fireEvent.change(screen.getByLabelText("Monday hours"), { target: { value: "8" } });

    submit();

    await waitFor(() => expect(manager.next).toHaveBeenCalledTimes(1));
    // Keys must be the exact canonical attribute text, not RHF's stripped form
    // (`the employees name`) and not the encoded wire-unsafe form (`the employee%27s name`).
    expect(manager.next).toHaveBeenCalledWith({
      "the employee's name": "Ada",
      'the "primary" role': "Engineer",
      "hours [monday]": "8",
    });
  });

  // A literal `.` in a *flat* attribute name is still routed through pathToNested
  // (legacy dot-notation entity paths) and mangled before the codec sees it. That
  // ambiguity predates ENG-1101 and needs graph knowledge to resolve; out of scope
  // here. Dots inside a repeating-entity leaf are handled (FieldControl encodes the
  // segment at construction) and covered by the core codec tests.
});

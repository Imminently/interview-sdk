import { describe, expect, test } from "bun:test";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { entityControl, textControl } from "../test-utils/fixtures";
import { renderForm } from "../test-utils/renderForm";

// ENG-1101: rule-graph attributes can now be canonical text (`the employee's name`)
// instead of a GUID. react-hook-form's field-name parser deletes `'` `"` `]` and
// splits on `.` `[`, so without the field-name codec the value typed into a control
// keyed by such an attribute is submitted under a mangled key (the apostrophe was
// being stripped from the network payload).

describe("canonical-text attribute names survive submit", () => {
  test("apostrophes, quotes, brackets and dots round-trip to manager.next unchanged", async () => {
    const controls = [
      textControl({ id: "c-apos", attribute: "the employee's name", label: "Employee name" }),
      textControl({ id: "c-quote", attribute: 'the "primary" role', label: "Primary role" }),
      textControl({ id: "c-bracket", attribute: "hours [monday]", label: "Monday hours" }),
      // `.` is a literal here, not a path separator: the backend only emits
      // "/"-delimited paths, so attributeToFieldName encodes it per segment.
      textControl({ id: "c-dot", attribute: "the company inc. revenue", label: "Revenue" }),
    ];
    const { manager, submit } = renderForm(controls);

    fireEvent.change(screen.getByLabelText("Employee name"), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText("Primary role"), { target: { value: "Engineer" } });
    fireEvent.change(screen.getByLabelText("Monday hours"), { target: { value: "8" } });
    fireEvent.change(screen.getByLabelText("Revenue"), { target: { value: "1000000" } });

    submit();

    await waitFor(() => expect(manager.next).toHaveBeenCalledTimes(1));
    // Keys must be the exact canonical attribute text, not RHF's stripped form
    // (`the employees name`) and not the encoded wire-unsafe form (`the employee%27s name`).
    expect(manager.next).toHaveBeenCalledWith({
      "the employee's name": "Ada",
      'the "primary" role': "Engineer",
      "hours [monday]": "8",
      "the company inc. revenue": "1000000",
    });
  });
});

// EntityFormControl builds each instance's attribute path as raw, un-encoded
// "/"-segments (entity/@id/attribute - the same shape the backend gives) and lets
// attributeToFieldName do all encoding and @id -> index resolution centrally. These
// cover the entity side of that same canonical-text guarantee.
describe("canonical-text attribute names inside repeating entities survive submit", () => {
  test("a dotted canonical attribute inside a repeating entity round-trips to manager.next", async () => {
    const controls = [
      entityControl({
        id: "members",
        entity: "household_member",
        instances: [
          {
            id: "member-1",
            controls: [textControl({ id: "revenue", attribute: "the company inc. revenue", label: "Revenue" })],
          },
        ],
      }),
    ];
    const { manager, submit } = renderForm(controls);

    fireEvent.change(screen.getByLabelText("Revenue"), { target: { value: "1000000" } });
    submit();

    await waitFor(() => expect(manager.next).toHaveBeenCalledTimes(1));
    // The key must be the exact canonical attribute text, not mangled by RHF and not
    // left percent-encoded - proves the leaf segment was decoded, not just passed
    // through raw from a pre-built/pre-encoded control.attribute.
    expect(manager.next).toHaveBeenCalledWith({
      household_member: [expect.objectContaining({ "the company inc. revenue": "1000000" })],
    });
  });

  test("two instances of a dotted canonical attribute resolve independently by their real @id, not the array index", () => {
    const controls = [
      entityControl({
        id: "members",
        entity: "household_member",
        instances: [
          {
            id: "member-1",
            controls: [textControl({ id: "revenue-1", attribute: "the company inc. revenue", label: "Revenue" })],
          },
          {
            id: "member-2",
            controls: [textControl({ id: "revenue-2", attribute: "the company inc. revenue", label: "Revenue" })],
          },
        ],
      }),
    ];
    const { manager, submit } = renderForm(controls);

    const inputs = screen.getAllByLabelText("Revenue");
    fireEvent.change(inputs[0], { target: { value: "1000000" } });
    fireEvent.change(inputs[1], { target: { value: "2000000" } });
    submit();

    return waitFor(() =>
      expect(manager.next).toHaveBeenCalledWith({
        household_member: [
          expect.objectContaining({ "the company inc. revenue": "1000000" }),
          expect.objectContaining({ "the company inc. revenue": "2000000" }),
        ],
      }),
    );
  });

  test("a dotted canonical attribute inside an entity nested inside another entity resolves at both levels", async () => {
    // Regression coverage for removing attributeToFieldName's "nested && attribute
    // includes '.'" passthrough: an entity-within-entity is exactly the case that
    // relied on it (the inner EntityFormControl re-feeds control.attribute into
    // useAttributeToFieldName), so this proves real resolution now happens instead
    // of the old "looks already resolved" shortcut.
    const controls = [
      entityControl({
        id: "households",
        entity: "household",
        instances: [
          {
            id: "house-1",
            controls: [
              entityControl({
                id: "members",
                entity: "household_member",
                instances: [
                  {
                    id: "member-1",
                    controls: [
                      textControl({ id: "revenue", attribute: "the company inc. revenue", label: "Revenue" }),
                    ],
                  },
                ],
              }),
            ],
          },
        ],
      }),
    ];
    const { manager, submit } = renderForm(controls);

    fireEvent.change(screen.getByLabelText("Revenue"), { target: { value: "1000000" } });
    submit();

    await waitFor(() => expect(manager.next).toHaveBeenCalledTimes(1));
    expect(manager.next).toHaveBeenCalledWith({
      household: [
        expect.objectContaining({
          household_member: [expect.objectContaining({ "the company inc. revenue": "1000000" })],
        }),
      ],
    });
  });
});

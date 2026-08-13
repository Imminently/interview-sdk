import { describe, expect, test } from "bun:test";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import {
  booleanControl,
  currencyControl,
  dateControl,
  numberControl,
  numberOfInstancesControl,
  radioControl,
  selectControl,
  textControl,
  timeControl,
} from "../test-utils/fixtures";
import { renderForm } from "../test-utils/renderForm";

// One control of every type that supports a simple, synchronous "fill" action, all required.
// Combobox/File are excluded: they depend on async manager calls (getConnectedData, uploadFile)
// rather than a plain value change, and Entity/Typography/Markdown aren't single required fields
// in the same sense - each already has its own dedicated coverage in its own *.render.test.tsx.
const buildControls = () => [
  numberControl({ id: "c-number", attribute: "age", required: true }),
  currencyControl({ id: "c-currency", attribute: "salary", required: true }),
  dateControl({ id: "c-date", attribute: "dob", required: true }),
  textControl({ id: "c-text", attribute: "name", required: true }),
  radioControl({ id: "c-radio", attribute: "color", required: true }),
  selectControl({ id: "c-select", attribute: "country", required: true }),
  booleanControl({ id: "c-boolean", attribute: "subscribed", required: true }),
  timeControl({ id: "c-time", attribute: "appointment", required: true }),
  numberOfInstancesControl({ id: "c-noi", attribute: "children_count", required: true }),
];

// Identify which control currently holds focus via the stable data-id FormItem sets, rather than
// React's internal (implementation-detail, useId-generated) element ids.
const focusedControlId = () => document.activeElement?.closest('[data-slot="form-item"]')?.getAttribute("data-id");

const clickNext = () => fireEvent.click(screen.getByText("Next"));

// The calendar always opens on the current month (see date.render.test.tsx), so we pick a fixed
// day-of-month and compute the expected ISO string relative to "now" rather than a hardcoded date.
const fifteenthOfThisMonthIso = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-15`;
};

describe("full form submit/focus flow", () => {
  test("submitting an empty required form shows an error on every field and focuses the first one", async () => {
    const { container, manager } = renderForm(buildControls());

    clickNext();

    await waitFor(() => expect(focusedControlId()).toBe("c-number"));
    expect(manager.next).not.toHaveBeenCalled();

    // every field shows an error message and is marked invalid (on its input, or on the group for radio).
    expect(container.querySelectorAll('[data-slot="form-message"]').length).toBe(9);
    expect(container.querySelectorAll('[aria-invalid="true"]').length).toBe(9);
  });

  test("fixing each field in turn advances focus to the next invalid field, then submits", async () => {
    const { manager } = renderForm(buildControls());

    clickNext();
    await waitFor(() => expect(focusedControlId()).toBe("c-number"));

    fireEvent.change(document.activeElement as HTMLInputElement, { target: { value: "25" } });
    clickNext();
    await waitFor(() => expect(focusedControlId()).toBe("c-currency"));

    fireEvent.change(document.activeElement as HTMLInputElement, { target: { value: "1000" } });
    clickNext();
    await waitFor(() => expect(focusedControlId()).toBe("c-date"));

    fireEvent.click(document.activeElement as HTMLElement);
    const fifteenth = await screen.findByRole("button", { name: /15th/ });
    fireEvent.click(fifteenth);
    clickNext();
    await waitFor(() => expect(focusedControlId()).toBe("c-text"));

    fireEvent.change(document.activeElement as HTMLInputElement, { target: { value: "Alex" } });
    clickNext();
    await waitFor(() => expect(focusedControlId()).toBe("c-radio"));

    fireEvent.click(document.activeElement as HTMLElement);
    clickNext();
    await waitFor(() => expect(focusedControlId()).toBe("c-select"));

    fireEvent.click(document.activeElement as HTMLElement);
    const australia = await screen.findByRole("option", { name: "Australia" });
    fireEvent.click(australia);
    clickNext();
    await waitFor(() => expect(focusedControlId()).toBe("c-boolean"));

    fireEvent.click(document.activeElement as HTMLElement);
    clickNext();
    await waitFor(() => expect(focusedControlId()).toBe("c-time"));

    fireEvent.change(document.activeElement as HTMLInputElement, { target: { value: "14:30" } });
    clickNext();
    await waitFor(() => expect(focusedControlId()).toBe("c-noi"));

    fireEvent.change(document.activeElement as HTMLInputElement, { target: { value: "2" } });
    clickNext();

    await waitFor(() => expect(manager.next).toHaveBeenCalledTimes(1));
    expect(manager.next).toHaveBeenCalledWith({
      age: 25,
      salary: 1000,
      dob: fifteenthOfThisMonthIso(),
      name: "Alex",
      color: "red",
      country: "au",
      subscribed: true,
      appointment: "14:30",
      children_count: 2,
    });
  });
});

import type { Control } from "@imminently/interview-sdk";

/**
 * Remaps child control attributes to include the parent path prefix from a nested container.
 * When a switch/repeating container is rendered inside another container, child attribute paths
 * need to be prefixed with the ancestor path segments so form field names resolve correctly.
 */
export const mapControls = (controls: Control[], attribute?: string): Control[] => {
  if (attribute === undefined) return controls;

  const parentPathParts = attribute.split(attribute.includes("/") ? "/" : ".").slice(0, -1);
  if (!parentPathParts?.length) return controls;

  return controls.map((it) => {
    if (it.attribute === undefined) return it;

    if (it.attribute.startsWith(parentPathParts.join(".")) || it.attribute.includes("/")) {
      return it;
    }

    return {
      ...it,
      attribute: parentPathParts.concat(it.attribute).join(attribute.includes("/") ? "/" : "."),
    };
  });
};

/** Returns true for control types that the DataContainer knows how to render as a label/value pair. */
export const isSupportedControl = (control: Control): boolean =>
  control.type === "boolean" ||
  control.type === "currency" ||
  control.type === "date" ||
  control.type === "time" ||
  control.type === "datetime" ||
  control.type === "options" ||
  control.type === "file" ||
  control.type === "number_of_instances" ||
  control.type === "text" ||
  control.type === "document" ||
  control.type === "image";

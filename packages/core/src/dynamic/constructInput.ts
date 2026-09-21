import get from "lodash/get.js";
import set from "lodash/set.js";
import { produce } from "immer";
import type { AttributeValues } from "../types";
import { resolveEntityIndices } from "../util";

/**
 * Constructs the input object from the preprocessed state for rules engine evaluation.
 * This function reconstructs the entity structure and applies user values and previous values.
 *
 * @param preProcessedState - The preprocessed state containing entity structure and nodes
 * @param data - The session data containing parent information
 * @param userValues - The current user input values
 * @param existingData - Optional existing data to merge into. It should come from the backend and contain information we might need.
 * @returns The constructed input object for rules engine evaluation
 */
export const constructInputFromPreProcessed = (
  preProcessedState: any,
  data: Record<string, any> & { "@parent": string | undefined },
  userValues: AttributeValues,
  existingData?: any,
): any => {
  // IMPORTANT: do NOT mutate existingData or preProcessedState
  const input = produce(existingData ?? preProcessedState?.entityStructure ?? {}, (draft: any) => {
    // resolveEntityIndices turns an `entity/@id/attr` key into positional segments
    // (`["entity", "0", "attr"]`) for lodash. A "." in a leaf name stays intact:
    // it never splits on "." and a canonical name can never contain a "/".
    if (preProcessedState?.nodes) {
      for (const [key, value] of Object.entries(preProcessedState.nodes)) {
        const prev = (value as any)?.previousValue;
        if (prev !== undefined) {
          set(draft, resolveEntityIndices(key, draft), prev);
        }
      }
    }

    const parent = data["@parent"];
    if (parent) {
      const nestedPath = resolveEntityIndices(parent, draft);
      const existing = get(draft, nestedPath);

      set(draft, nestedPath, {
        ...existing,
        ...userValues,
      });
    } else {
      for (const [key, value] of Object.entries(userValues)) {
        if (key.includes("/")) {
          set(draft, resolveEntityIndices(key, draft), value);
        } else {
          (draft as any)[key] = value;
        }
      }
    }
  });

  return input;
};

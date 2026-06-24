import get from "lodash/get.js";
import set from "lodash/set.js";
import { produce } from "immer";
import type { AttributeValues } from "../types";
import { pathToNested } from "../util";

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
    if (preProcessedState?.nodes) {
      for (const [key, value] of Object.entries(preProcessedState.nodes)) {
        const prev = (value as any)?.previousValue;
        if (prev !== undefined) {
          const nestedPath = pathToNested(key, draft, true).split(".");
          set(draft, nestedPath, prev);
        }
      }
    }

    const parent = data["@parent"];
    if (parent) {
      const nestedPath = pathToNested(parent, draft, true);
      const existing = get(draft, nestedPath.split("."));

      set(draft, nestedPath, {
        ...existing,
        ...userValues,
      });
    } else {
      for (const [key, value] of Object.entries(userValues)) {
        if (key.includes("/")) {
          const nestedPath = pathToNested(key, draft, true);
          set(draft, nestedPath.split("."), value);
        } else {
          (draft as any)[key] = value;
        }
      }
    }
  });

  return input;
};

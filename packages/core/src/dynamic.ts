import { SIDEBAR_DYNAMIC_DATA_INFO } from "./sidebars";
import type { AttributeValues, Session, Simulate, State } from "./types";
import { createEntityPathedData, getEntityIds } from "./util";


export interface SidebarSimulate {
  ids: string[];
  simulate: Simulate;
}

/**
 * Returns true if the current session state requires a simulation call, i.e. there is at least
 * one goal whose value is unknown but has user-supplied dependencies that could affect its outcome.
 * Stops as soon as the first such goal is found.
 */
export const requiresSimulation = (session: Session, attribValues: AttributeValues): boolean => {
  const state = session.state;
  const parent = session.data["@parent"];
  const sidebars = session.screen.sidebars;

  const knownValues = createEntityPathedData(attribValues);
  const allData = createEntityPathedData(attribValues);

  const resolvedState: State[] = [];

  if (state) {
    for (const stateObj of state) {
      if (allData[stateObj.id] === undefined && stateObj.value) {
        allData[stateObj.id] = stateObj.value;
      }
      // @ts-ignore
      if (stateObj.instanceTemplate) {
        // @ts-ignore
        const ids = getEntityIds(stateObj.instanceTemplate, allData);
        for (const id of ids) {
          resolvedState.push({
            ...stateObj,
            id: stateObj.id.replace("@id", id),
            dependencies: stateObj.dependencies?.map((dep) => {
              const result = dep.replace("@id", id);
              if (parent) {
                return result.replace(`${parent}/`, "");
              }
              return result;
            }),
          });
        }
      } else {
        resolvedState.push(stateObj);
      }
    }
  }

  const knownKeys = Object.keys(knownValues);

  for (const stateObj of resolvedState) {
    const { id: goal, dependencies } = stateObj;
    if (!goal || !dependencies || dependencies.length === 0) continue;
    // goal value is already directly known — no simulation needed for this one
    if (knownValues[goal] !== undefined) continue;

    for (const dep of dependencies) {
      const resolvedDep = parent ? dep.replace(`${parent}/`, "") : dep;

      if (allData[resolvedDep] !== undefined) {
        if (knownValues[resolvedDep] !== undefined) return true;
        continue;
      }

      for (const key of knownKeys) {
        if (key.endsWith(resolvedDep)) {
          if (knownValues[key] !== undefined) return true;
          break;
        }
      }
    }
  }

  // check whether any sidebar has dynamic attributes driven by user input
  if (sidebars) {
    for (const sidebar of sidebars) {
      if (sidebar.id) {
        const hasData = sidebar.dynamicAttributes?.some((attr) => knownValues[attr] !== undefined);
        if (hasData && SIDEBAR_DYNAMIC_DATA_INFO[sidebar.type]) return true;
      }
    }
  }

  return false;
};

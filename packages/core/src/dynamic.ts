import { ApiManager } from "./api-manager";
import { SIDEBAR_DYNAMIC_DATA_INFO } from "./sidebars";
import type { AttributeValues, Session, Simulate, State } from "./types";
import { createEntityPathedData, getEntityIds } from "./util";

export type UnknownValues = Record<string, Partial<Simulate>>;

export interface SidebarSimulate {
  ids: string[];
  simulate: Simulate;
}

export interface DynamicReplacementQueries {
  knownValues: AttributeValues;
  unknownValues: UnknownValues;
  sidebarSimulate: SidebarSimulate | undefined;
}

/**
 * Builds a list of known values, and a list of requests to be made against the API for unknown values
 * @param state Is the interview state for the current step
 * @param attribValues Is the data entered by the user (and any static attribute values)
 * @returns A list of known values, plus preformed requests to be made against the API for the unknown values
 */
export const buildDynamicReplacementQueries = (
  session: Session,
  attribValues: AttributeValues,
): DynamicReplacementQueries => {
  const state = session.state;
  const parent = session.data["@parent"];
  const sidebars = session.screen.sidebars;

  const knownValues = createEntityPathedData(attribValues);
  const allData = createEntityPathedData(attribValues);

  const unknownsWithSatisfiedDependencies: Partial<Simulate>[] = [];

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

  const unknownWithMissingDependencies: Array<{
    goal: string;
    data: any;
    unknownDependencies: string[];
  }> = [];

  for (const stateObj of resolvedState) {
    const { id: goal, dependencies } = stateObj;
    if (goal) {
      if (dependencies && dependencies.length > 0) {
        const data: any = {
          "@parent": parent,
        };
        let userInputInvolved = false;
        const unknownDependencies = dependencies.reduce((unknownDependencies, dep) => {
          const resolvedDep = parent ? dep.replace(`${parent}/`, "") : dep;
          const value = allData[resolvedDep];
          if (value !== undefined) {
            if (knownValues[resolvedDep] !== undefined) {
              userInputInvolved = true;
            }

            data[resolvedDep] = value;
            return unknownDependencies;
          }

          let hasAnyMatch = false;
          // in the case of entity controls the dep will be the global as we have no instances yet, therefore also check for a global match
          for (const key of knownKeys) {
            const match = key.endsWith(resolvedDep);
            if (match) {
              hasAnyMatch = true;
              const parts = key.split("/");
              parts.pop();
              const searchingParts: string[] = [];

              while (parts.length > 0) {
                const part = parts.shift() as string;
                searchingParts.push(part);
                const entityReference = searchingParts.join("/");
                if (allData[entityReference] !== undefined) {
                  data[entityReference] = structuredClone(allData[entityReference]);
                  break;
                }
              }

              if (knownValues[key] !== undefined) {
                userInputInvolved = true;
              }

              break;
            }
          }

          if (!hasAnyMatch) {
            unknownDependencies.push(resolvedDep);
          }
          return unknownDependencies;
        }, [] as string[]);

        // only resimulate if the user has entered a value that effects the outcome & we know all the dependencies
        if (userInputInvolved) {
          if (unknownDependencies.length === 0) {
            unknownsWithSatisfiedDependencies.push({
              goal,
              data,
            });
          } else {
            // the goal has missing dependencies, but the missing dependencies may be other unknowns
            unknownWithMissingDependencies.push({
              goal,
              data,
              unknownDependencies,
            });
          }
        }
      }
    }
  }
  // The previous implementation (below) is actually wrong - it could be that we have missing dependencies, but when we check with the backend the goal might be satisifed (it could be that the backend uses an OR or other complex rule base).
  // So we actually just send anything that has atleast one data point to the backend to check
  for (const unknownWithMissingDependency of unknownWithMissingDependencies) {
    const { goal, data, unknownDependencies } = unknownWithMissingDependency;
    const hasData = Object.keys(data).some((d) => {
      if (typeof data[d] !== "undefined") return true;
      else return false;
    });
    if (hasData) {
      unknownsWithSatisfiedDependencies.push({
        goal,
        data,
      });
    }
  }

  // remove requests where the goal already has a value, or was entered directly by the user
  const unknownValues: UnknownValues = {};
  for (const unknownValue of unknownsWithSatisfiedDependencies) {
    if (unknownValue.goal) {
      if (knownValues[unknownValue.goal] === undefined) {
        unknownValues[unknownValue.goal] = unknownValue;
      }
    }
  }

  /**
  // ok now we have a list of unknowns with missing dependencies, we need to check if any of the missing dependencies are also states and if they ARE known, then we can add the goal to the unKnownValues
  for (const unknownWithMissingDependency of unknownWithMissingDependencies) {
    const { goal, data, unknownDependencies } = unknownWithMissingDependency;
    const allActuallySatisfied = unknownDependencies.every((dep) => {
      const actuallySatisfied = unknownsWithSatisfiedDependencies.find((it) => it.goal === dep);
      if (actuallySatisfied) {
        Object.assign(data, actuallySatisfied?.data);
      }
      return actuallySatisfied;
    });
    if (allActuallySatisfied) {
      unknownsWithSatisfiedDependencies.push({
        goal,
        data,
      });
    }
  }

  // remove requests where the goal already has a value, or was entered directly by the user
  const unknownValues: UnknownValues = {};
  for (const unknownValue of unknownsWithSatisfiedDependencies) {
    if (unknownValue.goal) {
      if (attribValues[unknownValue.goal] === undefined) {
        unknownValues[unknownValue.goal] = unknownValue;
      }
    }
  }*/

  let sidebarSimulate: SidebarSimulate | undefined;
  if (sidebars) {
    for (const sidebar of sidebars) {
      if (sidebar.id) {
        const hasData = sidebar.dynamicAttributes?.some((attr) => knownValues[attr] !== undefined);
        if (hasData) {
          const dataInfo = SIDEBAR_DYNAMIC_DATA_INFO[sidebar.type];
          if (dataInfo) {
            const response = dataInfo.getResponse(sidebar.config);
            if (!sidebarSimulate) {
              sidebarSimulate = {
                ids: [],
                simulate: {
                  mode: "api",
                  save: false,
                  data: attribValues,
                  response: [],
                },
              };
            }
            sidebarSimulate.ids.push(sidebar.id);
            sidebarSimulate.simulate.response?.push(...response);
          }
        }
      }
    }
  }

  return {
    knownValues: knownValues, // the known values
    unknownValues: unknownValues, // the requests to be made against the API
    sidebarSimulate: sidebarSimulate,
  };
};

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
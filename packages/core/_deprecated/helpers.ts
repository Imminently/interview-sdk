import type { AttributeId, AttributeValues, Session, State, Step } from "./types";
import { formatValue } from "./formatting";

// -- step helpers

export const containsCurrentStep = (s: Step): boolean => {
  return Boolean(s.current || s.steps?.some((s) => containsCurrentStep(s)));
};

export const getCurrentStep = (s: Step): typeof s | null => {
  if (s.current) return s;
  if (s.steps === undefined || s.steps.length === 0) return null;

  return s.steps.reduce<typeof s | null>((a, s) => (a === null ? getCurrentStep(s) : a), null);
};

// -- text replacement helpers

export const replaceTemplatedText = (
  text: string,
  replacements: AttributeValues | Record<string, string>,
  data: Session["data"],
  state?: State[],
  locale?: Session["locale"],
) => {
  return text.replace(/{{(.*?)}}/g, (match: string) => {
    const [attribute, ...formatters] = match
      .replace(/{{(.*?)}}/, "$1")
      .split("|")
      .map((s) => s.trim());
    const parentScopedAttribute = data?.["@parent"] ? attribute.replace(`${data["@parent"]}/`, "") : attribute;
    const value = replacements[parentScopedAttribute] || replacements[attribute];
    const type = state?.find((state) => state.id === parentScopedAttribute || state.id === attribute)?.type;

    return formatValue(value, { formatters, type, locale }) ?? "...";
  });
};

// -- attribute helpers

/**
 * Strips out any common attributes between two AttributeValues objects, reporting only the latest changes
 * @param prev The previous state of the attributes
 * @param next The current state of the attributes
 */
export const cmpAttributeData = (prev: AttributeValues, next: AttributeValues): AttributeValues => {
  const ret: AttributeValues = {};

  for (const key of Object.keys(next)) {
    if (next[key] !== prev[key]) {
      ret[key] = next[key];
    }
  }

  // unlikely - but test the other way around, in case a value has been removed
  for (const key of Object.keys(prev)) {
    if (next[key] === undefined) {
      ret[key] = -1; // we don't really care about the value, just that there's been a change
    }
  }

  return ret;
};

/**
 * Checks if an attribId is within the goal or dependency list of a state object.
 * NOTE: goals with zero dependencies will have themselves in the dependency list,
 *       but we check both anyway
 * @returns `true` if any of the supplied attribIds are dynamic, `false` otherwise
 */
export const isAttributeDynamic = (attribId: AttributeId[], state?: State[]): boolean => {
  // flatten state object
  const stateFlat = (state ?? []).reduce((acc, cur) => {
    if (!acc.includes(cur.id)) {
      acc.push(cur.id);
    }
    for (const dep of cur.dependencies ?? []) {
      if (!acc.includes(dep)) {
        acc.push(dep);
      }
    }
    return acc;
  }, [] as AttributeId[]);

  return attribId.some((attrib) => stateFlat.includes(attrib));
};

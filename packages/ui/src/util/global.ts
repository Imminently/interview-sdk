import { type Control, DATE_FORMAT, type EntityControl, formatDate } from "@imminently/interview-sdk";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * @deprecated appears to be unused
 */
export const VALUE_ROWS_CONST = "valueRows";

/**
 * @deprecated appears to be unused
 */
export interface IEntityData {
  rowIds: string[];
  [VALUE_ROWS_CONST]: NonNullable<EntityControl["value"]>;
}

export const MAX_INLINE_LABEL_LENGTH = 64;

/**
 * @deprecated appears to be unused
 * 
 * Was used for fieldset labels, but those have been removed
 */
export const isLabelTooLong = (label: string | undefined): label is string => {
  if (typeof label === "string") {
    if (label.length > MAX_INLINE_LABEL_LENGTH) {
      return true;
    }
  }
  return false;
};

export const deriveDateFromTimeComponent = (t: string): Date => new Date(`1970-01-01T${t}`);

export const resolveNowInDate = (d?: string): string | undefined =>
  d === "now" ? formatDate(new Date(), DATE_FORMAT) : d;

export const requiredErrStr = "Please fill out this field";

/**
 * @deprecated appears to be unused
 */
export const deriveEntityChildId = (entity: string, indx: number, childIndx: number): string =>
  `${entity}.${VALUE_ROWS_CONST}.${indx}.${childIndx}`;

/**
 * @deprecated appears to be unused
 */
export const getEntityValueIndx = (path: string): number => {
  const match = path.match(/\[\d+\]$/);
  if (!match) return -1;
  const [maybeBracketedIndx] = match;

  return Number(maybeBracketedIndx?.slice(1, -1));
};

/**
 * @deprecated appears to be unused
 */
export function normalizeControlValue(c: Control, v: any): typeof v {
  if (c.type === "text") {
    const typedV = v as null | string | undefined;

    return typedV === null || typedV === undefined
      ? null
      : c.variation !== undefined && c.variation.type === "number"
        ? Number(typedV)
        : typedV;
  }

  if (c.type === "boolean") {
    return c.required ? Boolean(v) : typeof v === "boolean" ? v : null;
  }

  return v === undefined ? null : v;
}

// TODO maybe merge this with theme so its auto injected
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

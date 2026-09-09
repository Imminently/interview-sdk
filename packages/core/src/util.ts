import { UTCDate } from "@date-fns/utc";
import axios, { type AxiosRequestConfig, type AxiosRequestTransformer } from "axios";
import { format } from "date-fns";
import { v4 as baseUuid } from "uuid";
import { produce } from "immer";
import { replaceTemplatedText } from "./helpers";
import type {
  AttributeValues,
  AuthConfigGetter,
  Control,
  EntityControlInstance,
  RenderableCertaintyContainerControl,
  RenderableEntityControl,
  RenderableSwitchContainerControl,
  ResponseData,
  Session,
  State,
} from "./types";

export const uuid = baseUuid;

export const buildUrl = (...args: (string | undefined)[]) => {
  return [...args.filter((a) => !!a)].join("/");
};

export const range = (size: number, startAt = 0) => {
  return [...Array(size).keys()].map((i) => i + startAt);
};

export const isStrNotNullOrBlank = (str: any): boolean => !/^\s*$/.test(str || "");
export const isStrNullOrBlank = (str: any): boolean => !isStrNotNullOrBlank(str);

export const createApiInstance = (baseURL: string, auth?: AuthConfigGetter, overrides: AxiosRequestConfig = {}) => {
  const { transformRequest = [], ...rest } = overrides;
  return axios.create({
    baseURL,
    timeout: 30000,
    headers: { "Content-Type": "application/json" },
    transformRequest: [
      (data, headers) => {
        // default auth transformer
        if (headers && auth) {
          const { token, tenancy } = auth();
          headers.Authorization = token;
          headers["X-TENANCY"] = tenancy ?? undefined;
        }
        return JSON.stringify(data);
      },
      ...(transformRequest as AxiosRequestTransformer[]),
      ...(axios.defaults.transformRequest as AxiosRequestTransformer[]),
    ],
    ...rest,
  });
};

export const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

/**
 * An immer produce function that iterates over data and converts the following:
 * - "" (empty strings) to null
 * - "null" (string) to null
 * - "true"/"false" (string) to boolean
 *
 * It should iterate sub arrays and objects using a frontier approach
 */
export const normalizeInputData = (data: Record<string, any>): Record<string, any> => {
  return produce(data, (draft) => {
    const frontier: any[] = [draft];
    // console.log("Normalizing data:", draft, frontier);
    while (frontier.length > 0) {
      const current = frontier.pop();
      if (typeof current === "object" && current !== null) {
        for (const key of Object.keys(current)) {
          const value = current[key];
          if (value === "") {
            current[key] = null;
          } else if (value === "null") {
            current[key] = null;
          } else if (value === "true") {
            current[key] = true;
          } else if (value === "false") {
            current[key] = false;
          } else if (typeof value === "object" && value !== null) {
            if(Array.isArray(value)) {
              frontier.push(...value);
            } else {
              frontier.push(value);
            }
          }
        }
      }
    }
  });
};

export const transformResponse = (session: Session, data: AttributeValues): ResponseData => {
  return produce(normalizeInputData(data), (draft) => {
    if (session.data["@parent"]) {
      draft["@parent"] = session.data["@parent"];
    }

    // TODO legacy, we should check this works if its within containers
    for (const control of session.screen.controls) {
      if (control.type === "number_of_instances") {
        const value = draft[control.entity];
        draft[control.entity] = range(Number(value)).map(() => ({
          "@id": uuid(),
        }));
      }
    }
  });
};

// transform an object into a flat object with . delimited keys
export const flattenObject = (obj: any, delimiter = ".", parentKey = "", result: any = {}) => {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      flattenObject(obj[i], delimiter, parentKey ? `${parentKey}${delimiter}${i}` : `${i}`, result);
    }
  } else {
    if (typeof obj !== "object" || obj === null) {
      result[parentKey] = obj;
      return result;
    }

    for (const [key, value] of Object.entries(obj)) {
      flattenObject(value, delimiter, parentKey ? `${parentKey}${delimiter}${key}` : key, result);
    }
  }

  return result;
};

export const getEntityIds = (entity: string, values: AttributeValues): string[] => {
  const regex = new RegExp(`${entity}\\.(.*)\\.@id`);
  return Object.entries(flattenObject(values)).reduce((ids, [key, value]) => {
    if (typeof value === "string" && regex.test(key)) {
      ids.push(value);
    }
    return ids;
  }, [] as string[]);
};

export const iterateControls = (
  controls: Control[],
  func: (control: Control) => void,
  /** if true, will only interate valid / on screen controls */
  filtered?: boolean,
  template?: boolean,
) => {
  for (const control of controls) {
    func(control);
    if (control.type === "repeating_container") {
      const ctrl = control;
      if (ctrl.controls) {
        iterateControls(ctrl.controls, func, filtered, template);
      }
    } else if (control.type === "switch_container") {
      const ctrl = control as RenderableSwitchContainerControl;
      const outcome = ctrl.branch === "true";
      if (filtered) {
        const ctrls = outcome ? ctrl.outcome_true : ctrl.outcome_false;
        iterateControls(ctrls ?? [], func, filtered, template);
        continue;
      }
      if (ctrl.outcome_false) {
        iterateControls(ctrl.outcome_false, func, filtered, template);
      }
      if (ctrl.outcome_true) {
        iterateControls(ctrl.outcome_true, func, filtered, template);
      }
    } else if (control.type === "certainty_container") {
      const ctrl = control as RenderableCertaintyContainerControl;
      const outcome = ctrl.branch === "certain";
      if (filtered) {
        const ctrls = outcome ? ctrl.certain : ctrl.uncertain;
        iterateControls(ctrls ?? [], func, filtered, template);
        continue;
      }
      if (ctrl.certain) {
        iterateControls(ctrl.certain, func, filtered, template);
      }
      if (ctrl.uncertain) {
        iterateControls(ctrl.uncertain, func, filtered, template);
      }
    } else if (control.type === "entity") {
      const ctrl = control as RenderableEntityControl;
      // @ts-ignore
      if (ctrl.instances && !template) {
        // @ts-ignore
        for (const instance of ctrl.instances) {
          iterateControls(instance.controls, func, filtered, template);
        }
      } else if (ctrl.template) {
        iterateControls(ctrl.template, func, filtered, template);
      }
    } else if (control.type === "data_container") {
      const ctrl = control;
      if (ctrl.controls) {
        iterateControls(ctrl.controls, func, filtered, template);
      }
    }
  }
};

export const normalizeMinutesIncrement = (value: unknown): number | undefined => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  if (typeof value !== "string" && typeof value !== "number") return undefined;

  const increment = Number(value);
  return Number.isFinite(increment) && increment > 0 ? increment : undefined;
};

export const normalizeSessionControls = (session: Session): Session => {
  if (!session?.screen || !Array.isArray(session.screen.controls)) return session;

  // Return a plain, mutable clone rather than an immer `produce` result: the
  // SessionManager mutates the session in place (client graph cache, client-side
  // dynamic results, bookmark restore), and immer deep-freezes what it returns,
  // which would make every one of those writes throw.
  const normalized = structuredClone(session);
  iterateControls(normalized.screen.controls as Control[], (control) => {
    if (control.type === "time" || control.type === "datetime") {
      control.minutes_increment = normalizeMinutesIncrement(control.minutes_increment);
    }
  });
  return normalized;
};

export const instanceControl = (control: RenderableEntityControl, id: string): EntityControlInstance => {
  const controls =
    control.instances?.find((instance) => instance.id === id)?.controls ?? structuredClone(control.template);
  iterateControls(controls, (instanceControl: any) => {
    instanceControl.id = uuid();
    if (typeof instanceControl.templateText === "string") {
      instanceControl.templateText = instanceControl.templateText.replace(/@id/g, id);
    }
    if (typeof instanceControl.attribute === "string") {
      instanceControl.attribute = instanceControl.attribute.replace(/@id/g, id);
    }
    if (Array.isArray(instanceControl.dynamicAttributes)) {
      instanceControl.dynamicAttributes = instanceControl.dynamicAttributes.map((attr: string) =>
        attr.replace(/@id/g, id),
      );
    }
    if (instanceControl.type === "entity") {
      const keys: string[] = [];
      if (typeof instanceControl.min === "number") {
        for (let i = 0; i < instanceControl.min; i++) {
          keys.push(uuid());
        }
      }
      instanceControl.instances = keys.map((key) => instanceControl(instanceControl, key));
    }
  });

  return {
    id: id,
    controls: controls,
  } satisfies EntityControlInstance;
};

export const applyInstancesToEntityControl = (control: RenderableEntityControl, instances: string[]) => {
  if (typeof control.min === "number") {
    while (instances.length < control.min) {
      instances.push(uuid());
    }
  }
  // @ts-ignore
  control.instances = instances.map((id) => {
    return instanceControl(control, id);
  });
};

export const formatDate = (argument: string | Date | number, dateFormat: string, options?: any): string => {
  return format(argument, dateFormat, options);
};

export const createEntityPathedData = (data: AttributeValues): AttributeValues => {
  const result: any = {};
  const entityArrays: Array<{
    key: string;
    value: any[];
  }> = [];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      entityArrays.push({ key, value });
    } else {
      result[key] = value;
    }
  }

  const flattenEntities = (entities: any[], parent: string[]) => {
    result[parent.join("/")] = entities;
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      if (entity === undefined || entity === null) continue;
      const id = entity["@id"] || i + 1;
      const entityPath = [...parent, id];
      for (const [key, value] of Object.entries(entity)) {
        if (value === undefined || value === null) {
          continue;
        }

        if (Array.isArray(value)) {
          flattenEntities(value, [...entityPath, key]);
        } else {
          result[entityPath.concat(key).join("/")] = value;
        }
      }
    }
  };

  for (const { key, value } of entityArrays) {
    flattenEntities(value, [key]);
  }

  return result;
};

/**
 * react-hook-form parses a field name into a path: it splits on `.` and `[`, and
 * deletes `"` `'` `]` (see its `stringToPath`). Any name that isn't `/^\w*$/` goes
 * through that parser, so a canonical-text attribute such as `the employee's name`
 * is silently stored (and later submitted) as `the employees name`.
 *
 * `normaliseText` (the canonical-text producer) can emit those five characters,
 * plus `%`. `encodeFieldSegment` percent-escapes exactly those six and leaves
 * everything else (spaces, `-`, `\`, parens, unicode, `/`) alone, so the encoded
 * name stays readable in devtools and on the wire while surviving RHF intact.
 *
 * `%` must be escaped first/too: otherwise literal `%22` in an attribute name
 * would decode back to `"`.
 */
const FIELD_ENCODE_RE = /[%"'.[\]]/g;
const FIELD_DECODE_RE = /%([0-9A-Fa-f]{2})/g;
const RHF_RESERVED_SEGMENTS = new Set(["__proto__", "constructor", "prototype"]);

/** Encode one path segment (an entity or attribute name) for react-hook-form storage. */
export const encodeFieldSegment = (segment: string): string => {
  let out = segment.replace(FIELD_ENCODE_RE, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);
  // RHF's set() silently no-ops when a whole segment equals one of these.
  if (RHF_RESERVED_SEGMENTS.has(out)) {
    out = `%${out.charCodeAt(0).toString(16).toUpperCase()}${out.slice(1)}`;
  }
  return out;
};

/** Inverse of {@link encodeFieldSegment}. */
export const decodeFieldSegment = (segment: string): string =>
  segment.replace(FIELD_DECODE_RE, (_m, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));

/**
 * Encode a whole field path, per segment, preserving the `/` (entity path) and
 * `.` (nesting) separators the SDK puts between segments. Numeric index segments
 * pass through unchanged.
 */
export const encodeFieldPath = (path: string): string =>
  path
    .split("/")
    .map((chunk) => chunk.split(".").map(encodeFieldSegment).join("."))
    .join("/");

/** Inverse of {@link encodeFieldPath}. */
export const decodeFieldPath = (path: string): string =>
  path
    .split("/")
    .map((chunk) => chunk.split(".").map(decodeFieldSegment).join("."))
    .join("/");

/**
 * Recursively decode every key of a react-hook-form values object back to its
 * original canonical attribute name. Values are never touched. Use this at every
 * boundary where form data crosses back into the session manager (submit / save /
 * on-screen-change) so the network payload carries the real attribute names.
 */
export const decodeFormData = <T>(data: T): T => {
  if (Array.isArray(data)) {
    return data.map((item) => decodeFormData(item)) as unknown as T;
  }
  if (data && typeof data === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      out[decodeFieldPath(key)] = decodeFormData(value);
    }
    return out as T;
  }
  return data;
};

export const attributeToPath = <S extends string | undefined>(
  attribute: S,
  data: Session["data"],
  values: AttributeValues,
  nested: boolean,
): S => {
  if (!attribute) {
    return attribute;
  }

  // Already a resolved, encoded nested path (e.g. re-fed by EntityFormControl's
  // FieldControl). Passthrough keeps this idempotent.
  if (nested && attribute.includes(".")) {
    return attribute as S;
  }

  const parent = data["@parent"];
  const basePath = parent && attribute.startsWith(`${parent}/`) ? attribute.replace(`${parent}/`, "") : attribute;
  if (!nested && !basePath.includes(".")) {
    return encodeFieldPath(basePath) as S;
  }

  // pathToNested stays raw (the rules-engine input builder depends on that), so
  // feed it decoded values and encode its result here.
  return encodeFieldPath(pathToNested(basePath, decodeFormData(values), nested)) as S;
};

export const pathToNested = (basePath: string, values: AttributeValues, nested: boolean): string => {
  const wasNested = basePath.includes(".");
  const parts = basePath.split(/[./]/);

  const flatValues = createEntityPathedData(values);
  const flatResult: string[] = [];
  const result: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    // entity names
    if (i % 2 === 0) {
      result.push(part);
      flatResult.push(part);
    } else {
      let id: string | number = part;

      if (!Number.isNaN(id)) {
        id = Number.parseInt(id) - 1;
      }

      // this is an entity ID
      let entities: any = flatValues[flatResult.join("/")];

      if (Array.isArray(entities)) {
        // ensure we only have valid entities
        entities = entities.filter((e) => e && typeof e === "object" && "@id" in e);
        if (wasNested) {
          const index = Number.parseInt(part, 10) - 1;
          flatResult.push(entities[index]["@id"]);

          if (!nested) {
            id = entities[index]["@id"];
            if (!Number.isNaN(id)) {
              // @ts-ignore
              id = Number.parseInt(id) - 1;
            }
            result.push(id.toString());
            continue;
          } else {
            result.push(index.toString());
            continue;
          }
        }

        const index = entities.findIndex((entity: any) => entity["@id"] === part);

        if (index >= 0) {
          result.push(index.toString());
          flatResult.push(part);
        } else {
          result.push(id.toString());
          flatResult.push(part);
        }
      } else {
        result.push(id.toString());
        flatResult.push(part);
      }
    }
  }

  return result.join(nested ? "." : "/");
};

export const parseBoolean = (value: any): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return false;
}

export const postProcessControl = (
  control: any,
  replacements: any,
  data: Session["data"],
  state: State[] | undefined,
  locale: Session["locale"],
) => {
  if (control.templateText) {
    control.text = replaceTemplatedText(control.templateText, replacements, data, state, locale);
  }
  if (control.templateLabel) {
    control.label = replaceTemplatedText(control.templateLabel, replacements, data, state, locale);
  }
  if (control.type === "switch_container" && control.kind === "dynamic" && control.attribute) {
    const update = replacements[control.attribute];
    // if (update !== undefined) {
    control.branch = parseBoolean(update) ? "true" : "false";
    // }
  }
  // certainty containers don't have a 'kind' value for some reason
  if (control.type === "certainty_container" && control.attribute) {
    const update = replacements[control.attribute];
    const certain = update !== null && update !== undefined;
    control.branch = certain ? "certain" : "uncertain";
    // if (update !== undefined) {
    // control.branch = replacements[control.attribute] === null ? "uncertain" : "certain";
    // }
  }
};

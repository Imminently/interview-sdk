import { format, parseISO } from "date-fns";
import { v4 as baseUuid } from "uuid";
import type { AttributeValues, AuthConfigGetter, Control, EntityControlInstance, RenderableEntityControl, ResponseData, Session, State } from "./types";
import axios, { type AxiosRequestConfig, type AxiosRequestTransformer } from "axios";
import { replaceTemplatedText } from "./helpers";

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
          const { token, tenancy } = typeof auth === "function" ? auth() : auth;
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

export const transformResponse = (session: Session, data: ResponseData): ResponseData => {
  const newData = deepClone(data);
  if (session.data["@parent"]) {
    newData["@parent"] = session.data["@parent"];
  }

  for (const control of session.screen.controls) {
    if (control.type === "number_of_instances") {
      const value = newData[control.entity];
      newData[control.entity] = range(Number(value)).map((i) => ({ "@id": uuid() }));
    }
  }
  return newData;
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

export const iterateControls = (controls: Control[], func: (control: Control) => void, template?: boolean) => {
  for (const control of controls) {
    func(control);
    if (control.type === "repeating_container") {
      const ctrl = control;

      if (ctrl.controls) {
        iterateControls(ctrl.controls, func, template);
      }
    } else if (control.type === "switch_container") {
      const ctrl = control;
      if (ctrl.outcome_false) {
        iterateControls(ctrl.outcome_false, func, template);
      }
      if (ctrl.outcome_true) {
        iterateControls(ctrl.outcome_true, func, template);
      }
    } else if (control.type === "certainty_container") {
      const ctrl = control;
      if (ctrl.certain) {
        iterateControls(ctrl.certain, func, template);
      }
      if (ctrl.uncertain) {
        iterateControls(ctrl.uncertain, func, template);
      }
    } else if (control.type === "entity") {
      const ctrl = control as RenderableEntityControl;
      // @ts-ignore
      if (ctrl.instances && !template) {
        // @ts-ignore
        for (const instance of ctrl.instances) {
          iterateControls(instance.controls, func, template);
        }
      } else if (ctrl.template) {
        iterateControls(ctrl.template, func, template);
      }
    } else if (control.type === "data_container") {
      const ctrl = control;
      if (ctrl.controls) {
        iterateControls(ctrl.controls, func, template);
      }
    }
  }
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
  return format(typeof argument === "string" ? parseISO(argument) : argument, dateFormat, options);
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

export const attributeToPath = <S extends string | undefined>(
  attribute: S,
  data: Session["data"],
  values: AttributeValues,
  nested: boolean,
): S => {
  if (!attribute) {
    return attribute;
  }

  if (nested && attribute.includes(".")) {
    return attribute as S;
  }

  const parent = data["@parent"];
  const basePath = parent && attribute.startsWith(`${parent}/`) ? attribute.replace(`${parent}/`, "") : attribute;
  if (!nested && !basePath.includes(".")) {
    return basePath as S;
  }

  return pathToNested(basePath, values, nested) as S;
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
      // this is an entity ID
      let entities: any = flatValues[flatResult.join("/")];

      if (Array.isArray(entities)) {
        // ensure we only have valid entities
        entities = entities.filter(e => e && typeof e === "object" && "@id" in e);
        if (wasNested) {
          const index = Number.parseInt(part, 10);
          flatResult.push(entities[index]["@id"]);

          if (!nested) {
            result.push(entities[index]["@id"]);
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
          result.push(part);
          flatResult.push(part);
        }
      } else {
        result.push(part);
        flatResult.push(part);
      }
    }
  }

  return result.join(nested ? "." : "/");
};

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
    if (update !== undefined) {
      control.branch = update ? "true" : "false";
    }
  }
  if (control.type === "certainty_container") {
    const update = replacements[control.attribute];
    if (update !== undefined) {
      control.branch = replacements[control.attribute] === null ? "uncertain" : "certain";
    }
  }
};

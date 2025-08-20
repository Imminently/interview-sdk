import { format, parseISO } from "date-fns";
import { v4 as baseUuid } from "uuid";
import type { AttributeValues, Control, EntityControlInstance, RenderableEntityControl, Session, State } from "./types";

export const uuid = baseUuid;

export const buildUrl = (...args: (string | undefined)[]) => {
  return [...args.filter((a) => !!a)].join("/");
};

export const range = (size: number, startAt = 0) => {
  return [...Array(size).keys()].map((i) => i + startAt);
};

export const stateToData = (state: State[]): AttributeValues => {
  return Object.keys(state).reduce((acc: AttributeValues, key) => {
    acc[key] = state.find((s) => s.id === key)?.value;
    return acc;
  }, {});
};

export const isStrNotNullOrBlank = (str: any): boolean => !/^\s*$/.test(str || "");
export const isStrNullOrBlank = (str: any): boolean => !isStrNotNullOrBlank(str);

export const getEntityIds = (entity: string, values: AttributeValues): string[] => {
  const regex = new RegExp(`${entity}\\.(.*)\\.@id`);
  return Object.entries(values).reduce((ids, [key, value]) => {
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

export const formatDate = (
  argument: string | Date | number,
  dateFormat: string,
  options?: Parameters<typeof format>[2],
) => {
  return format(typeof argument === "string" ? parseISO(argument) : argument, dateFormat, options);
};

export const createEntityPathedData = (data: AttributeValues): AttributeValues => {
  const result: any = {};
  const entityArrays: Array<{
    key: string;
    value: any[];
  }> = [];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
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
      const id = entity["@id"] || i + 1;
      const entityPath = [...parent, id];
      for (const [key, value] of Object.entries(entity)) {
        if (value === undefined) {
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
      if (i === parts.length - 1) {
        result.push(part);
        flatResult.push(part);
      } else {
        // this is an entity ID
        const entities: any = flatValues[flatResult.join("/")];

        if (Array.isArray(entities)) {
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
  }

  return result.join(nested ? "." : "/") as S;
};

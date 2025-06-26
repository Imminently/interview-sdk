export interface ControlTypeInfo {
  id: string;
  name: string;
  isContainer?: boolean;
}

export const CONTROL_TYPES = {
  TYPOGRAPHY: {
    id: "typography",
    name: "Typography",
  },
  BOOLEAN: {
    id: "boolean",
    name: "Checkbox",
  },
  CURRENCY: {
    id: "currency",
    name: "Currency",
  },
  DATE: {
    id: "date",
    name: "Date",
  },
  TIME: {
    id: "time",
    name: "Time",
  },

  RADIO: {
    id: "radio",
    name: "Radio Buttons",
  },
  OPTIONS: {
    id: "options",
    name: "Select",
  },
  TEXT: {
    id: "text",
    name: "Text",
  },

  NUMBER_OF_INSTANCES: {
    id: "number_of_instances",
    name: "Number Of Instances",
  },
  FILE: {
    id: "file",
    name: "File Upload",
  },
  ENTITY: {
    id: "entity",
    name: "Entity",
  },
  REPEATING_CONTAINER: {
    id: "repeating_container",
    name: "Repeat Container",
    isContainer: true,
  },
  CERTAINTY_CONTAINER: {
    id: "certainty_container",
    name: "Certainty Container",
    isContainer: true,
  },
  SWITCH_CONTAINER: {
    id: "switch_container",
    name: "Switch Container",
    isContainer: true,
  },
  DATA_CONTAINER: {
    id: "data_container",
    name: "Data Container",
    isContainer: true,
  },
  INTERVIEW_CONTAINER: {
    id: "interview_container",
    name: "Interview Container",
    // isContainer: true, // kind of.... but not really
  },
  GENERATIVE_CHAT: {
    id: "generative_chat",
    name: "Generative Chat",
  },
} as const satisfies Record<string, ControlTypeInfo>;

/**
 * @deprecated - use CONTROL_TYPES instead
 */
export const ControlTypesInfo = CONTROL_TYPES;

import type { RenderableSidebar, Sidebar } from "../sidebars";
import type { RenderableControl } from "./controls";

export type StepId = string;
export type ReleaseId = string;
export type ProjectId = string;
export type SessionId = string;
export type InterviewId = string;
export type AttributeId = string;

// copied from decisively repo commons
export interface PreProcessedState {
  nodes: Record<string, { previousValue: any }>;
  entityStructure?: any;
}

// copied from decisively repo commons
/** A relationship between 2 entites */
export interface Relationship {
  containment: boolean;
  /** **NOT THE ENTITY ID** The relationship id, mostly unused */
  id: string;
  invisibleIfKnown: boolean;
  isComputed: boolean;
  /** The entity name. Only exists if this also defines an entity */
  name?: string;
  nameSingular: string;
  reverseId: string;
  reversePublicId: string;
  silentIfKnown: boolean;
  /** The source (parent) entity. Global if "global" otherwise references entity id. */
  source: string;
  /** The target (child) entity. Also used as the entity id */
  target: string;
  text: string;
  textSingular: string;
  type: string;
  reverseText?: string;
  contactEntity?: boolean;
  contactId?: string;
}

//# region FileAttributeValue

export type FileAttributeValue = {
  /**
   * `id` is a ref identifier in file storage\
   * value after "base64" is a file name
   *
   * @example
   *  [
   *    "data:id=53eefeab-b0a4-40de-83d5-7eb063c909d2;base64,qweasdzxc",
   *    "data:id=6bbf79d2-6e84-49cc-9473-3bc3c3dfbcc1;base64,iuytrew"
   *  ]
   */
  fileRefs: string[];
};
export const isFileAttributeValue = (v: unknown): v is FileAttributeValue => {
  if (typeof v !== "object" || v === null) return false;

  const typed = v as FileAttributeValue;
  if (Array.isArray(typed.fileRefs) === false || typed.fileRefs.some((it) => it.indexOf("data:id=") !== 0)) {
    return false;
  }

  return true;
};

/**
 * taken from https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem \
 * original examples from mdn:
 *    new TextDecoder().decode(__base64ToBytes("YSDEgCDwkICAIOaWhyDwn6aE")); // "a Ā 𐀀 文 🦄"
 */
function __base64ToBytes(base64: string): Uint8Array {
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0) || 0);
}
const decodeFromBase64 = (base64Str: string) => new TextDecoder().decode(__base64ToBytes(base64Str));

export const getNameFromFileAttributeRef = (ref: FileAttributeValue["fileRefs"][0]) => {
  const base64Indx = ref.indexOf("base64,");
  const nameBase64 = ref.slice(base64Indx + 7).trim();

  return decodeFromBase64(nameBase64);
};
export const getIdFromFileAttributeRef = (ref: FileAttributeValue["fileRefs"][0]) =>
  ref.replace("data:id=", "").slice(0, 36);

//# endregion

export type AttributeValue = string | number | boolean | FileAttributeValue | Record<string, AttributeValue>[];

/** Navigation can be step id, or true for next, false for no navigation */
export type Navigate = StepId | boolean;

export interface AttributeData {
  type: string; // auto, text, ...
  value: AttributeValue;
}

export type AttributeValues = Record<AttributeId, AttributeValue>;

export interface Parent {
  "@parent": string | undefined;
}

export type ResponseData = AttributeValues & Parent;

export interface EntityInstance {
  "@id": string;
}

/**
 * @deprecated Use `EntityInstance` instead
 */
export type IEntityInstance = EntityInstance;

export type EntityValue = AttributeValues & EntityInstance;

/**
 * @deprecated Use `EntityValue` instead
 */
export type IEntityValue = EntityValue;

/** Defines the context that the attributes within the screen exist within (whether they belong to the global object, or a sub-entity) */
export interface Context {
  /** Entity defines the entity that the screen belongs to. Either 'global' for the global object or the name of the entity */
  entity: string;
  /** Defines the id of the instance of the entity that is being referred to. For instance, if a project had an entity called 'household_member' the id would be used to determine which instance of the household_member is being referred to. This field will only appear when the entity is not 'global' */
  id?: string;
  /** Defines the parent path (if present) to the specific instance. The parent is of the form \<parent entity\>/\<parent index\> repeated for every parent up the global object (though global is never included in a parent path) */
  parent?: string;
}

/** Data structure used to calculate the value for a Dynamic Attribute.  */
export interface Simulate {
  mode: "api";
  save: false;
  goal?: AttributeId;
  data: AttributeValues;
  response?: any[];
}

/** The state attribute provides the values and additional information about attributes that will be displayed on the screen, but may require checking with the server for the latest information (aka: Dynamic Attributes). */
export interface State {
  id: AttributeId;
  type: string;
  // the backend will calculate the dependencies at runtime, so the runtime can monitor them and refresh the session
  dependencies?: AttributeId[];
  value?: any;
  // this state is a placeholder for an entity that doesn't exist yet and will include "@id" in its ID
  instanceTemplate?: string;
}

export interface Step {
  /** Unique ID of the screen */
  id: string;
  /** Title of the step. The screen may have a different title, so this title is intended for any menu UI */
  title: string;
  /** The context of the step */
  context: Context;
  /** Whether the step is the current step of the interview. Only one step is marked current at any time */
  current: boolean;
  /** Is the screen complete, that is has data been provided for the attributes in this step? A step will also be marked complete only when all of it's sub-steps are complete */
  complete: boolean;
  /** Has this step been visited by the user. A screen is marked as visited when either data is submitted from it or the user navigates away from it. A screen is not 'visited' until the user leaves it - so the current screen will always be marked as visited: false (unless it had been previously visited) */
  visited: boolean;
  /** True if the screen was skipped due to relevancy or conditional rules. The user cannot navigate to this screen */
  skipped: boolean;
  /** Whether a user can navigate to this screen. Some screens only exist as grouping of other screens (eg: just a header and some context info). */
  visitable: boolean;
  /** An array of sub-steps */
  steps?: Step[];

  sameAsPreviousSidebar?: boolean;
  sidebars?: Sidebar[] | null;
  special?: {
    // TODO what other values can this have?
    type: "complete"
  }
}

export interface DynamicNextButton {
  dependencies: string[];
  defaultEnabled: boolean;
}

export interface ScreenButtons {
  next: DynamicNextButton | boolean;
  back: boolean;
}

export interface Screen {
  /** The title of the screen. This may differ from the title in the step */
  title: string;
  /** Unique ID of the screen */
  id: string;
  /** The list of controls to be displayed on the screen */
  controls: RenderableControl[];
  /** The sidebar to render **/
  sidebars?: RenderableSidebar[] | null;
  /** Should the next/back buttons be enabled **/
  buttons?: ScreenButtons;

  attributes: string[];
  allAttributes: string[];
}

export interface Progress {
  /** The estimated time remaining for the interview, in seconds */
  time: number;
  /** The percentage completed, between 0-100 */
  percentage: number;
}

export interface Session {
  /** Unique ID of the session */
  sessionId: string;
  /** Unique ID of the interaction */
  interactionId: string;
  /** Unique ID of the interview */
  interviewId: string;
  /** Unique ID of the interview goal */
  goal: string;
  /** Unique ID of the project */
  model: string;
  /** Unique ID of the release */
  release: string;
  /** Unique ID of the report */
  reportId: string;
  status: "in-progress" | "complete" | "error";
  context: Context;
  data: Record<AttributeId, AttributeData> & Parent;
  state?: State[];
  steps: Step[];
  screen: Screen;
  progress?: Progress;
  renderAt?: number; // indicator on whether a dynamic replacement has occurred,
  explanations?: Record<AttributeId, string>;
  locale?: string;
  validations?: Validation[];
  clientGraph?: string;
  /** The client graph, decompressed, as a graph object */
  decompressedClientGraph?: any;
  relationships?: Relationship[];
  preProcessedState?: PreProcessedState;
  rulesEngineChecksum?: string;
  // data index
  index?: string;
}

export interface SessionConfig {
  /** An initial state with information already provided */
  initialData?: AttributeValues;
  /** Id of the desired interview */
  interview?: InterviewId;
  /** existing session (to create an interaction) */
  sessionId?: SessionId;
  /** Id of the interaction, if this is a continuation of an existing session */
  interactionId?: string;
  /** The project to use for the session */
  project?: string;
  /** Specific release, for testing purposes */
  release?: ReleaseId;
  /** response elements for next/submit */
  responseElements?: any[];
  /** which attributes to index */
  index?: string[];
  /** the goal */
  goal?: string;
  /** the session goal */
  sessionGoal?: string;
}

export type Overrides = Record<string, any>;

export type DynamicUpdateFunction = (data: AttributeValues) => void;

export interface AiOptions {
  temperature?: number;
  model?: string;
  instructions?: string;
}

export interface ChatProcessed {
  data: AttributeValues;
  attributes: Array<{
    id: string;
    publicId: string | undefined;
    path: string | undefined;
    description: string;
    entity: string;
  }>;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  interactionId: string;
  locale: string;
  goal: string;
  status: "in-progress" | "complete" | "error";
  processed: ChatProcessed;
}

export interface ChatMessage {
  content: string;
  self: boolean;
  failed?: boolean;
  processed?: ChatProcessed;
}

export interface Validation {
  id: string;
  message: string;
  parent?: string;
  severity: "error" | "warning";
  attributes: string[];
  conditions: any;
  shown?: boolean;
}

export interface AuthConfig {
  /** The full auth token, including type, ie `Bearer ...` */
  token: string;
  /** The X-Tenancy id if required */
  tenancy?: string;
}

/** A getter function that should return the latest auth value. Will run on each query */
export type AuthConfigGetter = () => AuthConfig;

export interface RulesEngine {
  solve(options: any, releaseHash: string, externalData: any, state: any): Promise<any>;
}
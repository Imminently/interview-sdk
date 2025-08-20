import ENTITY_LIST_SIDEBAR_DATA_INFO from "./entityListSidebar";

export interface SidebarTypeInfo {
  id: string;
  name: string;
}

export const SIDEBAR_TYPES = {
  entity_list: {
    id: "entity_list",
    name: "Entity List",
  },
  data: {
    id: "data",
    name: "Data",
  },
  explanation: {
    id: "explanation",
    name: "Explanation",
  },
  conversation: {
    id: "conversation",
    name: "Conversation",
  },
  interview: {
    id: "interview",
    name: "Interview",
  },
} as const satisfies Record<string, SidebarTypeInfo>;
export type SidebarType = keyof typeof SIDEBAR_TYPES;

interface BaseSidebar<TType extends SidebarType, TConfig extends {}> {
  type: TType;
  id: string;
  config?: TConfig;
  title: string;
}

type RenderableSidebarOf<TSidebar extends Sidebar, TData extends {}> = TSidebar & {
  data: TData;
  dynamicAttributes?: string[];
  loading?: boolean;
};

export interface AttributeInfo {
  value: string;
  label?: string;
}

// entity list

export type EntityListSidebar = BaseSidebar<
  "entity_list",
  {
    entity: string;
    titleAttribute?: string;
    filterAttribute?: string;
    descriptionAttributes?: AttributeInfo[];
  }
>;

export type RenderableEntityListSidebar = RenderableSidebarOf<
  EntityListSidebar,
  {
    entities: any[];
    titleAttributeDescription?: string;
    filterAttributeDescription?: string;
    descriptionAttributes?: AttributeInfo[];
  }
>;

// data sidebar

export type DataSidebar = BaseSidebar<
  "data",
  {
    description?: string;
    showAllAttributes?: boolean;
    canModify?: boolean;
    attributes?: AttributeInfo[];
  }
>;

export type RenderableDataSidebar = RenderableSidebarOf<
  DataSidebar,
  {
    data: any;
    attributes?: AttributeInfo[];
  }
>;

// explanation sidebar

export type ExplanationSidebar = BaseSidebar<
  "explanation",
  {
    text?: string;
    showAttributeExplanations?: boolean;
  }
>;

export type RenderableExplanationSidebar = RenderableSidebarOf<
  ExplanationSidebar,
  {
    text?: string; // rendered text from config
  }
>;

// conversation sidebar

export const INTERACTION_MODE = {
  "same-session": {
    id: "same-session",
    name: "Within same session",
  },
  "new-session": {
    id: "new-session",
    name: "New session, same project",
  },
  "different-project": {
    id: "different-project",
    name: "Different project",
  },
} as const;
export type InteractionMode = keyof typeof INTERACTION_MODE;

export type ConversationSidebar = BaseSidebar<
  "conversation",
  {
    aiOptions: {
      instructions?: string;
      temperature?: number;
      model?: string; // AI model
    };
    initialMessage?: string;
    goal: string;
    interactionMode: InteractionMode;
    projectId?: string; // Only if interactionMode is different-project
    workspaceId?: string; // Only if interactionMode is different-project
    showDataInline?: boolean; // Only if interactionMode is same-session
  }
>;

// biome-ignore lint: we don't need anything in the data for now but we may need it in future
export type RenderableConversationSidebar = RenderableSidebarOf<ConversationSidebar, {}>;

// interview sidebar

export type InterviewSidebar = BaseSidebar<
  "interview",
  {
    description?: string;
    interactionMode: InteractionMode;
    interviewId: string;
    projectId?: string; // Only if interactionMode is different-project
    workspaceId?: string; // Only if interactionMode is different-project
  }
>;

// biome-ignore lint: we don't need anything in the data for now but we may need it in future
export type RenderableInterviewSidebar = RenderableSidebarOf<InterviewSidebar, {}>;

// ---

export type RenderableSidebar =
  | RenderableEntityListSidebar
  | RenderableDataSidebar
  | RenderableExplanationSidebar
  | RenderableConversationSidebar
  | RenderableInterviewSidebar;

export type Sidebar = EntityListSidebar | DataSidebar | ExplanationSidebar | ConversationSidebar | InterviewSidebar;

export interface SidebarDynamicDataInfo<S extends RenderableSidebar> {
  getResponseElements: (config: S["config"]) => any[];
  type: S["type"];
  generateData: (config: S["config"], response: any) => Partial<S["data"]>;
}

export const SIDEBAR_DYNAMIC_DATA_INFO: Partial<Record<SidebarType, SidebarDynamicDataInfo<any>>> = {
  [SIDEBAR_TYPES.entity_list.id]: ENTITY_LIST_SIDEBAR_DATA_INFO,
};

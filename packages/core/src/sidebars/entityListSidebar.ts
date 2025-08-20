import type { RenderableEntityListSidebar, SidebarDynamicDataInfo } from "./sidebar";

const ENTITY_LIST_SIDEBAR_DATA_INFO: SidebarDynamicDataInfo<RenderableEntityListSidebar> = {
  getResponseElements: (config) => [
    {
      type: "attributes",
      id: `entity_list_${config?.entity}`,
      entities: [config?.entity],
      useDescription: true,
    },
  ],
  type: "entity_list",
  generateData: (config, response) => {
    if (!config?.entity) {
      return {};
    }
    const attributes = Array.isArray(response.reporting) ? response.reporting : [response.reporting];
    const entities = attributes.find((attributes: any) => attributes.id === `entity_list_${config.entity}`);

    return {
      entities: entities?.[config.entity] ?? [],
    };
  },
};

export default ENTITY_LIST_SIDEBAR_DATA_INFO;

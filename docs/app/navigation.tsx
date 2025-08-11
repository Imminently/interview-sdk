// Minimal navigation shape compatible with DocsLayout tree prop
export const navigation = {
  items: [
    { title: "Introduction", url: "/" },
    {
      title: "Core",
      items: [
        { title: "Overview", url: "/core/overview" },
        { title: "Manager", url: "/core/manager" },
        { title: "Conditional Logic", url: "/core/conditional-logic" },
        { title: "File Handling", url: "/core/file-handling" },
        { title: "Sidebars", url: "/core/sidebar" },
        { title: "API / Data Flow", url: "/core/api-data-flow" },
        { title: "Advanced", url: "/core/_advanced" }
      ]
    },
    {
      title: "UI",
      items: [
        { title: "Overview", url: "/ui/overview" },
        { title: "Quick Start (Interview)", url: "/ui/interview" },
        { title: "Slots & Layout", url: "/ui/slots" },
        { title: "Custom Controls", url: "/ui/custom-controls" },
        { title: "Theming", url: "/ui/theming" },
        { title: "i18n", url: "/ui/i18n" },
        { title: "Advanced UI", url: "/ui/advanced" },
        { title: "Playground", url: "/ui/playground" }
      ]
    }
  ]
};

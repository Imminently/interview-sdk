import { t } from "@/util/translate-fn";
import type { RenderableControlType } from "@imminently/interview-sdk";
import { HelpCircleIcon } from "lucide-react";
import type React from "react";
import { type PropsWithChildren, type ReactNode, createContext, useContext } from "react";

// convert options into select and radio, so they can override with a more specific type
// exlude the types we dont want to allow or do not yet support
type SlottableTypes =
  | "select"
  | "radio"
  | "renderValue"
  | Exclude<
      RenderableControlType,
      | "options"
      | "entity"
      | "interview_container"
      | "switch_container"
      | "certainty_container"
      | "repeating_container"
      | "data_container"
      | "generative_chat"
    >;

export type Theme = Record<string, any>;
export type IconMap = Record<string, React.ComponentType<{ className?: string }>>;
export type InterviewControls = Record<SlottableTypes, React.FC<any>>;

const useThemeContext = (theme: Theme = {}, customIcons: IconMap = {}, controls: Partial<InterviewControls> = {}) => {
  const icons = { ...DefaultIcons, ...customIcons } as IconMap;

  const merge = (part: string, overrides: Record<string, string> = {}) => {
    const themePart = theme[part + "Styles"] ?? {};
    return { ...themePart, ...overrides };
  };

  // TODO why does this need override? makes more sense as a fallback
  const getIcon = (icon: string, override: ReactNode) => {
    if (override) return override;
    return icons?.[icon] ?? null;
  };

  const getControl = (type: keyof InterviewControls) => {
    return controls?.[type] ?? null;
  };

  return {
    theme,
    icons,
    controls,
    merge,
    getIcon,
    getControl,
    t,
  };
};

const ThemeContext = createContext<ReturnType<typeof useThemeContext>>(undefined as any);

const DefaultIcons: IconMap = {
  help: HelpCircleIcon,
};

interface ThemeProviderProps extends PropsWithChildren {
  theme?: Theme;
  icons?: IconMap;
  controls?: Partial<InterviewControls>;
}

export const ThemeProvider = ({ theme = {}, icons = {}, controls = {}, children }: ThemeProviderProps) => {
  const context = useThemeContext(theme, icons, controls);
  return <ThemeContext.Provider value={context}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

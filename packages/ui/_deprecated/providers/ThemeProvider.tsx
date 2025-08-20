import type React from "react";
import { createContext, useContext } from "react";
import { Checked } from "../icons/Checked";
import { HelpIcon } from "../icons/HelpIcon";
import { IndeterminateCheck } from "../icons/IndeterminateCheck";

const ThemeContext = createContext<any | undefined>(undefined);
type IconMap = Record<string, React.ComponentType<{ className?: string }>>;

const DefaultIcons: IconMap = {
  help: HelpIcon,
  checked: Checked,
  indeterminateCheck: IndeterminateCheck,
};

interface ThemeProviderProps {
  theme: any;
  icons?: IconMap;
  children: React.ReactNode;
}

export const ThemeProvider = ({ theme, icons = {}, children }: ThemeProviderProps) => {
  const allIcons = { ...DefaultIcons, ...icons };
  return <ThemeContext.Provider value={{ theme, icons: allIcons }}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  return useContext(ThemeContext) || {};
}

// Helper to merge a theme part with overrides
export function themeMerge(part: string, overrides: Record<string, string> = {}) {
  const { theme } = useTheme();
  if (!theme) return overrides || {};
  const themePart = theme[part + "Styles"] || {};
  return { ...themePart, ...overrides };
}

export const getIcon = (icon: string, override: any) => {
  const { icons } = useTheme();
  if (override) return override;
  if (icons && icons[icon]) return icons[icon]();
  return null;
};

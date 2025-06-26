import React, { createContext, PropsWithChildren, ReactNode, useContext } from 'react';
import { HelpCircleIcon } from 'lucide-react';
import { RenderableControlType } from '@imminently/interview-sdk';

export type Theme = Record<string, any>;
export type IconMap = Record<string, React.ComponentType<{ className?: string }>>;
export type InterviewControls = Record<RenderableControlType, React.FC<any>>;

const useThemeContext = (theme: Theme = {}, customIcons: IconMap = {}, controls: Partial<InterviewControls> = {}) => {
  const icons = { ...DefaultIcons, ...customIcons };

  const merge = (part: string, overrides: Record<string, string> = {}) => {
    const themePart = theme[part + 'Styles'] ?? {};
    return { ...themePart, ...overrides };
  }

  // TODO why does this need override?
  const getIcon = (icon: string, override: ReactNode) => {
    if (override) return override;
    return icons?.[icon] ?? null;
  }

  const getControl = (type: keyof InterviewControls) => {
    return controls?.[type] ?? null;
  }

  return {
    theme,
    icons,
    controls,
    merge,
    getIcon,
    getControl
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
  return (
    <ThemeContext.Provider value={context}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};


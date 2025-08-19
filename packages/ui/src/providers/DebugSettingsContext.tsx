import { createContext, useContext, useEffect, useMemo, useState } from "react";

type DebugSettings = {
  debugEnabled: boolean;
  debugUIEnabled: boolean;
  setDebugEnabled: (enabled: boolean) => void;
  setDebugUIEnabled: (enabled: boolean) => void;
};

const DebugSettingsContext = createContext<DebugSettings | undefined>(undefined);

export function DebugSettingsProvider({ children, initialDebug }: { children: React.ReactNode, initialDebug?: boolean }) {
  const [debugEnabled, setDebugEnabled] = useState<boolean>(Boolean(initialDebug));
  const [debugUIEnabled, setDebugUIEnabled] = useState<boolean>(false);

  // When debug is turned off, also turn off the debug UI
  useEffect(() => {
    if (!debugEnabled && debugUIEnabled) {
      setDebugUIEnabled(false);
    }
  }, [debugEnabled, debugUIEnabled]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Cmd + D: force enable debug
      if ((event.metaKey || event.ctrlKey) && (event.key === 'd' || event.key === 'D')) {
        setDebugEnabled(v => !v);
        event.preventDefault();
        return;
      }

      // ` or ~ toggles debug UI if debug is enabled
      if (event.key === '`' || event.code === 'Backquote' || event.key === '~') {
        if (debugEnabled) {
          setDebugUIEnabled((v) => !v);
          event.preventDefault();
        }
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [debugEnabled]);

  const value = useMemo<DebugSettings>(() => ({
    debugEnabled,
    debugUIEnabled,
    setDebugEnabled,
    setDebugUIEnabled,
  }), [debugEnabled, debugUIEnabled]);

  return (
    <DebugSettingsContext.Provider value={value}>
      {children}
    </DebugSettingsContext.Provider>
  );
}

export function useDebugSettings(fallback?: Partial<DebugSettings>): DebugSettings {
  const context = useContext(DebugSettingsContext);
  if (!context) {
    throw new Error('useDebugSettings must be used within a DebugSettingsProvider');
  }
  return context;
}





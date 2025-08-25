import { useInterview } from "@/interview";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type DebugSettings = {
  debugEnabled: boolean;
  advancedDebugEnabled: boolean;
  setDebugEnabled: (enabled: boolean) => void;
  setadvancedDebugEnabled: (enabled: boolean) => void;
};

const DebugSettingsContext = createContext<DebugSettings | undefined>(undefined);

export function DebugSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const interview = useInterview();
  const [debugEnabled, _setDebugEnabled] = useState<boolean>(interview.manager.isDebugEnabled());
  const [advancedDebugEnabled, _setAdvancedDebugEnabled] = useState<boolean>(
    interview.manager.isAdvancedDebugEnabled(),
  );

  const setDebugEnabled: typeof _setDebugEnabled = (update) => {
    _setDebugEnabled((prevValue) => {
      const newValue = typeof update === "function" ? update(prevValue) : update;
      interview.manager.setDebugEnabled(newValue);
      return newValue;
    });
  };

  const setaAdvancedDebugEnabled: typeof _setAdvancedDebugEnabled = (update) => {
    _setAdvancedDebugEnabled((preValue) => {
      const newValue = typeof update === "function" ? update(preValue) : update;
      interview.manager.setAdvancedDebugEnabled(newValue);
      return newValue;
    });
  };

  // When debug is turned off, also turn off the debug UI
  useEffect(() => {
    if (!debugEnabled && advancedDebugEnabled) {
      setaAdvancedDebugEnabled(false);
    }
  }, [debugEnabled, advancedDebugEnabled]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Cmd + D: force enable debug
      if ((event.metaKey || event.ctrlKey) && (event.key === "d" || event.key === "D")) {
        setDebugEnabled((v) => !v);
        event.preventDefault();
        return;
      }

      // ` or ~ toggles debug UI if debug is enabled
      if (event.key === "`" || event.code === "Backquote" || event.key === "~") {
        if (debugEnabled) {
          setaAdvancedDebugEnabled((v) => !v);
          event.preventDefault();
        }
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [debugEnabled]);

  const value = useMemo<DebugSettings>(
    () => ({
      debugEnabled,
      advancedDebugEnabled,
      setDebugEnabled,
      setadvancedDebugEnabled: setaAdvancedDebugEnabled,
    }),
    [debugEnabled, advancedDebugEnabled],
  );

  return <DebugSettingsContext.Provider value={value}>{children}</DebugSettingsContext.Provider>;
}

export function useDebugSettings(fallback?: Partial<DebugSettings>): DebugSettings {
  const context = useContext(DebugSettingsContext);
  if (!context) {
    throw new Error("useDebugSettings must be used within a DebugSettingsProvider");
  }
  return context;
}


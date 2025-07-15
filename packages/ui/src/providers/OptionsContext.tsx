import { createContext, useContext } from "react";
import type { ManagerOptions } from "@imminently/interview-sdk";

const OptionsContext = createContext<ManagerOptions | undefined>(undefined);

export const OptionsProvider = OptionsContext.Provider;

/**
 * A basic read-only context for options that can be used throughout the application.
 * This is useful for providing configuration options that can be accessed by various components.
 */
export const useOptions = (fallback?: Partial<ManagerOptions>) => {
  const ctx = useContext(OptionsContext);
  // allow a fallback in case we are not in a provider (useful for mocked ui)
  if (!ctx && fallback) return fallback as ManagerOptions;
  if (!ctx) throw new Error("useOptions must be used within OptionsProvider");
  return ctx;
};

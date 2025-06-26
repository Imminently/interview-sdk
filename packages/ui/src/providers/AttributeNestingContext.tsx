import { createContext, useContext } from "react";

// TODO is this really needed? it appears to only be used in EntityControl
const AttributeNestingContext = createContext<boolean>(false);

export const useAttributeNestingContext = () => {
  const context = useContext(AttributeNestingContext);
  if (context === undefined) {
    throw new Error("useAttributeNestingContext must be used within an AttributeNestingProvider");
  }
  return context;
};

export const AttributeNestingProvider = AttributeNestingContext.Provider;
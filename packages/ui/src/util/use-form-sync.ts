import { decodeFormData } from "@imminently/interview-sdk";
import debounce from "lodash-es/debounce";
import { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useInterview } from "../interview/InterviewContext";

/**
 * Hook to sync form data with the session manager.
 * Updates internals, dynamic values, and calculates unknowns.
 * This is important to ensure the session updates and re-renders the form.
 */
export const useFormSync = (delay = 300) => {
  const { watch } = useFormContext();
  const { manager } = useInterview();

  // decode RHF-safe field names back to canonical attribute text; the dynamic solve is keyed by real attribute names
  const sync = useMemo(
    () => debounce((value: any) => manager.onScreenDataChange(decodeFormData(value)), delay),
    [manager, delay],
  );

  useEffect(() => {
    const subscription = watch((value, { type }) => {
      if (type === "change") {
        sync(value);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, sync]);
};
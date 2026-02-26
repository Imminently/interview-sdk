import { useInterview } from "@/interview/InterviewContext";
import { useAttributeNestingContext } from "@/providers";
import { attributeToPath } from "@imminently/interview-sdk";
import { useFormContext, useWatch } from "react-hook-form";

export const useAttributeToFieldName = (attribute: string | undefined): string | undefined => {
  const formContext = useFormContext();
  const values = formContext.getValues();

  const nested = useAttributeNestingContext();

  const { manager } = useInterview();
  if (!manager.activeSession) {
    throw new Error("useAttributeToFieldName: active session is undefined");
  }

  useWatch();
  return attributeToPath(attribute, manager.activeSession.data, values, nested);
};

import { useFormContext, useWatch } from "react-hook-form";
import { attributeToPath } from "@imminently/interview-sdk";
import { useInterview } from "@/interview/InterviewContext";
import { useAttributeNestingContext } from "@/providers";

export const useAttributeToFieldName = (attribute: string | undefined): string | undefined => {
  const formContext = useFormContext();
  const values = formContext.getValues();

  const nested = useAttributeNestingContext();

  const { session } = useInterview();
  if (!session) {
    throw new Error("useAttributeToFieldName: session is undefined");
  }

  useWatch();
  return attributeToPath(attribute, session?.data, values, nested);
};

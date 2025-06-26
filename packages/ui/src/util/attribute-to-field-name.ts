import { useFormContext, useWatch } from "react-hook-form";
import { attributeToPath } from "@/core";
import { useInterview } from "@/ui/interview/InterviewContext";
import { useAttributeNestingContext } from "@/ui/providers";

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

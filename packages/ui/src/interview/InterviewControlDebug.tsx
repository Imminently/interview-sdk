import type { Control } from "@imminently/interview-sdk";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useAttributeToFieldName } from "../util/attribute-to-field-name";
import { useInterview } from "./InterviewContext";

export interface InterviewControlDebugProps {
  control: Control;
}

const InterviewControlDebug = (props: InterviewControlDebugProps) => {
  const { control } = props;
  const { attribute } = control;

  const interview = useInterview();

  let attributeDescription: string | undefined;
  if (interview.manager.clientGraph && attribute) {
    const attributeId = attribute.split("/").pop();
    if (attributeId) {
      attributeDescription = interview.manager.clientGraph.nodes.find((node: any) => node.v === attributeId)?.value.description;
    }
  }

  return (
    <div className="mb-1">
      <div className="text-[10px] leading-tight text-muted-foreground font-mono">
        {control.type}{attributeDescription ? ` [${attributeDescription}]` : ""}{control.id ? ` #${control.id}` : ""}
      </div>
    </div>
  );
}

export default InterviewControlDebug;
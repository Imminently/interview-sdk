import type { RenderableCertaintyContainerControl } from "@imminently/interview-sdk";
import { RenderControl } from "../RenderControl";

export const CertaintyContainer = ({
  control,
  className,
}: {
  control: RenderableCertaintyContainerControl;
  className?: string;
}) => {
  const { certain, uncertain, branch } = control;

  const controls = branch === "certain" ? certain : uncertain;

  if (!controls || controls.length === 0) return null;

  return (
    <>
      {controls.map((value) => (
        <RenderControl
          key={value.id}
          control={value}
        />
      ))}
    </>
  );
};

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

  if (controls.length === 0) return null;

  return (
    <div
      className={className}
      data-id={control.id}
      data-type={control.type}
      data-loading={(control as any).loading ? "true" : undefined}
    >
      {controls.map((value) => (
        <RenderControl
          key={value.id}
          control={value}
        />
      ))}
    </div>
  );
};

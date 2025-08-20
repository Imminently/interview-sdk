import clsx from "clsx";
import { ControlRenderer as DefaultControlRenderer } from "../controls/ControlRenderer";
import { getInterviewComponent } from "../providers/InterviewProvider";
import { themeMerge } from "../providers/ThemeProvider";
export const InterviewForm = (props: any) => {
  const { className, classNames, controls, ControlRenderer = DefaultControlRenderer, controlOverrides } = props;
  const mergedClassName = themeMerge("InterviewForm", classNames);

  const _controls = controls || getInterviewComponent("screen.controls");

  if (!_controls || ControlRenderer === null) return null;
  return (
    <div className={clsx("dcsvly-form", mergedClassName.root, className)}>
      {_controls.map((control: any) => (
        <ControlRenderer
          key={control.id}
          control={control}
          classNames={mergedClassName.Controls}
          controlOverrides={controlOverrides}
        />
      ))}
    </div>
  );
};

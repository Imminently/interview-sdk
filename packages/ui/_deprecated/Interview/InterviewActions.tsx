import clsx from "clsx";
import { themeMerge } from "../providers/ThemeProvider";

export const InterviewActions = (props: any) => {
  const { className, classNames } = props;
  const mergedClassNames = themeMerge('InterviewActions', classNames);
  return (
    <div className={className}>
      <button className={clsx('dcsvly-back-button', mergedClassNames.backButton)}>Back</button>
      <button className={clsx('dcsvly-next-button', mergedClassNames.nextButton)}>Next</button>
    </div>
  );
};
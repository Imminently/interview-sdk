import clsx from "clsx";
import { useTheme } from "../providers/ThemeProvider";
import { themeMerge } from "../providers/ThemeProvider";
import { useState } from "react";
import { getInterviewComponent } from "../providers/InterviewProvider";

export const Explanation = (props: any) => {
  const { control, classNames } = props;
  const { icons } = useTheme();
  const mergedClassNames = themeMerge('Explanation', classNames);
  const [showExplanationPopup, setShowExplanationPopup] = useState(false);

  if (control.showExplanation) {
    const explanation = getInterviewComponent(`explanations.${control.attribute}`);
    if (!explanation) return null;
    return (
      <div className={clsx('dcsvly-help', mergedClassNames.help)}>
        <button
          type="button"
          className={clsx('dcsvly-help-icon', mergedClassNames.helpIcon)}
          onClick={() => setShowExplanationPopup(v => !v)}
          tabIndex={0}
        >
          {icons.help()}
        </button>
        {showExplanationPopup && (
          <div className={clsx('dcsvly-help-popup', mergedClassNames.helpPopup)}>
            {explanation}
          </div>
        )}
      </div>
    )
  }
  return null;
};
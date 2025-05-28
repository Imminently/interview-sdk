import { isEmpty } from "lodash-es";
import { useInterview } from "../providers/InterviewProvider";
import clsx from "clsx";
import { themeMerge } from "../providers/ThemeProvider";
import { t } from "../utils/translateFn";
export const InterviewAlert = (props: any) => {
  const { className, classNames } = props;
  const mergedClassName = themeMerge('InterviewAlert', classNames);
  let { errors } = useInterview();
  if (!errors || isEmpty(errors)) return null;
  return (
    <div className={clsx('dcsvly-alert', mergedClassName.root, className)}>
      <h1>{t('has_errors')}</h1>
    </div>
  );
};
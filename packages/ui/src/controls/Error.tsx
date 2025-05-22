import React from "react";
import { useInterview } from "../providers/InterviewProvider";
import clsx from "clsx";
import { themeMerge } from "../providers/ThemeProvider";
export const Error = ({ id, classNames }: { id: string, classNames?: any }) => {
  const { getError } = useInterview();
  const error = getError ? getError(id) : null;
  const mergedClassNames = themeMerge('Error', classNames);
  if (!error) return null;

  console.log('for field', id, error);
  return (
    <div data-id={id} className={clsx("dcsvly-error-root", mergedClassNames.root)}>
      {Array.isArray(error)
        ? error.map((err, i) => <div key={i}>{err}</div>)
        : <div>{error}</div>
      }
    </div>
  );
};
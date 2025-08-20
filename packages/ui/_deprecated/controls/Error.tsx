import clsx from "clsx";
import React from "react";
import { useInterview } from "../providers/InterviewProvider";
import { themeMerge } from "../providers/ThemeProvider";
export const Error = ({ id, classNames }: { id: string; classNames?: any }) => {
  const { getError } = useInterview();
  const error = getError ? getError(id) : null;
  const mergedClassNames = themeMerge("Error", classNames);
  if (!error) return null;

  return (
    <div
      data-id={id}
      className={clsx("dcsvly-error-root", mergedClassNames.root)}
    >
      {Array.isArray(error) ? error.map((err, i) => <div key={i}>{err.message}</div>) : <div>{error.message}</div>}
    </div>
  );
};

import * as React from "react";

export interface LoadingProps extends React.HTMLAttributes<HTMLSpanElement> { }

export const Loading = React.forwardRef<HTMLSpanElement, LoadingProps>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={className} {...props}>
      ...
    </span>
  )
);
Loading.displayName = "Loading";

export default Loading;

import React from "react";
import clsx from "clsx";
import { themeMerge } from "../providers/ThemeProvider";

type Variant =
  | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  | "subtitle1" | "subtitle2"
  | "body1" | "body2"
  | "caption"
  | "blockquote" | "code"
  | "banner-yellow" | "banner-red" | "banner-green" | "banner-blue";

interface TypographyProps {
  control?: { variant?: Variant; children?: React.ReactNode };
  classNames?: any;
  children?: React.ReactNode;
  variant?: Variant;
}

export const Typography: React.FC<TypographyProps> = (props: any) => {
  const { control, classNames } = props;
  const mergedClassNames = themeMerge('Typography', classNames);
  const variant: Variant = control.style || "body1";

  if (!control || control.hidden) return null
  // Map variant to element
  const variantMap: Record<Variant, keyof JSX.IntrinsicElements> = {
    h1: "h1", h2: "h2", h3: "h3", h4: "h4", h5: "h5", h6: "h6",
    subtitle1: "div", subtitle2: "div",
    body1: "div", body2: "div",
    caption: "div",
    blockquote: "div",
    code: "div",
    "banner-yellow": "div", "banner-red": "div", "banner-green": "div", "banner-blue": "div"
  };
  const Element = variantMap[variant] || "div";
  return (
    <Element
      className={clsx(
        "dcsvly-typography",
        mergedClassNames[variant]
      )}
    >
      {control.text}
    </Element>
  );
};

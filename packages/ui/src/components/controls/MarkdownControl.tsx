import { useTheme } from "@/providers";
import type { TypographyControl } from "@imminently/interview-sdk";
import Markdown from "react-markdown";

export interface TypographyControlProps {
  control: TypographyControl;
}

// NOTE name does not have Control included, as its just ready only text
export const MarkdownControl = ({ control }: TypographyControlProps) => {
  return (
    <Markdown>
      {control.text}
    </Markdown>
  );
};

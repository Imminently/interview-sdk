import { useInterview } from "@/interview/InterviewContext";
import { useTheme } from "@/providers";
import type {
  CertaintyContainerControl,
  Control,
  DataContainerControl,
  DocumentControl,
  GenerativeChatControl,
  ImageControl,
  NumberOfInstancesControl,
  RepeatingContainerControl,
  SwitchContainerControl,
  TypographyControl,
} from "@imminently/interview-sdk";
import clsx from "clsx";
import { HelpCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

// Omit control types that do not have explanations
type ExplanationControl = Exclude<
  Control,
  | ImageControl
  | NumberOfInstancesControl
  | TypographyControl
  | DocumentControl
  | GenerativeChatControl
  | RepeatingContainerControl
  | CertaintyContainerControl
  | SwitchContainerControl
  | DataContainerControl
>;

export type ExplanationProps = {
  control: Control;
  className?: string;
};

// TODO should this be renamed and moved into FormExplanation?
export const Explanation = (props: ExplanationProps) => {
  const { control, className } = props;
  const { t } = useTheme();
  const { manager } = useInterview();
  const showExplanation = (control as ExplanationControl).showExplanation;

  // getExplanation resolves the base attribute node id and looks it up in the
  // active session's explanations (keyed by that id, not the RHF field name).
  const explanation = control.attribute ? manager.getExplanation(control.attribute) : undefined;

  if (!showExplanation || !explanation) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Show explanation"
          className={clsx("size-6 rounded-full", className)}
        >
          <span className="sr-only">{t("form.explanation")}</span>
          <HelpCircle className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>{t(explanation)}</PopoverContent>
    </Popover>
  );
};

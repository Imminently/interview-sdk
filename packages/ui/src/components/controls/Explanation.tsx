import { useInterview } from "@/interview";
import { useTheme } from "@/providers";
import { useAttributeToFieldName } from "@/util";
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
  const { session } = useInterview();
  const showExplanation = (control as ExplanationControl).showExplanation;

  // make sure we use just the attribute id, ie strip all the pathing
  const attribute = useAttributeToFieldName(control.attribute);

  if (!showExplanation || !attribute) return null;

  const explanation = session.explanations?.[attribute] || null;
  if (!explanation) return null;

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

import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Button } from "../ui/button";
import { HelpCircle } from "lucide-react";
import { useInterview } from "@/";
import clsx from "clsx";
import { CertaintyContainerControl, Control, DataContainerControl, DocumentControl, GenerativeChatControl, ImageControl, NumberOfInstancesControl, RepeatingContainerControl, SwitchContainerControl, TypographyControl } from "@imminently/interview-sdk";

// Omit control types that do not have explanations
type ExplanationControl = Exclude<Control, ImageControl | NumberOfInstancesControl | TypographyControl | DocumentControl | GenerativeChatControl | RepeatingContainerControl | CertaintyContainerControl | SwitchContainerControl | DataContainerControl>;

export type ExplanationProps = {
  control: Control;
  className?: string;
};

// TODO should this be renamed and moved into FormExplanation?
export const Explanation = (props: ExplanationProps) => {
  const { control, className } = props;
  const { session } = useInterview();
  if ((control as ExplanationControl).showExplanation && control.attribute) {
    const explanation = session.explanations?.[control.attribute] || null;
    if (!explanation) return null;
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" size="icon" variant="ghost" aria-label="Show explanation" className={clsx("size-6 rounded-full", className)}>
            <span className="sr-only">Show explanation</span>
            <HelpCircle className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          {explanation}
        </PopoverContent>
      </Popover>
    );
  }
  return null;
};
import { useDebugSettings, useOptions, useTheme } from "@/providers";
import { cn } from "@/util";
import type { TypographyControl } from "@imminently/interview-sdk";
import { type VariantProps, cva } from "class-variance-authority";
import type React from "react";
import { Alert, AlertDescription } from "../ui/alert";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { useInterview } from "@/interview";
import { useMemo } from "react";

type TextVariant = TypographyControl["style"];

// CVA typography variants with shadcn/tailwind styles
const typographyVariants = cva("", {
  variants: {
    variant: {
      h1: "text-4xl font-extrabold tracking-tight",
      h2: "text-3xl font-semibold tracking-tight",
      h3: "text-2xl font-semibold tracking-tight",
      h4: "text-xl font-semibold tracking-tight",
      h5: "text-lg font-semibold tracking-tight",
      h6: "text-base font-semibold tracking-tight",
      subtitle1: "text-lg text-muted-foreground leading-relaxed",
      subtitle2: "text-base text-muted-foreground leading-relaxed",
      body1: "leading-7",
      body2: "text-sm leading-6",
      caption: "text-sm text-muted-foreground",
      "banner-yellow": "",
      "banner-red": "",
      "banner-green": "",
    },
  },
  defaultVariants: {
    variant: "body1",
  },
});

interface BannerProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof typographyVariants> {
  "data-typography": TextVariant;
}

const Banner = ({ className, children, ...props }: BannerProps) => {
  const variant = props["data-typography"];
  return (
    <Alert variant={variant.replace("banner-", "") as "yellow" | "red" | "green"}>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
};

// Map variant to html element (allows for proper semantic HTML)
const componentMap: Record<string, React.ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  subtitle1: "p",
  subtitle2: "p",
  body1: "p",
  body2: "p",
  caption: "span",
  "banner-yellow": Banner,
  "banner-red": Banner,
  "banner-green": Banner,
};

export interface TypographyControlProps {
  control: TypographyControl;
}

export const TypographyDebug = ({ name, control }: { name: string; control: TypographyControl }) => {
  const { debugEnabled } = useDebugSettings();
  const context = useInterview();
  const graph = useMemo(() => context.manager.parsedGraph, [context]);

  if (!debugEnabled) {
    return null;
  }

  const node = graph ? graph.node(name) : { description: "No graph", entity: "N/A" };
  console.log("TypographyDebug", { name, node });

  const dynamic = [] as string[];
  // @ts-ignore
  if (control.dynamicAttributes) {
    // @ts-ignore
    for (const attr of control.dynamicAttributes) {
      const n = graph?.node(attr);
      dynamic.push(n ? n.description ?? attr : attr);
    }
  }

  return (
    <div className="flex flex-col text-xs text-muted-foreground">
      <div className="flex flex-row gap-1 items-center">
        {node?.entity ? <span>[{node.entity}]</span> : null}
        <span>{node?.description ?? `Missing node for ${name}`}</span>
      </div>
      {/* @ts-ignore */}
      {control.templateText ? <span>Template: {control.templateText}</span> : null}
      {dynamic.length > 0 ? (<span>Dynamic Attributes: {dynamic.join(", ")}</span>) : null}
    </div>
  );
}

// NOTE name does not have Control included, as its just ready only text
export const Typography = ({ control }: TypographyControlProps) => {
  // merge is a bit weird here, as we actually would want to merge the cva variants
  // const { merge } = useTheme();
  const { debug } = useOptions({ debug: true });
  const { t } = useTheme();
  const variant: TextVariant = control.style || "body1";
  const Comp: React.ElementType = componentMap[variant] ?? "div";

  const debugControl = debug
    ? () => {
      console.log("Typography", {
        variant,
        control,
      });
    }
    : undefined;

  const component = (
    <>
      <TypographyDebug name={control.attribute ?? control.id} control={control} />
      <Comp
        onClick={debugControl}
        data-type={control.type}
        data-typography={variant}
        className={cn(typographyVariants({ variant }), control.customClassName)}
      >
        {control.emoji ? <span className="mr-2">{control.emoji}</span> : null}
        {t(control.text)}
      </Comp>
    </>
  );

  if (control.label) {
    return (
      <FormField
        name={control.attribute ?? control.id}
        data={control}
        render={() => (
          <FormItem>
            <FormLabel>{t(control.label)}</FormLabel>
            <FormControl>{component}</FormControl>
          </FormItem>
        )}
      />
    );
  }

  return component;
};

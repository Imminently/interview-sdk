import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useTheme } from "@/providers";
import type { Step } from "@imminently/interview-sdk";
import { CheckIcon } from "lucide-react";
import type * as React from "react";
import { useInterview } from "../InterviewContext";
import { InterviewProgress } from "./InterviewProgress";

// ─── Public Types ─────────────────────────────────────────────────────────────

/**
 * Props supplied to a custom {@link StepRenderFn}.
 */
export interface StepRenderProps {
  /** The step data to render. */
  step: Step;
  /** The 0-based index of this step within its sibling group. */
  index: number;
  /** The nesting depth (0 = top-level, 1 = first child level, etc.). */
  depth: number;
  /** Navigates to this step when called. */
  navigate: () => void;
  /**
   * The pre-rendered sub-step tree for this step.
   *
   * When using the default renderer, this is wrapped in a {@link SidebarMenuSub}.
   * When `renderStep` is provided, this is a plain fragment of the recursively
   * rendered child items — no sidebar wrapper is applied, so the consumer can
   * decide how to contain them.
   *
   * `null` when `showSubSteps` is disabled or there are no visible sub-steps.
   */
  children: React.ReactNode | null;
}

/**
 * A render function that controls how each step item is displayed.
 *
 * Receives the step data, its position within its sibling group, its nesting
 * depth, a `navigate` callback, and the pre-rendered `children` sub-tree.
 *
 * @example
 * const renderStep: StepRenderFn = ({ step, index, navigate, children }) => (
 *   <li key={step.id}>
 *     <button onClick={navigate}>{index + 1}. {step.title}</button>
 *     {children}
 *   </li>
 * );
 */
export type StepRenderFn = (props: StepRenderProps) => React.ReactNode;

/**
 * Props for {@link InterviewStepList}.
 */
export interface InterviewStepListProps {
  /** Additional CSS class names for the root {@link SidebarMenu} element. */
  className?: string;
  /**
   * Controls whether and how deeply sub-steps are rendered.
   *
   * - `true`   – render all nested sub-steps recursively.
   * - `number` – render sub-steps up to this many levels deep
   *              (e.g. `1` shows only direct children, `2` adds grandchildren).
   * - `false` or omitted – only top-level steps are shown.
   */
  showSubSteps?: boolean | number;
  /**
   * Custom render function for each step item.
   *
   * When provided it replaces the default shadcn sidebar item rendering for
   * every item at every depth. The `children` prop in {@link StepRenderProps}
   * will be a plain fragment (no `SidebarMenuSub` wrapper) so the consumer
   * can wrap the sub-items however they like.
   */
  renderStep?: StepRenderFn;
  /**
   * Explicit list of steps to render, bypassing the active session.
   * Useful for previews or rendering a custom step subset.
   */
  steps?: Step[];
}

/**
 * Props for {@link InterviewSteps}.
 */
export interface InterviewStepsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS class names applied to the {@link Sidebar} root. */
  className?: string;
  /** @see InterviewStepListProps.showSubSteps */
  showSubSteps?: boolean | number;
  /** @see InterviewStepListProps.renderStep */
  renderStep?: StepRenderFn;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Maps a step's state to a {@link Badge} variant. */
const getVariant = (step: Step) => {
  if (step.current) return "default";
  if (step.complete) return "success";
  if (step.visited) return "muted";
  if (step.skipped) return "ghost";
  return "secondary";
};

/**
 * Returns `true` when sub-steps should be rendered at the given nesting depth
 * based on the `showSubSteps` setting.
 */
const canShowSubStepsAtDepth = (showSubSteps: boolean | number | undefined, depth: number): boolean => {
  if (!showSubSteps) return false;
  if (typeof showSubSteps === "boolean") return true;
  return depth < showSubSteps;
};

// ─── Internal Recursive Renderer ─────────────────────────────────────────────

interface StepTreeProps {
  steps: Step[];
  depth: number;
  showSubSteps?: boolean | number;
  renderStep?: StepRenderFn;
  navigate: (id: string) => void;
  disabled?: boolean;
}

/**
 * Recursively renders a list of steps at the given nesting depth.
 *
 * At depth 0 the default renderer uses {@link SidebarMenuItem} /
 * {@link SidebarMenuButton}. At deeper depths it uses
 * {@link SidebarMenuSubItem} / {@link SidebarMenuSubButton}.
 *
 * When a custom `renderStep` is supplied it is used at every depth and the
 * sub-tree passed as `children` is a plain fragment (not wrapped in
 * {@link SidebarMenuSub}), giving the consumer full control over nesting.
 */
const StepTree = ({ steps, depth, showSubSteps, renderStep, navigate, disabled }: StepTreeProps) => {
  const { t } = useTheme();
  const visibleSteps = steps.filter((s) => s.visited || s.current);

  return (
    <>
      {visibleSteps.map((step, index) => {
        const visibleSubSteps = step.steps?.filter((s) => s.visited || s.current);
        const showChildren = !!visibleSubSteps?.length && canShowSubStepsAtDepth(showSubSteps, depth);

        const handleClick = (e: React.MouseEvent) => { e.stopPropagation(); if (!disabled) navigate(step.id); };

        const subTree = showChildren ? (
          renderStep ? (
            // Custom renderer: pass raw sub-items without a sidebar wrapper so
            // the consumer can decide how to contain them.
            <StepTree
              steps={visibleSubSteps!}
              depth={depth + 1}
              showSubSteps={showSubSteps}
              renderStep={renderStep}
              navigate={navigate}
              disabled={disabled}
            />
          ) : (
            // Default renderer: wrap sub-items in SidebarMenuSub.
            <SidebarMenuSub className="mr-0 pr-0">
              <StepTree
                steps={visibleSubSteps!}
                depth={depth + 1}
                showSubSteps={showSubSteps}
                renderStep={renderStep}
                navigate={navigate}
                disabled={disabled}
              />
            </SidebarMenuSub>
          )
        ) : null;

        if (renderStep) {
          return renderStep({ step, index, depth, navigate: () => navigate(step.id), children: subTree });
        }

        if (depth === 0) {
          return (
            <SidebarMenuItem key={step.id} onClick={handleClick}>
              <SidebarMenuButton disabled={disabled} className="cursor-pointer" tooltip={t(step.title)}>
                <Badge variant={getVariant(step)} className="rounded-full">
                  {index + 1}
                </Badge>
                <span className="truncate">{t(step.title)}</span>
                {step.complete ? <CheckIcon className="h-4 w-4 ml-auto" /> : null}
              </SidebarMenuButton>
              {subTree}
            </SidebarMenuItem>
          );
        }

        return (
          <SidebarMenuSubItem key={step.id} onClick={handleClick}>
            <SidebarMenuSubButton isActive={step.current} aria-disabled={disabled} className="cursor-pointer w-full">
              <span className="truncate">{t(step.title)}</span>
              {step.complete ? <CheckIcon className="h-4 w-4 ml-auto" /> : null}
            </SidebarMenuSubButton>
            {subTree}
          </SidebarMenuSubItem>
        );
      })}
    </>
  );
};

// ─── Public Components ────────────────────────────────────────────────────────

/**
 * Renders the list of visited and current interview steps as a navigable menu.
 *
 * This component is intentionally decoupled from any sidebar chrome so it can
 * be embedded inside a custom {@link Sidebar} layout, a sheet, a drawer, or
 * any other container.
 *
 * @example
 * // Embed inside a custom sidebar
 * <Sidebar>
 *   <SidebarContent>
 *     <SidebarGroup>
 *       <InterviewStepList showSubSteps />
 *     </SidebarGroup>
 *   </SidebarContent>
 * </Sidebar>
 *
 * @example
 * // Show up to two levels of sub-steps
 * <InterviewStepList showSubSteps={2} />
 *
 * @example
 * // Fully custom item rendering
 * <InterviewStepList
 *   showSubSteps
 *   renderStep={({ step, index, navigate, children }) => (
 *     <li key={step.id}>
 *       <button onClick={navigate}>{index + 1}. {step.title}</button>
 *       {children}
 *     </li>
 *   )}
 * />
 */
export const InterviewStepList = ({ className, showSubSteps, renderStep, steps: stepsProp }: InterviewStepListProps) => {
  const { session, manager, isLoading } = useInterview();
  const steps = stepsProp ?? session?.steps ?? [];

  return (
    <SidebarMenu className={className}>
      <StepTree
        steps={steps}
        depth={0}
        showSubSteps={showSubSteps}
        renderStep={renderStep}
        navigate={(id) => manager.navigate(id)}
        disabled={isLoading}
      />
    </SidebarMenu>
  );
};

// ─── Default Sidebar Layout ───────────────────────────────────────────────────

/**
 * The default full-sidebar layout for interview steps.
 *
 * Wraps {@link InterviewStepList} in standard shadcn {@link Sidebar} chrome,
 * including a group label and a footer {@link InterviewProgress} bar.
 * Prefer using {@link InterviewStepList} directly when you need a custom shell.
 */
const DefaultSteps = ({ className, showSubSteps, renderStep }: InterviewStepsProps) => {
  const { t } = useTheme();
  return (
    <Sidebar className={className}>
      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>{t("form.steps")}</SidebarGroupLabel>
          <InterviewStepList showSubSteps={showSubSteps} renderStep={renderStep} />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4 group-data-[collapsible=icon]:hidden">
        <InterviewProgress />
      </SidebarFooter>
    </Sidebar>
  );
};

/**
 * Renders the visited and current interview steps in the default sidebar layout.
 *
 * Supports recursive sub-step rendering via `showSubSteps` and custom item
 * rendering via `renderStep`. For advanced layouts — custom sidebars, drawers,
 * sheets, etc. — use {@link InterviewStepList} directly inside your own
 * container instead.
 *
 * @example
 * // Show all sub-steps recursively
 * <InterviewSteps showSubSteps />
 *
 * @example
 * // Show up to two levels of sub-steps
 * <InterviewSteps showSubSteps={2} />
 *
 * @example
 * // Custom item renderer inside the default sidebar
 * <InterviewSteps
 *   renderStep={({ step, index, navigate, children }) => (
 *     <SidebarMenuItem key={step.id}>
 *       <SidebarMenuButton onClick={navigate}>
 *         {index + 1}. {step.title}
 *       </SidebarMenuButton>
 *       {children}
 *     </SidebarMenuItem>
 *   )}
 * />
 */
export const InterviewSteps = (props: InterviewStepsProps) => {
  const { state, session } = useInterview();
  if (state !== "success" && !session) {
    return null; // Don't render if not in success state
  }
  return <DefaultSteps {...props} />;
};

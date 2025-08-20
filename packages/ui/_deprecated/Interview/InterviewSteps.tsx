import clsx from "clsx";
import type React from "react";
import { getInterviewComponent } from "../providers/InterviewProvider";
import { themeMerge } from "../providers/ThemeProvider";

interface Step {
  id: string;
  title: string;
  current: boolean;
  complete: boolean;
  visited: boolean;
  time_estimate: number;
  skipped: boolean;
  steps?: Step[];
}

interface StepsProps {
  steps: Step[];
  hideUnvisited?: boolean;
  maxDepth?: number;
  depth?: number;
  classNames?: any;
  className?: string;
}

const getStepState = (step: Step) => {
  if (step.current) return "current";
  if (step.visited) return "visited";
  return "future";
};

const StepItem: React.FC<{
  step: Step;
  index: number;
  hideUnvisited: boolean;
  maxDepth: number;
  depth: number;
  mergedClassNames: any;
}> = ({ step, index, hideUnvisited = true, maxDepth, depth, mergedClassNames }) => {
  const isFuture = !step.current && !step.visited;
  if (hideUnvisited && isFuture) return null;
  const state = getStepState(step);

  const indent = depth * 6; // 1.5rem per depth
  const size = depth === 0 ? mergedClassNames.text : mergedClassNames.textSub;
  const circleSize = depth === 0 ? mergedClassNames.circle : mergedClassNames.circleSub;
  const stateCircle = mergedClassNames[`circle${state.charAt(0).toUpperCase() + state.slice(1)}`];
  const stateText = mergedClassNames[`text${state.charAt(0).toUpperCase() + state.slice(1)}`];

  return (
    <div className={clsx("dcsvly-step-item", mergedClassNames.item)}>
      <div
        className={clsx("dcsvly-step-index", mergedClassNames.index)}
        style={{ marginLeft: `${indent}px` }}
      >
        <div
          className={clsx(
            depth === 0 ? "dcsvly-step-circle" : "dcsvly-step-sub-circle",
            `dcsvly-step-${state}`,
            circleSize,
            stateCircle,
          )}
        >
          {index + 1}
        </div>
        <span className={clsx("dcsvly-step-title", `dcsvly-step-${state}`, size, stateText)}>{step.title}</span>
      </div>
      {step.steps && depth + 1 < maxDepth && (
        <div className={clsx("dcsvly-step-substeps", mergedClassNames.subSteps)}>
          {step.steps.map((sub, i) => (
            <StepItem
              key={sub.id + i}
              step={sub}
              index={i}
              hideUnvisited={hideUnvisited}
              maxDepth={maxDepth}
              depth={depth + 1}
              mergedClassNames={mergedClassNames}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const InterviewSteps: React.FC<StepsProps> = ({
  steps,
  hideUnvisited = true,
  maxDepth = 2,
  depth = 0,
  classNames = {},
  className = "",
}) => {
  const mergedClassNames = themeMerge("InterviewSteps", classNames);
  const _steps = steps || getInterviewComponent("steps");
  if (!_steps) return null;
  return (
    <div className={clsx("dcsvly-step-root", mergedClassNames.root, className)}>
      {_steps.map((step, i) => (
        <StepItem
          key={step.id + i}
          step={step}
          index={i}
          hideUnvisited={hideUnvisited}
          maxDepth={maxDepth}
          depth={depth}
          mergedClassNames={mergedClassNames}
        />
      ))}
    </div>
  );
};

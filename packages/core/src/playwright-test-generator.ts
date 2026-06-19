export interface TimelineControl {
  id: string;
  type: string;
  label?: string;
  attribute?: string;
  // Generic children (data_container, repeating_container, entity template)
  controls?: TimelineControl[];
  // Entity instances — each carries the resolved full-path attribute controls
  instances?: Array<{ id: string; controls: TimelineControl[] }>;
  // certainty_container branches
  certain?: TimelineControl[];
  uncertain?: TimelineControl[];
  // switch_container branches
  outcome_true?: TimelineControl[];
  outcome_false?: TimelineControl[];
}

export interface TimelineScreen {
  title?: string;
  controls?: TimelineControl[];
}

export interface TimelineQuestion {
  asking: { screen: TimelineScreen };
  response?: { data?: Record<string, unknown> };
}

export interface InterviewTimeline {
  interview: string;
  goal: string;
  questions: TimelineQuestion[];
}

export interface GeneratePlaywrightTestOptions {
  project: string;
  release: string;
  timeline: InterviewTimeline;
  initialData?: Record<string, unknown>;
}

const FILL_CONTROL_TYPES = new Set(["text", "number", "currency", "date", "number_of_instances"]);
const SELECT_CONTROL_TYPES = new Set(["options", "radio"]);

/**
 * Recursively collects all controls from the tree.
 * Walks into all container and branch types.
 * Skips `template` on entity controls — instances carry the resolved full-path attributes.
 */
function collectControls(controls: TimelineControl[], out: TimelineControl[] = []): TimelineControl[] {
  for (const control of controls) {
    out.push(control);
    if (control.controls?.length) collectControls(control.controls, out);
    if (control.instances?.length) {
      for (const instance of control.instances) {
        collectControls(instance.controls, out);
      }
    }
    if (control.certain?.length) collectControls(control.certain, out);
    if (control.uncertain?.length) collectControls(control.uncertain, out);
    if (control.outcome_true?.length) collectControls(control.outcome_true, out);
    if (control.outcome_false?.length) collectControls(control.outcome_false, out);
  }
  return out;
}

function generateControlInteraction(label: string, type: string, value: unknown): string | null {
  const escaped = label.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  if (type === "boolean") {
    return value
      ? `  await page.getByLabel("${escaped}").check();`
      : `  await page.getByLabel("${escaped}").uncheck();`;
  }

  if (SELECT_CONTROL_TYPES.has(type)) {
    return `  await page.getByLabel("${escaped}").selectOption(${JSON.stringify(String(value))});`;
  }

  if (FILL_CONTROL_TYPES.has(type)) {
    return `  await page.getByLabel("${escaped}").fill(${JSON.stringify(String(value ?? ""))});`;
  }

  return null;
}

export function generatePlaywrightTestCode(options: GeneratePlaywrightTestOptions): string {
  const { project, release, timeline, initialData } = options;
  const { interview, goal, questions } = timeline;

  const lines: string[] = [
    `import { expect, test } from "@playwright/test";`,
    `import { createInterviewHarness } from "../src";`,
    ``,
    `test("interview - ${interview}", async ({ page, request }) => {`,
    `  const harness = createInterviewHarness(page, request);`,
    ``,
    `  await harness.loadInterview({`,
    `    project: ${JSON.stringify(project)},`,
    `    release: ${JSON.stringify(release)},`,
    `    interview: ${JSON.stringify(interview)},`,
    `    goal: ${JSON.stringify(goal)},`,
  ];

  if (initialData && Object.keys(initialData).length > 0) {
    const indented = JSON.stringify(initialData, null, 2).replace(/\n/g, "\n    ");
    lines.push(`    initialData: ${indented},`);
  }

  lines.push(`  });`, ``);

  for (const question of questions) {
    const { screen } = question.asking;
    const { title, controls = [] } = screen;
    const responseData = question.response?.data ?? {};

    if (title) {
      lines.push(`  // Step: "${title}"`);
      lines.push(`  await expect(harness.getScreenTitle()).toHaveText(${JSON.stringify(title)});`);
    }

    for (const control of collectControls(controls)) {
      if (!control.attribute || !control.label) continue;
      const value = responseData[control.attribute];
      if (value === undefined) continue;
      const interaction = generateControlInteraction(control.label, control.type, value);
      if (interaction) lines.push(interaction);
    }

    lines.push(`  await harness.getNextButton().click();`);
    lines.push(``);
  }

  lines.push(`  await expect(harness.getInterviewContainer()).toBeVisible();`);
  lines.push(`});`);
  lines.push(``);

  return lines.join("\n");
}

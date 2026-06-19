export interface TimelineControl {
  id: string;
  type: string;
  label?: string;
  attribute?: string;
  /** Present on number_of_instances controls — identifies which entity the count applies to. */
  entity?: string;
  // Generic children (data_container, repeating_container)
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
 * Flattens entity-nested response data into a map of full attribute paths.
 *
 * Handles two forms for entity data:
 *   Array form (raw API): { users: [{ "@id": "abc", "attr1": "val" }] }
 *   Normalized form (exported): { users: 1 }
 *
 * Array form is expanded into full-path attribute keys and an entity count.
 * Normalized number form goes straight into entityCounts.
 * Non-array, non-number keys are kept as-is for top-level attributes.
 */
function buildLookupMaps(data: Record<string, unknown>): {
  attributes: Record<string, unknown>;
  entityCounts: Record<string, number>;
} {
  const attributes: Record<string, unknown> = {};
  const entityCounts: Record<string, number> = {};

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      entityCounts[key] = value.length;
      for (const instance of value) {
        if (!instance || typeof instance !== "object") continue;
        const obj = instance as Record<string, unknown>;
        const id = obj["@id"];
        if (typeof id !== "string") continue;
        for (const [attrKey, attrValue] of Object.entries(obj)) {
          if (attrKey === "@id") continue;
          attributes[`${key}/${id}/${attrKey}`] = attrValue;
        }
      }
    } else if (typeof value === "number") {
      // Already normalized — number_of_instances count stored directly
      entityCounts[key] = value;
    } else {
      attributes[key] = value;
    }
  }

  return { attributes, entityCounts };
}

/**
 * Normalizes an exported timeline so that number_of_instances response data
 * is stored as a count rather than the post-transform array.
 *
 * transformResponse converts a submitted count (e.g. 1) into an array of
 * stub instances (e.g. [{ "@id": "..." }]). The API stores and returns that
 * array in the timeline. For replay and Playwright generation we need the
 * count form, because manager.next() will call transformResponse again.
 *
 * Only top-level screen controls are checked, matching the behaviour of
 * transformResponse itself (which also only reads session.screen.controls).
 */
export function exportTransformTimeline(timeline: InterviewTimeline): InterviewTimeline {
  return {
    ...timeline,
    questions: timeline.questions.map((question) => {
      if (!question.response?.data) return question;

      const topLevelControls = question.asking.screen.controls ?? [];
      const instanceControls = topLevelControls.filter(
        (c) => c.type === "number_of_instances" && typeof c.entity === "string",
      );

      if (instanceControls.length === 0) return question;

      const data = { ...question.response.data };
      let changed = false;

      for (const control of instanceControls) {
        const entity = control.entity as string;
        const value = data[entity];
        if (Array.isArray(value)) {
          data[entity] = value.length;
          changed = true;
        }
      }

      if (!changed) return question;

      return {
        ...question,
        response: { ...question.response, data },
      };
    }),
  };
}

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
    const { attributes, entityCounts } = buildLookupMaps(question.response?.data ?? {});

    if (title) {
      lines.push(`  // Step: "${title}"`);
      lines.push(`  await expect(harness.getScreenTitle()).toHaveText(${JSON.stringify(title)});`);
    }

    for (const control of collectControls(controls)) {
      if (!control.label) continue;

      let value: unknown;

      if (control.type === "number_of_instances" && control.entity) {
        value = entityCounts[control.entity];
      } else if (control.attribute) {
        value = attributes[control.attribute];
      }

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

import type {
  BooleanControl,
  CertaintyContainerControl,
  CurrencyControl,
  DataContainerControl,
  DateControl,
  EntityControl,
  FileControl,
  InterviewContainerControl,
  NumberControl,
  NumberOfInstancesControl,
  OptionsControl,
  RenderableCertaintyContainerControl,
  RenderableControl,
  RenderableDataContainerControl,
  RenderableEntityControl,
  RenderableInterviewContainerControl,
  RenderableSwitchContainerControl,
  RepeatingContainerControl,
  SwitchContainerControl,
  TextControl,
  TimeControl,
  TypographyControl,
} from "@imminently/interview-sdk";

export const numberControl = (overrides: Partial<NumberControl> = {}): NumberControl => ({
  type: "number",
  id: "age",
  attribute: "age",
  label: "Age",
  ...overrides,
});

export const booleanControl = (overrides: Partial<BooleanControl> = {}): BooleanControl => ({
  type: "boolean",
  id: "subscribed",
  attribute: "subscribed",
  label: "Subscribed",
  ...overrides,
});

export const currencyControl = (overrides: Partial<CurrencyControl> = {}): CurrencyControl => ({
  type: "currency",
  id: "salary",
  attribute: "salary",
  label: "Salary",
  symbol: "$",
  ...overrides,
});

export const dateControl = (overrides: Partial<DateControl> = {}): DateControl => ({
  type: "date",
  id: "dob",
  attribute: "dob",
  label: "Date of birth",
  ...overrides,
});

export const textControl = (overrides: Partial<TextControl> = {}): TextControl => ({
  type: "text",
  id: "name",
  attribute: "name",
  label: "Name",
  ...overrides,
});

export const timeControl = (overrides: Partial<TimeControl> = {}): TimeControl => ({
  type: "time",
  id: "appointment",
  attribute: "appointment",
  label: "Appointment time",
  ...overrides,
});

export const radioControl = (overrides: Partial<OptionsControl> = {}): OptionsControl => ({
  type: "options",
  id: "color",
  attribute: "color",
  label: "Favourite colour",
  asRadio: true,
  options: [
    { label: "Red", value: "red" },
    { label: "Blue", value: "blue" },
  ],
  ...overrides,
});

export const selectControl = (overrides: Partial<OptionsControl> = {}): OptionsControl => ({
  type: "options",
  id: "country",
  attribute: "country",
  label: "Country",
  options: [
    { label: "Australia", value: "au" },
    { label: "New Zealand", value: "nz" },
  ],
  ...overrides,
});

export const numberOfInstancesControl = (
  overrides: Partial<NumberOfInstancesControl> = {},
): NumberOfInstancesControl => ({
  type: "number_of_instances",
  id: "children_count",
  attribute: "children_count",
  entity: "child",
  label: "Number of children",
  ...overrides,
});

export const typographyControl = (overrides: Partial<TypographyControl> = {}): TypographyControl => ({
  type: "typography",
  id: "heading",
  text: "Some heading",
  style: "h2",
  ...overrides,
});

export const fileControl = (overrides: Partial<FileControl> = {}): FileControl => ({
  type: "file",
  id: "resume",
  attribute: "resume",
  label: "Resume",
  ...overrides,
});

export const entityControl = (overrides: Partial<RenderableEntityControl> = {}): RenderableEntityControl => ({
  type: "entity",
  id: "members",
  entity: "household_member",
  label: "Household members",
  template: [numberControl({ id: "member_age", attribute: "household_member/age", label: "Age" })],
  instances: [],
  ...overrides,
});

export const switchContainerControl = (
  overrides: Partial<RenderableSwitchContainerControl> = {},
): RenderableSwitchContainerControl => ({
  type: "switch_container",
  id: "switch-1",
  outcome_true: [textControl({ id: "true-child", attribute: "true_child", label: "True child" })],
  outcome_false: [textControl({ id: "false-child", attribute: "false_child", label: "False child" })],
  branch: "true",
  ...overrides,
});

export const certaintyContainerControl = (
  overrides: Partial<RenderableCertaintyContainerControl> = {},
): RenderableCertaintyContainerControl => ({
  type: "certainty_container",
  id: "certainty-1",
  attribute: "certainty_attr",
  certain: [textControl({ id: "certain-child", attribute: "certain_child", label: "Certain child" })],
  uncertain: [textControl({ id: "uncertain-child", attribute: "uncertain_child", label: "Uncertain child" })],
  branch: "certain",
  ...overrides,
});

export const repeatingContainerControl = (
  overrides: Partial<RepeatingContainerControl<RenderableControl>> = {},
): RepeatingContainerControl<RenderableControl> => ({
  type: "repeating_container",
  id: "repeating-1",
  entity: "household_member",
  display: "list",
  controls: [textControl({ id: "repeat-child", attribute: "repeat_child", label: "Repeat child" })],
  ...overrides,
});

export const dataContainerControl = (
  overrides: Partial<RenderableDataContainerControl> = {},
): RenderableDataContainerControl => ({
  type: "data_container",
  id: "data-1",
  label: "Summary",
  columns: 1,
  controls: [currencyControl({ id: "data-currency", attribute: "data_currency", value: 100 })],
  ...overrides,
});

export const interviewContainerControl = (
  overrides: Partial<RenderableInterviewContainerControl> = {},
): RenderableInterviewContainerControl => ({
  type: "interview_container",
  id: "sub-interview-1",
  label: "Sub interview",
  interviewRef: {
    interactionMode: "same-session",
    workspaceId: "workspace-1",
    projectId: "project-1",
    interviewId: "interview-1",
  },
  ...overrides,
});

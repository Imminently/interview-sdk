import type { AiOptions, EntityInstance, EntityValue, FileAttributeValue } from "./core";

export type LabelDisplay = "automatic" | "separate" | "inline";

interface BaseControl {
  id: string;
  type: string;
  attribute?: string;
  version?: number;
}

// schema controls

export interface GenerativeChatControl extends BaseControl {
  type: "generative_chat";
  goal: string;
  initialMessage: string;
  aiOptions?: AiOptions;
  required?: boolean;
  showDataInline?: boolean;
}

/**
 * A control to collect a true or false response from a user. Usually rendered as a checkbox.
 * Note: the control needs to allow for an indeterminate (or uncertain) response - i.e. the
 * user did not provide an answer. You can't send back undefined as the server will interpret
 * that as requiring an answer again later. Send back null to mark the question as reviewed
 * but not
 }answered.
 */
export interface BooleanControl extends BaseControl {
  // unique id of the control
  id: string;
  type: "boolean";
  label?: string;
  labelDisplay?: LabelDisplay;
  /** Manually assign a class name to the control, so you can style it with CSS, or easily query this element in the DOM */
  customClassName?: string;
  /** Allows for a longer description of the control to be displayed with the label (generally below the label). Explanations are usually on a tooltip that need to be hovered over */
  longDescription?: string;
  sxForSeparateLabel?: Record<string, unknown>;
  labelLength?: number;
  required?: true;
  disabled?: true;
  default?: boolean;
  value?: boolean | null;
  // The GUID of the attribute
  attribute: string;
  showExplanation?: boolean;
  readOnly?: boolean;
}

/**
 * @deprecated Use `BooleanControl` instead
 */
export type IBoolean = BooleanControl;

/**
 * A number input for inputting currency values. This should:
 * - Show the currency symbol
 * - Allow only numbers to be inputted. There is no restriction on the number of decimal places
 * - Negative numbers are allowed (unless the min is set to 0)
 */
export interface CurrencyControl extends BaseControl {
  /** unique id of the control */
  id: string;
  type: "currency";
  label?: string;
  labelDisplay?: LabelDisplay;
  customClassName?: string;
  sxForSeparateLabel?: Record<string, unknown>;
  labelLength?: number;
  required?: true;
  disabled?: true;
  default?: number;
  /** uuid */
  attribute: string;
  value?: number | null;
  /** @default '$'' */
  symbol?: string;
  /** Minimum number allowed - if not set assume no restriction */
  min?: number;
  /** Maximum number allowed - if not set assume no restriction */
  max?: number;
  showExplanation?: boolean;
  readOnly?: boolean;
}

/** Collects or displays a numeric value from/to the user. */
export interface NumberControl extends BaseControl {
  /** unique id of the control */
  id: string;
  type: "number";
  label?: string;
  labelDisplay?: LabelDisplay;
  customClassName?: string;
  sxForSeparateLabel?: Record<string, unknown>;
  labelLength?: number;
  required?: true;
  disabled?: true;
  /** uuid */
  attribute: string;
  /** current numeric value */
  value?: number | null;
  /** numeric default */
  default?: number;
  /** Numeric-only configuration */
  numericalOptions?: {
    /** The minimum numeric value allowed */
    min?: number;
    /** The maximum numeric value allowed */
    max?: number;
    /** Whether decimal values are allowed (false means integers only) */
    allowDecimals?: boolean;
    /** If decimals are allowed, restrict to this many decimal places */
    maxDecimalPlaces?: number;
  };
  showExplanation?: boolean;
  readOnly?: boolean;
}

/**
 * @deprecated Use `CurrencyControl` instead
 */
export type ICurrency = CurrencyControl;

/**
 * when we work with min/max/default date in an interview designer, \
 * we have several possible values that can be assigned to these:
 * - "now" literal value, which means "right now, this moment \
 * of time", and this is used when we want to use the date\
 * at which interview is being filled in by the user
 * - "YYYY-MM-DD"-like string, i.e. date that is formatted using \
 * this string and is exactly 10 characters long
 * - "{{some attribute name}}" - a very special value, that \
 * references another attribute in the graph. It must not have any\
 * trailing or leading whitespaces, no whitespaces between left or\
 * right bracket and the attribute, and have no | (which is an  \
 * attribute format description, I believe). \
 * **IMPORTANT** while this is a valid variant for interview designer\
 * to input, we don't expect BE to respond with this exact value \
 * when hydrating a Session for an interview runtime,\
 * instead it will replace this value with "YYYY-MM-DD" formatted \
 * string, that corresponds to referenced attribute.
 */
export type DateControlThreeVariantDate = string | "now";
/**
 * Allow a user to enter a date. This should send an ISO date string back to the server ('YYYY-MM-DD').
 * Do not send a time component back.
 */
export interface DateControl extends BaseControl {
  /** unique id of the control */
  id: string;
  type: "date";
  label?: string;
  labelDisplay?: LabelDisplay;
  customClassName?: string;
  sxForSeparateLabel?: Record<string, unknown>;
  labelLength?: number;
  required?: true;
  disabled?: true;
  allowManual?: true;
  /** uuid */
  attribute: string;
  /** 'YYYY-MM-DD' */
  value?: string | null;
  /** 'YYYY-MM-DD' */
  default?: DateControlThreeVariantDate;
  /** Minimum date allowed */
  min?: DateControlThreeVariantDate;
  /** Maximum date allowed */
  max?: DateControlThreeVariantDate;
  showExplanation?: boolean;
  readOnly?: boolean;
}

/**
 * @deprecated Use `DateControl` instead
 */
export type IDate = DateControl;

/**
 * pretty strange format, because it's from date-fns
 * @link https://date-fns.org/v2.16.1/docs/format. \
 * For some reason their approach is that dd is "day \
 * of month" but DD is "day of year" (in dayjs DD is\
 * "day of month")
 */
export const DATE_FORMAT = "yyyy-MM-dd";

/**
 * Allow a user to enter a time. This should send an ISO time string back to the server ('HH:mm:ss').
 * Do not send a date component back.
 */
export interface TimeControl extends BaseControl {
  /** unique id of the control */
  id: string;
  type: "time";
  label?: string;
  labelDisplay?: LabelDisplay;
  customClassName?: string;
  sxForSeparateLabel?: Record<string, unknown>;
  labelLength?: number;
  required?: true;
  disabled?: true;
  /** uuid */
  attribute: string;
  /** 'HH:mm:ss' */
  value?: string | null;
  /** 'HH:mm:ss' */
  default?: string;
  /** Minimum time allowed, 'HH:mm:ss' */
  min?: string;
  /** Maximum time allowed, 'HH:mm:ss' */
  max?: string;
  /**
   * Whether to display time with an 'AM/PM' or in 24 hour time.
   * Regardless of this input the server expects 24 hour time
   */
  amPmFormat?: true;
  /** Eg: 15 = only allow time in 15 minute increments (3:00, 3:15, 3:30, 3:45). The increment is assumed to start from the hour and will not be greater than 60 */
  minutes_increment?: number;
  allowSeconds?: true;
  showExplanation?: boolean;
  readOnly?: boolean;
}

/**
 * @deprecated Use `TimeControl` instead
 */
export type ITime = TimeControl;

export const TIME_FORMAT_24 = "HH:mm:ss";
export const TIME_FORMAT_12 = "h:mm:ss a";

/**
 * Allow a user to enter a date and time in one control. This should send an ISO date time string back to the server ('YYYY-MM-DD HH:mm:ssZ').
 * It's metadata is basically a merge of the date and time, but with seperate min/max.
 */
export interface DateTimeControl extends BaseControl {
  /** unique id of the control */
  id: string;
  type: "datetime";
  label?: string;
  labelDisplay?: LabelDisplay;
  customClassName?: string;
  sxForSeparateLabel?: Record<string, unknown>;
  labelLength?: number;
  required?: true;
  disabled?: true;
  /** uuid */
  attribute: string;
  /** 'YYYY-MM-DD HH:mm:ss' */
  value?: string | null;
  /** 'YYYY-MM-DD HH:mm:ss' */
  default?: string;
  /** 'YYYY-MM-DD', 'now' */
  date_min?: string | "now";
  /** 'YYYY-MM-DD', 'now' */
  date_max?: string | "now";
  /** 'HH:mm:ss' */
  time_min?: string;
  /** 'HH:mm:ss' */
  time_max?: string;
  /** Whether to display time with an 'AM/PM' or in 24 hour time.
   *  Regardless of this input the server expects 24 hour time
   */
  amPmFormat?: true;
  /** Eg: 15 = only allow time in 15 minute increments (3:00, 3:15, 3:30, 3:45). The increment is assumed to start from the hour and will not be greater than 60 */
  minutes_increment?: number;
  /** mui picker doesn't have this control */
  // allow_seconds?: true;
  showExplanation?: boolean;
  readOnly?: boolean;
}

/**
 * @deprecated Use `DateTimeControl` instead
 */
export type IDateTime = DateTimeControl;

export const DATE_TIME_FORMAT_24 = `${DATE_FORMAT} ${TIME_FORMAT_24}`;
export const DATE_TIME_FORMAT_12 = `${DATE_FORMAT} ${TIME_FORMAT_12}`;

export interface Option {
  label?: string;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  value: any;
}

/**
 * Allow a user to select from a predefined list of options (eg: a dropdown or a radio button).
 * ```text
 * Note: the design time UI shows the options within a single field in the form:
 * <label>:<value>
 * <label>:<value>
 * This should be converted into (and out of) the above format when sending to the server
 * ```
 * <br/>
 *
 * ```text
 * Note: the enum_id is only used in design time.
 * It signifies if the attribute should use a predefined enumeration.
 * The run time API will detect this and auto populate the options
 * attribute (and not send the enum_id to the client.
 * ```
 */
export interface OptionsControl extends BaseControl {
  /** unique id of the control */
  id: string;
  type: "options";
  /**
   * Display as a series of radio buttons. \
   * Default display as standart select
   */
  asRadio?: true;
  label?: string;
  labelDisplay?: LabelDisplay;
  customClassName?: string;
  sxForSeparateLabel?: Record<string, unknown>;
  labelLength?: number;
  required?: true;
  disabled?: true;
  value?: string | boolean | null;
  default?: string | boolean;
  /** uuid */
  attribute: string;
  /** design and runtime */
  options?: Array<Option>;
  /** Allow a user to add their own option, not in the list, in */
  allow_other?: true;
  /** uuid, design time only */
  enum_id?: string;
  showExplanation?: boolean;
  readOnly?: boolean;
}

/**
 * @deprecated Use `OptionsControl` instead
 */
export type IOptions = OptionsControl;

/**
 * **IMPORTANT** This is not currently supported\
 * Allow a user to upload a file. This metadata is still under construction
 */
export interface FileControl extends BaseControl {
  /** unique id of the control */
  id: string;
  type: "file";
  label?: string;
  labelDisplay?: LabelDisplay;
  customClassName?: string;
  sxForSeparateLabel?: Record<string, unknown>;
  labelLength?: number;
  required?: true;
  /** uuid */
  attribute: string;
  value?: FileAttributeValue | null;
  /** The max number of files that can be uploaded. Defaults to 1 */
  max?: number;
  /**
   * The types of file allowed (".pdf", ".docx", etc).\
   * **IMPORTANT**: values have to start with a dot  as they will be passed directly \
   * to an "accept" attribute of HTMLInputElement with type: "file". Alternatively\
   * those can be one of valid MIME-types
   */
  file_type?: string[];
  /** The maximum size of a document, in Mb */
  max_size?: number;
  showExplanation?: boolean;
  readOnly?: boolean;
}

/**
 * @deprecated Use `FileControl` instead
 */
export type IFile = FileControl;

/**
 * Display an image to the user. This does not collect any information from the user
 * ```text
 * Note: We may need other attributes to help display the image properly (height, width, stretch?).
 * Should provide enough to show an image reasonably, but more advanced stuff should really
 * be done in code in the SDK
 * ```
 */
export interface ImageControl extends BaseControl {
  id: string;
  type: "image";
  /** The base64 date URI of the image */
  data: string;
}

/**
 * @deprecated Use `ImageControl` instead
 */
export type IImage = ImageControl;

/**
 * Collects the number of instances of an entity the user will want. \
 * This will be used to control the repetition of steps to collect information \
 * for these instances. See . This should be displayed as a number input field \
 * or a dropdown (if the max is known and it makes more sense to display that way)\
 * \
 * The response to the server at run time is a little different for this control.\
 * See the link above for more detail.
 */
export interface NumberOfInstancesControl extends BaseControl {
  /** unique id of the control */
  id: string;
  type: "number_of_instances";
  label?: string;
  labelDisplay?: LabelDisplay;
  customClassName?: string;
  sxForSeparateLabel?: Record<string, unknown>;
  labelLength?: number;
  required?: true;
  default?: EntityInstance[];
  disabled?: true;
  value?: NumberOfInstancesControl["default"] | null;
  template?: Control[];
  /** The name of the entity */
  entity: string;
  /**
   * The minimum number of instances. 0 or greater.
   */
  min?: number;
  max?: number;
  readOnly?: boolean;
}

/**
 * @deprecated Use `NumberOfInstancesControl` instead
 */
export type INumberOfInstances = NumberOfInstancesControl;

/** Collects text from the user.  */
export interface TextControl extends BaseControl {
  /** unique id of the control */
  id: string;
  type: "text";
  label?: string;
  labelDisplay?: LabelDisplay;
  customClassName?: string;
  sxForSeparateLabel?: Record<string, unknown>;
  labelLength?: number;
  required?: true;
  disabled?: true;
  default?: string;
  /** uuid */
  attribute: string;
  value?: string | null;
  /** The maximum length of the string */
  max?: number;
  variation?: { type: "email" } | { type: "number" };
  multi?: {
    maxRows?: number;
    minRows?: number;
  };
  showExplanation?: boolean;
  readOnly?: boolean;
}

/**
 * @deprecated Use `TextControl` instead
 */
export type IText = TextControl;

/**
 * Denotes when documentation should be supplied/uploaded
 */
export interface DocumentControl extends BaseControl {
  id: string;
  type: "document";
  label?: string;
  attribute: string;
  required?: boolean;
  disabled?: true;
  maxSizeBytes?: number;
  /**
   * we'll manipulate these together, but it's easier if they are defined separately,
   * as one mime type can have multiple extensions, and one extension can have multiple mime types
   * e.g.
   */
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

/**
 * Display text to the user. This differs from the text control above, \
 * which collects text from the user.\
 * The end-styling of the text is up to the run time.
 */
export interface TypographyControl extends BaseControl {
  id: string;
  type: "typography";
  text: string;
  label?: string;
  customClassName?: string;
  style:
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "subtitle1"
    | "subtitle2"
    | "body1"
    | "body2"
    | "caption"
    | "banner-green"
    | "banner-yellow"
    | "banner-red";
  emoji?: string;
  /** `columnHeading` is relevant only when nested within a repeat_container, and will otherwise be ignored */
  columnHeading?: string;
  /** `columnWidth` is relevant only when nested within a repeat_container, and will otherwise be ignored */
  columnWidth?: number;
}

/**
 * @deprecated Use `TypographyControl` instead
 */
export type ITypography = TypographyControl;

/**
 * Collect information about instances (of an entity) within a tabular structure.
 */
export interface EntityControl<C = Control> extends BaseControl {
  /** unique id of the control */
  id: string;
  type: "entity";
  label?: string;
  labelDisplay?: LabelDisplay;
  sxForSeparateLabel?: Record<string, unknown>;
  labelLength?: number;
  /** The name of the entity */
  entity: string;
  /** Should all the fields be vertical (like table columns) or horizontal (individual rows, table-like) */
  /** describes single 'row' of entries, each of which has all controls from `template` */
  display?: "horizontal" | "vertical";
  template: C[];
  value?: EntityValue[];
  /** min number of instances */
  min?: number;
  max?: number;
  showExplanation?: boolean;
  entityId?: string;
}

/**
 * @deprecated Use `EntityControl` instead
 */
export type IEntity = EntityControl;

//#region container

export interface RepeatingContainerControl<C = Control> extends BaseControl {
  id: string;
  type: "repeating_container";
  entity: string;
  /** if `display` is `undefined` we should assume `"list"` */
  display?: "list" | "table";
  /** `filter` is an attributeId and is only relevant when `display` is `"table"` */
  filter?: string | null;
  /** `sort` is an attributeId and is only relevant when `display` is `"table"` */
  sort?: string | null;
  /** `showBorders` is only relevant when `display` is `"table"` and is defaulted to `true` if not set */
  showBorders?: boolean;
  /** `showHeaders` is only relevant when `display` is `"table"` and is defaulted to `true` if not set */
  showHeaders?: boolean;
  /** indicates if this is the first instance of a repeating series (calculated at runtime) */
  isFirst?: boolean;
  isLast?: boolean;
  controls: C[];
}

export interface CertaintyContainerControl<C = Control> extends BaseControl {
  id: string;
  type: "certainty_container";
  attribute: string;
  certain: C[];
  uncertain: C[];
  /** `columnHeading` is relevant only when nested within a repeat_container, and will otherwise be ignored */
  columnHeading?: string;
  /** `columnWidth` is relevant only when nested within a repeat_container, and will otherwise be ignored */
  columnWidth?: number;
}

export interface SwitchContainerControl<C = Control> extends BaseControl {
  id: string;
  type: "switch_container";
  outcome_true: C[];
  outcome_false: C[];
  condition?: ConditionExpression;
  kind?: "dynamic" | "static";
  /** `columnHeading` is relevant only when nested within a repeat_container, and will otherwise be ignored */
  columnHeading?: string;
  /** `columnWidth` is relevant only when nested within a repeat_container, and will otherwise be ignored */
  columnWidth?: number;
}

export interface DataContainerControl extends BaseControl {
  id: string;
  type: "data_container";
  label: string;
  columns: number;
  controls: Array<
    | BooleanControl
    | CurrencyControl
    | DateControl
    | TimeControl
    | DateTimeControl
    | OptionsControl
    | FileControl
    | ImageControl
    | NumberOfInstancesControl
    | TextControl
    | DocumentControl
  >;
}

/** Allows for an interview to be embedded within another interview */
export interface InterviewContainerControl extends BaseControl {
  type: "interview_container";
  label?: string;
  labelDisplay?: LabelDisplay;
  required?: true;
  showExplanation?: boolean;
  /** may point to interviews from different workspaces and/or projects */
  interviewRef: {
    /** available options will vary depending on whether the interview is within the same project or not */
    interactionMode: "same-session" | "new-session" | "different-project";
    workspaceId: string;
    /** only specify the project ID and not the release because we'll always take the latest */
    projectId: string;
    interviewId: string;
  };
  /** optional JSON string */
  initialData?: string;

  attribute?: never;
}

// renderable controls

export interface EntityControlInstance {
  id: string;
  controls: RenderableControl[];
}

export interface RenderableEntityControl extends EntityControl<RenderableControl> {
  instances: EntityControlInstance[];
}

export interface RenderableSwitchContainerControl extends SwitchContainerControl<RenderableControl> {
  branch?: "true" | "false";
}

export interface RenderableCertaintyContainerControl extends CertaintyContainerControl<RenderableControl> {
  branch?: "certain" | "uncertain";
}

export interface RenderableRepeatingContainerControl extends RepeatingContainerControl<RenderableControl> {}

export interface RenderableDataContainerControl extends DataContainerControl {}

export interface RenderableInterviewContainerControl extends InterviewContainerControl {}

// conditions

export type ConditionType =
  | "equals"
  | "not-equals"
  | "and"
  | "or"
  | "less-than"
  | "less-than-equals"
  | "greater-than"
  | "greater-than-equals";

export interface ConditionValue {
  type: "value" | "attribute";
  // one or the other, not both
  value?: string | boolean | null;
  attributeId?: string | null;
}

export interface ConditionExpression {
  type: ConditionType;
  elements: Array<ConditionValue | ConditionExpression>;
}

//#endregion

export type RenderableControl = (
  | BooleanControl
  | CurrencyControl
  | NumberControl
  | DateControl
  | TimeControl
  | DateTimeControl
  | OptionsControl
  | FileControl
  | ImageControl
  | NumberOfInstancesControl
  | TextControl
  | TypographyControl
  | DocumentControl
  | GenerativeChatControl
  | RenderableEntityControl
  | RenderableSwitchContainerControl
  | RenderableCertaintyContainerControl
  | RenderableRepeatingContainerControl
  | RenderableDataContainerControl
  | RenderableInterviewContainerControl
) & {
  loading?: boolean;
  dynamicAttributes?: string[];
};
export type RenderableControlType = RenderableControl["type"];

export type Control =
  | BooleanControl
  | CurrencyControl
  | NumberControl
  | DateControl
  | TimeControl
  | DateTimeControl
  | OptionsControl
  | FileControl
  | ImageControl
  | NumberOfInstancesControl
  | TextControl
  | TypographyControl
  | DocumentControl
  | EntityControl
  | GenerativeChatControl
  | RepeatingContainerControl
  | CertaintyContainerControl
  | SwitchContainerControl
  | DataContainerControl
  | InterviewContainerControl;
export type ControlType = Control["type"];

export interface ControlsValue {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  [controlUUID: string]: any;
}

/**
 * @deprecated Use `ControlValue` instead
 */
export type IControlsValue = ControlsValue;

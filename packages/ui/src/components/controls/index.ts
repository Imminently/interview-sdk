import { BooleanFormControl } from "./BooleanControl";
import { CurrencyFormControl } from "./CurrencyControl";
import { DateFormControl } from "./DateControl";
import { EntityFormControl } from "./EntityFormControl";
// import { DateTimeControl } from "./DateTimeControl";
import { Explanation } from "./Explanation";
import { FileFormControl } from "./FileControl";
import { RadioFormControl } from "./RadioControl";
import { NumberFormControl } from "./NumberControl";
import { SelectFormControl } from "./SelectControl";
import { TextFormControl } from "./TextControl";
import { TimeFormControl } from "./TimeControl";
import { Typography } from "./Typography";
import { ComboboxFormControl } from "./ComboboxControl";
import { MarkdownControl } from "./MarkdownControl";

export * from "./Explanation";
// export in case they want to make their own
export { useCombobox } from "./ComboboxControl";

export default Object.assign(
  {},
  {
    Boolean: BooleanFormControl,
    Combobox: ComboboxFormControl,
    Currency: CurrencyFormControl,
    Date: DateFormControl,
    // Datetime: DateTimeControl,
    Entity: EntityFormControl,
    File: FileFormControl,
    Error: Error,
    Explanation: Explanation,
    Radio: RadioFormControl,
    Number: NumberFormControl,
    Select: SelectFormControl,
    Text: TextFormControl,
    Time: TimeFormControl,
    Typography: Typography,
    Markdown: MarkdownControl,
  },
);

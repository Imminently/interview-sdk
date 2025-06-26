import { BooleanFormControl } from "./BooleanControl";
import { CurrencyFormControl } from "./CurrencyControl";
import { DateFormControl } from "./DateControl";
import { EntityFormControl } from "./EntityFormControl";
// import { DateTimeControl } from "./DateTimeControl";
import { Error } from "./Error";
import { Explanation } from "./Explanation";
import { FileFormControl } from "./FileControl";
import { TextFormControl } from "./TextControl";
import { TimeFormControl } from "./TimeControl";
import { Typography } from "./Typography";

export * from "./Explanation";
export * from "./Error";

export default Object.assign({}, {
  Boolean: BooleanFormControl,
  Currency: CurrencyFormControl,
  Date: DateFormControl,
  // Datetime: DateTimeControl,
  Entity: EntityFormControl,
  File: FileFormControl,
  Error: Error,
  Explanation: Explanation,
  Text: TextFormControl,
  Time: TimeFormControl,
  Typography: Typography,
});
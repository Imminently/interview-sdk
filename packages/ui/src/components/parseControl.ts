import { parseBooleanControl } from "./controls/BooleanControl";
import { parseCurrencyControl } from "./controls/CurrencyControl";
import { parseDateControl } from "./controls/DateControl";
import { parseNumberControl } from "./controls/NumberControl";
import { parseNumberOfInstancesControl } from "./controls/NumberOfInstancesControl";
import { parseRadioControl } from "./controls/RadioControl";
import { parseTimeControl } from "./controls/TimeControl";

// basic utility to parse a control object and return a format useable by the form/ui
export const parseControl = (control: any) => {
  switch (control.type) {
    case "boolean":
      return parseBooleanControl(control);
    case "currency":
      return parseCurrencyControl(control);
    case "date":
      return parseDateControl(control);
    case "number":
      return parseNumberControl(control);
    case "number_of_instances":
      return parseNumberOfInstancesControl(control);
    case "time":
      return parseTimeControl(control);
    case "options":
      if (control.asRadio) {
        return parseRadioControl(control);
      }
      return control;
    default:
      // default to do nothing
      return control;
  }
};

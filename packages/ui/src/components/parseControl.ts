import { parseDateControl } from "./controls/DateControl";
import { parseRadioControl } from "./controls/RadioControl";

// basic utility to parse a control object and return a format useable by the form/ui
export const parseControl = (control: any) => {
  switch (control.type) {
    case "date":
      return parseDateControl(control);
    case "options":
      // if (control.asRadio) {
      //   return parseRadioControl(control);
      // }
      return control;
    default:
      // default to do nothing
      return control;
  }
};

import { CertaintyContainer } from "./CertaintyContainer";
import { DataContainer } from "./DataContainer";
import { InterviewContainer } from "./InterviewContainer";
import { RepeatingContainer } from "./RepeatingContainer";
import { SwitchContainer } from "./SwitchContainer";

export * from "./CertaintyContainer";
export * from "./DataContainer";
export * from "./InterviewContainer";
export * from "./RepeatingContainer";
export * from "./SwitchContainer";

export default Object.assign(
  {},
  {
    Certainty: CertaintyContainer,
    Data: DataContainer,
    Interview: InterviewContainer,
    Repeating: RepeatingContainer,
    Switch: SwitchContainer,
  },
);

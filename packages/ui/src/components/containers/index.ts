import { CertaintyContainer } from "./CertaintyContainer";
import { InterviewContainer } from "./InterviewContainer";
import { RepeatingContainer } from "./RepeatingContainer";
import { SwitchContainer } from "./SwitchContainer";

export * from "./CertaintyContainer";
export * from "./InterviewContainer";
export * from "./RepeatingContainer";
export * from "./SwitchContainer";

export default Object.assign(
  {},
  {
    Certainty: CertaintyContainer,
    Interview: InterviewContainer,
    Repeating: RepeatingContainer,
    Switch: SwitchContainer,
  },
);

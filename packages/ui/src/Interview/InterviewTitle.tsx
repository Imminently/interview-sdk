import { getInterviewComponent } from "../providers/InterviewProvider";

export const InterviewTitle = (props: any) => {
  const { className } = props;
  let title = getInterviewComponent('screen.title');
  return <h1 className={className}>{title}</h1>;
};
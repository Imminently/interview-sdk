export interface ValueRenderProps {
  value: any;
}

const ValueRender = (props: ValueRenderProps) => {
  const { value } = props;
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (value === null) {
    return "Uncertain";
  }
  if (value === undefined) {
    return "Unknown";
  }
  return value;
};

export default ValueRender;

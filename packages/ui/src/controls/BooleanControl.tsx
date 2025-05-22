
export const BooleanControl = (props: any) => {
  const { label } = props;
  return (
    <div>
      <label htmlFor="boolean-control">{label}</label>
      <input type="checkbox" id="boolean-control" />
    </div>
  )
}
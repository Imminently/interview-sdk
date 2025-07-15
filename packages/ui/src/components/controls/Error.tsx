import { useFormContext } from "react-hook-form";

/**
 * @deprecated
 * A non FormControl error component that displays errors for a specific control by name.
 * It uses the form state to find errors related to the control's name.
 * 
 * In most cases, you should use the `FormMessage` component instead.
 *
 * @param name - The name of the control to display errors for.
 */
export const Error = ({ name }: { name: string }) => {
  const { formState } = useFormContext();
  const error = formState.errors?.[name];

  if (!error) return null;

  return (
    <div data-name={name} data-slot="form-error">
      {Array.isArray(error)
        ? error.map((err: any, i: number) => <div key={i}>{err?.message ?? String(err)}</div>)
        : <div>{(error as any)?.message ?? String(error)}</div>
      }
    </div>
  );
};
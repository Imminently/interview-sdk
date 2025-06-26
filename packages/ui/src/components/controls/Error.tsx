import { useFormContext } from "react-hook-form";

/**
 * @deprecated Use `FormMessage` instead.
 */
export const Error = ({ id }: { id: string }) => {
  // const interview = useInterview();
  const { formState } = useFormContext();
  const error = formState.errors?.[id];

  // const name: string = useAttributeToFieldName(attribute) ?? control.entity;
  // // TODO this appears to be the same value
  // // const pathedAttribute = attributeToPath(attribute, interview.session.data, getValues(), false);

  // const pathedAttribute = name;

  // const validations = control.attribute
  //   ? // we want the validation with the least number of attributes first
  //   interview.session.validations
  //     ?.filter((v) => v.shown && v.attributes.includes(pathedAttribute as string))
  //     .sort((a, b) => a.attributes.length - b.attributes.length)
  //   : undefined;
  // const firstValidation = validations?.[0];

  // const validationSeverity = firstValidation?.severity;
  // const validationMessage = firstValidation?.message;
  // const resolvedError = error?.message
  //         ? (error as FormControlError)
  //         : validationSeverity === "error"
  //           ? { message: validationMessage as string }
  //           : undefined;
  // const message = resolvedError?.message ?? validationMessage;

  if (!error) return null;

  return (
    <div data-id={id} className="dcsvly-error-root">
      {Array.isArray(error)
        ? error.map((err: any, i: number) => <div key={i}>{err?.message ?? String(err)}</div>)
        : <div>{(error as any)?.message ?? String(error)}</div>
      }
    </div>
  );
};
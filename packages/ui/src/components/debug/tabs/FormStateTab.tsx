import { useFormContext } from "react-hook-form";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h4 className="font-semibold mb-1.5 text-xs uppercase tracking-wide text-gray-500">{title}</h4>
    {children}
  </section>
);

const JsonBlock = ({ value }: { value: unknown }) => (
  <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-2 overflow-auto max-h-40">
    <code>{JSON.stringify(value, null, 2)}</code>
  </pre>
);

const Flag = ({ label, active }: { label: string; active: boolean }) => (
  <span
    className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
      active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
    }`}
  >
    {label}
  </span>
);

export const FormStateTab = () => {
  const { formState } = useFormContext();
  const {
    isDirty,
    isLoading,
    isSubmitted,
    isSubmitSuccessful,
    isSubmitting,
    isValid,
    isValidating,
    submitCount,
    dirtyFields,
    touchedFields,
    errors,
  } = formState;

  return (
    <div className="p-4 flex flex-col gap-4 text-sm">
      <Section title="Status flags">
        <div className="flex flex-wrap gap-1.5">
          <Flag label="dirty" active={isDirty} />
          <Flag label="valid" active={isValid} />
          <Flag label="loading" active={isLoading} />
          <Flag label="submitting" active={isSubmitting} />
          <Flag label="submitted" active={isSubmitted} />
          <Flag label="submitOk" active={isSubmitSuccessful} />
          <Flag label="validating" active={isValidating} />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Submit count: <span className="font-mono">{submitCount}</span>
        </p>
      </Section>

      <Section title="Errors">
        {Object.keys(errors).length === 0 ? (
          <p className="text-xs text-gray-400 italic">No errors</p>
        ) : (
          <JsonBlock value={errors} />
        )}
      </Section>

      <Section title="Touched fields">
        {Object.keys(touchedFields).length === 0 ? (
          <p className="text-xs text-gray-400 italic">None touched</p>
        ) : (
          <JsonBlock value={touchedFields} />
        )}
      </Section>

      <Section title="Dirty fields">
        {Object.keys(dirtyFields).length === 0 ? (
          <p className="text-xs text-gray-400 italic">None dirty</p>
        ) : (
          <JsonBlock value={dirtyFields} />
        )}
      </Section>
    </div>
  );
};

import { useTheme } from "@/providers";
import { type OptionsControl } from "@imminently/interview-sdk";
import { useController, useFormContext } from "react-hook-form";
import {
  Combobox,
  ComboboxContent,
  ComboboxData,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger
} from "../ui/combobox";
import { FormControl, FormDescription, FormLabel, FormMessage, useFormField } from "../ui/form";
import { Explanation } from "./Explanation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useInterview } from "@/interview";
import { debounce } from "lodash-es";

export type ConnectedDataResponse = {
  data: ComboboxData[];
  total: number;
}

// Hook to fetch async data for the combobox
// it should handle initial data load, search input, debouncing the input, and loading based on the search input
// NOTE: Validation for asyncOptions is handled in validation.ts via yup async test
// The validator uses the same logic as fetchLabel to ensure the selected value exists on the backend
export const useCombobox = (control: OptionsControl, debounceMs: number = 300) => {
  const { manager } = useInterview();
  const { name } = useFormField();
  const { watch, setError: setFormError, clearErrors } = useFormContext();
  const [search, setSearch] = useState("");
  const [label, setLabel] = useState<{ key: string; label: string } | undefined>(undefined);
  const [error, setError] = useState<{ key: string; message: string } | undefined>(undefined);
  const [options, setOptions] = useState<ComboboxData[]>([]);
  const [loading, setLoading] = useState(false);

  const value = watch(name);

  const fetchLabel = async (value: string) => {
    if (!value || !control.asyncOptions) {
      return;
    }
    const { asyncOptions: { query, ...options } } = control;
    try {
      // make sure label is set to the value we are loading
      setLabel({ key: value, label: value });
      setLoading(true);
      const templated = manager.templateText(query, { search: value });
      const res = await manager.getConnectedData<ConnectedDataResponse>({ ...options, query: templated })
      // find the item that matches the value
      const match = (res.data as any[]).find(item => item.value === value || item.key === value || item.id === value);
      if (match) {
        const label = match.label || match.name || match.value || match.key || "Unknown";
        setLabel({ key: value, label });
        setError(undefined); // clear any previous error
      } else {
        // we should have found it, throw an error
        throw new Error("No matching label found");
      }
    } catch (error) {
      console.error("Error fetching combobox label:", error);
      // clear the temp label and set error, using the value as key so we know when we can retry
      setLabel(undefined);
      setError({ key: value, message: (error as any).message ?? "Failed to fetch label" });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when control or search changes
  const fetchData = useCallback(async (val: string) => {
    if (!control.asyncOptions) {
      // filter control.options based on search
      const data = (control.options ?? []).filter((option: any) =>
        option.value.toLowerCase().includes(val.toLowerCase())
      ) as ComboboxData[];
      setOptions(data);
      return;
    }
    const { asyncOptions: { minInput, query, ...options } } = control;
    if (minInput && val.length < minInput) {
      return;
    }
    setLoading(true);
    try {
      const templated = manager.templateText(query, { search: val });
      const res = await manager.getConnectedData<ConnectedDataResponse>({ ...options, query: templated });
      const { data } = res;
      // Map the fetched data to ComboboxData format
      const mappedOptions = (data as any[]).map((item) => ({
        label: item.label || item.name || item.value || item.key || "Unknown",
        value: item.value || item.key || item.id || item.name || "unknown",
      }));
      setOptions(mappedOptions);
      setError(undefined); // clear any previous error
    } catch (error) {
      console.error("Error fetching combobox data:", error);
      setOptions([]);
      setError({ key: val, message: "Failed to fetch options" });
    } finally {
      setLoading(false);
    }
  }, [control, manager]);

  useEffect(() => {
    // don't refetch if we already have an error for this value
    if (error && value && error.key === value) return;
    // Fetch the label for the current value if not already loaded
    if (value && (label === undefined || label.key !== value)) {
      fetchLabel(value as string);
    }
  }, [control, label, value]);

  // Debounce search input to avoid too many requests
  const debouncedSearch = useMemo(() => debounce(fetchData, debounceMs), [fetchData, debounceMs]);
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value); // update input immediately
    debouncedSearch(value); // async search after debounce
  }, [debouncedSearch]);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel(); // cleanup on unmount
    };
  }, [debouncedSearch]);

  // set form error if combobox has error
  useEffect(() => {
    if (error) {
      setFormError(name, { type: "manual", message: error.message });
    } else {
      // make sure we clear it as well
      clearErrors(name);
    }
  }, [error, name, setError]);

  const clearSearch = () => {
    setSearch("");
    setOptions([]);
  };

  return { label: label?.label, search, options, loading, error, setSearch: handleSearchChange, clearSearch };
}

// need to do this as we need to unpack the slot props onto the trigger
const ComboControl = (props: any) => {
  const { t } = useTheme();
  const { name, control } = useFormField<OptionsControl>();
  const { field } = useController({ name });
  const { label, search, options, loading, setSearch, clearSearch } = useCombobox(control);

  return (
    <Combobox
      data={options}
      value={field.value ?? ""}
      onOpenChange={clearSearch} // reset search when opening
      onValueChange={control.readOnly ? undefined : field.onChange}
      type="item"
    >
      <ComboboxTrigger
        {...props}
        loading={loading}
        label={label}
        placeholder={t("form.combobox.select_placeholder")}
        disabled={field.disabled || control.readOnly} />
      <ComboboxContent>
        <ComboboxInput placeholder={t("form.combobox.search_placeholder")} name={field.name} value={search} onValueChange={setSearch} />
        <ComboboxEmpty>
          {loading ? t("form.combobox.loading") : t("form.combobox.no_options")}
        </ComboboxEmpty>
        <ComboboxList>
          <ComboboxGroup>
            {options.map((item) => (
              <ComboboxItem key={item.value} value={item.value} className="flex flex-col items-start gap-1">
                <span>{item.label}</span>
                <span className="text-muted-foreground text-sm italic">{item.value}</span>
              </ComboboxItem>
            ))}
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};

// TODO we need to support custom config for list items, as it might need more than just label
// CHANGEME: workaround is to just display label and value for now
export const ComboboxFormControl = () => {
  const { t } = useTheme();
  const { control } = useFormField<OptionsControl>();

  return (
    <>
      <FormLabel>
        {t(control.label)}
        <Explanation control={control} />
      </FormLabel>
      <FormControl>
        <ComboControl />
      </FormControl>
      <FormDescription />
      <FormMessage />
    </>
  );
};

import { useTheme } from "@/providers";
import { type OptionsControl } from "@imminently/interview-sdk";
import { useFormContext, type UseControllerReturn } from "react-hook-form";
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
export const useCombobox = (control: OptionsControl, debounceMs: number = 300) => {
  const { manager } = useInterview();
  const { name } = useFormField();
  const { watch } = useFormContext();
  const [search, setSearch] = useState("");
  const [label, setLabel] = useState<string | undefined>(() => undefined);
  const [options, setOptions] = useState<ComboboxData[]>([]);
  const [loading, setLoading] = useState(false);

  const value = watch(name);

  const fetchLabel = async (value: string) => {
    if (!value || !control.asyncOptions) {
      return;
    }
    const { asyncOptions: { query, ...options } } = control;
    try {
      setLoading(true);
      const templated = manager.templateText(query, { search: value });
      const res = await manager.getConnectedData<ConnectedDataResponse>({ ...options, query: templated })
      // find the item that matches the value
      const match = (res.data as any[]).find(item => item.value === value || item.key === value || item.id === value);
      if (match) {
        setLabel(match.label || match.name || match.value || match.key || "Unknown");
      } else {
        setLabel(undefined);
      }
    } catch (error) {
      console.error("Error fetching combobox label:", error);
      setLabel(undefined);
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
    } catch (error) {
      console.error("Error fetching combobox data:", error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [control, manager]);

  useEffect(() => {
    if (value && label === undefined) {
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

  const clearSearch = () => {
    setSearch("");
    setOptions([]);
  };

  return { label, search, options, loading, setSearch: handleSearchChange, clearSearch };
}

// TODO we need to support custom config for list items, as it might need more than just label
// CHANGEME: workaround is to just display label and value for now
export const ComboboxFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control } = useFormField<OptionsControl>();
  const { label, search, options, loading, setSearch, clearSearch } = useCombobox(control);

  return (
    <>
      <FormLabel>
        {t(control.label)}
        <Explanation control={control} />
      </FormLabel>
      <FormControl>
        <Combobox
          data={options}
          value={field.value}
          onOpenChange={clearSearch} // reset search when opening
          onValueChange={control.readOnly ? undefined : field.onChange}
          type="item"
        >
          <ComboboxTrigger
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
      </FormControl>
      <FormDescription />
      <FormMessage />
    </>
  );
};

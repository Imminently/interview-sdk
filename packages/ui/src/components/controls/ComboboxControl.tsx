import { useTheme } from "@/providers";
import { type OptionsControl } from "@imminently/interview-sdk";
import type { UseControllerReturn } from "react-hook-form";
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
import { useEffect, useState } from "react";
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
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<ComboboxData[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch data when control or search changes
  const fetchData = async () => {
    if (!control.asyncOptions) {
      // filter control.options based on search
      const data = (control.options ?? []).filter((option: any) =>
        option.value.toLowerCase().includes(search.toLowerCase())
      ) as ComboboxData[];
      setOptions(data);
      return;
    }
    const { asyncOptions: { minInput, query, ...options } } = control;
    if (minInput && search.length < minInput) {
      // setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const templated = manager.templateText(query, { search });
      const res = await manager.getConnectedData<ConnectedDataResponse>({ ...options, query: templated });
      const { data, total } = res;
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
  };

  // Fetch data initially and when search changes
  useEffect(() => {
    fetchData();
  }, [control, search]);

  // Debounce search input to avoid too many requests
  const debouncedSetSearch = debounce(setSearch, debounceMs);

  return { options, loading, setSearch: debouncedSetSearch };
}

export const ComboboxFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control } = useFormField<OptionsControl>();
  const { options, loading, setSearch } = useCombobox(control);

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
          onOpenChange={() => setSearch("")} // reset search when opening
          onValueChange={control.readOnly ? undefined : field.onChange}
          type="item"
        >
          <ComboboxTrigger placeholder={t("form.combobox.select_placeholder")} />
          <ComboboxContent>
            <ComboboxInput placeholder={t("form.combobox.search_placeholder")} name={field.name} onValueChange={setSearch} />
            <ComboboxEmpty>
              {loading ? t("form.combobox.loading") : t("form.combobox.no_options")}
            </ComboboxEmpty>
            <ComboboxList>
              <ComboboxGroup>
                {options.map((item) => (
                  <ComboboxItem key={item.value} value={item.value}>
                    {item.label}
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

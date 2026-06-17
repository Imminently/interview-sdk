import { useInterview } from "@/interview/InterviewContext";
import { useTheme } from "@/providers";
import { cn } from "@/util";
import { isSupportedControl } from "@/util/container-utils";
import {
  getNameFromFileAttributeRef,
  type RenderableDataContainerControl,
} from "@imminently/interview-sdk";
import { Download, Loader2 } from "lucide-react";
import * as React from "react";
import { Button } from "../ui/button";
import { Text } from "../ui/text";

type DisplayValue = React.ReactNode | string;

type LabelValue = {
  id: string;
  label: string;
  values: DisplayValue[];
};

export { isSupportedControl } from "@/util/container-utils";

export const DataContainer = ({ control, className }: { control: RenderableDataContainerControl; className?: string }) => {
  const { t } = useTheme();
  const { manager } = useInterview();
  const [downloadingRef, setDownloadingRef] = React.useState<string | null>(null);

  const handleDownload = React.useCallback(
    async (ref: string) => {
      try {
        setDownloadingRef(ref);
        const response = await manager.downloadFile(ref);
        if (!response?.data) {
          return;
        }

        const link = document.createElement("a");
        link.href = response.data;
        link.download = getNameFromFileAttributeRef(ref);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("[DataContainer] Download error", error);
      } finally {
        setDownloadingRef(null);
      }
    },
    [manager],
  );

  const labelsAndValues = React.useMemo<LabelValue[]>(() => {
    return (control.controls || []).reduce<LabelValue[]>((acc, item) => {
      if (!isSupportedControl(item)) {
        return acc;
      }

      if (item.type === "document" || item.type === "image") {
        return acc;
      }

      const label = item.label ? `${t(item.label)}:` : item.id;
      const values = (() => {
        if (item.type === "file") {
          if (!item.value?.fileRefs?.length) {
            return [t("form.no_files")];
          }

          return item.value.fileRefs.map((ref) => {
            const isDownloading = downloadingRef === ref;
            return (
              <Button
                key={ref}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDownload(ref)}
                disabled={isDownloading}
                className="justify-start"
              >
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span className="truncate">{getNameFromFileAttributeRef(ref)}</span>
              </Button>
            );
          });
        }

        if (item.type === "currency") {
          return [`${item.symbol || "$"} ${item.value === null || item.value === undefined ? "" : String(item.value)}`];
        }

        if (item.type === "options") {
          const matchingOption = (item.options || []).find((option) => option.value === item.value);
          const optionLabel = matchingOption?.label;

          return [
            item.value === null || item.value === undefined
              ? ""
              : String(optionLabel === undefined ? item.value : t(optionLabel)),
          ];
        }

        if (item.type === "number_of_instances") {
          return [item.value === null || item.value === undefined ? "" : String(item.value.length)];
        }

        return [item.value === null || item.value === undefined ? "" : String(item.value)];
      })();

      return acc.concat({
        id: item.id,
        label,
        values,
      });
    }, []);
  }, [control.controls, downloadingRef, handleDownload, t]);

  const columns = React.useMemo(() => {
    const count = Math.max(1, control.columns || 1);
    const distributedColumns = Array.from({ length: count }, () => [] as LabelValue[]);
    const maxRowsPerColumn = Math.ceil(labelsAndValues.length / count);

    return labelsAndValues.reduce((acc, item, index) => {
      const targetColumn = acc[Math.floor(index / Math.max(1, maxRowsPerColumn))];
      targetColumn?.push(item);
      return acc;
    }, distributedColumns).filter((column) => column.length > 0);
  }, [control.columns, labelsAndValues]);

  if (!control.label && labelsAndValues.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("flex flex-col gap-4", className)}
      data-control={control.type}
      data-id={control.id}
    >
      {control.label ? <Text variant="h5">{t(control.label)}</Text> : null}
      {columns.length > 0 ? (
        <div className="flex flex-wrap gap-4">
          {columns.map((column, index) => (
            <table
              key={index}
              className="border-separate border-spacing-y-0"
            >
              <tbody>
                {column.map(({ id, label, values }) => (
                  <tr
                    key={id}
                    className="align-top"
                  >
                    <th className="w-0 whitespace-nowrap pr-6 text-left align-top text-sm font-normal text-muted-foreground">
                      {label}
                    </th>
                    <td className="align-top text-sm text-foreground">
                      <div className="flex flex-col items-start gap-2">
                        {values.map((value, valueIndex) =>
                          typeof value === "string" ? (
                            <span
                              key={valueIndex}
                              className="whitespace-pre-wrap break-words"
                            >
                              {value}
                            </span>
                          ) : (
                            <React.Fragment key={valueIndex}>{value}</React.Fragment>
                          ),
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default DataContainer;
import { useInterview } from "@/interview";
import { useTheme } from "@/providers";
import type { UseControllerReturn } from "react-hook-form";
import { FormControl, FormLabel, FormMessage, useFormField } from "../ui/form";
import { Button } from "../ui/button";
import { Explanation } from "./Explanation";
import type { FileControl } from "@imminently/interview-sdk";
import { getNameFromFileAttributeRef, isFileAttributeValue, type FileAttributeValue } from "@imminently/interview-sdk";
import { Download, Loader2, Paperclip, Trash2 } from "lucide-react";
import React from "react";

type LoadingState = { type: "idle" } | { type: "add" } | { type: "remove"; ref: string };

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = reject;
  });

export const FileFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control } = useFormField<FileControl>();
  const { manager } = useInterview();

  const [loading, setLoading] = React.useState<LoadingState>({ type: "idle" });
  const [localError, setLocalError] = React.useState<string | undefined>(undefined);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const triggerFileDialog = React.useCallback(() => {
    inputRef.current?.click();
  }, []);

  const normalizedValue: FileAttributeValue = React.useMemo(() => {
    return isFileAttributeValue(field.value) ? field.value : { fileRefs: [] };
  }, [field.value]);

  const max = control.max ?? 1;
  const accept = control.file_type && control.file_type.length > 0 ? control.file_type.join(",") : undefined;
  const canAddMore = !control.readOnly && normalizedValue.fileRefs.length < max && loading.type !== "add";

  const handleUpload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    try {
      setLocalError(undefined);
      const inputEl = e.currentTarget; // capture before any awaits
      const files = Array.from(inputEl.files || []);
      const [file] = files;
      if (!file) return;

      // prevent duplicates by filename
      const alreadyExists = normalizedValue.fileRefs.some((ref) => getNameFromFileAttributeRef(ref) === file.name);
      if (alreadyExists) {
        setLocalError(t("form.file_duplicate"));
        inputEl.value = "";
        return;
      }

      // size validation
      if (typeof control.max_size === "number") {
        const maxBytes = control.max_size * 1024 * 1024;
        if (file.size > maxBytes) {
          manager.onFileTooBig(file);
          inputEl.value = "";
          return;
        }
      }

      setLoading({ type: "add" });
      const data = await toBase64(file);
      const res = await manager.uploadFile({ data, name: file.name });
      if (!res?.reference) {
        console.log("Upload failed", res);
        setLocalError(t("form.file_upload_failed"));
        return;
      }

      const next: FileAttributeValue = {
        ...normalizedValue,
        fileRefs: normalizedValue.fileRefs.concat(res.reference),
      };
      field.onChange(next);
      inputEl.value = "";
    } catch (err) {
      console.error("[FileFormControl] Upload error", err);
      setLocalError(t("form.file_upload_failed"));
    } finally {
      setLoading({ type: "idle" });
    }
  };

  const handleDelete = async (ref: string) => {
    if (!window.confirm(t("form.file_delete_confirm") || "Delete this file?")) return;
    try {
      setLocalError(undefined);
      setLoading({ type: "remove", ref });
      await manager.removeFile(ref);
      const next: FileAttributeValue = {
        ...normalizedValue,
        fileRefs: normalizedValue.fileRefs.filter((r) => r !== ref),
      };
      field.onChange(next);
    } catch (err) {
      console.error("[FileFormControl] Delete error", err);
      setLocalError(t("form.file_delete_failed"));
    } finally {
      setLoading({ type: "idle" });
    }
  };

  const handleDownload = async (ref: string) => {
    try {
      setLoading({ type: "remove", ref: "__download__" }); // reuse state to show spinner on button if desired
      const response = await manager.downloadFile(ref);
      if (!response || !response.data) return;
      const fileName = getNameFromFileAttributeRef(ref);
      const link = document.createElement("a");
      link.href = response.data;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("[FileFormControl] Download error", err);
    } finally {
      setLoading({ type: "idle" });
    }
  };

  return (
    <>
      <FormLabel>
        {t(control.label)}
        <Explanation control={control} />
      </FormLabel>
      <FormControl>
        <div className="flex flex-col gap-2">
          {/* Hidden input */}
          <input
            ref={inputRef}
            type="file"
            onChange={handleUpload}
            accept={accept}
            multiple={false}
            className="hidden"
            aria-hidden
          />

          {/* Files list */}
          <div className="flex flex-col gap-1">
            {normalizedValue.fileRefs.map((ref) => {
              const isRemoving = loading.type === "remove" && loading.ref === ref;
              const name = getNameFromFileAttributeRef(ref);
              return (
                <div
                  key={ref}
                  className="flex items-center gap-2"
                >
                  {!control.readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(ref)}
                      aria-label={t("form.file_delete")}
                    >
                      {isRemoving ? <Loader2 className="animate-spin" /> : <Trash2 />}
                    </Button>
                  )}
                  <span className="text-sm">{name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(ref)}
                    aria-label={t("form.file_download")}
                  >
                    {loading.type !== "idle" ? <Loader2 className="animate-spin" /> : <Download />}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Add button and counter */}
          {!control.readOnly && normalizedValue.fileRefs.length < max && (
            <div className="flex items-center gap-2">
              <Button
                onClick={triggerFileDialog}
                disabled={!canAddMore}
                aria-label={t("form.file_add")}
              >
                {loading.type === "add" ? <Loader2 className="animate-spin" /> : <Paperclip />}
                <span className="text-sm">{t("form.file_select_prompt")}</span>
              </Button>
            </div>
          )}

          {max > 1 && (
            <span className="text-muted-foreground text-xs">{normalizedValue.fileRefs.length} / {max}</span>
          )}

          {localError && <p className="text-destructive text-sm">{localError}</p>}
        </div>
      </FormControl>
      <FormMessage />
    </>
  );
};

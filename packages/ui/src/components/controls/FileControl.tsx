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

type LoadingState = { type: "idle" } | { type: "add" } | { type: "remove"; ref: string } | { type: "download"; ref: string };

const TEST_READ_ONLY = false; // **WARN** leave as `false`....
const TEST_MAX = undefined; // **WARN** leave as `undefined`...

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

  const clearLocalError = () => setLocalError(undefined);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const triggerFileDialog = React.useCallback(() => {
    inputRef.current?.click();
  }, []);

  const normalizedValue: FileAttributeValue = React.useMemo(() => {

    if (TEST_READ_ONLY) {
      // Dummy data for testing read-only mode
      const dummyFileRefs = [
        "data:id=123e4567-e89b-12d3-a456-426614174000;base64,UXVvdGF0aW9uIFJlcXVlc3QucGRm",
        "data:id=987fcdeb-51a2-43d1-9c8e-123456789abc;base64,SW52b2ljZS5kb2N4",
        "data:id=456789ab-cdef-1234-5678-90abcdef1234;base64,UmVjZWlwdC5qcGc="
      ];
      return isFileAttributeValue(field.value) ? field.value : { fileRefs: dummyFileRefs };
    }

    return isFileAttributeValue(field.value) ? field.value : { fileRefs: [] };
  }, [field.value]);

  const max = TEST_MAX ?? control.max ?? 1;
  const readOnly = TEST_READ_ONLY ? true : (control.readOnly ?? false);
  const accept = control.file_type && control.file_type.length > 0 ? control.file_type.join(",") : undefined;
  const canAddMore = !readOnly && normalizedValue.fileRefs.length < max && loading.type !== "add";

  const handleUpload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    try {
      clearLocalError();
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
      setLoading({ type: "download", ref });
      clearLocalError();
      const response = await manager.downloadFile(ref);
      if (!response || !response.data) {
        setLocalError(t("form.file_download_failed"));
        return;
      }
      const fileName = getNameFromFileAttributeRef(ref);
      const link = document.createElement("a");
      link.href = response.data;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("[FileFormControl] Download error", err);
      setLocalError(t("form.file_download_failed"));
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
          <div className="space-y-1">
            {normalizedValue.fileRefs.map((ref) => {
              const isRemoving = loading.type === "remove" && loading.ref === ref;
              const isDownloading = loading.type === "download" && loading.ref === ref;
              const name = getNameFromFileAttributeRef(ref);
              return (
                <div
                  key={ref}
                  className="flex items-center gap-3 p-3 border rounded-md bg-muted/30"
                >
                  <div className="flex items-center gap-1">
                    {!readOnly && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(ref)}
                        disabled={isRemoving}
                        aria-label={t("form.file_delete")}
                        className="h-8 w-8 p-0"
                      >
                        {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(ref)}
                      disabled={isDownloading}
                      aria-label={t("form.file_download")}
                      className="h-8 w-8 p-0"
                    >
                      {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    </Button>
                  </div>
                  <span className="text-sm font-medium text-foreground flex-1 truncate flex items-center leading-none" title={name}>
                    {name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Add button and counter */}
          {!readOnly && normalizedValue.fileRefs.length < max && (
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

          {readOnly && normalizedValue.fileRefs.length === 0 && (
            <p className="text-muted-foreground text-sm">{t("form.no_files")}</p>
          )}

          {localError && <p className="text-destructive text-sm">{localError}</p>}
        </div>
      </FormControl>
      <FormMessage />
    </>
  );
};

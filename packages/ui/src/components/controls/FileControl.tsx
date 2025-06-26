import { FileControl } from "@core";
import { InterviewControl } from "@/interview/InterviewControl";
import { FormControl, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Explanation } from "./Explanation";

export const FileFormControl = ({ control }: { control: FileControl }) => {
  // on change, we need to limit the size of each file to control.max_size
  return (
    <InterviewControl control={control}>
      {({ field }) => {
        return (
          <>
            <FormLabel>
              {control.label}
              <Explanation control={control} />
            </FormLabel>
            <FormControl>
              <Input
                type={control.type}
                value={field.value}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (control.max_size !== undefined) {
                    // convert to bytes since max_size is in MB
                    const max = control.max_size * 1024 * 1024; // MB to bytes
                    console.log("Validating file sizes", control.max_size, files);
                    const validFiles = files.filter(file => file.size <= max);
                    field.onChange(validFiles);
                  } else {
                    field.onChange(files);
                  }
                }}
                disabled={field.disabled}
                accept={control.file_type?.join(",") || undefined}
                multiple={control.max ? control.max > 1 : false}
              />
            </FormControl>
            <FormMessage />
          </>
        );
      }}
    </InterviewControl>
  )
}
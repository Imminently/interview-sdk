import type { FileControl } from "@imminently/interview-sdk";
import { z } from "zod";

export const fileValidator = (c: FileControl): z.ZodTypeAny | undefined => {
  const { required } = c;

  if (required !== true) return undefined;

  return z
    .custom<unknown>()
    .nullable()
    .refine(
      (v) => {
        if (v === null || v === undefined) return false;
        if (Boolean(v) === false) {
          console.error("0RsLCXOHdW | Interview-react-material: not a file attrib value");
          return false;
        }
        // @ts-ignore
        return v.fileRefs.length > 0;
      },
      "Required",
    );
};

export type UploadFileArg = {
  /** file name, e.g. "test.txt" */
  name: string;
  /** file contents presented as data uri, e.g. "data:text/plain;base64,qweasdzxc" */
  data: string;
};
export type UploadFileRtrn = {
  /** @example 'data:id={uuid};base64,{base64-file-name}' */
  reference: string;
  /** uuid */
  id: string;
};
export type UploadFile = (arg: UploadFileArg) => Promise<UploadFileRtrn>;

/**
 * mainly for when we visit screens that we already submitted or when we recheck\
 * before final submit (in data container control). But I guess can also be used\
 * when uploading files and those are in temporary storage (for more general code)
 */
export type RemoveFile = (ref: UploadFileRtrn["reference"]) => Promise<unknown>;

/**
 * as it is possible to specify max file size, we need to take care of a proper\
 * communication with a user so that we don't just silently fail. This method \
 * will serve as a way for lib consumers to override how they want to signalize \
 * that file is too big.
 */
export type OnFileTooBig = (f: File) => unknown;

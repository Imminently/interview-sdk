import { type AxiosInstance } from "axios";
import { tryCatch } from "./try-catch";
import { getIdFromFileAttributeRef } from "./types";
import get from "lodash-es/get";
import { buildUrl, createApiInstance } from "./util";

const LogGroup = "FileManager";

const defaultFilePath = ["decisionapi", "file"];

export type UploadFileArgs = {
  /** file name, e.g. "test.txt" */
  name: string;
  /** file contents presented as data uri, e.g. "data:text/plain;base64,qweasdzxc" */
  data: string;
};

export type UploadFileResponse = {
  /** @example 'data:id={uuid};base64,{base64-file-name}' */
  reference: string;
  /** uuid */
  id: string;
};

interface FileManagerInterface {
  uploadFile(arg: UploadFileArgs): Promise<UploadFileResponse | null>;
  downloadFile(ref: any): Promise<any>;
  removeFile(ref: any): Promise<void>;
  onFileTooBig(file: File): void;
}

export type FileManagerOptions = {
  api: AxiosInstance;
} | {
  host: string;
  filePath?: string[];
  overrides?: Record<string, any>;
};

export class FileManager implements FileManagerInterface {
  private api: AxiosInstance;

  constructor(options: FileManagerOptions) {
    if ('api' in options) {
      this.api = options.api;
      return;
    }
    // not using a custom api, so we need to create one
    const { host, filePath, overrides } = options;
    const fileBaseUrl = buildUrl(host, ...(filePath ?? defaultFilePath));
    this.api = createApiInstance(fileBaseUrl, overrides);
  }

  /**
   * Uploads a file to the server.
   * @param args - The arguments for uploading the file.
   * @returns A promise that resolves to the upload response or null if an error occurs.
   * @throws Will log an error to the console if the upload fails.
   */
  async uploadFile(args: UploadFileArgs) {
    const [error, res] = await tryCatch(this.api.post("", args));
    if (error) {
      console.error(`[${LogGroup}] Error uploading file:`, error);
      return null;
    }
    return res.data as UploadFileResponse;
  };

  /**
   * Downloads a file from the server.
   * @param ref - The reference to the file to download.
   * @returns A promise that resolves to the file data.
   * @throws Will log an error to the console if the download fails.
   */
  async downloadFile(ref: string) {
    let result: any;
    try {
      result = await this.api.get(getIdFromFileAttributeRef(ref));
    } catch (e) {
      // anything else -> some other type of problem -> signal to user
      console.error(`[${LogGroup}] Download file error`, e);
      return null;
    }
    return result.data;
  };

  /**
   * Removes a file from the server.
   * @param ref - The reference to the file to remove.
   * @returns A promise that resolves when the file is removed.
   * @throws Will log an error to the console if the removal fails.
   */
  async removeFile(ref: string) {
    try {
      await this.api.delete(getIdFromFileAttributeRef(ref));
    } catch (e) {
      if (get(e, ["response", "data", "message"], "") === "Unable to retrieve data - check the file reference") {
        /**
         * this is an expected error which means that file is in staging area \
         * and so we can't remove it using delete, but it will be removed automatically\
         * after some time
         */
        return;
      }

      // anything else -> some other type of problem -> signal to user
      console.error(`[${LogGroup}] Remove file error`, e);
      return;
    }
  };

  onFileTooBig(file: File) {
    console.error(`[${LogGroup}] File too big`, file);
  };
}
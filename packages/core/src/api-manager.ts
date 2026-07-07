import {
  RemoteInterviewBackend,
  type RemoteInterviewBackendOptions,
} from "./backend/remote-backend";

/** @deprecated Use `RemoteInterviewBackend` instead. */
export const ApiManager = RemoteInterviewBackend;

/** @deprecated Use `RemoteInterviewBackendOptions` instead. */
export type ApiManagerOptions = RemoteInterviewBackendOptions;

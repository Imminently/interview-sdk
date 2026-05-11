import type {
  ManagerLifecycleEventMap,
  ManagerLifecycleEventName,
  ManagerLifecycleListener,
} from "@imminently/interview-sdk";
import { useEffect, useRef } from "react";
import { useInterview } from "./InterviewContext";

const useInterviewLifecycleEvent = <K extends ManagerLifecycleEventName>(
  eventName: K,
  listener: ManagerLifecycleListener<K>,
) => {
  const { manager } = useInterview();
  const listenerRef = useRef(listener);

  listenerRef.current = listener;

  useEffect(() => {
    return manager.events.subscribe(eventName, (event) => {
      listenerRef.current(event as ManagerLifecycleEventMap[K]);
    });
  }, [eventName, manager]);
};

export { useInterviewLifecycleEvent };

export const useInterviewSessionStart = (listener: ManagerLifecycleListener<"sessionStart">) =>
  useInterviewLifecycleEvent("sessionStart", listener);

export const useInterviewCreate = (listener: ManagerLifecycleListener<"create">) =>
  useInterviewLifecycleEvent("create", listener);

export const useInterviewLoad = (listener: ManagerLifecycleListener<"load">) =>
  useInterviewLifecycleEvent("load", listener);

export const useInterviewReset = (listener: ManagerLifecycleListener<"reset">) =>
  useInterviewLifecycleEvent("reset", listener);

export const useInterviewSessionUpdate = (listener: ManagerLifecycleListener<"sessionUpdate">) =>
  useInterviewLifecycleEvent("sessionUpdate", listener);

export const useInterviewComplete = (listener: ManagerLifecycleListener<"complete">) =>
  useInterviewLifecycleEvent("complete", listener);

export const useInterviewError = (listener: ManagerLifecycleListener<"error">) =>
  useInterviewLifecycleEvent("error", listener);

export const useInterviewActiveSessionChange = (listener: ManagerLifecycleListener<"activeSessionChange">) =>
  useInterviewLifecycleEvent("activeSessionChange", listener);
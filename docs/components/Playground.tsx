"use client";
import { ApiManager, FileManager, SessionManager } from "@imminently/interview-sdk";
import * as InterviewUI from "@imminently/interview-ui";
import React from "react";
import { LiveEditor, LiveError, LivePreview, LiveProvider } from "react-live";

const scope = {
  React,
  ...InterviewUI,
  SessionManager,
  ApiManager,
  FileManager,
};

export function Playground({
  code,
  noPreview = false,
}: {
  code: string;
  noPreview?: boolean;
}) {
  return (
    <LiveProvider code={code.trim()} scope={scope} language="tsx">
      {!noPreview && (
        <div className="rounded border p-4 mb-3 bg-background">
          <LivePreview />
        </div>
      )}
      <div className="rounded border bg-muted/40 overflow-hidden">
        <LiveEditor className="text-sm font-mono p-2 outline-none" />
      </div>
      <LiveError className="mt-2 text-sm text-red-600 whitespace-pre-wrap" />
    </LiveProvider>
  );
}
